import { createServer } from "../lib/index.js";
import fs from "fs";
import path from "path";
const port = 9001;
createServer(
    {
        key: fs.readFileSync(path.join(__dirname, "server.key")),
        cert: fs.readFileSync(path.join(__dirname, "server.crt")),
    },
    function (req, res) {
        if (!req.socket) {
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
).listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
