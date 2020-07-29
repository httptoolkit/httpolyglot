const net = require('net');
const tls = require('tls');
const http = require('http');
const http2 = require('http2');
const SocketWrapper = require('_stream_wrap');

const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;

function Server(tlsConfig, requestListener) {
  if (!(this instanceof Server)) return new Server(tlsConfig, requestListener);

  if (typeof tlsConfig === 'function') {
    requestListener = tlsConfig;
    tlsConfig = undefined;
  }

  // We bind the listener, so 'this' always refers to us, not each subserver.
  // This means 'this' is consistent (and this.close() works). If you need to
  // access a specific subserver, you'll need to use ._{http,http2,tls}Server
  const boundListener = requestListener.bind(this);

  // Create subservers for each supported protocol:
  this._httpServer = new http.Server(boundListener);
  this._http2Server = http2.createServer({}, boundListener);

  if (typeof tlsConfig === 'object') {
    // If we have TLS config, create a TLS server, which will pass sockets to
    // the relevant subserver once the TLS connection is set up.
    this._tlsServer = tls.Server(tlsConfig, (tlsSocket) => {
      if (tlsSocket.alpnProtocol === false || tlsSocket.alpnProtocol === 'http/1.1') {
        this._httpServer.emit('connection', tlsSocket);
      } else {
        this._http2Server.emit('connection', tlsSocket);
      }
    });
  } else {
    // Fake server that rejects all connections:
    this._tlsServer = new EventEmitter();
    this._tlsServer.on('connection', (socket) => socket.destroy());
  }

  const subServers = [this._httpServer, this._http2Server, this._tlsServer];

  // We ourselves just act as a plain TCP server, accepting and examing
  // each connection, then passing it to the right subserver.
  net.Server.call(this, connectionListener);

  // Proxy all event listeners setup onto the subservers, so any
  // subscriptions on this server are fed from all the subservers
  this.on('newListener', function (eventName, listener) {
    subServers.forEach(function (subServer) {
      subServer.addListener(eventName, listener);
    })
  });

  this.on('removeListener', function (eventName, listener) {
    subServers.forEach(function (subServer) {
      subServer.removeListener(eventName, listener);
    })
  });
}
inherits(Server, net.Server);

function onError(err) {}

const TLS_HANDSHAKE_BYTE = 0x16; // SSLv3+ or TLS handshake
const HTTP2_PREFACE = 'PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n';
const HTTP2_PREFACE_BUFFER = Buffer.from(HTTP2_PREFACE);

const connectionListener = function (socket) {
  const data = socket.read(1);

  if (data === null) {
    socket.removeListener('error', onError);
    socket.on('error', onError);

    socket.once('readable', () => {
      connectionListener.call(this, socket);
    });
  } else {
    socket.removeListener('error', onError);

    // Put the peeked data back into the socket
    const firstByte = data[0];
    socket.unshift(data);

    // Pass the socket to the correct subserver:
    if (firstByte === TLS_HANDSHAKE_BYTE) {
      // TLS sockets don't allow half open
      socket.allowHalfOpen = false;
      this._tlsServer.emit('connection', socket);
    } else {
      if (firstByte === HTTP2_PREFACE_BUFFER[0]) {
        // The connection _might_ be HTTP/2. To confirm, we need to keep
        // reading until we get the whole stream:
        http2Listener.call(this, socket);
      } else {
        // The above unshift isn't always sufficient to invisibly replace the
        // read data. The rawPacket property on errors in the clientError event
        // for plain HTTP servers loses this data - this prop makes it available.
        // Bit of a hacky fix, but sufficient to allow for manual workarounds.
        socket.__httpPeekedData = data;
        this._httpServer.emit('connection', socket);
      }
    }
  }
};

const http2Listener = function (socket, pastData) {
  const h1Server = this._httpServer;
  const h2Server = this._http2Server;

  const newData = socket.read() || Buffer.from([]);
  const data = pastData ? Buffer.concat(pastData, newData) : newData;

  if (data.length >= HTTP2_PREFACE_BUFFER.length) {
    socket.unshift(data);
    if (data.slice(0, HTTP2_PREFACE_BUFFER.length).equals(HTTP2_PREFACE_BUFFER)) {
      // We have a full match for the preface - it's definitely HTTP/2.
      h2Server.emit('connection', new SocketWrapper(socket));
      return;
    } else {
      h1Server.emit('connection', socket);
      return;
    }
  } else if (!data.equals(HTTP2_PREFACE_BUFFER.slice(0, data.length))) {
    socket.unshift(data);
    // Haven't finished the preface length, but something doesn't match already
    h1Server.emit('connection', socket);
    return;
  }

  // Not enough data to know either way - try again, waiting for more:
  socket.removeListener('error', onError);
  socket.on('error', onError);
  socket.once('readable', () => {
    http2Listener.call(this, socket, data);
  });
};

exports.Server = Server;

exports.createServer = function (tlsConfig, requestListener) {
  return new Server(tlsConfig, requestListener);
};
