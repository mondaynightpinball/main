var express = require('express');
var router = express.Router();
var fs = require('fs');
var mustache = require('mustache');

var venues = require('../model/venues');
var seasons = require('../model/seasons');
var matches = require('../model/matches'); //For standings
var players = require('../model/players');
var stats = require('../model/stats');
var ifpa = require('../model/ifpa');

var base = fs.readFileSync('./template/base.html').toString();

router.get('/',function(req,res) {
  var template = fs.readFileSync('./template/index.html').toString();
  var html = mustache.render(base,{
    title: 'Home'
  },{
    content: template
  });
  res.send(html);
});

router.get('/standings',function(req,res) {
  //TODO: Accept a season number.
  var template = fs.readFileSync('./template/standings.html').toString();

  var season = seasons.get(); //TODO Allow other seasons.
  var rows = season.getStandings();

  var html = mustache.render(base,{
    title: 'Standings',
    rows: rows
  },{
    content: template
  });

  res.send(html);
});

router.get('/schedule',function(req,res) {
  var template = fs.readFileSync('./template/schedule.html').toString();
  var season = seasons.get(); //TODO Allow other seasons.

  var weeks = season.weeks;

  //TODO: Q: Where and when do we add results to the weeks?

  var html = mustache.render(base,{
    title: 'Schedule',
    weeks: weeks
  },{
    content: template
  });

  res.send(html);

});

router.get('/stats',function(req,res) {
  var template = fs.readFileSync('./template/stats.html').toString();
  var all = stats.all();

  var max = 0;
  for(i in all) {
    var x = all[i].num_matches;
    if(x > max) max = x;
  }

  var cut = Math.round(max * 0.4);

  all.sort(function(a,b) {
    if(a.num_matches < cut && b.num_matches >= cut) return 1;
    if(b.num_matches < cut && a.num_matches >= cut) return -1;
    if(a.pops > b.pops) return -1;
    if(b.pops > a.pops) return 1;
    return 0;
  });

  for(i in all) {
    all[i].n = parseInt(i) + 1;
  }

  var html = mustache.render(base,{
    title: 'Stats',
    players: all
  }, {
    content: template
  });
  res.send(html);
});

router.get('/rules',function(req,res) {
  var template = fs.readFileSync('./template/rules2.html').toString();
  var html = mustache.render(base,{
    title: 'Rules'
  },{
    content: template
  });
  res.send(html);
});

router.get('/new-teams',function(req,res) {
  var template = fs.readFileSync('./template/call-for-teams.html').toString();
  var html = mustache.render(base,{
    title: 'Call For Teams'
  },{
    content: template
  });
  res.send(html);
});

router.get('/teams',function(req,res) {
  var season = seasons.get();
  var template = fs.readFileSync('./template/teams.html').toString();

  var list = [];

  for(k in season.teams) {
    var team = season.teams[k];
    console.log('team:', team);
    list.push({
      key: team.key,
      name: team.name,
      venue: venues.get(team.venue).name
    });
  }

  list.sort(function(a,b) {
    var trick = [a.name,b.name];
    trick.sort();
    if(trick[0] == a.name) return -1;
    else return 1; //Would I ever care about them being equal?
  });

  var html = mustache.render(base,{
    title: 'Teams',
    teams: list
  },{
    content: template
  });

  res.send(html);

});

//TODO: This function can be handled with Numeral on the client side.
function format(num) {
  if(Math.round(num) == num) {
    num += 0.000000001;
  }
  var str = num + ' ';
  if(str.length > 5) {
    str = str.substring(0,5);
  }
  str = str.trim();
  while(str.length < 5) {
    str = str + '0';
  }
  return str;
}

router.get('/teams/:team_id',function(req,res) {
  var season = seasons.get(); //TODO Allow other seasons.
  var template = fs.readFileSync('./template/team.html').toString();

  //Does the team exist in the season.
  var tk = req.params.team_id;
  var team = season.teams[tk];
  if(!team) { return res.redirect('/teams'); }

  var venue = venues.get(team.venue);
  var vname = venue ? venue.name : team.venue;

  //TODO: Duplicated from mnp.js, should move to constants.js
  var top150 = '/top-150.png';
  var top500 = '/top-500.png';
  var top1000 = '/top-1000.png';

  //TODO: This is where we could inject some stats.
  var lineup = [];
  for(i in team.roster) {
    var p = team.roster[i];
    var rank = ifpa.rank(p.name);
    var badge = null;
    if(rank > 0) {
      if(rank < 150)       { badge = top150; }
      else if(rank < 500)  { badge = top500; }
      else if(rank < 1000) { badge = top1000;}
    }
    var pk = players.makeKey(p.name); //TODO: UGLY makeKey call.
    var ps = stats.get(pk);
    // console.log("player stats: ", ps);
    var pops = ps ? ps.points.won / ps.points.of : 0;
    lineup.push({
      key: pk,
      name: p.name,
      rank: rank,
      badge: badge,
      pops: ps.pops,
      points: ps.points.won,
      num_matches: ps.num_matches,
      ppm: ps.ppm
    });
  }

  var weeks = [];
  for(i in team.schedule) {
    var w = team.schedule[i];
// console.log(w);
    //TODO: There are better ways to get the key.
    var key = 'mnp-6-' +w.week+ '-';
    var ok = w.opp.key;
    var isHome = (w.side.indexOf('@') == -1);
// console.log(w.side,isHome);

    if(isHome) {
      //team is home
      key += ok + '-' + tk;
    }
    else {
      key += tk + '-' + ok;
    }

// console.log("key:",key);
    var match = matches.get(key);
// console.log("match:", match ? match.name : match);
    var result = null;
    if(match) {
      var points = match.getPoints();
      //result -> '(W|L) team.score - opp.score'
      if(match.isDone()) {
        result = isHome ?
          ((points.home > points.away) ? 'W' : 'L') :
          ((points.away > points.home) ? 'W' : 'L');
      }
      else {
        result = 'R' + match.round;
      }
      result += ' ';
      var ts = isHome ? points.home : points.away;
      var os = isHome ? points.away : points.home;
      result += ts + '-' +os;
    }

    weeks.push({
      week: w.week,
      side: w.side,
      opp:  w.opp,
      key: key,
      result: result
    });
  }

  var html = mustache.render(base,{
    title: team.name,
    name: team.name,
    venue: vname,
    captain: team.captain,
    co_captain: team.co_captain,
    roster: lineup,
    schedule: weeks
    // schedule: team.schedule
  }, {
    content: template
  });

  res.send(html);
});

// TODO: This route seems like a huge security hole, but it is a
//       convenient way to lookup a player key by name.
router.get('/players',function(req,res) {
  var template = fs.readFileSync('./template/players.html').toString();

  var html = mustache.render(base,{
    title: 'Players',
    players: players.all()
  },{
    content: template
  });

  res.send(html);
});

router.get('/players/:key',function(req,res) {
  var template = fs.readFileSync('./template/player.html').toString();
  // var p = players.get(req.params.key);
  // //TODO: Need something different than using players == users.
  // if(!p) { return res.redirect('/players'); }
  var st = stats.get(req.params.key);
  var html = mustache.render(base,{
    title: 'Player',
    name: st.name,
    num_matches: st.num_matches,
    points_won: st.points.won,
    ppm: st.ppm,
    pops: st.pops,
    ifpa_rank: ifpa.rank(st.name),
    history: st.history
  },{
    content: template
  });
  res.send(html);
});

module.exports = router;
