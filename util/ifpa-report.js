// Given every player that has played a game in MNP, lookup their
// IFPA number in one way or another.
// 1) Load {name,ifpa} from data/ifpa_num.csv
// 2) Attempt to match via IFPA API.

const fs = require('fs');

const ifpa = fs.readFileSync('data/ifpa_num.csv').toString()
  .split('\n')
  .filter(line => line.length > 0)
  .map(line => line.split(','))
  .filter(row => row.length > 1)
  .reduce((map, row) => {
    map[row[0].toLowerCase()] = Number(row[1]);
    return map;
  }, {});

const pdb = fs.readFileSync('data/season-8/playerdb.csv').toString()
  .split('\n')
  .filter(line => line.length > 0)
  .map(line => line.split(','))
  .filter(row => row.length > 0)
  .map(row => {
    return {
      lookup: row[0],
      name: row[1],
      team: row[2],
      role: row[3],
      // email: row[4] // Commenting out email for now.
    }
  })
  .reduce((map, player) => {
    map[player.lookup] = player;
    return map;
  }, {});

const matches = require('../model/matches').all();

const players = matches.reduce((map, match) => {
  [match.home, match.away].forEach(team => {
    team.lineup.forEach(p => {
      const lookup = p.name.toLowerCase();
      const roster = pdb[lookup];
      map[lookup] = map[lookup] || {
        name: p.name,
        ifpa: ifpa[lookup] || '',
        team: roster ? roster.team : '',
        role: roster ? roster.role : ''
      };
    });
  });
  return map;
}, {});

Object.keys(players).forEach(lookup => {
  const p = players[lookup];
  const line = [p.name, p.ifpa, p.team, p.role].join(',');
  console.log(line);
});
