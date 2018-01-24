'use strict';

const agent = require('superagent');
const cookieParser = require('cookie-parser');

const debug = function() {};

// TODO: URL should be loaded from .env
const proxyUrl = 'http://localhost:4444';

const base = '/staging';

function showProps(obj) {
  Object.keys(obj)
  .forEach(key => debug(key));
}

function toTitleCase(str) {
  return str.split('-').map(n => {
    return n.charAt(0).toUpperCase() + n.substr(1);
  }).join('-');
}

module.exports = function(req, res, next) {
  debug(' ** STAGING **', req.hostname);

  if(!req.url.match(/^\/staging/)) {
    return next();
  }

  const { hostname, headers, url, method, body, cookies } = req;
  debug({ hostname, headers, url, method, body, cookies });
  debug('REQ:', url);

  const to = proxyUrl + url.slice(base.length);
  debug('trying', method, to);
  const request = agent(method, to)
  .set('accept', headers.accept);

  // TODO Only use staging cookies.
  if(req.cookies.mnp_sess_staging) {
    request.set('Cookie', `mnp_sess=${req.cookies.mnp_sess_staging}`);
  }
  // if(headers.cookie) request.set('cookie', headers.cookie);

  if(body) request.send(body);

  // TODO: Add POST options, if/when needed.
  request.end((err, from) => {
    debug('FROM:');
    // showProps(from);
    const { status, type, headers, text, body } = from;
    const len = text ? text.length : -1;
    debug({ status, type, headers, text_length: len });
    debug('body:', body);
    debug('rawHeaders:', from.rawHeaders);

    // For now, let's just copy ALL the headers.
    debug('Setting headers...');
    Object.keys(headers).forEach(hk => {
      const value = Array.isArray(headers[hk]) ? headers[hk][0] : headers[hk];
      const name = toTitleCase(hk);
      debug(name, typeof value, ':',value);

      if(hk === 'set-cookie' && value.match(/^mnp_sess/)) {
        // TODO Convert cookie to a staging cookie.
        debug('*** set-cookie:', value);
        res.set(name, value.replace(/^mnp_sess/, 'mnp_sess_staging'));
        return;
      }
      res.set(name, value);
    });

    res.on('close',    () => debug('/// CLOSED ///'));
    res.on('finish',   () => debug('/// FINISH ///'));
    res.on('complete', () => debug('/// COMPLETE ///'));
    res.on('emd',      () => debug('/// END ///'));

    if(type.match(/^text/)) {
      const sText = text
        .replace('url(skyline', 'url(/staging/skyline')
        .replace(/src=\"\//g, 'src=\"/staging/')
        .replace(/action=\"\//g, 'action=\"/staging/')
        .replace(/url: \'\/games/g, 'url: \'/staging/games')
        .replace(/"url":"\/pics/g, '"url":"/staging/pics')
        .replace(/\?redirect_url=/g, '?redirect_url=/staging')
        .replace(/location=\'/g, 'location=\'/staging')
        .replace(/href=\"\//g, 'href=\"/staging/');

      return res.type(type).send(sText);
    }

    if(type.match(/^image/)) {
      return res.send(body);
    }

    if(type.match(/json$/)) {
      return res.json(body);
    }

    if(type === 'application/javascript') {
      debug('handling JS');
      // debug('RES *******');
      // showProps(res);
      return from.pipe(res);
    }

    if(type === 'application/octet-stream') {
      debug('Piping application/octet-stream');
      const len = Number(headers['content-length']);
      const buf = new Buffer(len);
      debug('len:', len, 'buf.length:', buf.length);
      let num = 0;
      from.on('data', data => {
        // debug('DATA:', data);
        // debug('NUM:', num);
        buf.write(data.toString(), num);
        num += data.toString().length;
      });
      from.on('end', () => {
        res.send(buf);
      });
    }
    else {
      res.send('-- EMPTY --');
    }
  });
};
