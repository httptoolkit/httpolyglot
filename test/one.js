import { createServer } from "../lib/index.js";
import fs from "fs";
const port = 9000;
import path from "path";
createServer(
    {
        key: fs.readFileSync(path.join(__dirname, "server.key")),
        cert: fs.readFileSync(path.join(__dirname, "server.crt")),
    },
    function (req, res) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end((req.socket ? "HTTPS" : "HTTP") + " Connection!");
    }
).listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
