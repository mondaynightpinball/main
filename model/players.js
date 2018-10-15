var fs = require('fs');
var mustache = require('mustache');
var ids = require('../lib/ids');
// TODO: Move the email integration into the router?
var email = require('../lib/email');
var util = require('../lib/util');
var A = require('../lib/auth');
const makeKey = require('../lib/make-key');

var _map = {};

// TODO: ALERT, destroy player isn't erasing anything but the player file.
function destroyPlayer(k) {
  delete _map[k];
  const filename = `data/players/${k}`;
  if(util.fileExists(filename)) {
    fs.unlinkSync(filename);
  }
}

function getPlayer(k) {
  //var key = k.toLowerCase();
  var key = k; //.toLowerCase();
  var p = _map[key]; //This would be replaced by a mongo.get/findOne.
  if(!p) {
    //Try to load from disk.
    var filename = 'data/players/' + key;
    if(util.fileExists(filename)) {
      var raw = fs.readFileSync('data/players/'+key);
      try {
        p = JSON.parse(raw);
      } catch (e) { console.log(e); }
      if(p) _map[key] = p;
    }
    else {
      // console.log("Nothing found for " +k);
    }
  }
  if(p) {
    p.save = function() {
      savePlayer(this);
    };
  }
  return p; //Or callback(p);
}

function getAll() {
  var list = fs.readdirSync('data/players');
  var results = [];
  for(i in list) {
    var p = getPlayer(list[i]);
    if(p) results.push(p);
  }
  return results;
}

//TODO: load players from db? See hack at the bottom of the file.

// TODO: We should be doing this on the client side!
function passesMatch(params) {
  var p1 = params.pass || 'p1';
  var p2 = params.conf || 'p2';
  return p1 == p2;
}

function playerExists(key) {
  var k = key.toLowerCase();
  if(_map[k]) return true;
  if(util.fileExists('data/players/'+k)) return true;
  return false;
}

function savePlayer(player) {
  try {
    fs.writeFileSync('data/players/'+player.key,JSON.stringify(player,null,2));
  } catch (err) {
    console.log(err);
  }
}

function sendVerify(params) {
  console.log("sendVerify()... ");
  var template = fs.readFileSync('./template/email_verify.html').toString();

  var url = params.url;
  var name = params.name;
  var to = params.email;
  var subject = params.subject || 'MNP - Confirm Email';

  var body = mustache.render(template, {
    name: name,
    link: url
  });
  email.send(to, subject, body);
}

module.exports = {
  makeKey, // TODO: Remove as an export from players, now that it's a lib.
  all: getAll,
  //TODO: Should this involve a callback?
  get: getPlayer,
   //TODO: Change to use callback?
  getByEmail: function(email) {
    if(!util.isEmail(email)) return;
    return this.getByField('email',email);
  },
  getByName: function(name) {
    return this.getByField('name',name);
  },
  //TODO: This should be replaced by mongo.findOne
  getByField: function(field,value) {
    var list = this.all();
    var check = value.trim().toLowerCase(); //For now only using lower case on values. fields should be known.
    for(i in list) {
      var p = list[i];
      if(p[field] && p[field].trim().toLowerCase() == check) {
        return p;
      }
    }
  },
  login: function(params,callback) {
    var username = params.username;
    var pass = params.pass;

    if(!username || username.length == 0) {
      console.log("login failed, empty playername");
      return callback("ERROR: Failed to login");
    }

    if(!pass || pass.length == 0) {
      console.log("login failed, empty pass");
      return callback("ERROR: Failed to login");
    }

    var player;

    if(username.indexOf('@') >= 0) {
      //Find the ukey to match the email, if possible.
      player = this.getByEmail(username);
    }
    else { //This is semi-deprecated because of the new hash keys.
      player = this.get(username);
    }
    if(!player) {
      console.log("login failed, unknown player: \"" + username + "\"");
      return callback("ERROR: Failed to login");
    }

    if(!A.shadows.check(player.key,pass)) {
      console.log("login failed, incorrect password for player: " + player.key);
      return callback("ERROR: Failed to login");
    }
    console.log("login SUCCESS: " +player.key);

    callback(null, player);
  },
  signup: function(params,callback) {
    var name = params.name;
    var email = params.email;
    if(!util.isEmail(email)) { return callback("ERROR: Invalid Email address. \"" +params.email+ "\""); }

    var player;

    //If we are having users signup with their email, that is probably
    //the only check we should make for a prior user.
    //HOWEVER, We very much do not want to allow duplicate names
    //		so long as we use them as the root of our keys.
    //var player = this.getByName(name);
    //if(!player) player = this.getByEmail(email);
    var player = this.getByEmail(email);
    if(player) console.log("Email already used. verified: " +player.verified);
    var token;
    if(!player) {
      console.log("Player is unknown, creating new...");
      var key = makeKey(name);
      token = ids.create();

      A.tokens.set(key,token);
      player = {
        key: key,
        name: name,
        email: email,
        created_at: Date.now(),
      };
    }
    else {
      console.log("Player object existed already...");
      //, resending verify link...");
      if(player.verified) {
        console.log("Player already verified, sending to existing email...");
      }
      else {
        console.log("Player not yet verified, using the most recent email...");
        player.email = email;
      }
      token = A.tokens.get(player.key);
      if(!token) {
        console.log("Token did not exist for " +player.key);
        token = ids.create();
        A.tokens.set(player.key, token);
      }
    }
    sendVerify({
      url: params.host + '/verify/' + token,
      name: name,
      email: player.email
    });
    savePlayer(player);
    callback(null, player);
  },
  verify: function(params,callback) {
    var token = params.token;
    console.log("verify token: ",token);
    //TODO: Index the tokens if needed.
    //TODO: OR mongo.find('players',{token: token})...

    var ukey = A.tokens.keyFor(token);
    if(!ukey) {
      return callback("ERROR: No token found: " +token);
    }

    //var player = this.getByField('token',token);
    var player = this.get(ukey);
    if(!player) {
      return callback("ERROR: No player matches token " +token);
    }
    player.verified = true;
    savePlayer(player);
    callback(null, player);
  },
  createPass: function(params,callback) {
    if(!passesMatch(params)) { return callback("ERR: Passwords did not match"); }
    var player = this.get(params.ukey);
    if(!player) { return callback("ERR: Player not found for " +params.ukey); }
    A.shadows.put(player.key, params.pass);
    console.log("Password set for: " +player.key);
    callback(null,player);
  },
  destroy: destroyPlayer
};
