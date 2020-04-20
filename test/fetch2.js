import fetch2 from "fetch-h2";
import { cert } from "./key-cert.js";
import { urls } from "./urls.js";

process.on("unhandledRejection", console.error);

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
})(fetch2.context({ session: { ca: cert } }).fetch);
