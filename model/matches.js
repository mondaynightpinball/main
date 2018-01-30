var fs = require('fs');
var util = require('../lib/util');
var CONST = require('../constants');
var players = require('./players');

// TODO: Refactor in conjunction with splitting venues.js
var venues = require('./venues');

var NUM_GAMES   = [4,7,7,4,3];
var NUM_PLAYERS = [4,2,2,4,4];
var NUM_SCORES  = [4,2,2,4,2];

function makeRounds() {
  var rounds = [
    makeRound(1),
    makeRound(2),
    makeRound(3),
    makeRound(4)
  ];
  return rounds;
}

function makeRound(n) {
  var round = {
    n: n,
    games: []
  };

  var num = NUM_GAMES[n-1];
  for(var j = 0; j < num; j++) {
    round.games[j] = { n: j+1 };
//TODO: Move roundDone here as round.isDone
  }

  return round;
}

var _map = {};

function getMatch(key) {
  var match = _map[key];
  if(!match) {
    //Let's try to load.
    match = loadMatch(key);
    if(match) {
      //Cache the match for faster access.
      _map[key] = match;
    }
  }
  return match;
}

function loadMatch(key) {
  var filename = 'data/matches/'+key+'.json';
  if(!util.fileExists(filename)) { return; }

  var json = JSON.parse(fs.readFileSync(filename));
  //How do we apply our prototype back to the loaded object.
  //First make an empty match
  var match = new Match({});
  //Now let's copy in the team values.
  util.copy(json.home, match.home);
  util.copy(json.away, match.away);
  //Copy the rest of the match, but don't re-overwrite the away and home teams.
  util.copy(json, match, ['home','away']);

  return match;
}

//TODO: This never really got used. Probably remove at some point.
function deleteMatch(key) {
  var filename = 'data/matches/'+key+'.json';
  if(util.fileExists(filename)) {
      //TODO: Move the file to the trash instead of just wiping it.
    fs.unlinkSync(filename);
  }
  delete _map[key];
}

//TODO: Q: It seems like some day we'll hit the memory wall
//	   on how much junk we can just load.
function loadAll() {
console.log("loadAll()...");
  var list = fs.readdirSync('data/matches');
  for(i in list) {
    var fn = list[i];
    var spot = fn.indexOf('.json');
    var key = fn.substring(0,spot);
    var m = loadMatch(key);
    if(m) {
      m.key = key; //Fixes when I copy matches without changing key.
      _map[key] = m;
// console.log("list["+i+"]:",m.key);
    }
  }
}

//TODO: Do we need different find and findOne?
function listFind(list,query) { //TODO: callback
  if(!query || !list) return null;

  //For now, assuming query is an object with a single {prop: value} element
  var prop;
  var value;
  for(x in query) {
    if(prop) console.log("What the fuck? prop not null.");
    prop = x;
    value = query[x];
  }
  for(i in list) {
    var obj = list[i];

    if(obj && obj[prop] && obj[prop] == value) {
      return obj;
    }
  }
  return null;
}

function listGet(list,key) {
  if(!key || !list) return null;
  for(i in list) {
    //if(list[i].key.toLowerCase() == key.toLowerCase()) {
    if(list[i].key == key) {
      return list[i];
    }
  }
  return null;
}

function listAdd(list,p) {
  //TODO: We should probably check for all fields we expect/want.
  if(!p) return false;
  if(listGet(list,p.key)) return false;
  list.push(p);
}

function listRemove(list,key) {
  for(i in list) {
    var p = list[i];
    if(p && p.key == key) {
      list.splice(i,1);
      return p;
    }
  }
}

function isAuth(ukey,list) {
  if(ukey == CONST.ROOT) return true;
  for(i in list) {
    var p = list[i];
    if(p.key == ukey) {
      return true;
    }
  }
  return false;
}

function Team(params) {
  this.name = params.name;
  this.captains = [];
  this.lineup = [];
}

Team.prototype = {
  constructor: Team,
  /** Admins and captains can invite */
  hasCaptain: function(ukey) {
    var result = isAuth(ukey,this.captains);
    return result;
  },
  getPermissions: function(ukey) {
    var auth = isAuth(ukey,this.captains);
    return {
      canEdit: auth,
      canInvite: auth,
      canConfirm: auth,
      canRemove: auth,
      canJoin: ukey != 'ANON'
    }
  },
  getBonusPoints: function() {
    var count = 0;
    for(i in this.lineup) {
      var p = this.lineup[i];
      var n = p.num_played || 0;
      if(n >= 3) count++;
    }
    //TODO: Bonus points depend on the season's rules.
    if(count == 10) return 9;
    if(count ==  9) return 4; // Season 6+7 was 5 for 9
    return 0;
  },
};

