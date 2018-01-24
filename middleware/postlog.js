var express = require('express');
var fs = require('fs');
var util = require('../lib/util');
var router = express.Router();

//NOTE: By placing this middleware AFTER the users middleware,
//	all the login, logout, and signup routes will be
//	handled before this, which is nice to avoid
//	logging passwords in the log.

console.log("Loaded postlog.js");

//I also want to log ALL POST operations to a file.
router.post('/*',function(req,res,next) {
console.log("RECORDING POST....");

  //TODO: Semi weird to do this photo scrubbing here,
  //	  but I'm just moving the data so that we don't
  //      dump a bunch of junk. We could also intercept
  //      a standardized convention for photos and save
  //      them to a cache, and attach the filename to
  //      the req.
/*
for(prop in req.body) {
  var x = req.body[prop];
  console.log(prop,typeof x,x.length);
}
*/
  if(req.body.photo_data) {
    console.log("Saving photo data ...");
    var x = req.body.photo_data;
    var sha = util.digest(x);
    var fn = 'uploads/' +sha;
    if(!util.fileExists(fn)) {
      fs.writeFileSync(fn,x);
      console.log(" ... saved " +fn+ " " +x.length+ " bytes");
    }
    else console.log("Already have " +fn);
    req.body.photo_data = sha;
  }
  else console.log("No photo data");

  var data = {
    path: req.path,
    body: req.body,
    when: Date.now(),
    user_id: req.user.id,
    ukey: req.user.key
  };

  var chunk = JSON.stringify(data,null,2);
  var id = util.digest(chunk);

  //THIS WAS A REALLY BAD IDEA TO APPEND TO A COMMON FILE.
  //fs.appendFileSync('data/post.log',chunk+',\n');

  fs.writeFileSync('data/posts/'+id,chunk);
  next();
});

module.exports = router;
