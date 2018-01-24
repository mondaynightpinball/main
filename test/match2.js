var CONST = require('../constants');
var matches = require('./matches');

function buildMatch(callback) {
  matches.create({
    key: 'Test-Match-2',
    name: 'Test Match 2',
    venue: 'AAB'
  },function(match) {
    //Let's get the teams ready.
//    match.home.ready = true;
//    match.away.ready = true;
    match.state = CONST.FORMING;
    match.round = 1;

    addPlayers(match,callback);
  });
}

function copy(src,dst) {
  for(prop in src) {
    dst[prop] = src[prop];
  }
}

function addPlayers(match,callback) {
  var keys = [
    'GeoffS','MattWo','MattWa','SophieS','AlexSi','DanD','DanielM','BlakeM','AmandaM','TimT',
    'MaxS','DanielS','AgeD','StanloS','SamSt','SamA','NateC','BethanyB','PhilH','JustinB'
  ];
  
  var num = 0;
  for(i in keys) {
    console.log(keys[i] + " trying to join match...");
    match.join({
      ukey: keys[i],
      want_captain: (i % 10 == 0)
    }, function(err,player) {
      num++;
      console.log("...Done with " +num+ " " +player.key+ " added.");
      if(num == keys.length) {
        callback(null, match);
        //startDraft(match,callback);
      }
    });
  }
}

function startDraft(match,callback) {
console.log("********** DRAFT ********************");
  match.conductDraft({ukey: 'GeoffS'},function(err,m) {
    m.begin({ukey: 'GeoffS'},callback);
  });
}

module.exports = {
  build: buildMatch
};

buildMatch(function(err,match) {
  if(err) console.log(err);
  console.log("ALL DONE building match 2");
  console.log(JSON.stringify(match,null,2));
});

