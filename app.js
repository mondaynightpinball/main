var https = require('https');
var fs = require('fs');

var express = require('express');

var router = require('./route/main');

var opts = JSON.parse(fs.readFileSync('.credentials/https.opts.mnp.json'));
var app = express(opts);

app.use('/', router);

https.createServer(opts, app).listen(443);

//Setup http -> https redirection
var redirect = express();
redirect.use(function(req,res,next) {
  res.redirect('https://www.mondaynightpinball.com'+req.url);
});
redirect.listen(80);
