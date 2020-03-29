const fs = require('fs');

const season = require('../model/seasons').get();
const matches = require('../model/matches');
const Match = matches.Match;

const filename = process.argv[2];

const pad = (num) => {
  return num < 10 ? `0${num}` : `${num}`;
};

const getDate = () => {
  const now = new Date();
  return `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()}`;
};

fs.readFileSync(filename).toString()
  .split('\n')
  .filter(line => line)
  .map(line => line.split(','))
  .map(row => {
    const away = season.teams[row[0]];
    const home = season.teams[row[1]];

    const params = {
      key: `mnp-13-S-${away.key}-${home.key}`,
      name: `SCRM ${away.key} @ ${home.key}`,
      week: 'S',
      date: getDate(),
      venue: home.venue,
      away,
      home,
    };

    console.log(params);

    return new Match(params);
  })
  .forEach(match => match.save());
