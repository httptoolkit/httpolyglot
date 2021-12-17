import * as net from 'net';
import * as tls from 'tls';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';

import { EventEmitter } from 'events';

declare module 'net' {
  interface Socket {
    __httpPeekedData?: Buffer;
  }
}

function onError(err: any) {}

const TLS_HANDSHAKE_BYTE = 0x16; // SSLv3+ or TLS handshake
const HTTP2_PREFACE = 'PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n';
const HTTP2_PREFACE_BUFFER = Buffer.from(HTTP2_PREFACE);

const NODE_MAJOR_VERSION = parseInt(process.version.slice(1).split('.')[0], 10);

type Http2Listener = (request: http2.Http2ServerRequest, response: http2.Http2ServerResponse) => void;

export class Server extends net.Server {

  private _httpServer: http.Server;
  private _http2Server: http2.Http2Server;
  private _tlsServer: EventEmitter;

  constructor(requestListener: http.RequestListener);
  constructor(tlsConfig: https.ServerOptions, requestListener: http.RequestListener);
  constructor(configOrListener: https.ServerOptions | http.RequestListener, listener?: http.RequestListener) {
    // We just act as a plain TCP server, accepting and examing
    // each connection, then passing it to the right subserver.
    super((socket) => this.connectionListener(socket));

    let tlsConfig: https.ServerOptions | undefined;
    let requestListener: http.RequestListener;

    if (typeof configOrListener === 'function') {
      requestListener = configOrListener;
      tlsConfig = undefined;
    } else {
      tlsConfig = configOrListener;
      requestListener = listener!;
    }

    // We bind the request listener, so 'this' always refers to us, not each subserver.
    // This means 'this' is consistent (and this.close() works).
    const boundListener = requestListener.bind(this);

    // Create subservers for each supported protocol:
    this._httpServer = new http.Server(boundListener);
    this._http2Server = http2.createServer({}, boundListener as any as Http2Listener);

    if (typeof tlsConfig === 'object') {
      // If we have TLS config, create a TLS server, which will pass sockets to
      // the relevant subserver once the TLS connection is set up.
      this._tlsServer = new tls.Server(tlsConfig, (tlsSocket) => {
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

  private connectionListener(socket: net.Socket) {
    const data = socket.read(1);

    if (data === null) {
      socket.removeListener('error', onError);
      socket.on('error', onError);

      socket.once('readable', () => {
        this.connectionListener(socket);
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
          this.http2Listener(socket);
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
  }

  private http2Listener(socket: net.Socket, pastData?: Buffer) {
    const h1Server = this._httpServer;
    const h2Server = this._http2Server;

    const newData: Buffer = socket.read() || Buffer.from([]);
    const data = pastData ? Buffer.concat([pastData, newData]) : newData;

    if (data.length >= HTTP2_PREFACE_BUFFER.length) {
      socket.unshift(data);
      if (data.slice(0, HTTP2_PREFACE_BUFFER.length).equals(HTTP2_PREFACE_BUFFER)) {
        // We have a full match for the preface - it's definitely HTTP/2.

        // For HTTP/2 we hit issues when passing non-socket streams (like H2 streams for proxying H2-over-H2).
        if (NODE_MAJOR_VERSION <= 12) {
          // For Node 12 and older, we need a (later deprecated) stream wrapper:
          const StreamWrapper = require('_stream_wrap');
          socket = new StreamWrapper(socket);
        } else {
          // For newer node, we can fix this with a quick patch here:
          const socketWithInternals = socket as { _handle?: { isStreamBase?: boolean } };
          if (socketWithInternals._handle) {
            socketWithInternals._handle.isStreamBase = false;
          }
        }

        h2Server.emit('connection', socket);
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
      this.http2Listener.call(this, socket, data);
    });
  }
}

export function createServer(requestListener: http.RequestListener): Server;
export function createServer(tlsConfig: https.ServerOptions, requestListener: http.RequestListener): Server;
export function createServer(configOrListener: https.ServerOptions | http.RequestListener, listener?: http.RequestListener) {
  return new Server(configOrListener as any, listener as any);
};
