import http from "http";
import net from "net";
import spdy from "spdy";
import events from "events";
import https from "https";
import { inherits } from "util";
class Server extends net.Server {
    constructor(config, requestListener) {
        super();
        const serverhttp = http.createServer(config, requestListener);
        const serverhttps = spdy.createServer(config, requestListener);
        if (typeof config === "object") {
            events.EventEmitter.prototype.removeAllListeners.call(this, "connection");
            const connectionListener = function (socket) {
                socket.on("error", function onError() { });
                socket.once("data", (data) => {
                    const firstByte = data[0];
                    socket.unshift(data);
                    if (firstByte === 22) {
                        serverhttps.emit("connection", socket);
                    }
                    else if (32 < firstByte && firstByte < 127) {
                        serverhttp.emit("connection", socket);
                    }
                    else {
                        socket.end();
                        return;
                    }
                });
            };
            events.EventEmitter.prototype.on.call(this, "connection", connectionListener);
        }
        else {
            throw new Error("options are required!");
        }
    }
}
inherits(Server, https.Server);
function createServer(config, requestListener) {
    return new Server(config, requestListener);
}
export { createServer, Server };
