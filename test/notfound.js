import { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
const port = 8998;
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer({
    key,
    cert,
});

server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
