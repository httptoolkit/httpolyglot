import events from "events";
import http from "http";
import spdy from "spdy";
function createServer(config, requestListener) {
    if (!(typeof config === "object")) {
        throw new Error("options are required!");
    }
    const serverhttp = http.createServer(config, requestListener);
    const serverspdy = spdy.createServer(config, requestListener);
    const onconnection = serverspdy.listeners("connection");
    events.EventEmitter.prototype.removeAllListeners.call(serverspdy, "connection");
    const connectionListener = function (socket) {
        socket.on("error", function onError() { });
        socket.once("data", (data) => {
            socket.pause();
            const firstByte = data[0];
            socket.unshift(data);
            if (firstByte === 22) {
                onconnection.forEach((listener) => {
                    listener.call(serverspdy, socket);
                });
            }
            else if (32 < firstByte && firstByte < 127) {
                serverhttp.emit("connection", socket);
            }
            socket.resume();
        });
    };
    events.EventEmitter.prototype.on.call(serverspdy, "connection", connectionListener);
    return serverspdy;
}
export { createServer };
