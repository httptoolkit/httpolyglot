# Description

Serve http and https and spdy and http2 connections over the same port with node.js

# Requirements

-   [node.js](http://nodejs.org/) -- v12.0.0 or newer

# Install

```shell
yarn add spdy  @masx200/http-https-spdy-http2-polyglot
```

# Connection protocol judgment

Determine if the connection is tls.

```js
const istls = "encrypted" in req.socket;
```

Determine if the connection is http/2.

```js
const ishttp2 = "h2" === req.socket.alpnProtocol;
```

# Examples

-   http2 server push

https://github.com/masx200/http-https-spdy-http2-polyglot/blob/master/test/push.js

-   Websocket

https://github.com/masx200/http-https-spdy-http2-polyglot/blob/master/test/websocket.js

-   Simple Determine if the connection is tls.

```javascript
const httpolyglot = require("@masx200/http-https-spdy-http2-polyglot");
const fs = require("fs");
const port = 9000;
httpolyglot
    .createServer(
        {
            key: fs.readFileSync("server.key"),
            cert: fs.readFileSync("server.crt"),
        },
        function (req, res) {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(
                ("encrypted" in req.socket ? "HTTPS" : "HTTP") + " Connection!"
            );
        }
    )
    .listen(port, "localhost", function () {
        console.log("httpolyglot server listening on port " + port);
    });
```

-   redirect all http connections to https:

```javascript
const httpolyglot = require("@masx200/http-https-spdy-http2-polyglot");
const fs = require("fs");
const port = 9000;
httpolyglot
    .createServer(
        {
            key: fs.readFileSync("server.key"),
            cert: fs.readFileSync("server.crt"),
        },
        function (req, res) {
            if (!("encrypted" in req.socket)) {
                const host = req.headers["host"];
                const originurl = req.url || "";
                const tourl = new URL(originurl, "https://" + host);
                tourl.port = String(port);
                res.writeHead(302, { Location: tourl.href });
                return res.end();
            } else {
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end("Welcome, HTTPS user!");
            }
        }
    )
    .listen(port, "localhost", function () {
        console.log("httpolyglot server listening on port " + port);
    });
```

# API

## Exports

https://github.com/masx200/http-https-spdy-http2-polyglot/blob/master/lib/index.d.ts

-   **createServer** - Creates and returns a new Server instance.

```ts
declare function createServer(
    config: ServerOptions,
    requestListener?: RequestListener,
    upgradeListener?: UpgradeListener
): https.Server;
```

The `requestListener` is a function which is automatically added to the 'request' event

The `upgradeListener` is a function which is automatically added to the 'upgrade' event

# How it Works

https://github.com/lvgithub/blog/blob/master/http_and_https_over_same_port/README.MD

TLS and HTTP connections are easy to distinguish based on the first byte sent by clients trying to connect. See this comment for more information.

https://github.com/mscdex/httpolyglot/issues/3#issuecomment-173680155

https://github.com/httptoolkit/httpolyglot/blob/master/lib/index.js
