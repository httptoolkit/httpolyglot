import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const key = fs.readFileSync(
    path.join(__dirname, "../", "./server.key.pem")
);
export const cert = fs.readFileSync(
    path.join(__dirname, "../", "./server.crt.pem")
);
