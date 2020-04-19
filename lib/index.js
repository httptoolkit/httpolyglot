import events from "events";
import http from "http";
import net from "net";
import spdy from "spdy";
function createServer(config, requestListener) {
    if (!(typeof config === "object")) {
        throw new Error("options are required!");
    }
    const serverhttp = http.createServer(config, requestListener);
    const serverspdy = spdy.createServer(config, requestListener);
    const onconnection = serverspdy.listeners("connection");
    events.EventEmitter.prototype.removeAllListeners.call(
        serverspdy,
        "connection"
    );
    const connectionListener = function (socket) {
        let firsthandle = true;
        let ishttp = false;
        let istls = false;
        const streamhttp = new net.Socket();
        const streamtls = new net.Socket();
        streamhttp.on("data", (data) => {
            if (ishttp) {
                socket.write(data);
            }
        });
        streamhttp.on("end", () => {
            if (ishttp) {
                socket.end();
            }
        });
        streamtls.on("data", (data) => {
            if (istls) {
                socket.write(data);
            }
        });
        streamtls.on("end", () => {
            if (istls) {
                socket.end();
            }
        });
        serverhttp.emit("connection", streamhttp);
        onconnection.forEach((listeners) =>
            listeners.call(serverspdy, streamtls)
        );
        socket.on("error", function onError() {});
        socket.on("data", (data) => {
            debugger;
            if (firsthandle) {
                firsthandle = false;
                const firstByte = data[0];
                if (firstByte === 22) {
                    istls = true;
                } else if (32 < firstByte && firstByte < 127) {
                    ishttp = true;
                }
            }
            if (ishttp) {
                streamhttp.write(data);
            }
            if (istls) {
                streamtls.write(data);
            }
            debugger;
        });
    };
    events.EventEmitter.prototype.on.call(
        serverspdy,
        "connection",
        connectionListener
    );
    return serverspdy;
}
export { createServer };
