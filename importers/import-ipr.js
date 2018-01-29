'use strict';

const players = JSON.parse(require('fs').readFileSync('data/playerinfo.json'));

Object.keys(players).map(pk => {
  const p = players[pk];
  return [p.IPR, pk].join(',');
})
.forEach(line => console.log(line));
