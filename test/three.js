import { createServer } from "../lib/index.js";
import fs from "fs";
const port = 8999;
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ws from "ws";
const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", (socket, req) => {
    socket.send(JSON.stringify(req.headers));
    socket.send(
        ("encrypted" in req.socket ? "HTTPS" : "HTTP") + " Connection!"
    );
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer(
    {
        key: fs.readFileSync(path.join(__dirname, "server.key")),
        cert: fs.readFileSync(path.join(__dirname, "server.crt")),
    },
    function (req, res) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        
        res.end("websocket");
    },
    function (req, socket, head) {
        wsServer.handleUpgrade(req, socket, head, function done(ws) {
            wsServer.emit("connection", ws, req);
        });
    }
);

server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
