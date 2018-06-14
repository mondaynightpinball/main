'use strict';

const info = JSON.parse(require('fs').readFileSync('data/playerinfo.json'));
const { players } = info;

// IPR.csv output
Object.keys(players).map(name => {
  const p = players[name];
  return [p.IPR, name].join(',');
})
.forEach(line => console.log(line));

// subs.json output
// console.log(JSON.stringify(Object.keys(players), null, 2));

// ifpa_num.csv output
// const { IFPA } = info;
// Object.keys(IFPA).map(num => [IFPA[num], num])
//   .forEach(row => console.log(row.join(',')));
