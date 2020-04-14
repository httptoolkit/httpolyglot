const http = require('http');
const https = require('https');
const inherits = require('util').inherits;
const httpSocketHandler = http._connectionListener;

function Server(tlsconfig, requestListener) {
  if (!(this instanceof Server)) return new Server(tlsconfig, requestListener);

  if (typeof tlsconfig === 'function') {
    requestListener = tlsconfig;
    tlsconfig = undefined;
  }

  if (typeof tlsconfig === 'object') {
    this.removeAllListeners('connection');

    https.Server.call(this, tlsconfig, requestListener);

    // capture https socket handler, it's not exported like http's socket
    // handler
    const connev = this._events.connection;
    if (typeof connev === 'function') {
      this._tlsHandler = connev;
    } else {
      this._tlsHandler = connev[connev.length - 1];
    }
    this.removeListener('connection', this._tlsHandler);

    this._connListener = connectionListener;
    this.on('connection', connectionListener);

    // copy from http.Server
    this.timeout = 2 * 60 * 1000;
    this.allowHalfOpen = true;
    this.httpAllowHalfOpen = false;
  } else {
    http.Server.call(this, requestListener);
  }
}
inherits(Server, https.Server);

Server.prototype.setTimeout = function (msecs, callback) {
  this.timeout = msecs;
  if (callback) this.on('timeout', callback);
};

Server.prototype.__httpSocketHandler = httpSocketHandler;

function onError(err) {}

const connectionListener = function (socket) {
  const data = socket.read(1);

  if (data === null) {
    socket.removeListener('error', onError);
    socket.on('error', onError);

    socket.once('readable', () => {
      this._connListener(socket);
    });
  } else {
    socket.removeListener('error', onError);

    const firstByte = data[0];
    socket.unshift(data);
    if (firstByte < 32 || firstByte >= 127) {
      // tls/ssl
      // TLS sockets don't allow half open
      socket.allowHalfOpen = false;
      this._tlsHandler(socket);
    } else {
      this.__httpSocketHandler(socket);
    }
  }
};

exports.Server = Server;

exports.createServer = function (tlsconfig, requestListener) {
  return new Server(tlsconfig, requestListener);
};
