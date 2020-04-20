import { createServer } from "../lib/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = 9001;
createServer(
    {
        key: fs.readFileSync(path.join(__dirname, "server.key")),
        cert: fs.readFileSync(path.join(__dirname, "server.crt")),
    },
    function (req, res) {
        if ("encrypted" in req.socket) {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Welcome, HTTPS user!");
        } else {
            const host = req.headers["host"];
            const originurl = req.url || "";
            const tourl = new URL(originurl, "https://" + host);
            tourl.port = String(port);
            res.writeHead(302, { Location: tourl.href });
            return res.end();
        }
    }
).listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
