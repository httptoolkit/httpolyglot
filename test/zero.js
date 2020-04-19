import { createServer } from "../lib/index.js";
import fs from "fs";
const port = 8998;
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
createServer({
    key: fs.readFileSync(path.join(__dirname, "server.key")),
    cert: fs.readFileSync(path.join(__dirname, "server.crt")),
}).listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
