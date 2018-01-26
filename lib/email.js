// NOTE: A lot of this code is old code that was originally
// copied from stackoverflow and google dev guides. While this
// code appears to work fine, it still could be better.

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
var TOKEN_DIR = './.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-token.json';

var client;
var working = false;
var waiting = [];

function init(callback) {
  if(client) {
    callback(true);
  }
  else {
    waiting.push(callback);
    if(working) {
    }
    else {
      working = true;
      var secret = JSON.parse(
        fs.readFileSync('./.credentials/client_secret.json')
      );
      authorize(secret, function(auth) {
        client = auth;
        console.log("Authorized gmail");
        for(var i = 0; i < waiting.length; i++) {
          waiting[i](true);
        }
      });
    }
  }
}

init(function(res) {
  console.log("*** INIT GMAIL - " +res);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

//TODO: Consider using single params {} object.
// TODO: This should be done async
function send(to,subject,message) {
  var from = 'Monday Night Pinball <service@mondaynightpinball.com>';

  var raw = makeBody(to,from,subject,message);

  var gmail = google.gmail('v1');
  gmail.users.messages.send({
    auth: client,
    userId: 'me',
    resource: {
      raw: raw
    }
  }, function(err, response) {
    if(err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    console.log("Response: -------------------------------------------");
    console.log(JSON.stringify(response,null,2));
  });
}

// http://stackoverflow.com/a/34563593
function makeBody(to, from, subject, message) {
    var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');

    var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
        return encodedMail;
}

module.exports = {
  init: init,
  send: send
};
