import { createServer } from "../lib/index.js";
import fs from "fs";
const port = 9002;
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
    (req, res) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        if (res.push) {
            var stream = res.push("/main.js", {
                status: 200, // optional
                method: "GET", // optional
                request: {
                    accept: "*/*",
                },
                response: {
                    "content-type": "application/javascript",
                },
            });
            stream.on("error", function (e) {
                console.log(e);
            });
            stream.end('alert("hello from push stream!");');
        }

        res.end('push<script src="/main.js"></script>');
    }
);
server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