function getDate(t) {
  var now = new Date(t || Date.now());
  var month = now.getMonth() + 1;
  if(month < 10) month = '0' + month;
  var day = now.getDate();
  if(day < 10) day = '0' + day;
  var year = now.getFullYear();
  return month + '/' +day+ '/' +year;
}

function Match(params) {
// console.log("********** NEW MATCH *******************");
// console.log(params);
  this.key = params.key;
  this.name = params.name;
  this.type = params.type || 'manual';
  this.week = params.week || 'Scrimmage';
  this.round = 1;
  this.create_at = Date.now();
  this.date = params.date || getDate();
  this.state = params.state || CONST.PREGAME;
//console.log("params.venue:",params.venue);
  var vk = params.venue ? params.venue.key ? params.venue.key : params.venue : null;
  // var venue = params.venue ? venues.get(params.venue.key) : null;
  var venue = vk ? venues.get(vk) : null;
// console.log("venue:",vk,venue);
  if(!venue) {
    venue = {
      key: 'venue-'+params.key,
      name: 'Venue for ' +params.name,
      machines: []
    };
  }
  else {
    //Make a copy.
    var ven = {
      key: venue.key,
      name: venue.name,
      machines: []
    };
    for(i in venue.machines) {
      ven.machines.push(venue.machines[i]);
    }
    venue = ven;
  }

  this.venue = venue;


  this.away = new Team(params.away || { name: "Away Team" });
  this.home = new Team(params.home || { name: "Home Team" });
  this.rounds = makeRounds();
  this.players = [];
}


