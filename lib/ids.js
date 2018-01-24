var crypto = require('crypto');

/**
 Returns a modified base64 of randomBytes, trimmed of trailing ==
 */
function create() {
  var buf = new Buffer(crypto.randomBytes(16));
  return buf.toString('base64')
    .replace(/\+/g,'0')
    .replace(/\//g,'0')
    .substring(0,22);
}

if(module && module.exports) {
  module.exports = {
    create: create
  };
}

//TEST TEST TEST
//console.log(genId());

