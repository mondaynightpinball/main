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

  simulateMatch(match);

  return match;
};

function simulateMatch(match) {
  const {away, home} = match;

  // In order to best mock everything, we should
  // make all the calls that the router would.
  doPregame(match);

  // TODO: the response is almost the same logic as the picks.
  //       We can probably roll those together with a param for
  //       picks or response.

  // Round 1
  doDoublesPicks(match, away);
  doDoublesResponse(match, home);
  playGames(match);
  confirmRound(match);

  // Round 2
  doSinglesPicks(match, home);
  doSinglesResponse(match, away);
  playGames(match);
  confirmRound(match);

  // Round 3
  doSinglesPicks(match, away);
  doSinglesResponse(match, home);
  playGames(match);
  confirmRound(match);

  // Round 4
  doDoublesPicks(match, home);
  doDoublesResponse(match, away);
  playGames(match);
  confirmRound(match);
}

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

function confirmRound(match) {
  const {away, home} = match;

  console.log('confirmRound...');

  // TODO: More left/right pain! What a horrible design.
  const left  = match.round % 2 === 0 ? home : away;
  const right = match.round % 2 === 0 ? away : home;

  match.confirmScores({
    ukey: left.captains[0].key,
    side: 'left',
  }, (err) => console.log(err));

  match.confirmScores({
    ukey: right.captains[0].key,
    side: 'right',
  }, (err) => console.log(err));
}

// machine.n
// player_x.n
function doDoublesPicks(match, team) {
  const players = team.lineup.sort((a,b) => {
    if(a.num_played < b.num_played) return -1;
    if(a.num_played > b.num_played) return 1;
    return 0;
  }).slice(0, 8);
  const machines = match.venue.machines.slice(0, 4);
  match.makePicks({
    ukey: team.captains[0].key,
    state: match.state,
    round: match.round,
    picks: Object.assign({},
      machines.reduce((set, m, i) => {
        set[`machine.${i + 1}`] = m;
        return set;
      }, {}),
      players.reduce((set, p, i) => {
        const num = [1, 3][i % 2];
        const game = Math.floor(i / 2) + 1;
        set[`player_${num}.${game}`] = p.key;
        return set;
      }, {})
    ),
  });
}

function doDoublesResponse(match, team) {
  const players = team.lineup.sort((a,b) => {
    if(a.num_played < b.num_played) return -1;
    if(a.num_played > b.num_played) return 1;
    return 0;
  }).slice(0, 8);

  match.makePicks({
    ukey: team.captains[0].key,
    state: match.state,
    round: match.round,
    picks: Object.assign({},
      players.reduce((set, p, i) => {
        const num = [2, 4][i % 2];
        const game = Math.floor(i / 2) + 1;
        set[`player_${num}.${game}`] = p.key;
        return set;
      }, {})
    ),
  });
}

// TODO: This is almost identical to doDoublesPicks. Perhaps find a way to merge them.
function doSinglesPicks(match, team) {
  const players = team.lineup.sort((a,b) => {
    if(a.num_played < b.num_played) return -1;
    if(a.num_played > b.num_played) return 1;
    return 0;
  }).slice(0, 7);
  const machines = match.venue.machines.slice(0, 7);
  match.makePicks({
    ukey: team.captains[0].key,
    state: match.state,
    round: match.round,
    picks: Object.assign({},
      machines.reduce((set, m, i) => {
        set[`machine.${i + 1}`] = m;
        return set;
      }, {}),
      players.reduce((set, p, i) => {
        set[`player_1.${i + 1}`] = p.key;
        return set;
      }, {})
    ),
  });
}

function doSinglesResponse(match, team) {
  const players = team.lineup.sort((a,b) => {
    if(a.num_played < b.num_played) return -1;
    if(a.num_played > b.num_played) return 1;
    return 0;
  }).slice(0, 7);

  match.makePicks({
    ukey: team.captains[0].key,
    state: match.state,
    round: match.round,
    picks: Object.assign({},
      players.reduce((set, p, i) => {
        set[`player_2.${i + 1}`] = p.key;
        return set;
      }, {})
    ),
  });
}

function playGames(match) {
  const round = match.getRound(match.round);

  const slots = (round.n === 1 || round.n === 4) ? [1,2,3,4] : [1,2];
  const update = slots.reduce((map, slot) => {
    map[`score_${slot}`] = `${100 * slot}`; // Hate that it only accepts string.
    return map;
  }, {});

  // I'm going to make player 2 (and 4) win every game.
  round.games.forEach(game => {
    match.reportScores({
      ukey: game.player_1,
      n: game.n,
      round: round.n,
      update
    });
  });
}

const [away, home, week] = process.argv.slice(2);
console.log({away, home, week});
const match = mockTieBreaker(away, home, week);
console.log(JSON.stringify(match, null , 2));
