var venues = require('../model/venues');
var machines = require('../model/machines');

var all = venues.all();

for(i in all) {
  var venue = all[i];
  var om = venue.machines;
  for(j in om) {
    var mk = om[j];
    var machine = machines.get(mk);
    if(!machine) {
      console.log("Unknown machine: " +mk+ " at " +venue.name);
    }
  }
}
