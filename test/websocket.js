import { createServer } from "../lib/index.js";
import fs from "fs";
const port = 8999;
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ws from "ws";
const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", (websocket, req) => {
    websocket.send(JSON.stringify(req.headers));
    websocket.send(
        ("encrypted" in req.socket ? "HTTPS" : "HTTP") + " Connection!"
    );
});
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer(
    {
        key: fs.readFileSync(path.join(__dirname, "server.key.pem")),
        cert: fs.readFileSync(path.join(__dirname, "server.crt.pem")),
    },
    async function (req, res) {
        if (req.url === "/") {
            res.writeHead(200, { "Content-Type": "text/html" });

            res.end(
                "websocket<script type='module' src='./index.js'></script>"
            );
        } else if (req.url === "/index.js") {
            res.writeHead(200, { "Content-Type": "text/javascript" });
            const jsfile = await fs.promises.readFile(
                path.join(__dirname, "index.js")
            );
            res.write(jsfile);
            res.end();
        } else {
            res.statusCode = 404;
            res.end();
        }
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
