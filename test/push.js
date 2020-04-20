import { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
const port = 9002;
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer(
    {
        key,
        cert,
    },
    (req, res) => {
        if (req.url == "/main.js") {
            res.statusCode = 200;
            res.setHeader("content-type", "application/javascript");
            res.end('alert("not from push stream")');
            return;
        } else {
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
    }
);
server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
