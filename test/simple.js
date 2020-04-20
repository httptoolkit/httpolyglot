import { createServer } from "../lib/index.js";
import fs from "fs";
const port = 9000;
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer(
    {
        key: fs.readFileSync(path.join(__dirname, "server.key.pem")),
        cert: fs.readFileSync(path.join(__dirname, "server.crt.pem")),
    },
    async function (req, res) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(
            ("encrypted" in req.socket ? "HTTPS" : "HTTP") + " Connection!\n"
        );
        res.write("alpnProtocol:" + req.socket.alpnProtocol + " \n");

        res.end();
    }
);

server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
