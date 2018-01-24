var matches = require('../model/matches');

var all = matches.all();

for(let i = 0; i < all.length; i++) {
  let m = all[i];
  console.log(m.key);
  m.rounds.forEach( round => {
    if(!round.left_confirmed || !round.right_confirmed) {
      console.log('Round not confirmed',round.n);
    }
  });
}
