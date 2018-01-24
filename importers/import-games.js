process.stdin.setEncoding('utf8');

function processLine(line) {
  var cols = line.split(',');
  if(cols.length < 6) return undefined;

  var game = {
    week: parseInt(cols[0]), //mnp. for any mnp only attributes.
    datestamp: parseInt(cols[1]),
    away: cols[2],
    home: cols[3],
    round: parseInt(cols[4]),
    machine: cols[5],
    players: [
      cols[6],cols[8],cols[10],cols[12]
    ],
    scores: [
      parseInt(cols[7]) || 0,
      parseInt(cols[9]) || 0,
      parseInt(cols[11]) || 0,
      parseInt(cols[13]) || 0
    ],
    reported: {
      away_points: parseInt(cols[14]) || 0,
      home_points: parseInt(cols[15]) || 0
    }
  };

  if(game.round == 1 || game.round == 4) {
    //Doubles game
    var points = calcDoubles(game.scores);
    game.calculated = {
      away_points: (game.round == 1 ? 
        points[0] + points[2] : points[1] + points[3]),
      home_points: (game.round == 1 ? 
        points[1] + points[3] : points[0] + points[2]),
    };
  }
  else if(game.round == 2 || game.round == 3) {
    //Singles
    var points = calcSingles(game.scores);
    game.calculated = {
      away_points: (game.round == 2 ? points[1] : points[0]),
      home_points: (game.round == 2 ? points[0] : points[1])
    };
  }
  else if(game.round == 5) {
    //Shared
    var points = calcShared(game.scores);
    game.calculated = {
      away_points: points[1],
      home_points: points[0]
    };
    //Fix players.
    game.players[0] = game.players[0].split(' ');
    game.players[1] = game.players[1].split(' ');
  }
  else {
    return undefined;
  }

  return game;
}

function calcDoubles(scores) {
  var points = [0,0,0,0];

  var total1 = scores[0] + scores[2];
  var total2 = scores[1] + scores[3];

  if(scores[0] > scores[1]) { points[0]++; } else { points[1]++; }
  if(scores[0] > scores[3]) { points[0]++; } else { points[3]++; }
  if(scores[2] > scores[1]) { points[2]++; } else { points[1]++; }
  if(scores[2] > scores[3]) { points[2]++; } else { points[3]++; }

  if(total1 > total2) { points[0] += 0.5; points[2] += 0.5; }
  else                { points[1] += 0.5; points[3] += 0.5; }

  return points;
}

function calcSingles(scores) {
  var points = [0,0];

  //float ratio = ((float)scores[0])/scores[1];
  var ratio = scores[0]/scores[1];

  //It is possible to exactly double. In NBAFB, there was a 23-46 game. 2x tie goes to the winner
  if(ratio >= 2)        { points[0] = 3; } //p1 doubled p2
  else if(ratio > 1)    { points[0] = 2; points[1] = 1; } //p1 def p2 without doubling
  //There should not be any exact ties.
  else if(ratio > 0.5)  { points[0] = 1; points[1] = 2; } //p2 def p1 without doubling
  else                  { points[1] = 3; } //p2 doubled p1

  return points;
}

function calcShared(scores) {
  //I suppose this could be for all players, but
  //I'm probably already going to refactor all of this.
  points = [0,0];

  if(scores[0] == 0 && scores[1] == 0) {
    return points;
  }

  if(scores[0] > scores[1]) points[0] = 1/3;
  else                      points[1] = 1/3;

  return points;
}

process.stdin.on('data', function(chunk) {
//console.log("on(data), chunk: ",chunk);

  var lines = chunk.replace(/\r/g,'').split('\n');
  for(i in lines) {
    console.log("lines["+i+"]: ",lines[i]);
    var game = processLine(lines[i]);
    if(game) console.log(game);
  }
});

process.stdin.on('end', function() {
//console.log("on(end)");

});

