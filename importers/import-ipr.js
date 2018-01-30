'use strict';

const info = JSON.parse(require('fs').readFileSync('data/playerinfo.json'));
const { players } = info;

// Object.keys(players).map(name => {
//   const p = players[name];
//   return [p.IPR, name].join(',');
// })
// .forEach(line => console.log(line));

console.log(JSON.stringify(Object.keys(players), null, 2));
