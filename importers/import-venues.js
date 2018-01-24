var csv = require('../lib/csv');

//TODO: Perhaps opt between process.in or file.read
var filename = process.argv[2];

//var rows = csv.load(filename,['key','name']);
var rows = csv.load(filename);

//console.log(rows);


var venues = [];

for(i in rows) {
  //console.log("row["+i+"]: " +rows[i]);

  var row = rows[i];
  if(row.length > 1) {
    venues.push({
      key: row[0],
      name: row[1]
    });
  }
}

console.log(JSON.stringify(venues,null,2));
