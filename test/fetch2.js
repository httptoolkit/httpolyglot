import fetch2 from "fetch-h2";
import { cert } from "./key-cert.js";
import { urls } from "./urls.js";
import { formatresponse } from "./format-response.js";
import { logjson } from "./logjson.js";

process.on("unhandledRejection", console.error);

const fetch = fetch2.context({ session: { ca: cert } }).fetch;

// @ts-ignore

~((fetch) => {
    Promise.allSettled(
        /**
         * @param {string | fetch2.Request} url
         */
        urls
            .map((url) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => reject(new Error("timeout")), 2000);

                    resolve(
                        fetch(url, { timeout: 2000, redirect: "manual" }).then(
                            (r) => {
                                return formatresponse(r);
                            }
                        )
                    );
                });
            })
            .flat(1 / 0)
    ).then(logjson);
    // @ts-ignore
})(fetch);