Match.prototype = {
  constructor: Match,
  // --------------- REMOVE PLAYER ----------------------------
  remove: function(params,callback) {
    var callback = callback || function() {};
console.log("remove():",params);
    var ukey = params.ukey;
    var team;
    if(params.team && params.team == 'home') team = this.home;
    if(params.team && params.team == 'away') team = this.away;

    var auth = (ukey == CONST.ROOT); //TODO: This line is not necessary.
    if(team) auth = isAuth(ukey,team.captains);

    if(!auth) { return callback("ERROR: " +ukey+ " not authorized to REMOVE players"); }
    var key = params.key;
    if(!key || key.length == 0) { return callback("ERROR: Can't remove nothing"); }
    //Is the player even in the list?

    //Q: Should we prevent captains from removing themselves?
    //A: Unless there is some confirm by the user, or a way to undo, I say we do prevent.
    if(key == ukey) { return callback("ERROR: Can't remove yourself"); }

    //TODO: Should we prevent a team from removing a player that
    //      has played at least 1 game? In that case, they should
    //      first add the replacement, if applicable, then swap,
    //      then remove....but that's a big pain.
    //    I suppose that it might be ok, it will just confuse
    //    the GUI, but perhaps not in a breaking way.

    if(team) {
      var x = listRemove(team.captains,key);
      var y = listRemove(team.lineup,key);
      team.ready = false;
      team.confirmed = false;
      if(y) return callback(null,y);
    }
    else {
      var y = listRemove(this.players,key);
      if(y) return callback(null,y);
    }
    return callback("ERROR: Did not find target to remove");
  },
  // ------------------ JOIN MATCH -------------------------------
  // This is only used for match.type='auto', but even then we maybe
  // should just have the match admin add players instead of allowing
  // players to join.
  join: function(params,callback) {
    var callback = callback || function() {};
    var ukey = params.ukey;
    var want_captain = params.want_captain;

    var auth = ukey != 'ANON';
    if(!auth) { return callback("ERROR: Not logged in"); }

console.log("match.join ukey: " +ukey);
console.log(this.players);

    var p = listGet(this.players,ukey);
    if(!p) {
      p = players.get(ukey);
      if(!p) { return callback("ERROR: Player doesn't exist " +ukey); }
      var player = {
        name: p.name,
        key: p.key,
        ifpa_num: p.ifpa_num,
        confirmed: true //Not sure if I should really do this!!!
      };
      p = player;
      this.players.push(p);
    }
    p.wants_captain = want_captain;
    this.save();
    callback(null,p);
  },
  // ----------------- ADD PLAYER ---------------------------------
  add: function(params,callback) {
    var callback = callback || function() {};
//console.log("add player...\n",params);
    var ukey = params.ukey;
    var team;
    if(params.team && params.team == 'home') team = this.home;
    if(params.team && params.team == 'away') team = this.away;

    var auth = (ukey == CONST.ROOT);
    if(team) auth = isAuth(ukey,team.captains);

    if(!auth) { return callback("ERR: " +ukey+ " not authorized to add players"); }
    var want_captain = params.want_captain ? true : false;
    var name = params.name;

    if(!name || name.length == 0) {
      return callback("ERROR: Cannot add nothing.");
    }

    var who = players.get(ukey);
    if(!who) { return callback("ERR: No player exists for " +ukey); }
    var hash  = players.makeKey(name);
    var uhash = players.makeKey(who.name);

    var p;
    var query = { key: hash };

    if(team) {
      //Check the lineups.
      if(!p) p = listFind(this.away.lineup,query); //function(err,p)?
      if(!p) p = listFind(this.home.lineup,query);
    }
    else {
      p = listFind(this.players,query);
    }

    if(!p) p = players.getByName(name);

    if(!p) {
      //Person was not in the match, nor found by email or name.
      var player = {
        key: hash,
        name: name
      };
      p = player;
    }
    else {
      var player = {
        key: hash,
        name: p.name
      };
      p = player;
    }
    if(team) {
      //Determine if the player is a sub.

      // TODO: Fix any require race condition!
      var seasons = require('./seasons'); //Needed to delay the require.

      //console.log(seasons);
      // TODO: seasons.get() only gets current season. Should we compare against a season field in this?
      var season = seasons.get();
      //console.log(season);
      var teams = season.teams;
      var roster = teams[team.key] ? teams[team.key].roster : null;
      var isRoster = false;
      var isLeague = /^mnp-\d+-\d+/.test(this.key);
      console.log(this.key, isLeague, isRoster);
      if(roster) {
        for(x in roster) {
          var rp = roster[x];
          if(players.makeKey(rp.name) == p.key) {
            isRoster = true;
          }
        }
      }
      if(want_captain) {
        listAdd(team.captains,{
          key: p.key,
          name: p.name
        });
      }
      else {
        if(p.key != ukey) {
          listRemove(team.captains,p.key);
        }
        else {
          console.log("Suppressing removal of captain " +p.key+ " == " +ukey);
        }
      }
      listAdd(team.lineup,{
        key: p.key,
        name: p.name,
        sub: isLeague ? !isRoster : false
      });
      team.ready = false;
      team.confirmed = false;
    }
    else {
      listAdd(this.players,p);
    }
    this.save();
    callback(null,this);
  },
  // ------------------ CONDUCT DRAFT ------------------------------------------
  //TODO: This method should be moved out, because it's just a
  //      custom factory of sorts to allow for automatic draft.
  conductDraft: function(params,callback) {
    var ukey = params.ukey;
    //Who is allowed to conduct the draft?
    if(ukey != CONST.ROOT) {
      return callback("ERROR: " +ukey+ " not authorized to conduct draft.");
    }

    if(this.state != CONST.DRAFTING) {
      return callback("ERROR: Match is not in DRAFTING state.");
    }

    //TODO: Someday we should have different types of drafts.
    //	    For now, it's an auto draft.
    if(this.players.length < 16) {
      return callback("ERROR: Not enough players to start the draft.");
    }

    //TODO: Matches should have directors, which is a step below admin, and a step above captains.

    //Q: What if there aren't enough captains?
    //A: For now, I'm going to callback with an error.
    var caps = [];
    for(i in this.players) {
      var p = this.players[i];
      if(p.wants_captain) caps.push(p);
    }
console.log(caps.length,"people want captain");

    if(caps.length < 2) {
      return callback("ERROR: Not enough captains to start a match.");
    }

    var available = this.players.slice(0);

//console.log("caps:",caps);
//console.log("available: ",available);

    var a = { name: 'Away Team', captains: [], lineup: [] };
    var h = { name: 'Home Team', captains: [], lineup: [] };

    //Select the first captain, who will be away and pick first.
    var n = caps.length;
    var index = Math.floor(n * Math.random());
    var captain = caps[index];
    caps.splice(index,1); //Remove the option.
    a.captains.push(captain);
    a.lineup.push(captain);
    var x = available.indexOf(captain); //Will this work???
    available.splice(x,1);
    console.log("Away captain is: ", captain);

    //Select the second captain, who will be home and pick second.
    n = caps.length;
    index = Math.floor(n * Math.random());
    captain = caps[index];
    caps.splice(index,1); //Remove the option.
    h.captains.push(captain);
    h.lineup.push(captain);
    x = available.indexOf(captain); //Will this work???
    available.splice(x,1);
    console.log("Home captain is: ", captain);

    var pick = 0;
    while(available.length > 0) {
      n = available.length;
      index = Math.floor(n * Math.random());
      var p = available[index];
      available.splice(index,1);
      var team = (pick % 2 == 0) ? a : h;
      team.lineup.push(p);
      pick++;
//console.log("pick ",pick," by ",team.name," is ",p);
    }

    this.home.name     = h.name;
    this.home.captains = h.captains;
    this.home.lineup   = h.lineup;

    this.away.name     = a.name;
    this.away.captains = a.captains;
    this.away.lineup   = a.lineup;

    this.save();
    callback(null,this);
  },
  // -------------- ADD MACHINE -------------------------------
  addMachine: function(params,callback) {
console.log("addMachine()",params);
    var ukey = params.ukey;
    var auth = this.home.hasCaptain(ukey) ||
               this.away.hasCaptain(ukey);

    if(!auth) { return callback("ERROR: " +ukey+ " Not allowed to add machines."); }
    var mkey = params.mkey;
    var index = this.venue.machines.indexOf(mkey);
    if(index < 0) this.venue.machines.push(mkey);
    this.save();
    callback(null,this);
  },
  // ---------------  REMOVE MACHINE ------------------------------
  removeMachine: function(params,callback) {
console.log("removeMachine()",params);
    var ukey = params.ukey;
    var auth = this.home.hasCaptain(ukey) ||
               this.away.hasCaptain(ukey);

    if(!auth) { return callback("ERROR: " +ukey+ " Not allowed to remove machines."); }
    var mkey = params.mkey;
    var index = this.venue.machines.indexOf(mkey);
    if(index >= 0) this.venue.machines.splice(index,1);
    this.save();
    callback(null,this);

  },
  // ---------------   BEGIN MATCH -----------------------------
  begin: function(params,callback) {
    var ukey = params.ukey;
    if(ukey != CONST.ROOT) { return callback("ERROR: Not a tournament director. Cannot begin."); }

    //OK Let's see where we are:
    if(this.state == CONST.REGISTERING) {
      //We need to draft and then punt it back to the user(s).
      this.state = CONST.DRAFTING;
      return this.conductDraft(params, callback);
    }
    else if(this.state == CONST.DRAFTING) {
      //Make all the checks to see if we can really start.
      if(this.home.captains.length == 0) return callback("ERROR: No Home captains.");
      if(this.away.captains.length == 0) return callback("ERROR: No Away captains.");
      if(this.home.lineup.length < 8) return callback("ERROR: Not enough home players.");
      if(this.away.lineup.length < 8) return callback("ERROR: Not enough away players.");

      //TODO: Venue acceptable? Enough machines?

      //TODO: We could also move to captain based draft instead of auto.
      this.home.ready = true;
      this.away.ready = true;
      this.round = 1;
      this.state = CONST.PICKING;
    }

    this.save();
    callback(null, this);
  },
  // ------------------- CONFIRM LINEUP --------------------------
  confirmLineup: function(params,callback) {
console.log("confirmLineup()...");
console.log(params);
    var side = params.side || '';
    var ukey = params.ukey;
    var team;
    var vs;
    if(side == 'away') { team = this.away; vs = this.home; }
    if(side == 'home') { team = this.home; vs = this.away; }
    if(!team) { return callback("ERROR: Side not found: " +side); }

    var auth = isAuth(ukey,team.captains);
    if(!auth) { return callback("ERROR: " +ukey+ " not authorized to confirm opponent's lineup."); }

    var name = CONST.ROOT; //Default for the only one who isn't a captain here.
    var cap = listGet(team.captains,ukey);
    if(cap) name = cap.name;
    //The captain from {{side}} is confirming {{vs}} lineup.
    if(!vs.ready) { return callback("ERROR: Opponent's lineup is not ready to be confirmed."); }
    vs.confirmed = {
      by: name,
      at: Date.now()
    };
    console.log("Confirmed: " +vs.name+ " by " +ukey);

    if(team.confirmed && team.ready) {
      //It's time for the match to move on to playing!
      this.state = CONST.PICKING;
      this.round = 1;
    }
    this.save();
    callback(null,this);
  },
  // -------------------- TEAM READY ------------------------------
  teamReady: function(params,callback) {
console.log("teamReady()...");
//console.log(params);
    var side = params.side || '';
    var ukey = params.ukey;
    var team;
    var vs;
    if(side == 'away') { team = this.away; vs = this.home; }
    if(side == 'home') { team = this.home; vs = this.away; }
    if(!team) { return callback("ERROR: Side not found: " +side); }

    var auth = isAuth(ukey,team.captains);
    if(!auth) { return callback("ERROR: " +ukey+ " not authorized to set lineup."); }

    //TODO: Is the team in question actually ready to be ready?

    team.ready = true;
    this.save();
    callback(null, this);
  },
  getRound: function(n) {
    var n = n || this.round;
    for(i in this.rounds) {
      var round = this.rounds[i];
      if(round.n == n) return round;
    }
    //TODO: Should we return undefined or null instead?
    return { n: 0, games: [] };
  },
  getGame: function(r,n) {
    var round = this.getRound(r);
    return round.games[n-1];
  },
  // ----------------- WHO PICKS/PLAYS FIRST? ------------------
  getOrder: function(round) {
    var round = round || this.round;
    if(round == 1) return [this.away, this.home];
    if(round == 2) return [this.home, this.away];
    if(round == 3) return [this.away, this.home];
    if(round == 4) return [this.home, this.away];
    if(round == 5) return [this.home, this.away];
  },
  getPickingTeam: function(round) {
    var order = this.getOrder(round);
    if(this.state == CONST.PICKING) {
      return order[0];
    }
    if(this.state == CONST.RESPONDING) {
      return order[1];
    }
  },
  // ------------------ MAKE PICKS -------------------------
  makePicks: function(params,callback) {
    //Verify that the incoming picks are from the valid state.
    var st = params.state;
    if(!st || st != this.state) {
      return callback("ERROR: Not allowed to pick state " +this.state+ " from " +st);
    }
    var rnd = params.round;
    if(!rnd || rnd != this.round) {
      return callback("ERROR: Not allowed to pick round " +this.round+ " from " +rnd);
    }

    //console.log("makePicks() ", params);
    var team = this.getPickingTeam();
    if(!team) {
      //Probably should never happen.
      return callback(["ERROR: Not in a picking state"]);
    }

    if(!isAuth(params.ukey,team.captains)) {
      return callback(["ERROR: " +params.ukey+ " not authorized to pick"]);
    }
    else {
      //At this point, the ukey is a captain of the "picking"
      //team, and posting picks for this.round and this.state.
      var games = this.getRound().games;
      for(prop in params.picks) {
        var x = params.picks[prop];
        if(x.length > 0) {
          var nn = prop.split('.');
          var num = nn[1];
          var game = games[num - 1]; //Can also be checked against each game.n
          var field = nn[0];
          //TODO: assert field in valid_fields

          //Q: Is it possible to have multiple Forfeit players?
          game[field] = x;
        }
      }
      var numPlayers = NUM_PLAYERS[this.round - 1];

      //Determine if picks are satisfied.
      var picksReady = true;
      var players = [[],[]];
      var machines = [];
      var errors = [];

      var addPlayer = function(n,p) {
        if(!p || p.length == 0) return false;
        var w = 1 - (n % 2);
        if(players[w].indexOf(p) >= 0) {
          errors.push("Cannot use same player for more than 1 game per round. " +p.name);
          return false;
        }
        players[w].push(p);
        return true;
      };

      var addMachine = function(m) {
        if(!m || m.length == 0) return false;
        // if(machines.indexOf(m) >= 0) {
//console.log("Duplicate Machine: " + m);
          //TODO: The following is only an error if there are enough machines.
          //      We would need to pull up the venue and see what machines are in.
          //      BUT, just like we have virtual team objects for every match,
          //      we should have a virtual venue object to allow the match
          //      creator/director to remove games.
          //      Games that need to be added can also copy to other instances of
          //      the venue, including the master copy, but that might need review.
          // errors.push("Cannot use same machine for more than 1 game per round. " +m);
          // return false;
        // }
        machines.push(m);
        return true;
      };

      for(var i = 0; i < games.length; i++) {
        var g = games[i];
        //Verify picking team picks.
        if(!addMachine(g.machine)) picksReady = false;
        if(!addPlayer(1,g.player_1)) picksReady = false;
        if(numPlayers > 2) {
          if(!addPlayer(3,g.player_3)) picksReady = false;
        }
        if(this.state == CONST.RESPONDING) {
          //Verify responding team picks.
          if(!addPlayer(2,g.player_2)) picksReady = false;
          if(numPlayers > 2) {
            if(!addPlayer(4,g.player_4)) picksReady = false;
          }
        }
      }

console.log("state:",this.state,"picksReady:",picksReady);

      if(this.state == CONST.PICKING) {
        if(picksReady) this.state = CONST.RESPONDING;
      }
      else if(this.state == CONST.RESPONDING) {
        if(picksReady) {
          this.state = CONST.PLAYING;
        }
      }
      this.save();
      callback(errors,this);
    }
  },
  // ----------------- CALC POINTS -------------------------
  // This allows us to recalc points after edits outside
  // of reportScores().
  calcPoints: function() {
    console.log("calcPoints() ...");
    for(i in this.rounds) {
      var r = this.rounds[i];
      for(j in r.games) {
        var g = r.games[j];
        if(gameDone(g,r.n)) {
          calcPoints(g,r.n);
        }
        else {
          console.log("Incomplete game:",r.n,g.n);
        }
      }
      if(!roundDone(r)) {
        console.log("Incomplete round:",r.n);
      }
    }
  },
  // ----------------- GET POINTS --------------------------
  //TODO: Consider rename getPoints -> getBoxscore
  getPoints: function() {
    countGames(this);
    var points = { home: 0, away: 0, rounds: [] };
    for(var r = 0; r < 4; r++) {
      var round = this.rounds[r];
      points.rounds[r] = { n: r+1, home: 0, away: 0 };
      for(var i = 0; i < round.games.length; i++) {
        var g = round.games[i];
        points.home += g.home_points || 0;
        points.away += g.away_points || 0;
        points.rounds[r].home += g.home_points || 0;
        points.rounds[r].away += g.away_points || 0;
      }
    }
    if(this.rounds.length == 5) {
      var round = this.rounds[4];
      var asum = 0;
      var hsum = 0;
      for(var i = 0; i < round.games.length; i++) {
        var g = round.games[i];

        //TODO: IMPORTANT HACK for round 5.
        //  The home team plays first in all games
        //  instead of away.

        asum += g.away_points || 0;
        hsum += g.home_points || 0;
      }
      if(asum > 0.5) {
        points.away += 1;
        points.rounds[4] = { n: 5, home: 0, away: 1 };
      }
      else if(hsum > 0.5) {
        points.home += 1;
        points.rounds[4] = { n: 5, home: 1, away: 0 };
      }
      else {
        points.rounds[4] = { n: 5, home: 0, away: 0 };
      }
    }
    else {
      points.rounds.push({ n: 5, home: 0, away: 0 });
    }
    var hb = this.home.getBonusPoints();
    var ab = this.away.getBonusPoints();
//console.log("bonus, home:",hb,"away:",ab);
    points.bonus = {
      home: hb,
      away: ab
    };
    points.home += hb;
    points.away += ab;
    return points;
  },
  canReport: function(params) {
    var ukey = params.ukey;

    //For now, and to test an easy hack...
    if(ukey == CONST.ROOT) return true;

    var r = params.round;
    var n = params.n;

    //DONE: if(ukey is ROOT)
    //TODO: if(ukey is a captain)
    //TODO: else if(ukey is a player)
    if(this.state != CONST.PLAYING) {
      //For non-captain players, return false
      //For captains, when can you change things?
      return false;
    }

    if(r != this.round) {
      console.log("Cannot report round " +r+ " during round " +this.round);
      return false;
    }

    //Q: Who can edit a game?
    //A: Any player from either team, for now.
    var list = [];
    for(i in this.home.lineup) {
      list.push(this.home.lineup[i]);
    }
    for(i in this.away.lineup) {
      list.push(this.away.lineup[i]);
    }
    var auth = isAuth(ukey,list);
    return auth;
  },
  reportScores: function(params,callback) {
console.log("reportScores(): ",params);
//console.log("reportScores(): ");
    var ukey = params.ukey;
    var r = params.round;
    var n = params.n;
    var update = params.update;

    var round = this.getRound(r);
    var games = round.games;
    var game = games[n-1];

    //Q: When can a game be edited?
    //A: For now, anytime that r <= this.round
    //A2: Changing to only be r == this.round.
    if(r > this.round) {
      return callback("ERROR: Trying to edit a round that has not happened yet.");
    }

    var auth = this.canReport(params);
    if(!auth) {
      return callback("ERROR: " +ukey+ " not authorized to report scores.");
    }

    //TODO: There is a reported/observed bug where photos lose their
    //      transform data.
    var rot   = parseInt(update.photo_rotation || 0);
    var dx    = parseInt(update.photo_dx       || 0);
    var dy    = parseInt(update.photo_dy       || 0);
    var scale = parseFloat(update.photo_scale  || 1);
    rot = rot % 360;

    var data = update.photo_data;
    if(data && data.length > 0) {
      var purl = '/pics/' +data;
      if(!game.photos) game.photos = [];
      game.photos.splice(0,0,{
        uploaded_by: ukey,
        url: purl,
        rot: rot,
        scale: scale,
        dx: dx,
        dy: dy
      });
    }
    else {
      var oldPhoto = game.photos ? game.photos[0] : null;
      //Only update the oldPhoto if transform data was received.
      //We only need to check for one because they are sent as
      //a bundle.
      if(oldPhoto && update.photo_rotation) {
        oldPhoto.rot = rot;
        oldPhoto.scale = scale;
        oldPhoto.dx = dx;
        oldPhoto.dy = dy;
      }
    }

    //Just to be safe, we'll always say there is a mod.
    //var modified = false;
    //NOTE: We are sucking in whatever gets posted.
    //      This is pretty bad design because people
    //      could post all sorts of weird shit.
    //  BUT: For now, it's pretty convenient for changing
    //      players and/or the machine.
    for(prop in update) {
      var x = update[prop];
      if(prop.indexOf('photo_') != 0 && x.length > 0) {
        if(prop.indexOf('score_') == 0) {
          var newScore = parseInt(x);
          if(newScore > 0) game[prop] = newScore;
        }
        else {
          //TODO: Block non-captain access for non-score values.
          //      ie a change in machine or players.
          game[prop] = x;
        }
      }
    }

    //TODO: if(!modified)
    delete round.left_confirmed;
    delete round.right_confirmed;

    //TODO: Need break it all down into events that get logged, instead of full match saves?

    //TODO: If any scores were changed to 0 after calcPoints was
    //      called, the points and sums are not cleared.
    if(gameDone(game, r)) {
      calcPoints(game, r);
    }
    else {
      game.points_1 = 0;
      game.points_2 = 0;
      game.points_3 = 0;
      game.points_4 = 0;
      game.points_13 = 0;
      game.points_24 = 0;
      game.score_13 = 0;
      game.score_24 = 0;
    }

    if(roundDone(round)) {
      //Check to see if the match is done?
//      if(r == this.round) {
//        this.state = CONST.REVIEWING;
//      }
    }
    else {
      //We don't need to change round or state, since we are
      //still waiting for more results. However, if the
      //game is complete, we can calculate the points.
    }

    //Save changes to the match and callback.
    this.save();
    callback(null,this);
  },
  confirmScores: function(params,callback) {
console.log("confirmScores():",params);
    var ukey = params.ukey;
    var order = this.getOrder();
    var left = order[0];
    var right = order[1];

    // var right = this.round % 2 == 0 ? this.away : this.home;
    // var left  = this.round % 2 == 0 ? this.home : this.away;

    var side = params.side;
    //Q: Is it really time to confirm?
    var round = this.getRound();
    if(roundDone(round)) {
      //Yes, this round can be confirmed.
      //Q: Is this the correct captain?
      if(side == 'left') {
        if(left.hasCaptain(ukey)) {
          var lcap = listGet(left.captains,ukey);
          var name = lcap ? lcap.name : ukey;
          round.left_confirmed = {
            by: name,
            at: Date.now(),
            elapsed: function() {
              return Date.now() - this.at;
            }
          };
        }
        else {
          return callback("ERROR: Not a left captain");
        }
      }
      else if(side == 'right') {
        if(right.hasCaptain(ukey)) {
          var rcap = listGet(right.captains,ukey);
          var name = rcap ? rcap.name : ukey;
          round.right_confirmed = {
            by: name,
            at: Date.now(),
            elapsed: function() {
              return Date.now() - this.at;
            }
          };
        }
        else {
          return callback("ERROR: Not a right captain");
        }
      }
    }
    else {
      //No, this round cannot yet be confirmed.
      return callback("ERROR: Round is not ready to be confirmed.");
    }
    if(round.left_confirmed && round.right_confirmed) {
      //console.log("Round has been mutually confirmed!");

      //Do we need more rounds?
      var more = false;
      if(this.round < 4) {
        more = true;
      }
      else if (this.round == 4) {
        var points = this.getPoints();
        if(points.home == points.away) {
          this.rounds.push(makeRound(5));
          more = true;
        }
      }
      if(more) {
        this.round++;
        this.state = CONST.PICKING;
      }
      else {
        this.state = CONST.COMPLETE;
      }
    };
    this.save();
    callback(null,this);
  },
  isDone: function() {
// console.log("isDone(), rnd:" +this.round);
    //Do we need more rounds?
    if(this.round < 4) {
      return false;
    }
    var points = this.getPoints();
    var round = this.getRound();
// console.log("round.done:", round.done);
    if(this.round == 4) {
      if(round.done) {
        return (points.home != points.away);
      }
      else return false; //Finish round 4
    }
    if(this.round == 5) {
      return round.done;
    }
  },
  save: function() {
    var json = JSON.stringify(this,null,2);
    fs.writeFileSync('data/matches/'+this.key+'.json',json);
  }
};

