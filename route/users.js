var fs = require('fs');
var express = require('express');
var mustache = require('mustache');

var ids = require('../lib/ids');
var util = require('../lib/util');
var players = require('../model/players');
var venues = require('../model/venues');

var COOKIE_NAME = 'mnp_sess';
var COOKIE_OPTIONS = { maxAge: 1000*60*60*24*365*10 };

var router = express.Router();

// TODO: Refactor as middleware
router.use(function(req, res, next) {
  req.user = getUser(req, res);
  next();
});

var base = fs.readFileSync('./template/base.html').toString();

router.get('/login',function(req,res) {
  sendLoginHtml(res,null,req.query.redirect_url);
});

function sendLoginHtml(res,err,redirect_url) {
  var template = fs.readFileSync('./template/login.html').toString();

  res.send(
    mustache.render(base, {
      title: 'Login',
      error: err,
      redirect_url: redirect_url || ''
    }, {
      content: template
    })
  );
};

router.post('/login',function(req,res) {
  var rurl = req.body.redirect_url || '/';
  players.login({
    username: req.body.username,
    pass: req.body.password
  }, function(err,player) {
    if(err) {
      return sendLoginHtml(res,'Failed to login. Please try again.',rurl);
    }
    console.log(player.name + " Logged in");
    setPlayer(player,req,res);
    res.redirect(rurl);
  });
});

router.get('/profile',function(req,res) {
  var ukey = req.user.key;
  var player = players.get(ukey);
  if(!player) { return res.redirect('/login?redirect_url=/profile'); }

  var template = fs.readFileSync('./template/profile.html').toString();
  var html = mustache.render(base, {
    title: 'Profile',
    player: player
  }, {
    content: template
  });
  res.send(html);
});

router.get('/forgotpass',function(req,res) {
  var template = fs.readFileSync('./template/forgotpass.html').toString();
  var html = mustache.render(base, {
    title: 'Forgot Password'
  }, {
    content: template
  });
  res.send(html);
});

/*
router.get('/changepass',function(req,res) {
  var rurl = req.query.redirect_url || '/';
  var template = fs.readFileSync('./template/changepass.html').toString();

  var ukey = req.user.key;
  if(!ukey || ukey == 'ANON') {
    return res.redirect('/login?redirect_url='+rurl);
  }

  var html = mustache.render(base, {
    title: 'Change Password',
    redirect_url: rurl,
    ukey: ukey
  }, {
    content: template
  });

  res.send(html);
});

router.post('/changepass',function(req,res) {
  var rurl = req.body.redirect_url || '/';
  players.changePass({
    ukey: req.user.key,
    pass: req.body.pass,
    conf: req.body.conf,
    old: req.body.old
  }, function(err,player) {
    if(err) console.log(err);
    res.redirect(rurl);
  });
});
*/

//NOTE: This is mostly for testing. Users won't really
//      need to logout for any reason. And considering
//      they never even login, it would be odd to have logout.
//NOTE: This actually was a problem because I had a
//      logout link at the bottom of every single page,
//      and it would just redirect back so quick that you
//      wouldn't even know that you were logged out.
router.get('/logout', function(req,res) {
  console.log("LOGOUT request");
  clearUser(req,res);

  //Should we remove the entire req.user property?
  var rurl = req.query.redirect_url || '/';

  res.redirect(rurl);
});

//NOTE: This is effectively a dumbed down version of /profile
router.get('/me',function(req,res) {
  var ukey = req.user.key;
  var player = players.get(ukey);
  if(!player) { return res.send('You are not logged in'); }

  res.send('Hello ' +player.name+ '<br>Key:' +player.key+ '<br>Code:' +util.digest(player.email));
});

router.get('/signup',function(req,res) {
  var template = fs.readFileSync('./template/signup.html').toString();

  var html = mustache.render(base,{
    title: 'Sign-Up',
    redirect_url: req.params.redirect_url,
    venues: venues.current()
  },{
    content: template
  });

  res.send(html);
});

router.post('/signup',function(req,res) {

  req.body.timestamp = Date.now();
  var json = JSON.stringify(req.body, null, 2);
  var key = util.digest(json);

  const reason = req.body.signup_reason || 'default';

  fs.writeFileSync('./data/signups/' +reason+ '/' +key+ '.json', json);

  var host = req.protocol + '://' +req.hostname;
  players.signup({
    name: req.body.name,
    email: req.body.email,
    host: host
  } ,function(err,player) {
    if(err) {
      //TODO: This should render error message to the user.
      console.log(err);
      return res.redirect('/signup');
    }

    var template = fs.readFileSync('./template/thanks.html').toString();
    var html = mustache.render(base, {
      title: 'Thanks'
    },{
      content: template
    });
    res.send(html);
  });
});

router.get('/verify/:token',function(req,res) {
  console.log("GET /verify token:",req.params.token);
  players.verify(req.params,function(err,player) {
    if(err) {
      console.log(err);
      return res.redirect('/signup');
    }
    setPlayer(player,req,res);
    res.redirect('/createpass');
  });
});

router.get('/createpass',function(req,res) {
  var template = fs.readFileSync('./template/createpass.html').toString();

  var ukey = req.user.key;

  console.log("GET /createpass ukey: ",ukey);

  if(!ukey) { return res.redirect('/signup'); }

  var html = mustache.render(base, {
    title: 'Create Password',
    ukey: ukey
  }, {
    content: template
  });

  res.send(html);
});

router.post('/createpass',function(req,res) {
  console.log("POST /createpass");
  var ukey = req.user.key;
  if(!ukey) { return res.redirect('/signup'); }

  players.createPass({
    ukey: ukey,
    pass: req.body.pass,
    conf: req.body.conf
  }, function(err,player) {
    if(err) {
      console.log(err);
      return res.redirect('/createpass');
    }
    setPlayer(player,req,res);
    //AWESOME The user is all setup.
    res.redirect('/welcome');
  });
});

router.get('/welcome',function(req,res) {
  var template = fs.readFileSync('./template/welcome.html').toString();

  var player = players.get(req.user.key);
  if(!player) {
    console.log("No player found.");
    return res.redirect('/login');
  }

  var html = mustache.render(base,{
    title: 'Welcome',
    name: player.name,
    pkey: player.key
  },{
    content: template
  });

  res.send(html);
});

var sessions = {};

// TODO: Refactor model methods into ../model
function getUser(req,res) {
  var cookie = req.cookies[COOKIE_NAME];

  var user = {};
  if(cookie) {
    user.id = cookie;
  }
  else {
    user.id = ids.create();
  }

  var s = sessions[user.id];
  if(!s) {
    var fn = 'data/sessions/' +user.id;
    if(util.fileExists(fn)) {
      var raw = fs.readFileSync(fn);
      s = JSON.parse(raw);
      sessions[user.id] = s;
    }
  }
  if(s) {
    user.key = s.key;
  }
  res.cookie(COOKIE_NAME, user.id, COOKIE_OPTIONS);

  return user;
}

function setPlayer(player,req,res) {
  req.user.key = player.key;
  var sess = {
    key: player.key,
    created_at: Date.now()
  };
  sessions[req.user.id] = sess;
  try {
    var fn = 'data/sessions/' +req.user.id;
    fs.writeFileSync(fn,JSON.stringify(sess,null,2));
  } catch (e) {
    console.log(e);
  }
}

function clearUser(req,res) {
  res.clearCookie(COOKIE_NAME);
  delete sessions[req.user.id];
  var fn = 'data/sessions/' +req.user.id;
  if(util.fileExists(fn)) {
    fs.unlink(fn);
  }
}
module.exports = router;
