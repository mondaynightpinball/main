'use strict';

const matches = require('../model/matches');

matches.all().forEach(match => {
  const { home, away, key } = match;
  console.log(key);

  // mnp-10-3-TWC-NLT
  const [ak, hk] = key.split('-').slice(3);
  home.key = home.key || hk;
  away.key = away.key || ak;

  


  match.save();
});

// TODO: Do we want to "fix" any tie breakers? It seems like
// some games might flip their win/loss if we don't do something.
