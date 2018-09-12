const fs = require('fs');
const matches = require('../model/matches').all();

// match.key format: mnp-{season}-{week}-{away}-{home}
const pattern = /^mnp-(\d+)-(\d+)/; //-(\w+)-(\w+)/;

const weeks = matches
  .reduce((weeks, match) => {
    const parts = match.key.match(pattern);
    if (parts) {
      const stem = parts[0];
      const week = weeks[stem] || [];
      week.push(match);
      weeks[stem] = week;
    }
    return weeks;
  }, {});

Object.keys(weeks).forEach(stem => {
  const week = weeks[stem];
  const target = `static/match_summary/${stem}.json`;

  fs.writeFileSync(target, JSON.stringify(week, null, 2));
});
