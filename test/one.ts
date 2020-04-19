import { createServer } from "../lib/index.js";
import fs from "fs";
const port = 9000;

createServer(
    {
        key: fs.readFileSync("server.key"),
        cert: fs.readFileSync("server.crt"),
    },
    function (req, res) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end((req.socket ? "HTTPS" : "HTTP") + " Connection!");
    }
).listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
