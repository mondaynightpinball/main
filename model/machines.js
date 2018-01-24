var fs = require('fs');

var _map = {};

function fileExists(filename) {
  try {
    fs.statSync(filename);
    return true;
  } catch(e) {}
  return false;
}

function init() {
  var filename = 'data/machines.json';
  if(!fileExists(filename)) {
    console.log("FAILED to load " +filename);
    return;
  }
  var json = JSON.parse(fs.readFileSync(filename));
  if(typeof json == 'object') {
    _map = json;
  }
  else if(typeof json == 'array') {
    for(i in list) {
      var m = list[i];
      _map[m.key] = m;
    }
  }
}
init();

function save() {
  var json = JSON.stringify(_map);
  fs.writeFileSync('data/machines.json',json);
}

var machines = module.exports = {
  add: function(params) {
    console.log("Adding",params);
    //TODO: isAuth params.ukey?
    var key = params.key;
    var name = params.name;
    _map[key] = {key: key, name: name};
    save();
  },
  remove: function(params) {
    //TODO: isAuth params.ukey?
    var key = params.key;
    delete _map[key];
    save();
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
  }
};
