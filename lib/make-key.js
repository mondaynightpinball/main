'use strict';

const util = require('./util');

module.exports = (name) => util.digest(name.trim().toLowerCase());
