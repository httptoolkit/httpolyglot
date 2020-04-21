import { execFile } from "child_process";
// @ts-ignore
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import util from "util";
process.on("unhandledRejection", console.error);
// @ts-ignore
const execpro = util.promisify(execFile);
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
const files = ["early-disconnect.js", "fetch1.js", "fetch2.js"].map((p) =>
    path.join(__dirname, p)
);
files.reduce(async (prev, file) => {
    await prev;
    const result = await execpro("node", [file]);
    const { stdout, stderr } = result;
    console.log(file);
    console.log(stdout);
    console.log(stderr);
}, Promise.resolve());
