const fs = require('fs');
const [ seasonNum, weekNum ] = process.argv.slice(2);

console.log({seasonNum, weekNum});

if (!seasonNum || !weekNum) {
  console.log('ERROR: seasonNum and weekNum required');
  console.log('Usage: node util/summarize-week.js seasonNum weekNum');
  process.exit(1);
}

// Load the matches after checking the args.
const matches = require('../model/matches').all();

const stem = `mnp-${seasonNum}-${weekNum}`;

const summary = matches
  .filter(match => match.key.indexOf(stem) !== -1);

const target = `static/match_summary/${stem}.json`;

fs.writeFileSync(target, JSON.stringify(summary, null, 2));
