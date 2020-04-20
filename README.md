# Description

Serve http and https and spdy and http2 connections over the same port with node.js

# Requirements

-   [node.js](http://nodejs.org/) -- v12.0.0 or newer

# Install

```shell
yarn add spdy  @masx200/http-https-spdy-http2-polyglot
```

# Connection protocol judgment

Determine if the connection is over tls.

```js
const istls = "encrypted" in req.socket;
```

Determine if the connection is `http/2`.

```js
const ishttp2 = "h2" === req.socket.alpnProtocol;
```

# Examples

-   http2 server push

https://github.com/masx200/http-https-spdy-http2-polyglot/blob/master/test/push.js

-   Websocket server

https://github.com/masx200/http-https-spdy-http2-polyglot/blob/master/test/websocket.js

-   Simple Determine the connection protocol

```javascript
const httpolyglot = require("@masx200/http-https-spdy-http2-polyglot");
const fs = require("fs");
const port = 9000;
const server = httpolyglot.createServer(
    {
        key: fs.readFileSync("server.key.pem"),
        cert: fs.readFileSync("server.crt.pem"),
    },
    function (req, res) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
            ("encrypted" in req.socket ? "HTTPS" : "HTTP") + " Connection!"
        );
    }
);
server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
```

-   redirect all http connections to https:

https://github.com/masx200/http-https-spdy-http2-polyglot/blob/master/test/redirect.js

-   create a "404 not found" server

https://github.com/masx200/http-https-spdy-http2-polyglot/blob/master/test/notfound.js

# API

## Exports

https://github.com/masx200/http-https-spdy-http2-polyglot/blob/master/lib/index.d.ts

-   **createServer** - Creates and returns a new Server instance.

```ts
declare function createServer(
    config: ServerOptions,
    requestListener?: RequestListener,
    upgradeListener?: UpgradeListener
): net.Server;
```

The `requestListener` is a function which is automatically added to the 'request' event

The `upgradeListener` is a function which is automatically added to the 'upgrade' event

If no "requestListener" or "upgradeListener" is provided, the default "404 not found" listener will be used instead.

# How it Works

https://github.com/lvgithub/blog/blob/master/http_and_https_over_same_port/README.MD

TLS and HTTP connections are easy to distinguish based on the first byte sent by clients trying to connect. See this comment for more information.

https://github.com/mscdex/httpolyglot/issues/3#issuecomment-173680155

https://github.com/httptoolkit/httpolyglot/blob/master/lib/index.js

# test

```powershell
yarn install
```

```powershell
./generate-ssl-cert.ps1
```

```powershell
yarn serve
```

```powershell
yarn fetch1
```

```powershell
yarn fetch2
```

```powershell
yarn open
```
