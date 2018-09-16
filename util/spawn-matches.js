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

const now = new Date();
const today = new Date(`${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate() + 1}`);
const time = today.getTime();

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const current = season.weeks.find(week => {
  const date = new Date(week.date).getTime();
  console.log('week: ', date, week.date);
  console.log('today:', time);
  console.log('max :', WEEK_IN_MS);
  console.log('diff:', date - time);
  if (date >= time && date - time < WEEK_IN_MS) {
    return true;
  }
});

// console.log(current);
const { code, date } = current;

current.matches
  .filter(({match_key}) => !matches.get(match_key))
  .map(info => {
    console.log(info);
    return new Match({
      key: info.match_key,
      name: `${code} ${info.away_key} @ ${info.home_key}`,
      week: current.n,
      date,
      venue: info.venue,

    });
  })
  .forEach(match => {
    console.log(match.name);
    match.save();
  });
