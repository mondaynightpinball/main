var express = require('express');

var fs = require('fs');

var router = express.Router();

var morgan = require('morgan');

morgan.token('user-id', function(req,res) {
  return req.user.id;
});

var format = ':remote-addr :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :referrer ":user-agent"';

// TODO: It would probably be better to just export the instance of morgan...treating this file like a setup/wrapper.
router.use(morgan(format, {
  skip: function(req,res) {
    var code = res.statusCode;
    //console.log("skip(), code: ",code);
    return code == 304;
  }
}));

module.exports = router;
