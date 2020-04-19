import events from "events";
import http from "http";
import spdy from "spdy";
import { Duplex } from "stream";
function createServer(config, requestListener) {
    if (!(typeof config === "object")) {
        throw new Error("options are required!");
    }
    const serverhttp = http.createServer(config, requestListener);
    const serverspdy = spdy.createServer(config, requestListener);
    const onconnection = serverspdy.listeners("connection");
    events.EventEmitter.prototype.removeAllListeners.call(serverspdy, "connection");
    const connectionListener = function (socket) {
        let firsthandle = true;
        let ishttp = false;
        let istls = false;
        const streamhttp = new Duplex();
        const streamtls = new Duplex();
        Reflect.set(streamhttp, "write", function (chunk, encoding, callback) {
            var _a;
            debugger;
            if (ishttp) {
                return socket.write(chunk, encoding, callback);
            }
            else {
                (_a = callback) === null || _a === void 0 ? void 0 : _a();
                return true;
            }
        });
        Reflect.set(streamtls, "write", function (chunk, encoding, callback) {
            var _a;
            debugger;
            if (istls) {
                return socket.write(chunk, encoding, callback);
            }
            else {
                (_a = callback) === null || _a === void 0 ? void 0 : _a();
                return true;
            }
        });
        socket.on("error", function onError() { });
        socket.on("data", (data) => {
            debugger;
            if (firsthandle) {
                firsthandle = false;
                const firstByte = data[0];
                if (firstByte === 22) {
                    istls = true;
                }
                else if (32 < firstByte && firstByte < 127) {
                    ishttp = true;
                }
                if (ishttp) {
                    serverhttp.emit("connection", streamhttp);
                }
                if (istls) {
                    onconnection.forEach((listeners) => listeners.call(serverspdy, streamtls));
                }
            }
            if (ishttp) {
                streamhttp.emit("data", data);
            }
            if (istls) {
                streamtls.emit("data", data);
            }
        });
    };
    events.EventEmitter.prototype.on.call(serverspdy, "connection", connectionListener);
    return serverspdy;
}
export { createServer };
