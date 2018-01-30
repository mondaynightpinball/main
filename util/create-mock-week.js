const fs = require('fs');

const rnd = () => Math.random() < 0.5 ? -1 : 1;

const tiers = fs.readFileSync('data/season-9/teams.csv')
  .toString()
  .split('\n')
  .map(line => line.split(','))
  .filter(row => row.length > 1)
  .reduce((tiers, row) => {
    const tier = parseInt(row[3]);
    console.log(tier, row);
    tiers[tier - 1].push({
      key: row[0],
      venue: row[1],
      name: row[2],
      tier
    });
    return tiers;
  }, [[],[]]); // Empty array of arrays.

tiers.forEach(tier => tier.sort(rnd));

// NOTE: This alg only works when the tiers have the same number of teams.
const n = tiers[0].length;

for(let i = 0; i < n; i++) {
  const away = tiers[0][i];
  const home = tiers[1][i];

  console.log(`1,20180129,${away.key},${home.key},${home.venue}`);
}
