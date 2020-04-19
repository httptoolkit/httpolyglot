import http from "http";
import net from "net";
import http2 from "http2";
import events from "events";
class Server extends net.Server {
    constructor(config, requestListener) {
        super();
        const serverhttp = http.createServer(config, requestListener);
        const serverhttps = http2.createSecureServer(config, requestListener);
        if (typeof config === "object") {
            events.EventEmitter.prototype.removeAllListeners.call(this, "connection");
            const connectionListener = function (socket) {
                socket.on("error", function onError() { });
                socket.once("data", (data) => {
                    socket.pause();
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
                    socket.resume();
                });
            };
            events.EventEmitter.prototype.on.call(this, "connection", connectionListener);
        }
        else {
            throw new Error("options are required!");
        }
    }
}
function createServer(config, requestListener) {
    return new Server(config, requestListener);
}
export { createServer, Server };
