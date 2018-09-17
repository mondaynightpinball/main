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

const getOrder = (date) => {
  const s = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate() + 1
  ].join('');
  return parseInt(s);
};

const now = new Date();
const time = getOrder(now);

const current = season.weeks.find(week => {
  const date = getOrder(new Date(week.date));
  console.log('week: ', date, week.date);
  console.log('today:', time);
  console.log('diff:', date - time);
  if (date >= time && date - time < 7) {
    return true;
  }
});

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
    // match.save();
  });
