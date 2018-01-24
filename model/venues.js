var fs = require('fs');

var _map = {};

var filename = 'data/venues.json';

function loadVenues() {
  var buf = fs.readFileSync(filename);
  _map = JSON.parse(buf);
  for(x in _map) {
    // console.log("venue.key: " + x);
    var v = _map[x];
    v.addMachine = function(mkey) {
      var index = this.machines.indexOf(mkey);
      if(index < 0) {
        this.machines.push(mkey);
        saveVenues();
      }
      else {
        console.log("Already have machine:",mkey," at ",this.name);
      }
    };

    v.removeMachine = function(mkey) {
      var index = this.machines.indexOf(mkey);
      if(index < 0) {
        console.log("Machine not found, NOT removing:",mkey," from ",this.name);
      }
      else {
        this.machines.splice(index,1);
        saveVenues();
      }
    };

  }
}
loadVenues();

function saveVenues() {
  var json = JSON.stringify(_map,null,2);
  fs.writeFileSync(filename, json);
}

module.exports = {
  create: function(params,callback) {
    var venue = {
      key: params.key,
      name: params.name,
      machines: []
    };
    _map[params.key] = venue;
    this.save();
    callback(venue);
  },
  get: function(key) {
    return _map[key];
  },
  list: function() {
    return Object.keys(_map);
  },
  all: function() {
    var list = [];
    for(k in _map) {
      list.push(_map[k]);
    }
    return list;
  },
  save: saveVenues
};
