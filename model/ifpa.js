//TODO: This is kind of more than just a model, but it's fine for now.

var https = require('https');
var fs = require('fs');
var csv = require('../lib/csv');
var util = require('../lib/util');
var players = require('./players');

require('dotenv').load();
const IFPA_API_KEY = process.env.IFPA_API_KEY;

var map = {};

function load() {
  var filename = 'data/ifpa_num.csv';
  console.log("Loading: " +filename+ " ...");
  var rows = csv.load(filename);
  for(i in rows) {
    var cols = rows[i];
    var name = cols[0];
    var num = parseInt(cols[1]);
    var key = players.makeKey(name);
    var p = {
      key: key, //Convenience key.
      name: name,
      num: num
    };
    var fn = 'data/ifpa/' + num;
    if(util.fileExists(fn)) {
      var json = JSON.parse(fs.readFileSync(fn));
      p.fetched = json.mnp_fetched || 0;
      p.rank    = json.player_stats.current_wppr_rank || 0;
    }
    map[key] = p;
  }
}
load();
//console.log(map);

var queue = [];

function refresh() {
  for(k in map) {
    //queue.push(map[k]);
    queue.splice(0,0,map[k]);
  }

  work();
}

function work() {
  console.log("work(), q.len:",queue.length);
  if(queue.length == 0) {
    console.log("Nothing to do right now.");
    //TODO: We might want to schedule up a time to check for more work.
    return;
  }
  var item = queue.pop();
  console.log("Working on: ",item);
  var api_key = IFPA_API_KEY;

  var options = {
    hostname: 'api.ifpapinball.com',
    port: 443,
    path: '/v1/player/' +item.num+ '?api_key=' +api_key,
    method: 'GET'
  };

  console.log("Requesting " +item.name);
  console.log(options);
  var req = https.request(options, function(res) {
    console.log(" ... response for ",item.name);
    console.log("status:",res.statusCode);
    res.on('data',function(data) {
      var json = JSON.parse(data);
      //console.log("json:",json);
      var rank = json.player_stats.current_wppr_rank;
      console.log("rank:",rank);
      json.mnp_fetched = Date.now();
      fs.writeFileSync('data/ifpa/'+item.num,JSON.stringify(json,null,2));
    });
    res.on('end',function() {
      // setTimeout(work, 500);
      //IFPA said it wasn't a problem to blast away. :)
      work(); //Try to do more work when done.
    });
  });
  req.on('error', function(err) {
    console.log(" ... FAILED: ",err);
  });
  req.end();
}

//TODO: Should rank return -1 for unknown ranks?
module.exports = {
  //TODO: Q: Why does rank accept name instead of key?
  //      A: Because the key is not available all the time?
  rank: function(name) {
    if(!name) return 0;
    var key = players.makeKey(name);
    var p = map[key];
    if(p) {
      return p.rank || 0;
    }
    return 0;
  },
  refresh: refresh
};

//Exported refresh with the idea that we can then make
//  an easy script to do the refresh.

//TEST TEST
//refresh();
