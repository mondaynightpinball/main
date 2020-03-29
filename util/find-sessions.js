const fs = require('fs');

const makeKey = require('../lib/make-key');

const debug = () => {}; //console.log;

const sessionDir = 'data/sessions';

const findSessions = ({name}) => {
  debug('findSessions, name:', name);
  const findKey = makeKey(name);
  debug('searching for', name, findKey);

  return fs.readdirSync(sessionDir).filter(filename => {
    debug('sessionId:', filename);

    const session = JSON.parse(fs.readFileSync(`${sessionDir}/${filename}`));
    debug(session);

    return session.key === findKey;
  });
};

if (process.argv[1].endsWith('find-sessions.js')) {
  console.log(findSessions({name: process.argv[2]}));
} else {
  console.log(process.argv);
}

module.exports = findSessions;
