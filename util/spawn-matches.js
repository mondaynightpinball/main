/**
  This is intended to be run as part of the pre-week script.
  In order to make it more cron friendly, it is necessary
  to detect what season and week to generate.

  The general logic is that this script should generate
  the next matches, and probably only match the week if it
  happens within 7 days of this script running.

  If the script runs on Sunday or Monday (or any day before), it
  should still work.

  The server runs on UTC, so match datetimes need to be
  converted for proper comparison.
*/
const season = require('../model/seasons').get();
const matches = require('../model/matches');
const Match = matches.Match;

const weekOverride = process.argv[2];

const pad = (num) => {
  return num < 10 ? `0${num}` : `${num}`;
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const getOrder = (date) => {
  return date.getTime() / DAY_IN_MS;
}

const getOrder_nonLinear = (date) => {
  const s = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate() + 1)
  ].join('');
  return parseInt(s);
};

const now = new Date();
const time = getOrder(now);

let current;

if (weekOverride) {
  current = season.weeks.find(week => week.n == weekOverride);
} else {
  // TODO: Don't assume that weeks are already sorted.
  current = season.weeks.find(week => {
    const date = getOrder(new Date(week.date));
    const diff = date - time;
    console.log('week: ', week.n, date, week.date);
    console.log('today:  ', time);
    console.log('diff:  ', diff);
    if (date >= time) {
      return true;
    }
  });
}

const { code, date } = current;

console.log('spawing', current);

current.matches
  // Filter to only matches not already created. Safety against overwrite.
  .filter(({match_key}) => !matches.get(match_key))
  .map(info => {
    console.log(info);
    const away = season.teams[info.away_key];
    const home = season.teams[info.home_key];
    return new Match({
      key: info.match_key,
      name: `${code} ${info.away_key} @ ${info.home_key}`,
      week: current.n,
      date,
      venue: info.venue,
      away,
      home,
    });
  })
  .forEach(match => {
    // console.log(match);
    match.save();
  });
