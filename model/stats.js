var fs = require('fs');

var _map = {};

var DATA_DIR = "data/stats";

function load() {
  var list = fs.readdirSync(DATA_DIR);
  console.log("Stats load()... list.len:",list.length);
  for(i in list) {
    var pk = list[i];
    var raw = fs.readFileSync(DATA_DIR + '/' + pk);
    var json = JSON.parse(raw);
    _map[pk] = json;
  }
}

function Stats(obj) {
  this.key = obj.key;
  this.history = [];
  this.pops = '0.000';
  this.num_matches = 0;
  this.ppm = '0.000';
  this.points = {
    won: 0,
    of: 0
  };
}

load();

module.exports = {
  get: function(key) {
    // console.log("stats.get("+key+")");
    return _map[key] || new Stats({ key: key });
  },
  set: function(key, value) {
    _map[key] = value;
    fs.writeFileSync(DATA_DIR + '/' + key, JSON.stringify(value,null,2));
  },
  all: function() {
    var all = [];
    for(k in _map) {
      all.push(_map[k]);
    }
    return all;
  }
};
