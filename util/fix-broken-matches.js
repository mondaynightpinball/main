'use strict';

const matches = require('../model/matches');

matches.all().forEach(match => {
  const { home, away, key } = match;
  console.log(key);

  // mnp-10-3-TWC-NLT
  const [seasonNum, week, ak, hk] = key.split('-').slice(1);
  home.key = home.key || hk;
  away.key = away.key || ak;

  if (seasonNum == 10 && week < 3 && match.rounds.length == 5) {
    console.log('Tie breaker found', key);
    const round = match.getRound(5);

    const swap = (game) => {
      console.log('swapping', game);
      const { score_1, score_2, player_1, player_2, player_3, player_4 } = game;
      game.score_2 = score_1;
      game.score_1 = score_2;
      game.player_1 = player_2;
      game.player_2 = player_1;
      game.player_3 = player_4;
      game.player_4 = player_3;
    };

    // for games 2 and 3, the away team should be playing first.
    round.games.slice(1).forEach(game => {
      // player_1 and player_3 should be away players.
      if (home.lineup.find(p => p.key === game.player_1)) {
        console.log('Home player in the 1 slot');
        swap(game);
      }
      // player_2 and player_4 should be home players.
      if (away.lineup.find(p => p.key === game.player_2)) {
        console.log('Away player in the 2 slot');
        swap(game);
      }
    });

    match.calcPoints();
    console.log(round);
  }


  // match.save();
});

// TODO: Do we want to "fix" any tie breakers? It seems like
// some games might flip their win/loss if we don't do something.
