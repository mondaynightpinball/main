var CONST = require('../constants');
var matches = require('./matches');

function buildMatch(callback) {
  matches.create({
    key: 'Test-Match-1',
    name: 'Test Match 1',
    venue: 'AAB'
  },function(match) {
    buildTeams(match);
    //Let's get the teams ready.
    match.home.ready = true;
    match.away.ready = true;
    match.state = CONST.PICKING;
    match.round = 1;

    //Now let's make some picks.
    pickRound1(match,callback);

    //callback(match);
  });
}

function copy(src,dst) {
  for(prop in src) {
    dst[prop] = src[prop];
  }
}

function buildTeams(match) {
  var home = {
    name: 'Point Breakers',
    captains: [
      { key: 'GeoffS', joined: true, confirmed: true, status: 'Confirmed' }
    ],
    lineup: [
      { key: 'GeoffS', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'MattWo', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'MattWa', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'SophieS', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'AlexSi', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'DanD', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'DanielM', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'MattBa', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'MandieM', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'Bre', joined: true, confirmed: true, status: 'Confirmed' }
    ]
  };
  copy(home, match.home);

  var away = {
    name: 'JJ\'s Middle Flippers',
    captains: [
      { key: 'MaxSt', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'DanielS', joined: true, confirmed: true, status: 'Confirmed' }
    ],
    lineup: [
      { key: 'MaxSt', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'DanielS', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'AgeD', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'StanloS', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'SamSt', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'SamA', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'NateC', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'BethanyB', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'PhilH', joined: true, confirmed: true, status: 'Confirmed' },
      { key: 'JustinB', joined: true, confirmed: true, status: 'Confirmed' }
    ]
  };
  copy(away, match.away);
}

function pickRound1(match,callback) {
  match.makePicks({
    ukey: 'DanielS',
    picks: { 
      'machine.1': 'Ali',
      'player_1.1': 'MaxSt',
      'player_3.1': 'SamSt',
      'machine.2': 'EBD',
      'player_1.2': 'DanielS',
      'player_3.2': 'AgeD',
      'machine.3': 'EK',
      'player_1.3': 'StanloS',
      'player_3.3': 'SamA',
      'machine.4': 'TAF',
      'player_1.4': 'NateC',
      'player_3.4': 'BethanyB'
    }
  }, function(errors,m) {
    if(errors) console.log(errors);
    console.log("Done making picks. state: " +m.state);
    respRound1(m,callback);
  });
}

function respRound1(match,callback) {
  match.makePicks({
    ukey: 'GeoffS',
    picks: {
      'player_2.1': 'GeoffS',
      'player_4.1': 'MattWo',
      'player_2.2': 'MattWa',
      'player_4.2': 'SophieS',
      'player_2.3': 'AlexSi',
      'player_4.3': 'DanD',
      'player_2.4': 'DanielM',
      'player_4.4': 'MandieM' 
    }
  }, function(errors,m) {
    if(errors) console.log(errors);
    console.log("Done making resp. state: " +m.state);
    //callback(null,m);
    scoreRound1(m,callback)
  });
}

function scoreRound1(match,callback) {
  var games = [false,false,false,false];

  match.reportScores({
    ukey: 'GeoffS',
    round: '1',
    n: '1',
    scores: {
      score_1: '500000',
      score_2: '733000',
      score_3: '350000',
      score_4: '950000'
    }
  }, function(errors,m) {
    if(errors) console.log(errors);
    games[0] = true;
    doneRound1(match,games,callback);
  });

  match.reportScores({
    ukey: 'GeoffS',
    round: '1',
    n: '2',
    scores: {
      score_1: '1125000',
      score_2: '850000',
      score_3: '325000',
      score_4: '675000'
    }
  }, function(errors,m) {
    if(errors) console.log(errors);
    games[1] = true;
    doneRound1(match,games,callback);
  });

  match.reportScores({ 
    ukey: 'GeoffS',
    round: '1',
    n: '3',
    scores: {
      score_1: '24000',
      score_2: '156000',
      score_3: '86000',
      score_4: '27000'
    }
  }, function(errors,m) {
    if(errors) console.log(errors);
    games[2] = true;
    doneRound1(match,games,callback);
  });

  match.reportScores({
    ukey: 'GeoffS',
    round: '1',
    n: '4',
    scores: {
      score_1: '97000000',
      score_2: '75000000',
      score_3: '15000000',
      score_4: '23000000'
    }
  }, function(errors,m) {
    if(errors) console.log(errors);
    games[3] = true;
    doneRound1(match,games,callback);
  });
}

function doneRound1(match,games,callback) {
  var done = true;
  for(i in games) {
    if(!games[i]) done = false;
  }
  if(done) {
    callback(null,match);
  }
}

module.exports = {
  build: buildMatch
};
