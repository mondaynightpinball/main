var fs = require('fs');

function load(filename, colnames) {
  var rows = [];

  var raw;
  try {
    raw = fs.readFileSync(filename).toString();
  } catch (e) {
    return rows; //OR return; //undefined so we know there was an error?
  }

  var lines = raw.split('\n');
  for(var i = 0; i < lines.length; i++) {
//    console.log("line["+i+"]: " +lines[i]);
    if(lines[i].length == 0) continue;

    var cols = lines[i].split(',');

    if(colnames) {
      var row = {};
      for(var j = 0; j < cols.length && j < colnames.length; j++) {
        row[colnames[j]] = cols[j];
      }
      rows.push(row);
    }
    else {
      rows.push(cols);
    }
  }
  
  return rows;
}

module.exports = {
  load: load
};
