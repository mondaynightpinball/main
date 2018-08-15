var fs = require('fs');
var CONST = require('../constants');
var express = require('express');
var mustache = require('mustache');

var machines = require('../model/machines');
var venues = require('../model/venues');

var base = fs.readFileSync('./template/base.html').toString();

var router = express.Router();

router.get('/venues',function(req,res) {
  var template = fs.readFileSync('./template/venues.html').toString();

  var ukey = req.user.key || 'ANON';

  //TODO: Change hard coded canCreate
  var canCreate = CONST.ROOT == ukey;

  var list = venues.current();
  // console.log('before sort:',list);

  list.sort(function(a,b) {
    return [a.name, b.name].sort()[0] === a.name ? -1 : 1;
  });
  // console.log('after sort:',list);

  var html = mustache.render(base,{
    title: 'Venues',
    venues: list,
    canCreate: canCreate
  },{
    content: template
  });

  res.send(html);
});

router.get('/venues/create',function(req,res) {
  var ukey = req.user.key || 'ANON';
  if(ukey != CONST.ROOT) {
    //Boot back somewhere else.
console.log("CREATE attempted by non-authorized user ",ukey);
    return res.redirect('/venues');
  }

  var template = fs.readFileSync('./template/venue_create.html').toString();
  var html = mustache.render(base,{
    title: 'Create Venue'
    //TODO: Include list of venue keys to avoid collision?
  },{
    content: template
  });

  res.send(html);
});

router.post('/venues/create',function(req,res) {
  var ukey = req.user.key || 'ANON';
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

router.get('/venues/:key',function(req,res) {
  var ukey = req.user.key || 'ANON';

  //TODO: What is ukey authorized to do?
  var canAdd = CONST.ROOT == ukey;
  var canRemove = CONST.ROOT == ukey;
  // var canRemove = false;

  var venue = venues.get(req.params.key);
  if(!venue) {
    //For invalid venues, just redirect to /venues
    return res.redirect('/venues');
  }

// console.log("name:",venue.name);
// console.log("key:",venue.key);

  var name = venue.name;
  var key = venue.key;

  var list = [];
  for(i in venue.machines) {
    var mk = venue.machines[i];
    var m = machines.get(mk);
    if(m) list.push(m);
    else list.push({ key: mk, name: mk});
  }

  list.sort((a,b) => [a.name, b.name].sort()[0] == a.name ? -1 : 1);

  var template = fs.readFileSync('./template/venue.html').toString();
  var html = mustache.render(base,{
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
  var venue = venues.get(req.params.key);
  if(!venue) {
    //For invalid venues, just redirect to /venues
    return res.redirect('/venues');
  }
  var ukey = req.user.key || 'ANON';
  if(ukey != CONST.ROOT) {
    return res.redirect('/venues/'+req.params.key);
  }

  var mkey = req.body.mkey;
  if(mkey) {
    venue.addMachine(mkey);
  }
  //TODO: Handle errors on Add?
  return res.redirect('/venues/'+req.params.key);
});

router.post('/venues/:key/remove',function(req,res) {
  var venue = venues.get(req.params.key);
  if(!venue) {
    //For invalid venues, just redirect to /venues
    return res.redirect('/venues');
  }
  var ukey = req.user.key || 'ANON';
  if(ukey != CONST.ROOT) {
    return res.redirect('/venues/'+req.params.key);
  }

  var mkey = req.body.mkey;
  if(mkey) {
    venue.removeMachine(mkey);
  }
  //TODO: Handle errors on Add?
  return res.redirect('/venues/'+req.params.key);
});

module.exports = router;
