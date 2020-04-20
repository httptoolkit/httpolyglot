import { urls } from "./urls.js";

process.on("unhandledRejection", console.error);

import fetch1 from "node-fetch";

import fetch2 from "fetch-h2";

// @ts-ignore
const fetcharr = [fetch1.default, fetch2.fetch];
Promise.all(
    urls
        .map((url) =>
            fetcharr.map((fetch) => {
                return fetch(url, { redirect: "manual" }).then((r) =>
                    Promise.all([r, r.text()])
                );
            })
        )
        .flat(1 / 0)
).then(console.log);
