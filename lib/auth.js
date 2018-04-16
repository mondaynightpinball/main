var fs = require('fs');
var csv = require('./csv');
var util = require('./util');

// TODO: Holding a cache of shadows in memory is not the
// best, and doesn't really add a whole lot of speed optimization.
// If we do any kind of util adjustment of passwords, then we
// would have to immediately restart the server.
// Eventually those kinds of utils would either update a db that
// lives independent of the lifecycle of the site, or perhaps
// they would call an API method on the server instance.
function Map(filename) {
  this.filename = filename;
  this.cache = {};
}

Map.prototype = {
  constructor: Map,
  isValid: function(key,sh) {
    var v = this.cache[key];
    if(v && v == sh) return true;
    return false;
  },
  keyFor: function(value) {
    for(x in this.cache) {
      var v = this.cache[x];
      if(v == value) return x;
    }
  },
  get: function(key) {
    return this.cache[key];
  },
  set: function(key,sh) {
    this.cache[key] = sh;
    this.save();
  },
  put: function(key,pass) {
    var sh = util.digest(pass);
    this.set(key,sh);
  },
  check: function(key,pass) {
    var sh = util.digest(pass);
    return this.isValid(key,sh);
  },
  clear: function(key) {
    delete this.cache[key];
    this.save();
  },
  load: function() {
    console.log("AUTH Loading " +this.filename);
    this.cache = {}; //Throw away the old cache when re-loading.
    var rows = csv.load(this.filename);
    if(!rows || rows.length == 0) {
      // console.log("-- Unable to load  --");
      return;
    }

    var results = {};
    for(i in rows) {
      var row = rows[i];
      var key = row[0];
      var value = row[1];
      this.cache[key] = value;
    }
  },
  save: function() {
    var lines = '';
    for(key in this.cache) {
      var value = this.cache[key];
      if(value) lines += key + ',' + value + '\n';
    }
    //TODO: Perhaps try file write?
    fs.writeFileSync(this.filename, lines);
  }
};

// TODO: We may want to set a MNP_HOME env var and use absolute paths.
//       Node will be based where it is run from, whereas require()
//       is relative to the source file.
var _shadows = new Map('data/.shadows');
var _tokens  = new Map('data/.tokens');
_shadows.load();
_tokens.load();

//TODO: Fix this up, copied from different file.
function testShadows() {
  //This is sort of a hack to avoid overwriting the real file.
  shadows.filename = 'data/test_shadows';
  shadows.load(); //Load to swap out the cache.
  var key = 'mrguy';
  var sh1 = digest('hello');
  var sh2 = digest('there');

  console.log("hello: ",shadows.isValid(key,sh1));
  console.log("there: ",shadows.isValid(key,sh2));

  console.log("Setting password to hello");
  shadows.set(key,sh1);

  console.log("hello: ",shadows.isValid(key,sh1));
  console.log("there: ",shadows.isValid(key,sh2));

  console.log("Setting password to there");
  shadows.set(key,sh2);

  console.log("hello: ",shadows.isValid(key,sh1));
  console.log("there: ",shadows.isValid(key,sh2));
}

module.exports = {
  shadows: _shadows,
  tokens:  _tokens
};
