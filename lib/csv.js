var fs = require('fs');

// NOTE: At one point, we allowed a set of colnames,
//       which then produced an array of row objects.
function load(filename) {
  return fs.readFileSync(filename).toString()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.split(','));
}

module.exports = {
  load: load
};
