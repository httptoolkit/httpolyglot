import events from "events";
import http from "http";
import https from "https";
import net from "net";
import spdy from "spdy";
const eventproto = events.EventEmitter.prototype;
type ServerOptions = https.ServerOptions;

function createServer(
    config: ServerOptions,
    requestListener: http.RequestListener
) {
    if (!(typeof config === "object")) {
        throw new Error("options are required!");
    }
    const serverhttp = http.createServer(config, requestListener);
    const serverspdy = spdy.createServer(config, requestListener);
    eventproto.removeAllListeners.call(serverhttp, "request");
    eventproto.removeAllListeners.call(serverspdy, "request");
    const onconnection = serverspdy.listeners("connection");
    eventproto.removeAllListeners.call(serverspdy, "connection");
    function handletls(socket: net.Socket) {
        onconnection.forEach((listeners) => listeners.call(serverspdy, socket));
    }
    function handlehttp(socket: net.Socket) {
        serverhttp.emit("connection", socket);
    }
    const connectionListener = function (socket: net.Socket) {
        socket.on("error", function onError() {});

        let ishttp = false;
        let istls = false;

        const data = socket.read(1);
        /* https://github.com/httptoolkit/httpolyglot/blob/master/lib/index.js */
        if (data === null) {
            socket.once("readable", () => {
                connectionListener(socket);
            });
        } else {
            const firstByte = data[0];
            socket.unshift(data);
            if (firstByte === 22) {
                istls = true;
            } else if (32 < firstByte && firstByte < 127) {
                ishttp = true;
            } else {
                socket.destroy();
            }
            if (ishttp) {
                handlehttp(socket);
            }
            if (istls) {
                handletls(socket);
            }
        }
        /* 测试发现不能使用on data事件,会收不到响应 */
    };
    eventproto.addListener.call(serverspdy, "connection", connectionListener);

    return serverspdy;
}
export { createServer };
