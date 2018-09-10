const fs = require('fs');
const makeKey = require('../lib/make-key');
const IPR = require('../model/ratings');
const season = require('../model/seasons').get();
const {ROOT} = require('../constants');

const {teams} = season;
const players = Object.keys(teams)
  .map(tk => {
    return teams[tk].roster.map(({name}) => ({
      name,
      team: tk
    }));
  })
  .reduce((map, team) => {
    team.forEach(p => {
      map[p.name.toLowerCase()] = p.team;
    });
    return map;
  }, {});
// console.log(players);

// TODO: Use some kind of env var for the home dir?
// The readdir assumes this is running from the project root.
const DIR = './data/players';
const files = fs.readdirSync(DIR);

// TODO: Confirm that we have an IPR matching the name.

files.forEach(fn => {
  if(fn === ROOT) return;

  const p = JSON.parse(fs.readFileSync(`${DIR}/${fn}`));


  const line = [
    fn,
    p.name,
    fn === makeKey(p.name) || 'BAD_KEY',
    IPR.forName(p.name)    || 'UNK_IPR',
    // players[p.name.toLowerCase()] || 'NON_ROSTER',
    fn === makeKey(p.name) && !!IPR.forName(p.name)
  ];

  if(!line[4]) console.log(line.join(','));

  // if(fn !== makeKey(p.name)) {
  //   console.log(['BAD_KEY', fn, p.name].join(','));
  // }
  // if(!IPR.forName(p.name)) {
  //   console.log(['UNKNOWN_IPR', fn, p.name].join(','));
  // }
  // if(!players[p.name.toLowerCase()]) {
  //   console.log(['NON_ROSTER', fn, p.name].join(','));
  // }

  // This doesn't seem to be a problem, so commenting for now.
  // if(fn !== p.key) {
  //   // This doesn't seem to be much of a problem.
  //   console.log(fn,'does not match key',p.key);
  // }
});
