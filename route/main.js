var express = require('express');
var router = express.Router();

router.use(require('../middleware/whitelist'));

var cookieParser = require('cookie-parser');
router.use(cookieParser());

var bodyParser = require('body-parser');

// TODO: Replace image upload with CF/S3 solution

//HACK: We are accepting images up to 10MB.
router.use(bodyParser.urlencoded({ limit: 10000000, extended: true }));
router.use(bodyParser.json());

// TODO: Staging didn't quite work out as a sub-router. Deprecated
// router.use(require('./staging'));

var users = require('./users');
router.use(users);

router.use(require('../middleware/postlog'));
router.use(require('../middleware/logging'));

router.use(require('./users'));
router.use(require('./mnp'));
router.use(require('./league'));
router.use(require('./machines'));
router.use(require('./venues'));

router.use(express.static('static'));

module.exports = router;
