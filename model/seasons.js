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

  season.getStandings = () => require('../lib/get-standings')(season, matches);

  console.log("loadSeason()",key,fn,season.key);
  return season;
}

var CURRENT = 'season-10';

var _map = {
  // Not sure why we would need to load other seasons like this.
  // Eventually everything will be in a db.
  // 'season-6': loadSeason('season-6'),
  // 'season-7': loadSeason('season-7'),
  // 'season-8': loadSeason('season-8'),
  // 'season-9': loadSeason('season-9'),
  [CURRENT]: loadSeason(CURRENT)
};

module.exports = {
  get: function(params) {
    var params = params || {};
    var key = params.key || CURRENT;
    return _map[key];
  }
};
