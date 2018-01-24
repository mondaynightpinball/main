var express = require('express');
//var URL = require('url');

// TODO Refactor as middleware?

var router = express.Router();

//TODO: Include the protocol and possibly method.
//TODO: List should probably be list of filter objects.
var list = [
  'localhost',
  'geofftest.com',
  'mondaynightpinball.com'
];

router.use('/', function(req, res, next) {
  var hn = req.hostname;

  //var url = URL.parse(req.

  var parts = hn.split('.');

  //console.log('PRE/hn:' +hn);
  //console.log('parts:',parts);

  if(parts.length > 2) {
    var n = parts.length;
    hn = parts[n-2] + '.' + parts[n-1];
  }
  //console.log('POST/hn:' +hn);

  if(list.indexOf(hn) != -1) {
    //console.log("ACCEPT: " +hn);
    next();
  }
  else {
    console.log("REJECT: " +req.protocol+ "://" +req.hostname + req.originalUrl);
    res.sendStatus(400);
  }
});

module.exports = router;
