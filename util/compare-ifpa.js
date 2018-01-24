'use strict';

var players = require('../model/players.js');

var csv = require('./csv.js');

var rows1 = csv.load('./data/ifpa_num.csv');
var rows2 = csv.load('./data/ifpa_official.csv');

// TODO: This should load from a file, or maybe just season number?
var pdb = csv.load('./data/season-7/playerdb.csv');

var map1 = rowsToMap(rows1);
var map2 = rowsToMap(rows2);

//console.log(map1);
console.log(Object.keys(map1).length);
console.log(Object.keys(map2).length);

//Let's look for matches on existing.
/*
let nums = Object.keys(map1);
for(let i in nums) {
  let num = nums[i];
  if(!map2[num]) console.log('IFPA Missing:',num,map1[num]);
  if(map1[num] !== map2[num]) console.log('Mismatch names:',map1[num],'-',map2[num]);
}
*/

for(let i = 0; i < pdb.length; i++) {
  let p = pdb[i];
  let name = p[1].trim();
  let key = players.makeKey(name);
  let x = map1[key];
  let y = map2[key];
  if(!x) {
    //if(y) console.log(`${name},${y.num}`);
    if(!y) console.log('Unknown player:',name);
  }
}

function rowsToMap(rows) {
  //expecting 2 cols of name,num
  let map = {};
  for(let i = 0; i < rows.length; i++) {
    let name = rows[i][0].trim();
    let num = Number(rows[i][1]);
    let key = players.makeKey(name);
    map[key] = { num, name };
  }
  return map;
}
