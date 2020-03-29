'use strict';

const fs = require('fs');
const util = require('../lib/util');
const players = require('../model/players');
const makeKey = require('../lib/make-key');
const { shadows } = require('../lib/auth');
const findSessions = require('./find-sessions');

const fromName = process.argv[2];
const toName = process.argv[3];

if(!fromName || !toName) {
  console.log('Usage: node util/rename-player fromName toName');
  process.exit();
}

console.log('Migrating player:', fromName, 'to', toName);

// See if a player already exists.
const oldPlayer = players.getByName(fromName);

if(!oldPlayer) {
  console.log(fromName, 'not found. Nothing to do.');
  process.exit();
}

// TODO: Q: What happens if toPlayer already exists?
//       A: We should probably bail out, but perhaps
//          the person has 2 player accounts?

if(players.getByName(toName)) {
  console.log(toName, 'already exists. Delete the account to try again, if desired.');
  process.exit();
}

const newPlayer = Object.assign({}, oldPlayer, {
  key: makeKey(toName),
  name: toName
});

console.log('newPlayer:', newPlayer);
newPlayer.save();

// Migrate player password shadow so they don't have to re-signup (since there is no change password).
const shadow = shadows.get(oldPlayer.key);

console.log('shadow:', !!shadow);

if(shadow) {
  shadows.set(newPlayer.key, shadow);
  shadows.clear(oldPlayer.key);
}

players.destroy(oldPlayer.key);

console.log('Finding sessions to update for', fromName);

// Update session file, if it exists
findSessions({name: fromName}).forEach(sessionId => {
  console.log('sessionId', sessionId);
  const sessionFilename = `data/sessions/${sessionId}`;
  const session = JSON.parse(fs.readFileSync(sessionFilename));
  console.log('from:', session);
  session.key = newPlayer.key;
  console.log('to', session);

  fs.writeFileSync(sessionFilename, JSON.stringify(session,null,2));
});

console.log('ALL DONE');
