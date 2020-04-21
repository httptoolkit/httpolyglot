import assert from "assert";
import http from "http";
import net from "net";
import spdy from "spdy";
import { requestNotFound, upgradeNotFound } from "./declaration.js";
export * from "./declaration.js";
export { createServer };
function createServer(
    config,
    requestListener = requestNotFound,
    upgradeListener = upgradeNotFound
) {
    if (!(config && typeof config === "object")) {
        throw new Error("options are required!");
    }
    requestListener = requestListener || requestNotFound;
    upgradeListener = upgradeListener || upgradeNotFound;
    const servernet = net.createServer(config);
    const serverhttp = http.createServer(config);
    const serverspdy = spdy.createServer(config);
    servernet.addListener("error", () => {});
    serverhttp.addListener("ClientError", (err, socket) => {
        socket.destroy();
    });
    serverhttp.addListener("error", () => {});
    serverspdy.addListener("tlsClientError", (err, socket) => {
        socket.destroy();
    });
    serverspdy.addListener("error", () => {});
    serverspdy.prependListener("secureConnection", (socket) => {
        if (!socket.listeners("error").length) {
            socket.on("error", () => {});
        }
    });
    serverhttp.addListener("upgrade", upgradeListener);
    serverspdy.addListener("upgrade", upgradeListener);
    serverhttp.addListener("request", requestListener);
    serverspdy.addListener("request", requestListener);
    function handletls(socket) {
        serverspdy.emit("connection", socket);
    }
    function handlehttp(socket) {
        serverhttp.emit("connection", socket);
    }
    servernet.addListener("connection", connectionListener);
    function connectionListener(socket) {
        assert(Reflect.get(socket, "allowHalfOpen") === false);
        if (!socket.listeners("error").length) {
            socket.on("error", () => {});
        }
        const data = socket.read(1);
        if (data === null) {
            socket.once("readable", () => {
                connectionListener(socket);
            });
        } else {
            const firstByte = data[0];
            socket.unshift(data);
            if (firstByte === 22) {
                handletls(socket);
            } else if (32 < firstByte && firstByte < 127) {
                handlehttp(socket);
            } else {
                socket.destroy();
            }
        }
    }
    return servernet;
}
