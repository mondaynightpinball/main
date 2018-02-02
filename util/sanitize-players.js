'use strict';

const fs = require('fs');

const DIR = 'data/players';

const ALLOWED = ['key', 'name', 'email', 'created_at', 'verified'];

fs.readdirSync(DIR)
  .map(pk => fs.readFileSync(`${DIR}/${pk}`))
  .map(buf => JSON.parse(buf))
  .map(p => {
    Object.keys(p)
      .filter(k => !ALLOWED.includes(k))
      .forEach(rejected => {
        console.log('--',new Date(p.created_at),p.name,rejected);
        delete p[rejected];
      });
    return p;
  })
  .forEach(p => {
    // Re-save the player file.
    fs.writeFileSync(`${DIR}/${p.key}`, JSON.stringify(p, null, 2));
  });
