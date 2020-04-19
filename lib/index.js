import events from "events";
import http from "http";
import spdy from "spdy";
import stream from "stream";
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
        const streamhttp = new stream.Duplex();
        const streamtls = new stream.Duplex();
        streamhttp.on("data", (data) => {
            debugger;
            if (ishttp) {
                socket.write(data);
            }
        });
        streamtls.on("data", (data) => {
            debugger;
            if (istls) {
                socket.write(data);
            }
        });
        serverhttp.emit("connection", streamhttp);
        onconnection.forEach((listeners) =>
            listeners.call(serverspdy, streamtls)
        );
        socket.on("error", function onError() {});
        socket.on("data", (data) => {
            if (firsthandle) {
                debugger;
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
