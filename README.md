# Httpolyglot [![Build Status](https://github.com/httptoolkit/httpolyglot/workflows/CI/badge.svg)](https://github.com/httptoolkit/httpolyglot/actions) [![Available on NPM](https://img.shields.io/npm/v/@httptoolkit/httpolyglot.svg)](https://npmjs.com/package/@httptoolkit/httpolyglot)

> _Part of [HTTP Toolkit](https://httptoolkit.com): powerful tools for building, testing & debugging HTTP(S)_

A module for serving HTTP, HTTPS and HTTP/2 connections, all over the same port.

Forked from the original [`httpolyglot`](https://github.com/mscdex/httpolyglot) to fix various issues required for [HTTP Toolkit](https://httptoolkit.com), including:

* Support for HTTP/2
* Fixing `tlsClientError`: https://github.com/mscdex/httpolyglot/pull/11
* Include initially sniffed bytes aren't lost in subsequent `clientError` events (https://github.com/mscdex/httpolyglot/issues/13)
* Dropping support for very old versions of Node (and thereby simplifying the code somewhat)
* Converting to TypeScript
* Event subscription support (subscribe to `server.on(x, ...)` to hear about `x` from _all_ internal servers - HTTP/2, HTTP/1, TLS and net)
* Adding support for SOCKS connections
* Adding support for custom handling of unknown protocols

Requirements
============

* [node.js](http://nodejs.org/) -- v20 or newer


Install
============

    npm install @httptoolkit/httpolyglot


Examples
========

* Simple usage:

```javascript
import * as httpolyglot from '@httptoolkit/httpolyglot';
import * as fs from 'fs';

httpolyglot.createServer({
  tls: {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
  }
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
import * as httpolyglot from '@httptoolkit/httpolyglot';
import * as fs from 'fs';

httpolyglot.createServer({
  tls: {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
  }
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

* **createServer**([< _object_ >config, ]< _function_ >requestListener) - _Server_ - Creates and returns a new Server instance.

If no config is provided, this server handles HTTP/1 & HTTP/2 in plain text on the same port.

If a config is provided, it can contain:

- `tls` - Either TLS configuration options for [`tls.createServer`](https://nodejs.org/api/tls.html#tlscreateserveroptions-secureconnectionlistener), or an existing `tls.Server` instance. Setting this option enables TLS, so that HTTP/1 & HTTP/2 are accepted over both plain-text & encrypted (HTTPS) connections on the same port. If configuration options are provided, Httpolyglot will handle TLS automatically. If a server is provided, the connection will be passed to it (by emitting the `connection` event) and Httpolyglot will wait for the server to emit `secureConnection` (the default TLS server event) to handle the content within.
- `socks` - A `net.Server` instance, which will handle any incoming SOCKS connections. If this is provided, SOCKSv4 and SOCKSv5 connections will be emitted as `connection` events on this server. If not, all SOCKS connections will be treated like any other unknown protocol.
- `unknownProtocol` - A `net.Server` instance, which will handle any unknown protocols. If this is provided, unrecognized protocols will be emitted as `connection` events on this server. If it's not provided, these connections will be passed to the HTTP server by default, which will typically result in a `clientError` event and a 400 HTTP response being sent to the client.

How it Works
============

TLS, HTTP, HTTP/2, SOCKS and other connections are easy to distinguish based on the first byte sent by clients trying to connect. See [this comment](https://github.com/mscdex/httpolyglot/issues/3#issuecomment-173680155) for more information.
