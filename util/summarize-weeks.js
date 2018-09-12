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

const parse = stem => {
  const [ , season, week ] = stem.match(pattern);
  // console.log({season, week});
  return (100 * parseInt(season)) + parseInt(week);
};

const current = Object.keys(weeks)
  .reduce((current, stem) => {
    const order = parse(stem);
    if (order > current.order) {
      current.order = order;
      current.stem = stem;
    }
    return current;
  }, { order: 0 });

const curName = 'static/match_summary/mnp-current.json';
fs.writeFileSync(curName, JSON.stringify(weeks[current.stem], null, 2));
