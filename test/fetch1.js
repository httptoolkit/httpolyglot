import https from "https";
import fetch1 from "node-fetch";
import { cert } from "./key-cert.js";
import { urls } from "./urls.js";

process.on("unhandledRejection", console.error);


// @ts-ignore

~((fetch) => {
    const agent = new https.Agent({
        ca: cert,
    });
    Promise.all(
        urls
            .map((url) => {
                return fetch(url, {
                    redirect: "manual",
                    agent: url.startsWith("http:") ? undefined : agent,
                }).then((r) => Promise.all([r, r.text()]));
            })
            .flat(1 / 0)
    ).then(console.log);
    // @ts-ignore
})(fetch1.default);

