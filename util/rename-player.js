'use strict';

const players = require('../model/players');
const makeKey = require('../lib/make-key');
const { shadows } = require('../lib/auth');

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
// Players will need to login again, though. We could potentially migrate their
// session object as well.
const shadow = shadows.get(oldPlayer.key);

console.log('shadow:', shadow);

if(shadow) {
  shadows.set(newPlayer.key, shadow);
  shadows.clear(oldPlayer.key);
}

players.destroy(oldPlayer.key);

console.log('ALL DONE');
