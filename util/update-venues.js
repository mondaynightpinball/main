var seasons = require('../model/seasons');
var matches = require('../model/matches');
var venues = require('../model/venues');
var machines = require('../model/machines');

var weeknum = process.argv[2] || 1;

var season = seasons.get();
var week = season.getWeek(weeknum);

for(i in week.matches) {
  var m = week.matches[i];
  var key = m.match_key;
  var match = matches.get(key);
  var v = match.venue;
  var venue = venues.get(v.key);
  var om = venue.machines;
  var nm = v.machines;
  for(j in nm) {
    var mk = nm[j];
    if(mk.length > 0 && om.indexOf(mk) == -1) {
      //New machine for venue.
      console.log("ADD:",mk," + ",venue.name);

      var machine = machines.get(mk);
      if(!machine) {
        console.log("WARNING: Unknown machine " +mk);
      }

      om.push(mk);
    }
  }
  om.sort();
  for(k in om) {
    var mk = om[k];
    if(nm.indexOf(mk) == -1) {
      console.log("DEL:",mk," - ",venue.name);
      //NOTE: Disabling the actual delete.
      // om.splice(k,1);
    }
  }
}

venues.save();
