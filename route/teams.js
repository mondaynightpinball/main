const fs = require('fs');
const mustache = require('mustache');
const { Router } = require('express');
const router = Router();

const makeKey = require('../lib/make-key');
const venues = require('../model/venues');
const seasons = require('../model/seasons');
const matches = require('../model/matches'); //For standings
const stats = require('../model/stats');
const IPR = require('../model/ratings');

const base = fs.readFileSync('./template/base.html').toString();

const byName = (a,b) => [a.name, b.name].sort()[0] === a.name ? -1 : 1;

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
  list.sort(byName);

  const html = mustache.render(base,{
    title: 'Teams',
    teams: list
  },{
    content: template
  });

  res.send(html);
});

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

  const lineup = team.roster.map(p => {
    const rating = IPR.forName(p.name) || 0;
    // TODO: Handle cases where rating == undefined, instead of default to 0.
    teamRating += parseInt(rating);

    const pk = makeKey(p.name); //TODO: UGLY makeKey call.
    // TODO: What divisions to show? Thinking either all or the div of the team.
    const ps = stats.get(pk).divisions.all;
    const pops = ps ? ps.points.won / ps.points.of : 0;
    return {
      key: pk,
      name: p.name,
      rating: rating,
      pops: ps.pops,
      points: ps.points.won,
      num_matches: ps.num_matches,
      ppm: ps.ppm
    };
  }).sort(byName);

  const weeks = team.schedule.map(w => {
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

    return {
      week: w.week,
      side: w.side,
      opp:  w.opp,
      key: w.match_key,
      result: result
    };
  });

  const html = mustache.render(base,{
    title: team.name,
    name: team.name,
    division: team.division,
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

module.exports = router;