function calcPoints(game, round) {
  // console.log("calcPoints() game:", game, " round:", round);
  if(round == 1 || round == 4) {
    //Doubles game
    var points = calcDoubles([
      game.score_1,
      game.score_2,
      game.score_3,
      game.score_4,
    ]);
    game.points_1 = points[0];
    game.points_2 = points[1];
    game.points_3 = points[2];
    game.points_4 = points[3];

    game.score_13 = game.score_1 + game.score_3;
    game.score_24 = game.score_2 + game.score_4;

    game.points_13 = points[0] + points[2];
    game.points_24 = points[1] + points[3];

    game.away_points = (round == 1 ?
        game.points_13 : game.points_24);
    game.home_points = (round == 1 ?
        game.points_24 : game.points_13);
  }
  else if(round == 2 || round == 3) {
    //Singles
    var points = calcSingles([
      game.score_1,
      game.score_2
    ]);
    game.points_1 = points[0];
    game.points_2 = points[1];
    game.points_13 = points[0];
    game.points_24 = points[1];
    game.score_13 = game.score_1;
    game.score_24 = game.score_2;
    game.away_points = (round == 2 ? points[1] : points[0]);
    game.home_points = (round == 2 ? points[0] : points[1]);
  }
  else if(round == 5) {
    //Shared
    var points = calcShared([
      game.score_1,
      game.score_2
    ]);
    game.points_1 = points[0];
    game.points_2 = points[1];
    game.points_13 = points[0];
    game.points_24 = points[1];
    game.score_13 = game.score_1;
    game.score_24 = game.score_2;

    game.away_points = points[1],
    game.home_points = points[0];
  }
  else {
    return undefined;
  }
  return game;
}

