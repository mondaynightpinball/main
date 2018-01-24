var fs = require('fs');
var CONST = require('../constants');
var seasons = require('../model/seasons');
var matches = require('../model/matches');

function createMatches(params) {
  var params = params || {};
  //NOTE: We do not want a default week, to avoid accidental overwrite.
  var week = params.week; // || 1;
  var key = params.key;
  var season = seasons.get({key: key});
  var num = key.substring(key.indexOf('-')+1,key.length);
console.log("season num:",num);
  var info = season.getWeek(week);
console.log("match info: ----\n",info);
  for(var i in info.matches) {
    var x = info.matches[i];
console.log("info[" +i+ "]:",x);

//TODO: Only create match if it didn't already exist.
    //if(matches.get(info.match_key)) .... Needs to move the key concat up.
    var match = matches.create({
      ukey: CONST.ROOT, //TODO: Hard coded auth for now.
      //key: 'mnp-' +num+ '-' +week+ '-' +x.away_key+ '-' +x.home_key,
      key: x.match_key,
      name: info.code + ' ' + x.away_key + ' @ ' + x.home_key,
      // name: 'WK '+ week+ ' ' + x.away_key + ' @ ' + x.home_key,
      type: 'manual', //TODO: Can remove if manual is made the default of Match.type
      //state: CONST.SCHEDULED,
      state: CONST.PREGAME,
      week: info.n,
      date: info.date, //Currently testing date creation.
      venue: x.venue
    }, function(err,m) {
      if(err) console.log(err);
//console.log("...created:",m);

      //Add rosters and captains.
      var home = season.teams[x.home_key];
      var away = season.teams[x.away_key];

      m.home.name = home.name;
      m.home.key  = home.key;
      m.away.name = away.name;
      m.away.key  = away.key;

      for(j in home.roster) {
        var p = home.roster[j];
        m.add({
          ukey: CONST.ROOT,
          team: 'home',
          name: p.name
        });
      }
      m.add({
        ukey: CONST.ROOT,
        team: 'home',
        name: home.captain,
        want_captain: true
      });
      m.add({
        ukey: CONST.ROOT,
        team: 'home',
        name: home.co_captain,
        want_captain: true
      });

      for(j in away.roster) {
        var p = away.roster[j];
        m.add({
          ukey: CONST.ROOT,
          team: 'away',
          name: p.name
        });
      }
      m.add({
        ukey: CONST.ROOT,
        team: 'away',
        name: away.captain,
        want_captain: true
      });
      m.add({
        ukey: CONST.ROOT,
        team: 'away',
        name: away.co_captain,
        want_captain: true
      });

    });


  }
}

// TODO: Consider throwing an error for argv.length < 3
var params = {
  key: 'season-8',
  week: process.argv[2] || 1
};

//TEST TEST TEST
createMatches(params);
