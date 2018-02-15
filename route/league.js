const express = require('express');
const router = express.Router();
const fs = require('fs');
const mustache = require('mustache');

const venues = require('../model/venues');
const seasons = require('../model/seasons');
const matches = require('../model/matches'); //For standings
const players = require('../model/players');
const stats = require('../model/stats');
const ifpa = require('../model/ifpa');
const IPR = require('../model/ratings');

const base = fs.readFileSync('./template/base.html').toString();

router.get('/',function(req,res) {
  const template = fs.readFileSync('./template/index.html').toString();
  const html = mustache.render(base,{
    title: 'Home'
  },{
    content: template
  });
  res.send(html);
});

router.get('/standings',function(req,res) {
  //TODO: Accept a season number.
  const template = fs.readFileSync('./template/standings.html').toString();

  const season = seasons.get(); //TODO Allow other seasons.
  const rows = season.getStandings();

  const html = mustache.render(base,{
    title: 'Standings',
    rows: rows
  },{
    content: template
  });

  res.send(html);
});

router.get('/schedule',function(req,res) {
  const template = fs.readFileSync('./template/schedule.html').toString();
  const season = seasons.get(); //TODO Allow other seasons.

  const weeks = season.weeks;

  //TODO: Q: Where and when do we add results to the weeks?

  const html = mustache.render(base,{
    title: 'Schedule',
    weeks: weeks
  },{
    content: template
  });

  res.send(html);

});

router.get('/stats',function(req,res) {
  const template = fs.readFileSync('./template/stats.html').toString();
  const all = stats.all();

  let max = 0;
  for(i in all) {
    const x = all[i].num_matches;
    if(x > max) max = x;
  }

  const cut = Math.round(max * 0.4);

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

  const html = mustache.render(base,{
    title: 'Stats',
    players: all
  }, {
    content: template
  });
  res.send(html);
});

// router.get('/rules',function(req,res) {
//   const template = fs.readFileSync('./template/rules3.html').toString();
//   const html = mustache.render(base,{
//     title: 'Rules'
//   },{
//     content: template
//   });
//   res.send(html);
// });

router.get('/new-teams',function(req,res) {
  const template = fs.readFileSync('./template/call-for-teams.html').toString();
  const html = mustache.render(base,{
    title: 'Call For Teams'
  },{
    content: template
  });
  res.send(html);
});

router.get('/teams',function(req,res) {
  const season = seasons.get();
  const template = fs.readFileSync('./template/teams.html').toString();

  const list = [];

  for(k in season.teams) {
    const team = season.teams[k];
    const venue = venues.get(team.venue);
    list.push({
      key: team.key,
      name: team.name,
      venue: venue ? venue.name : 'MISSING ' + team.venue,
    });
  }

  // sort by name
  list.sort(function(a,b) {
    const trick = [a.name,b.name];
    trick.sort();
    if(trick[0] == a.name) return -1;
    else return 1; //Would I ever care about them being equal?
  });

  const html = mustache.render(base,{
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
  let str = num + ' ';
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
  const season = seasons.get(); //TODO Allow other seasons.
  const template = fs.readFileSync('./template/team.html').toString();

  //Does the team exist in the season.
  const tk = req.params.team_id;
  const team = season.teams[tk];
  if(!team) { return res.redirect('/teams'); }

  const venue = venues.get(team.venue);
  const vname = venue ? venue.name : team.venue;

  let teamRating = 0;

  const lineup = [];
  for(i in team.roster) {
    const p = team.roster[i];

    const rating = IPR.forName(p.name.trim()) || 0;
    // TODO: Handle cases where rating == undefined, instead of default to 0.
    teamRating += parseInt(rating);

    const pk = players.makeKey(p.name); //TODO: UGLY makeKey call.
    const ps = stats.get(pk);
    const pops = ps ? ps.points.won / ps.points.of : 0;
    lineup.push({
      key: pk,
      name: p.name,
      rating: rating,
      pops: ps.pops,
      points: ps.points.won,
      num_matches: ps.num_matches,
      ppm: ps.ppm
    });
  }

  const weeks = [];
  for(i in team.schedule) {
    const w = team.schedule[i];
    const isHome = w.side == 'vs';
    const match = matches.get(w.match_key);
    let result = null;
    if(match) {
      const points = match.getPoints();
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
      const ts = isHome ? points.home : points.away;
      const os = isHome ? points.away : points.home;
      result += ts + '-' +os;
    }

    weeks.push({
      week: w.week,
      side: w.side,
      opp:  w.opp,
      key: w.match_key,
      result: result
    });
  }

  const html = mustache.render(base,{
    title: team.name,
    name: team.name,
    venue: vname,
    captain: team.captain,
    co_captain: team.co_captain,
    team_rating: teamRating,
    roster: lineup,
    schedule: weeks
  }, {
    content: template
  });

  res.send(html);
});

// TODO: This route seems like a huge security hole, but it is a
//       convenient way to lookup a player key by name.
router.get('/players',function(req,res) {
  const template = fs.readFileSync('./template/players.html').toString();

  const html = mustache.render(base,{
    title: 'Players',
    players: players.all()
  },{
    content: template
  });

  res.send(html);
});

router.get('/players/:key',function(req,res) {
  const template = fs.readFileSync('./template/player.html').toString();
  // var p = players.get(req.params.key);
  // //TODO: Need something different than using players == users.
  // if(!p) { return res.redirect('/players'); }

  const name = players.getName(req.params.key);

  //TODO: Might be nice to have team mapped.
  const st = stats.get(req.params.key);
  const html = mustache.render(base,{
    title: 'Player',
    name: name,
    num_matches: st.num_matches,
    points_won: st.points.won,
    ppm: st.ppm,
    pops: st.pops,
    ifpa_rank: ifpa.rank(name) || 'Unknown',
    ipr: IPR.forName(name) || 'Unknown',
    history: st.history
  },{
    content: template
  });
  res.send(html);
});

module.exports = router;
