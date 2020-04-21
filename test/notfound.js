import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
const port = 8998;
// @ts-ignore

const server = createServer({
    key,
    cert,
});

server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
