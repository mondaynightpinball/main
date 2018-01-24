var fs = require('fs');

var filename = 'data/season-6/venues.all.txt';

var raw = fs.readFileSync(filename).toString();

//console.log(raw);

var lines = raw.split('\n');

var codes = require('../model/machines').all();

var stops = [
  'and',
  'from',
  'le',
  'limited',
  'premium',
  //'stern',
  'edition',
  'pro',
  'of',
  'the'
];

//TODO: Make this less slow.
function lookup(name) {
//console.log("lookup() name:",name);
  //var cans = [];
  var max = 0;
  var can;

  for(i in codes) {
    var m = codes[i];
    var v = compare(name,m.name);
    if(v > 0) {
//console.log("candidate:",v,m.name);
      if(v > max) {
        max = v;
        can = m;
      }
    }
  }

//console.log(name + " -> " + (can ? can.name : " NO MATCH") + "\n");

  return can;
}

function compare(n1,n2) {
  var v1 = n1.trim().toLowerCase().replace(/[^a-z0-9\- ]/g,'');
  var v2 = n2.trim().toLowerCase().replace(/[^a-z0-9\- ]/g,'');

  if(v1 == v2) {
//console.log("Exact match: ",v1);
    return 100;
  }

  var w1 = v1.split(' ');
  var w2 = v2.split(' ');

  var x1 = w1[0];
  var x2 = w2[0];

  //var p1 = 0;
  //var p2 = 0;

  var matches = [];

  for(var p1 = 0; p1 < w1.length; p1++) {
    for(var p2 = 0; p2 < w2.length; p2++) {
      var x1 = w1[p1];
      var x2 = w2[p2];
      if(stops.indexOf(x1) < 0 &&
         stops.indexOf(x2) < 0 && x1 == x2) {
        matches.push({w: x1, p1: p1, p2: p2});
      }
    }
  }

  if(matches.length > 0) {
//console.log(w1);
//console.log(w2);
//console.log(matches);

    var sum = 0;

    for(i in matches) {
      var x = matches[i];
      sum++; //A point for any match.
      if(x.p1 == x.p2) sum++; //A point for exact spot.
    }
    return sum;
  }

  return 0;
}

var venue;
var machines = {};
//var list = []; //of venues
var venues = {};

for(i in lines) {
  var line = lines[i].trim();

//console.log("lines["+i+"]:",line);

  var len = line.length;
  if(len == 0) {
    if(venue) {
      if(venue.key != '-') {
//console.log("PUSHING venue: "+venue.name);
        //list.push(venue);
        venues[venue.key] = venue;
      }
      venue = undefined;
    }
  }
  else {
    if(venue) {
      if(venue.key) {
        if(venue.address) {
//console.log("      Adding machine:",line);
          var mkey = line;
          var machine = lookup(mkey);
          if(machine) {
            mkey = machine.key;
          }
          venue.machines.push(mkey);
          machines[mkey] = machines[mkey] ? machines[mkey] + 1 : 1;
        }
        else {
//console.log("    Setting address:",line);
          venue.address = line;
        }
      }
      else {
//console.log("  Setting key:",line);
        venue.key = line;
      }
    }
    else {
//console.log("Creating new venue:",line);
      venue = {
        name: line,
        machines: []
      };
    }
  }
}

if(venue && venue.key != '-') {
  //list.push(venue);
  venues[venue.key] = venue;
}

//console.log(machines);
/*
var counts = {};
var keys = Object.keys(machines);
keys.sort();
for(i in keys) {
  var k = keys[i];
  var v = k.toLowerCase().replace('\'','').replace(/[^a-z0-9\- ]/g,' ').replace(/[ ]+/g,' ');
  var n = machines[k];

  var parts = v.split(' ');
  for(j in parts) {
    var w = parts[j];
    if(w.length > 0) counts[w] = counts[w] ? counts[w] + 1 : 1;
  }
  console.log(n + "," + v);
  //console.log(n +","+ k);
}
*/

/*
keys = Object.keys(counts);
for(i in keys) {
  var k = keys[i];
  console.log(counts[k],k);
}
*/

console.log(JSON.stringify(venues,null,2));
