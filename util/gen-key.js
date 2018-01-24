var players = require('../model/players');

var name = process.argv[2];

console.log(players.makeKey(name));