function calcDoubles(scores) {
  var points = [0,0,0,0];

  var total1 = scores[0] + scores[2];
  var total2 = scores[1] + scores[3];

  if(scores[0] > scores[1]) { points[0]++; } else { points[1]++; }
  if(scores[0] > scores[3]) { points[0]++; } else { points[3]++; }
  if(scores[2] > scores[1]) { points[2]++; } else { points[1]++; }
  if(scores[2] > scores[3]) { points[2]++; } else { points[3]++; }

  if(total1 > total2) { points[0] += 0.5; points[2] += 0.5; }
  else                { points[1] += 0.5; points[3] += 0.5; }

  return points;
}

function calcSingles(scores) {
  var points = [0,0];

  //float ratio = ((float)scores[0])/scores[1];
  var ratio = scores[0]/scores[1];

  //It is possible to exactly double. In NBAFB, there was a 23-46 game. 2x tie goes to the winner
  if(ratio >= 2)        { points[0] = 3; } //p1 doubled p2
  else if(ratio > 1)    { points[0] = 2; points[1] = 1; } //p1 def p2 without doubling
  //There should not be any exact ties.
  else if(ratio > 0.5)  { points[0] = 1; points[1] = 2; } //p2 def p1 without doubling
  else                  { points[1] = 3; } //p2 doubled p1

  return points;
}

