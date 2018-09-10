/**
  This tool is here to correct the crazy ass key model
  of using hashed player names, which meant that any
  inaccuracy of a name led to some failures, and any
  change would require a key change.

  The primary places where keys show up are:
  * .shadows and .tokens are wrapped up with lib/auth
  data/.shadows - as CSV of key,shadow pairs
  data.tokens   - as CSV of key,token pairs

  data/sessions/<session_id> - as JSON { key, created_at }
  data/players/<key> - as JSON { key, name, email, created_at, verified }
  data/matches/<match_key> - JSON, nested games use keys in their player slots
  data/stats/<key> - as JSON { key, name, ...other_stuff }
*/
const fs = require('fs');

const { shadows, tokens } = require('../lib/auth');

// TODO: In order to get off of the name standard, change makeKey.
const makeKey = player => require('../lib/make-key')(player.name);

const migratePlayer = (oldKey, props) => {
  const player = JSON.parse(fs.readFileSync(`data/players/${oldKey}`));
  Object.assign(player, props); // TODO: Update node version to use ...props
  const newKey = makeKey(player);
  if(oldKey === newKey) {
    console.log('No change', oldKey, player);
    return;
  }
  player.key = newKey;

  // Save the player with the new key at the new filename.
  console.log('Saving to', newKey);
  fs.writeFileSync(`data/players/${player.key}`, JSON.stringify(player, null, 2));

  // Update shadows so the user can still login.
  console.log('Reset shadow', oldKey, '->', newKey);
  shadows.set(newKey, shadows.get(oldKey));

  // Clear the old player file.
  fs.unlinkSync(`data/players/${oldKey}`);
  shadows.clear(oldKey);
};

const changeName = (oldKey, name) => {
  return migratePlayer(oldKey, {name});
};

// For right now, just fix a list of ids.
const keys = process.argv.slice(2);

keys.forEach(migratePlayer);
