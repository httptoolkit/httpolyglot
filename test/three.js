import { createServer } from "../lib/index.js";
import fs from "fs";
const port = 8999;
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer(
    {
        key: fs.readFileSync(path.join(__dirname, "server.key")),
        cert: fs.readFileSync(path.join(__dirname, "server.crt")),
    },
    function (req, res) {
        console.log(req, res);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("websocket");
    },
    function (req, socket, head) {
        console.log(req, head);
        socket.write(
            "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
                "Upgrade: WebSocket\r\n" +
                "Connection: Upgrade\r\n" +
                "\r\n"
        );

        socket.pipe(socket);
    }
);

server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