function calcShared(scores) {
  //I suppose this could be for all players, but
  //I'm probably already going to refactor all of this.
  points = [0,0];

  if(scores[0] == 0 && scores[1] == 0) {
    return points;
  }

  if(scores[0] > scores[1]) points[0] = 0.333; //1/3;
  else                      points[1] = 0.333; //1/3;

  return points;
}

function countGames(match) {
// console.log("countGames... for " +match.key);
  var map = {};
  var incr = function(key) {
    var x = map[key] || 0;
    map[key] = x + 1;
  }
  for(i in match.rounds) {
    var round = match.rounds[i];
    for(j in round.games) {
      var game = round.games[j];
      if(game.done) {
        if(round.n < 5) {
          incr(game.player_1);
          incr(game.player_2);
        }
        if(round.n == 1 || round.n == 4) {
          incr(game.player_3);
          incr(game.player_4);
        }
      }
    }
  }
// console.log(map);
  for(i in match.away.lineup) {
    var p = match.away.lineup[i];
    var x = map[p.key] || 0;
    p.num_played = x;
  }
  for(i in match.home.lineup) {
    var p = match.home.lineup[i];
    var x = map[p.key] || 0;
    p.num_played = x;
  }
// console.log(match.away.key,match.away.lineup);
// console.log(match.home.key,match.home.lineup);

}

