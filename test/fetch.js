import { urls } from "./urls.js";

process.on("unhandledRejection", console.error);
import https from "https";
import fetch1 from "node-fetch";

import fetch2 from "fetch-h2";
import { cert } from "./key-cert.js";
const agent = new https.Agent({
    ca: cert,
});
// @ts-ignore
const fetcharr = [fetch1.default, fetch2.fetch];
Promise.all(
    urls
        .map((url) =>
            fetcharr.map((fetch) => {
                return fetch(url, { redirect: "manual", agent }).then((r) =>
                    Promise.all([r, r.text()])
                );
            })
        )
        .flat(1 / 0)
).then(console.log);
