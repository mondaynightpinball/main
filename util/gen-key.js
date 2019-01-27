const makeKey = require('../lib/make-key');

var name = process.argv[2];

console.log(makeKey(name));
