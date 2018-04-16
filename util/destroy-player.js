'use strict';

const players = require('../model/players');
const { shadows } = require('../lib/auth');

const name = process.argv[2];

if(!name) {
  console.log('Usage: node util/destroy-player <name>');
  process.exit();
}

const player = players.getByName(name);

if(!player) {
  console.log(name, 'not found. Nothing to do.');
  process.exit();
}

players.destroy(player.key);
shadows.clear(player.key);
