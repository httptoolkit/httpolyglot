import https from "https";
import fetch1 from "node-fetch";
import { cert } from "./key-cert.js";
import { urls } from "./urls.js";
import { logjson } from "./logjson.js";
import { formatresponse } from "./format-response.js";

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
    Promise.allSettled(
        urls
            .map((url) => {
                return fetch(url, { timeout: 2000, redirect: "manual" }).then(
                    (r) => {
                        return formatresponse(r);
                    }
                );
            })

            .flat(1 / 0)
    ).then(logjson);
    // @ts-ignore
})(fetch);
