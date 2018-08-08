const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// TODO: There could be a case made that the token path is read from .env
const TOKEN_DIR = './.credentials/';
const TOKEN_PATH = `${TOKEN_DIR}/gmail-token.json`;

let client;

function getClient() {
  return new Promise((resolve, reject) => {
    if(client) return resolve(client);
    try {
      console.log('Loading credentials...');
      const credentials = JSON.parse(
        fs.readFileSync(`${TOKEN_DIR}/credentials.json`)
      );
      console.log('Authorizing...');
      authorize(credentials, (oAuth2Client) => {
        client = oAuth2Client;
        resolve(client);
      });
    } catch (e) {
      return reject(e);
    }
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function send({to, from, subject, message}) {
  return new Promise((resolve, reject) => {
    var raw = makeBody(to,from,subject,message);

    getClient()
    .then(auth => {
      const gmail = google.gmail({version: 'v1', auth});
      console.log('Sending...');
      gmail.users.messages.send({
        userId: 'me',
        resource: { raw }
      }, (err, response) => {
        if(err) {
          return reject(err);
        }
        resolve(response);
      });
    })
    .catch(reject);
  });
}

function makeBody(to, from, subject, message) {
  const raw = [
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    'Content-Transfer-Encoding: 7bit',
    `to: ${to}`,
    `from: ${from}`,
    `subject: ${subject}`,
    '',
    message
  ].join('\n');

  // For some reason. The entire email needs to be base64 encoded.
  // I assume that is part of the RFC for email.
  // Originally noticed in the following SO:
  // http://stackoverflow.com/a/34563593
  return new Buffer(raw)
    .toString("base64")
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

module.exports = { send };
