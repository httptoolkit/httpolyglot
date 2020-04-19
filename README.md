# Description

Serve http and https and spdy and http2 connections over the same port with node.js

# Requirements

-   [node.js](http://nodejs.org/) -- v8.0.0 or newer

# Install

    npm install @masx200/http-https-spdy-http2-polyglot

# Examples

-   Simple usage:

```javascript
const httpolyglot = require("@masx200/http-https-spdy-http2-polyglot");
const fs = require("fs");

httpolyglot
    .createServer(
        {
            key: fs.readFileSync("server.key"),
            cert: fs.readFileSync("server.crt"),
        },
        function (req, res) {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end((req.socket.encrypted ? "HTTPS" : "HTTP") + " Connection!");
        }
    )
    .listen(9000, "localhost", function () {
        console.log("httpolyglot server listening on port 9000");
    });
```

-   Simple redirect of all http connections to https:

```javascript
const httpolyglot = require("@masx200/http-https-spdy-http2-polyglot");
const fs = require("fs");

httpolyglot
    .createServer(
        {
            key: fs.readFileSync("server.key"),
            cert: fs.readFileSync("server.crt"),
        },
        function (req, res) {
            if (!req.socket.encrypted) {
                res.writeHead(301, { Location: "https://localhost:9000" });
                return res.end();
            } else {
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end("Welcome, HTTPS user!");
            }
        }
    )
    .listen(9000, "localhost", function () {
        console.log("httpolyglot server listening on port 9000");
    });
```

# API

## Exports

-   **Server** - A class similar to https.Server (except instances have `setTimeout()` from http.Server).

-   **createServer**(< _object_ >tlsConfig[, < _function_ >requestListener]) - _Server_ - Creates and returns a new Server instance.

# How it Works

https://github.com/lvgithub/blog/blob/master/http_and_https_over_same_port/README.MD

TLS and HTTP connections are easy to distinguish based on the first byte sent by clients trying to connect. See [this comment](https://github.com/mscdex/httpolyglot/issues/3#issuecomment-173680155) for more information.
