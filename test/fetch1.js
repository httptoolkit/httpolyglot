import https from "https";
import fetch1 from "node-fetch";
import { cert } from "./key-cert.js";
import { urls } from "./urls.js";

process.on("unhandledRejection", console.error);

const fetch =
    /**
     * @param {string} url
     * @param {Object} opt
     */
    function (url, opt) {
        const agent = new https.Agent({
            ca: cert,
        });
        // @ts-ignore
        return fetch1.default(url, {
            agent: url.startsWith("http:") ? undefined : agent,
            ...opt,
        });
    };

// @ts-ignore

~((fetch) => {
    Promise.all(
        urls
            .map((url) => {
                return fetch(url, {
                    redirect: "manual",
                }).then((r) => Promise.all([r, r.text()]));
            })
            .flat(1 / 0)
    ).then(console.log);
    // @ts-ignore
})(fetch);
