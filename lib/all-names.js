'use strict';

/**
  The purpose of this module is to collect all possible names and
  to convert them to different formats.
*/

const makeKey = require('./make-key');

// Collect names from:
// 1) Rosters
// 2) Matches
// 3) playerinfo.json
// Anywhere else???

const nameLookup = {};

const { teams } = require('../model/seasons').get();
Object.keys(teams)
  .map(tk => teams[tk])
  .forEach(team => team.roster.forEach(p => {
     nameLookup[makeKey(p.name)] = p.name;
  }));

// const matches = require('../model/matches').all();
// matches.forEach(match => {
//   [match.home, match.away].forEach(team => {
//     team.lineup.forEach(p => nameLookup[p.key] = p.name);
//   });
// });

// console.log(nameLookup);

module.exports = {
  nameForKey: (key) => nameLookup[key] || 'MISSING KEY'
};
