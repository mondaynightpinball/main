var fs = require('fs');
var CONST = require('../constants');
var players = require('../model/players');
var util = require('../lib/util');
var A = require('../lib/auth');

var list = players.all();

var sessions = [];
var files = fs.readdirSync('data/sessions');
for(i in files) {
//console.log(files[i]);
  var id = files[i];
  var fn = 'data/sessions/' + id;
  var raw = fs.readFileSync(fn);
  var obj = JSON.parse(raw);
  obj.id = id;
  obj.save = function() {
console.log("Saving session: " +this.id);
    var filename = 'data/sessions/' + this.id;
    var str = JSON.stringify({
      key: this.key,
      created_at: this.created_at
    });
    fs.writeFileSync(filename, str);
  };
  sessions.push(obj);
console.log(obj);
}

for(i in list) {
  var player = list[i];
  var old = player.key;
  var key = players.makeKey(player.name);

  if(old != key && old != CONST.ROOT) {
    var fn = 'data/players/' + old;
    if(util.fileExists(fn)) { fs.unlinkSync(fn); }
    player.key = key;

    var sh = A.shadows.get(old);
    A.shadows.set(key,sh);
    A.shadows.clear(old);

    var token = A.tokens.get(old);
    if(token) {
      A.tokens.set(key,token);
      A.tokens.clear(old);
    }

    //Fix the sessions, too.
    for(j in sessions) {
      var s = sessions[j];
      if(s.key == old) {
        s.key = key;
        s.save();
      }
    }

    player.save();
  }
}
