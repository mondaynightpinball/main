// DEPRECATED: Use the newer compute-stats instead.

var fs = require('fs');
var matches = require('../model/matches');
var machines = require('../model/machines');
var stats = require('../model/stats');

//Lookup for points available by round, 1-based.
var PA = [0,2.5,3,3,2.5,0];

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

function build() {

  //Our goal is to construct a stats object for each
  //player and save it in the stats collection using
  //the player's key as a ref.

  // TODO: Load the players module to lookup updated names,
  //       as the name in the match is however it was
  //       entered into the match.

  //TODO: Separate the seasons.
  var players = {}; //{history, points_won, points_available}

  //TODO: Change matches.all to matches.visitAll
  var all = matches.all();
  for(i in all) {
    var match = all[i];
    var hk = match.home.key;
    var ak = match.away.key;

    // NOTE: The lookup is necessary because the games only have keys, not names.
    var lookup = {};
    match.home.lineup.forEach(function(y) { lookup[y.key] = y.name; });
    match.away.lineup.forEach(function(y) { lookup[y.key] = y.name; });

    for(j in match.rounds) {
      var round = match.rounds[j];
      //Only use singles and doubles for stats.
      if(round.n < 5) {
        for(k in round.games) {
          var game = round.games[k];
          var mk = game.machine;
          if(!machines.get(mk)) {
            console.log("WARNING, Unknown machine: " +mk+ " @ " +match.venue.key+ " in week " +match.week+ " round " +round.n+ " " +match.key);
          }

          //TODO: Only track finished games.

          //player_n, score_n, points_n
          for(x = 1; x < 5; x++) {
            var pn = 'player_' + x;
            var pk = game[pn];
            if(pk) {
              //For rounds 1 and 3, away team is players 1 (and 3).
              var team = ((round.n - 1) % 2 == 0) ?
                ((x-1) % 2 == 0) ? ak : hk :
                ((x-1) % 2 == 0) ? hk : ak;
              var opp = ((round.n - 1) % 2 == 0) ?
                ((x-1) % 2 == 0) ? hk : ak :
                ((x-1) % 2 == 0) ? ak : hk;
              var sn = 'score_' + x;
              var tn = 'points_' + x;
              var player = players[pk];
              if(!player) {
                player = {
                  key: pk,
                  name: lookup[pk],
                  history: [] //,
                  // points_won: 0, //We can calculate summary after building history.
                  // points_available: 0
                };
                players[pk] = player;
              }
              // var avail = (round.n == 1 || round.n == 4) ? 2.5 : 3;
              player.history.push({
                url: '/games/' +match.key+ '.' +round.n+ '.' +game.n,
                team: team,
                opp: opp,
                match: match.key,
                week: match.week,
                // TODO: season: match.season?
                round: round.n,
                machine: mk,
                score: game[sn],
                points: game[tn],
                pops: format(game[tn] / PA[round.n])
              });
            }
          }
        }
      }
    }
  }

  for(pk in players) {
    var player = players[pk];
    var pm = {};

    var tot = {won: 0, of: 0};
    for(i in player.history) {
      var item = player.history[i];
      tot.won += item.points;
      tot.of  += PA[item.round];
      var mk = item.match;
      pm[mk] = pm[mk] ? pm[mk] + 1 : 1;
    }
    player.pops = format(tot.won / tot.of);
    player.num_matches = Object.keys(pm).length;
    player.ppm = format(tot.won / player.num_matches);
    player.points = tot;
    // console.log(player);
    stats.set(pk, player);
  }
}

build();
