import open from "open";
import { urls } from "./urls.js";

Promise.all(urls.map((url) => open(url))).then((p) => console.log(p));
process.on("unhandledRejection", console.error);