function roundDone(round) {
//console.log("roundDone() round:",round);
  var games = round.games;
  var done = true;
  for(var i = 0; i < games.length; i++) {
    if(!gameDone(games[i], round.n)) {
      done = false;
    }
  }
  round.done = done;
  return done;
}

function gameDone(game, r) {
  var done = true;
  if(!game.score_1 || game.score_1.length == 0) done = false;
  if(!game.score_2 || game.score_2.length == 0) done = false;
  if(NUM_SCORES[r-1] > 2) {
    if(!game.score_3 || game.score_3.length == 0) done = false;
    if(!game.score_4 || game.score_4.length == 0) done = false;
  }
  game.done = done;
  return done;
}

module.exports = {
  //TODO: Should probably add callbacks to get and all.
  get: function(key) {
    var match = _map[key];
    if(!match) {
      //Let's try to load.
      match = loadMatch(key);
      if(match) {
        //Cache the match for faster access.
        _map[key] = match;
      }
    }
    return match;
  },
  all: function() {
    var list = [];
    for(k in _map) {
      list.push(_map[k]);
    }
    return list;
  },
  create: function(params,callback) {
    var ukey = params.ukey;
    if(ukey != CONST.ROOT) {
      return callback("ERROR: " +ukey+ " not authorized to create a match");
    }
    var match = new Match(params);
    _map[match.key] = match;
    match.save(); //TODO: add callback function
    callback(null,match);
  },
  remove: function(params,callback) {
    var ukey = params.ukey;
    if(ukey != CONST.ROOT) {
      return callback("ERROR: " +ukey+ " not authorized to remove a match");
    }
    var key = params.key;
    var match = this.get(key);
    if(!match) { return callback("ERROR: No match found for key=" +key); }
    deleteMatch(key);
    callback(null,match);
  }
  //Team: Team,
};

loadAll();
