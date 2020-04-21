import assert from "assert";
import tls from "tls";
import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";

const port = 0;
// @ts-ignore

const server = createServer(
    {
        key,
        cert,
    },
    async function (req, res) {
        assert(false, "Request handler should not be called");
    }
);
const host = "localhost";
server.listen(port, host, function () {
    var port = this.address().port;
    console.log("httpolyglot server listening on port " + port);

    const socket = tls.connect({
        port: port,
        host: host,
        ca: cert,
        timeout: 2000,
    });
    socket.on("session", (session) => {
        console.log("client session", session);
    });
    socket.on("secureConnect", () => {
        console.log("client connect");
        socket.end();
        socket.destroy();
    });
    socket.on("close", (e) => {
        console.log("client close", e);
        server.close((e) => {
            console.log("server close", e);
        });
    });
    // socket.on("error", console.error);
    // socket.connect(port, "localhost", () => {
    //     console.log("client connect");
    //     socket.end(() => {
    //         console.log("client end");
    //     });
    //     socket.destroy();
    //     socket.on("close", (e) => {
    //         console.log("client close", e);
    //         server.close(() => {
    //             console.log("server close");
    //         });
    //     });
    // });
});
