Description
===========

A module for serving http and https connections over the same port.

Forked from the original [`httpolyglot`](https://github.com/mscdex/httpolyglot) to fix various issues required for [HTTP Toolkit](https://httptoolkit.tech), including:

* Fixing `tlsClientError`: https://github.com/mscdex/httpolyglot/pull/11.
* Exposing the lost bytes from https://github.com/mscdex/httpolyglot/issues/13 on the socket, as `__httpPeekedData`.
* Dropping support for old versions of Node (and thereby simplifying the code somewhat)

Requirements
============

* [node.js](http://nodejs.org/) -- v8.0.0 or newer


Install
============

    npm install @httptoolkit/httpolyglot


Examples
========

* Simple usage:

```javascript
const httpolyglot = require('@httptoolkit/httpolyglot');
const fs = require('fs');

httpolyglot.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
}, function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end((req.socket.encrypted ? 'HTTPS' : 'HTTP') + ' Connection!');
}).listen(9000, 'localhost', function() {
  console.log('httpolyglot server listening on port 9000');
  // visit http://localhost:9000 and https://localhost:9000 in your browser ...
});
```

* Simple redirect of all http connections to https:

```javascript
const httpolyglot = require('@httptoolkit/httpolyglot');
const fs = require('fs');

httpolyglot.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
}, function(req, res) {
  if (!req.socket.encrypted) {
    res.writeHead(301, { 'Location': 'https://localhost:9000' });
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Welcome, HTTPS user!');
}).listen(9000, 'localhost', function() {
  console.log('httpolyglot server listening on port 9000');
  // visit http://localhost:9000 and https://localhost:9000 in your browser ...
});
```


API
===

Exports
-------

* **Server** - A class similar to https.Server (except instances have `setTimeout()` from http.Server).

* **createServer**(< _object_ >tlsConfig[, < _function_ >requestListener]) - _Server_ - Creates and returns a new Server instance.

How it Works
============

TLS and HTTP connections are easy to distinguish based on the first byte sent by clients trying to connect. See [this comment](https://github.com/mscdex/httpolyglot/issues/3#issuecomment-173680155) for more information.
