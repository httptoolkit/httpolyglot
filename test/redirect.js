import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
// @ts-ignore

const port = 9001;
const server = createServer(
    {
        key,
        cert,
    },
    function (req, res) {
        if ("encrypted" in req.socket) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("Welcome, HTTPS user!");
        } else {
            const host = req.headers["host"];
            const originurl = req.url || "";
            const tourl = new URL(originurl, "https://" + host);
            tourl.port = String(port);
            res.writeHead(302, {
                Location: tourl.href,
                "Content-Type": "text/html",
            });
            res.write("302");
            return res.end();
        }
    }
);

server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
