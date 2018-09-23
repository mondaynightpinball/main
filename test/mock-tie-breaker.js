const {teams} = require('../model/seasons').get();
const {Match} = require('../model/matches');
const venues = require('../model/venues');

function pad(num, len) {
  let s = `${num}`;
  while(s.length < len) {
    s = '0' + s;
  }
  return s;
}

const mockTieBreaker = module.exports = function(aKey, hKey, week) {
  if(!teams[aKey] || !teams[hKey]) {
    throw new Error('Only teams in the current season are allowed, and use their codes');
  }

  const now = new Date();
  const date = [
    pad(now.getMonth() + 1, 2),
    pad(now.getDate() + 1, 2),
    now.getFullYear(),
  ].join('/');

  const away = teams[aKey];
  const home = teams[hKey];
  const venue = venues.get(home.venue);

  const match = new Match({
    // TODO: Get season num from current()
    key: `mnp-10-${week}-${away.key}-${home.key}`,
    name: `WK${week} ${away.key} @ ${home.key}`,
    week,
    date,
    away,
    home,
    venue,
  });

  // In order to best mock everything, we should
  // make all the calls that the router would.
  doPregame(match);

  // Round 1
  // match.makePicks({
  //
  // })

  return match;
};

function doPregame(match) {
  const {away, home} = match;

  match.teamReady({
    side: 'home',
    ukey: home.captains[0].key
  });

  match.teamReady({
    side: 'away',
    ukey: away.captains[0].key
  });

  match.confirmLineup({
    ukey: away.captains[0].key,
    side: 'away'
  });

  match.confirmLineup({
    ukey: home.captains[0].key,
    side: 'home'
  });

}

const [away, home, week] = process.argv.slice(2);
console.log({away, home, week});
const match = mockTieBreaker(away, home, week);
console.log(match);
