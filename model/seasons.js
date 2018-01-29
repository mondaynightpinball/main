var fs = require('fs');

var matches = require('./matches');

function loadSeason(key) {
  var fn = 'data/'+key+'/season.json';
  var buf = fs.readFileSync(fn);
  var season = JSON.parse(buf);

  season.currentWeek = function() {
console.log("NOT IMPLEMENTED! currentWeek()");
    //TODO: Compare Date.now() with each week.
    //      Return 0 if preseason.
    //      Return 1-10 for regular season
    //      Return 91-94 for post season, Or is that too legacy?
    //TODO: In the match.type, we can specify regular, post, or scrimmage.
  };
  season.getWeek = function(n) {
console.log("getWeek(), n:",n);
    for(i in this.weeks) {
      var w = this.weeks[i];
      if(w.n && w.n == n) return w;
    }
  };
  season.getWeekByDate = function(date) {
console.log("NOT IMPLEMENTED! getWeekByDate(), date:",date);
  };

  //TODO: Accept a week param to only count up to that point?
  season.getStandings = function() {
    var map = {
      get: function(k) { //disposable method
        if(!this[k]) {
          this[k] = {
            key: k,
            wins: [],
            losses: [],
            points: 0
          };
        }
        return this[k];
      }
    };
    for(i in this.weeks) {
      var w = this.weeks[i];
      if(!w.isSpecial && !w.isPlayoffs) {
        var list = w.matches;
        for(j in list) {
          var m = w.matches[j];
          var match = matches.get(m.match_key);
          if(match) { // && match.complete
            var hk = match.home.key;
            var ak = match.away.key;
            var hr = map.get(hk);
            var ar = map.get(ak);
            hr.name = match.home.name;
            ar.name = match.away.name;
            var p = match.getPoints();
            if(p.home > p.away) {
              // hr.wins++; ar.losses++;
              hr.wins.push(ak);
              ar.losses.push(hk); //Maybe don't need as array.
            }
            if(p.away > p.home) {
              // ar.wins++; hr.losses++;
              ar.wins.push(hk);
              hr.losses.push(ak);
            }
            //No ties
            hr.points += p.home;
            ar.points += p.away;
          }
        }
      }
    }

    //We can discard the helper function now.
    delete map.get;

    var rows = [];
    for(x in map) {
      rows.push(map[x]);
    }

    rows.sort(function(a,b) {
      if(a.wins.length > b.wins.length) { return -1; }
      if(b.wins.length > a.wins.length) { return  1; }
      //else need points tie-breaker.
      if(a.points > b.points) { return -1; }
      if(b.points > a.points) { return  1; }
      //else need head's up tie-breaker
      if(a.wins.indexOf(b.key) != -1) { return -1; }
      if(b.wins.indexOf(a.key) != -1) { return  1; }
      //else Teams did not play each other.
      //TODO: Record vs common opponents
      //TODO: else Points vs common
    });

    for(i in rows) {
      var row = rows[i];
      row.n = parseInt(i) + 1;
    }
    return rows;
  };

console.log("loadSeason()",key,fn,season.key);
  return season;
}

var CURRENT = 'season-9';

var _map = {
  'season-6': loadSeason('season-6'),
  'season-7': loadSeason('season-7'),
  'season-8': loadSeason('season-8'),
  [CURRENT]: loadSeason(CURRENT)
};

module.exports = {
  get: function(params) {
    var params = params || {};
    var key = params.key || CURRENT;
    return _map[key];
  }
};
