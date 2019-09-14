const fs = require('fs');
const CONST = require('../constants');
const express = require('express');
const mustache = require('mustache');

const makeKey = require('../lib/make-key');
const machines = require('../model/machines');
const venues = require('../model/venues');
const seasons = require('../model/seasons');

const base = fs.readFileSync('./template/base.html').toString();

const router = express.Router();

router.get('/venues',function(req,res) {
  const template = fs.readFileSync('./template/venues.html').toString();

  const ukey = req.user.key || 'ANON';

  //TODO: Change hard coded canCreate
  const canCreate = CONST.ROOT == ukey;

  const list = venues.current();
  // console.log('before sort:',list);

  list.sort(function(a,b) {
    return [a.name, b.name].sort()[0] === a.name ? -1 : 1;
  });
  // console.log('after sort:',list);

  const html = mustache.render(base,{
    title: 'Venues',
    venues: list,
    canCreate: canCreate
  },{
    content: template
  });

  res.send(html);
});

router.get('/venues/create',function(req,res) {
  const ukey = req.user.key || 'ANON';
  if(ukey != CONST.ROOT) {
    //Boot back somewhere else.
    console.log("CREATE attempted by non-authorized user ",ukey);
    return res.redirect('/venues');
  }

  const template = fs.readFileSync('./template/venue_create.html').toString();
  const html = mustache.render(base,{
    title: 'Create Venue'
    //TODO: Include list of venue keys to avoid collision?
  },{
    content: template
  });

  res.send(html);
});

router.post('/venues/create',function(req,res) {
  // NOTE: Intentionally not allowing anyone but ROOT to create a venue
  const ukey = req.user.key || 'ANON';
  if(ukey != CONST.ROOT) {
    //Boot back somewhere else.
    console.log("CREATE attempted by non-authorized user ",ukey);
    return res.redirect('/venues');
  }

  venues.create({
    name: req.body.name,
    key:  req.body.key
  },function(venue) {
    //TODO: Check for errors?
    res.redirect('/venues/'+venue.key);
  });

});

const canEdit = (venue, user) => {
  // ROOT can always edit
  if(user.key === CONST.ROOT) {
    return true;
  }
  // See if user is a captain at the venue.
  const {teams} = seasons.get();
  let isHomeCaptain = false;

  Object.keys(teams)
    .filter(tk => (teams[tk].venue === venue.key))
    .map(tk => teams[tk])
    .forEach(team => {
      console.log('captain:', team.captain, makeKey(team.captain));
      console.log('co_captain:', team.co_captain, makeKey(team.co_captain));
      if(makeKey(team.captain) === user.key) {
        isHomeCaptain = true;
      }
      if(makeKey(team.co_captain) === user.key) {
        isHomeCaptain = true;
      }
    });

  return isHomeCaptain;
};

router.get('/venues/:key',function(req,res) {
  const venue = venues.get(req.params.key);
  if(!venue) {
    //For invalid venues, just redirect to /venues
    return res.redirect('/venues');
  }

  const canAdd = canEdit(venue, req.user);
  const canRemove = canEdit(venue, req.user);

  console.log('GET /venues/',venue.key, req.user.key, canAdd);

  const name = venue.name;
  const key = venue.key;

  const list = [];
  for(i in venue.machines) {
    const mk = venue.machines[i];
    const m = machines.get(mk);
    if(m) list.push(m);
    else list.push({ key: mk, name: mk});
  }

  list.sort((a,b) => [a.name, b.name].sort()[0] == a.name ? -1 : 1);

  const template = fs.readFileSync('./template/venue.html').toString();
  const html = mustache.render(base,{
    title: name,
    canAdd: canAdd,
    canRemove: canRemove,
    venue_id: key,
    name: name,
    machines: list,
    sugs: machines.all()
  },{
    content: template
  });

  res.send(html);
});

router.post('/venues/:key/add',function(req,res) {
  const venue = venues.get(req.params.key);
  if(!venue) {
    //For invalid venues, just redirect to /venues
    return res.redirect('/venues');
  }
  if(!canEdit(venue, req.user)) {
    return res.redirect('/venues/'+req.params.key);
  }

  const mkey = req.body.mkey;
  if(mkey) {
    venue.addMachine(mkey);
  }
  //TODO: Handle errors on Add?
  return res.redirect('/venues/'+req.params.key);
});

router.post('/venues/:key/remove',function(req,res) {
  const venue = venues.get(req.params.key);
  if(!venue) {
    //For invalid venues, just redirect to /venues
    return res.redirect('/venues');
  }
  if(!canEdit(venue, req.user)) {
    return res.redirect('/venues/'+req.params.key);
  }

  const mkey = req.body.mkey;
  if(mkey) {
    venue.removeMachine(mkey);
  }
  //TODO: Handle errors on Add?
  return res.redirect('/venues/'+req.params.key);
});

module.exports = router;
