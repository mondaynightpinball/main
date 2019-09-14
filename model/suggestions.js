const IPR = require('./ratings');
const { teams } = require('./seasons').get();

// TODO: Consider making lookup a method instead of constant.
const lookup = Object.keys(teams).map(tk => teams[tk])
  .reduce((map, team) => {
    team.roster.forEach(p => {
      map[p.name] = team.key;
    });
    return map;
  }, {});

// console.log(lookup);

/**
 * teams - ex: ['SSS', 'PBR']
 */
function getSuggestions(teams) {
  const all = IPR.getNames().reduce((set, name) => {
    set[name] = true;
    return set;
  }, {});
  Object.keys(lookup).forEach(name => {
    const playsFor = lookup[name];
    // TODO: If the match is a scrimmage, teams.find might be doing undefined === playsFor
    // Also, match here is not referring to a match, but whether the player matches a team.
    const match = teams.find(x => x === playsFor);
    if (!match) {
      // console.log('REMOVE:', playsFor, name);
      delete all[name];
    }
  });
  return Object.keys(all);
}

module.exports = {
  getSuggestions
};

/* TEST
const testTeams = ['PBR', 'DTP'];
const sugs = getSuggestions(testTeams);
console.log(testTeams);

// console.log(sugs);
console.log('Ros:', Object.keys(lookup).length);
console.log('IPR:', IPR.getNames().length);
console.log('Num:', sugs.length);
console.log('Check:', 'Geoff Simons', sugs.includes('Geoff Simons')); // expect true
console.log('Check:', 'Dwayne Collins', sugs.includes('Dwayne Collins')); // expect true
console.log('Check:', 'Dave Stewart', sugs.includes('Dave Stewart')); // expect false
*/
