import * as net from 'net';
import * as tls from 'tls';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';

import { EventEmitter } from 'events';

function onError(err: any) {}

const TLS_HANDSHAKE_BYTE = 0x16; // SSLv3+ or TLS handshake
const HTTP2_PREFACE = 'PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n';
const HTTP2_PREFACE_BUFFER = Buffer.from(HTTP2_PREFACE);

const NODE_MAJOR_VERSION = parseInt(process.version.slice(1).split('.')[0], 10);

type Http2Listener = (request: http2.Http2ServerRequest, response: http2.Http2ServerResponse) => void;

export interface HttpolyglotOptions {
  /**
   * Enable support for incoming TLS connections. If a TLS configuration is provided, this will
   * be used to instantiate a TLS server to handle the connections. If a TLS server is provided,
   * then all incoming TLS connections will be emitted as 'connection' events on the given
   * TLS server, and all 'secureConnection' events coming from the TLS server will be handled
   * according to the connection type detected on that socket.
   */
  tls?: https.ServerOptions | tls.Server;
}

class Server extends net.Server {

  private _httpServer: http.Server;
  private _http2Server: http2.Http2Server;
  private _tlsServer: EventEmitter;

  /**
   * Create an Httpolyglot instance with just a request listener to support plain-text
   * HTTP & HTTP/2 on the same port, with incoming TLS connections being closed immediately.
   */
  constructor(requestListener: http.RequestListener);
  /**
   * Call with configuration options to enable TLS, which may include
   * HTTP or HTTP/2 in turn, accepting all protocols on the same port.
   */
  constructor(config: HttpolyglotOptions, requestListener: http.RequestListener);
  constructor(
    configOrListener:
      | HttpolyglotOptions
      | http.RequestListener,
    listener?: http.RequestListener
  ) {
    // We just act as a plain TCP server, accepting and examing
    // each connection, then passing it to the right subserver.
    super((socket) => this.connectionListener(socket));

    let config: HttpolyglotOptions = {};
    let requestListener: http.RequestListener;

    if (typeof configOrListener === 'function') {
      requestListener = configOrListener;
    } else {
      config = configOrListener;
      requestListener = listener!;
    }

    // We bind the request listener, so 'this' always refers to us, not each subserver.
    // This means 'this' is consistent (and this.close() works).
    // Use `Function.prototype.bind` directly as frameworks like Express generate
    // methods from `http.METHODS`, and `BIND` is an included HTTP method.
    const boundListener = Function.prototype.bind.call(requestListener, this);

    // Create subservers for each supported protocol:
    this._httpServer = new http.Server(boundListener);
    this._http2Server = http2.createServer({}, boundListener as any as Http2Listener);

    if (config.tls) {
      if (config.tls instanceof tls.Server) {
        // If we've been given a preconfigured TLS server, we use that directly, and
        // subscribe to connections there
        this._tlsServer = config.tls;
        this._tlsServer.on('secureConnection', this.tlsListener.bind(this));
      } else {
        // If we have TLS config, create a TLS server, which will pass sockets to
        // the relevant subserver once the TLS connection is set up.
        this._tlsServer = new tls.Server(config.tls, this.tlsListener.bind(this));
      }
    } else {
      // Fake TLS server that rejects all connections:
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
    const data = socket.read();

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
          this._httpServer.emit('connection', socket);
        }
      }
    }
  }

  private tlsListener(tlsSocket: tls.TLSSocket) {
    if (
      tlsSocket.alpnProtocol === false || // Old non-ALPN client
      tlsSocket.alpnProtocol === 'http/1.1' || // Modern HTTP/1.1 ALPN client
      tlsSocket.alpnProtocol === 'http 1.1' // Broken ALPN client (e.g. https-proxy-agent)
    ) {
      this._httpServer.emit('connection', tlsSocket);
    } else {
      this._http2Server.emit('connection', tlsSocket);
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

export type { Server };

/**
 * Create an Httpolyglot instance with just a request listener to support plain-text
 * HTTP & HTTP/2 on the same port, with incoming TLS connections being closed immediately.
 */
export function createServer(requestListener: http.RequestListener): Server;
/**
 * Create an Httpolyglot server with advanced configuration, to enable TLS
 * connections containing HTTP, accepting all protocols on the same port.
 *
 * The options can contain:
 * - `tls`: A TLS configuration object, or an existing TLS server. If a TLS server is provided,
 *   all incoming TLS connections will be emitted as 'connection' events on the given TLS server,
 *   and all 'secureConnection' events coming from the TLS server will be handled according to
 *   the connection type (HTTP/1 or HTTP/2) detected on that socket.
 */
export function createServer(config: HttpolyglotOptions, requestListener: http.RequestListener): Server;
export function createServer(configOrListener:
  | HttpolyglotOptions
  | http.RequestListener,
  listener?: http.RequestListener
) {
  let config: HttpolyglotOptions;
  let requestListener: http.RequestListener;

  if (typeof configOrListener === 'function') {
    config = {}
    requestListener = configOrListener;
  } else {
    config = configOrListener;
    requestListener = listener!;
  }

  return new Server(config, requestListener);
};
