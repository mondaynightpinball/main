const fs = require('fs');

const map = fs.readFileSync('data/IPR.csv').toString()
  .split('\n')
  .filter(line => line.length > 0)
  .map(line => line.split(','))
  .reduce((m, row) => {
    const [ ipr, name ] = row;
    m[name.toLowerCase()] = ipr;
    return m;
  }, {});

module.exports = {
  forName: name => map[name.toLowerCase()]
};
