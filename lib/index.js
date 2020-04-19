import events from "events";
import http from "http";
import spdy from "spdy";
const eventproto = events.EventEmitter.prototype;
function createServer(config, requestListener) {
    if (!(typeof config === "object")) {
        throw new Error("options are required!");
    }
    const serverhttp = http.createServer(config, requestListener);
    const serverspdy = spdy.createServer(config, requestListener);
    eventproto.removeAllListeners.call(serverhttp, "request");
    eventproto.removeAllListeners.call(serverspdy, "request");
    const onconnection = serverspdy.listeners("connection");
    eventproto.removeAllListeners.call(serverspdy, "connection");
    function handletls(socket) {
        onconnection.forEach((listeners) => listeners.call(serverspdy, socket));
    }
    function handlehttp(socket) {
        serverhttp.emit("connection", socket);
    }
    const connectionListener = function (socket) {
        socket.on("error", function onError() { });
        let ishttp = false;
        let istls = false;
        const data = socket.read(1);
        if (data === null) {
            socket.once("readable", () => {
                connectionListener(socket);
            });
        }
        else {
            const firstByte = data[0];
            socket.unshift(data);
            if (firstByte === 22) {
                istls = true;
            }
            else if (32 < firstByte && firstByte < 127) {
                ishttp = true;
            }
            else {
                socket.destroy();
            }
            if (ishttp) {
                handlehttp(socket);
            }
            if (istls) {
                handletls(socket);
            }
        }
    };
    eventproto.addListener.call(serverspdy, "connection", connectionListener);
    return serverspdy;
}
export { createServer };
