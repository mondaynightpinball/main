const gmail = require('../lib/gmail.js');

require('dotenv').load(); // If not already.
const TO = process.env.TEST_EMAIL_ADDRESS;

console.log('Sending a test email to:', TO);

gmail.send({
  to: TO,
  from: 'Monday Night Pinball <service@mondaynightpinball.com>',
  subject: 'Test Email',
  message: 'Hello There. This is a test.'
})
.then(response => {
  console.log('SUCCESS');
  console.log(response.data);
})
.catch(err => {
  console.log('ERROR');
  console.log(err);
});
