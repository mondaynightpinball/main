'use strict';

const fs = require('fs');

const machines = require('../model/machines');
const players = require('../model/players');
const { teams } = require('../model/seasons').get();

const PA = [0, 2.5, 3, 3, 2.5, 0];

//TODO: This function can be handled with Numeral on the client side.
function format(num) {
  if(num == 0) return '0.000';
  if(Math.round(num) == num) {
    num += 0.000000001;
  }
  var str = num + ' ';
  if(str.length > 5) {
    str = str.substring(0,5);
  }
  str = str.trim();
  while(str.length < 5) {
    str = str + '0';
  }
  return str;
}

// TODO: Stop using hardcoded season numbers.
const rosters = fs.readFileSync('data/season-10/playerdb.csv').toString()
//.replace('\r', '')
.split('\n')
.filter(line => line.length > 0)
.map(line => line.split(','))
.map(row => {
  // console.log('row:', row);
  // TODO: Capitalize row[0]
  const name = row[1].length > 0 ? row[1] : row[0];
  return {
    key: players.makeKey(name),
    name,
    team: row[2],
    role: row[3]
  };
})
.reduce((x, p) => {
  // console.log('p:', p);
  x[p.key] = p.name; // Or maybe also the team?
  return x;
}, {});

const lookup = fs.readdirSync('data/matches')
.filter(fn => fn.match(/mnp-\d+-\d+/)) // only MNP league matches
.map(fn => {
  return JSON.parse(fs.readFileSync('data/matches/' +fn));
})
.reduce((stats, match) => {
  const names = [ ...match.away.lineup, ...match.home.lineup ]
  .reduce((x, p) => {
    x[p.key] = p.name;
    return x;
  }, {});
  // console.log(names);

  // For the time being, there are no mixed division matches.
  // If the home team isn't found or doesn't have a division,
  // then we can fall back to something else.
  const division = teams[match.home.key] ? teams[match.home.key].division : 0;

  match.rounds.forEach(round => {
    if(round.n > 4) return;
    round.games.forEach(game => {
      const mk = game.machine;
      if(!machines.get(mk)) {
        console.log('WARNING, Unknown machine:', mk, '@', match.venue.key, 'in week', match.week, 'round', round.n, match.key);
      }
      [1, 2, 3, 4]
      .map(n => {
        return {
          pn: 'player_' + n,
          sn: 'score_'  + n,
          tn: 'points_' + n
        };
      })
      .filter(p => game[p.pn])
      .map((p, i) => {
        // TODO Include match info.
        const isHome = (( round.n % 2 ) + ( (i + 1) % 2)) % 2 === 1;
        const team = isHome ? match.home.key : match.away.key;
        const opp  = isHome ? match.away.key : match.home.key;
        return { // history item
          pk: game[p.pn],
          team,
          opp,
          match: match.key,
          week: match.week,
          round: round.n,
          machine: mk,
          division,
          score: game[p.sn],
          points: game[p.tn],
          pops: format(game[p.tn] / PA[round.n])
        };
      })
      .forEach(item => {

        const registered = players.get(item.pk);
        const rosterName = rosters[item.pk];

        const name = registered ?
          registered.name :
          rosterName ?
          rosterName :
          names[item.pk];

        const player = stats[item.pk] || {
          key: item.pk,
          name,
          history: []
        };
        delete item.pk; // Don't need key after stats lookup.
        // console.log(player.key, player.name, item);
        player.history.push(item);
        stats[player.key] = player;
      });
    });
  });
  return stats;
}, {});

Object.keys(lookup).forEach(pk => {
  const player = lookup[pk];

  const historyToStats = (history) => history.reduce((tot, item) => {
    tot.won += item.points;
    tot.of += PA[item.round];
    const mk = item.match;
    tot.pm[mk] = tot.pm[mk] ? tot.pm[mk] + 1 : 1;
    return tot;
  }, { won: 0, of: 0, pm: {} });

  const statsToPlayer = (stats) => {
    const num_matches = Object.keys(stats.pm).length;
    return {
      pops: format(stats.of ? stats.won / stats.of : 0),
      num_matches,
      ppm: format(num_matches ? stats.won / num_matches : 0),
      points: { won: stats.won, of: stats.of }
    };
  };

  const statsAll = historyToStats(player.history);
  const stats1 = historyToStats(player.history.filter(item => item.division == 1));
  const stats2 = historyToStats(player.history.filter(item => item.division == 2));

  player.divisions = {
    'all': statsToPlayer(statsAll),
    'div-1': statsToPlayer(stats1),
    'div-2': statsToPlayer(stats2)
  };

  require('../model/stats').set(pk, player);
  // console.log(player);
});
