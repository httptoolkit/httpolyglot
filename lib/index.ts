import http from "http";
import https from "https";
import net from "net";
import spdy from "spdy";

type ServerOptions = https.ServerOptions;

function createServer(
    config: ServerOptions,
    requestListener: http.RequestListener
) {
    if (!(typeof config === "object")) {
        throw new Error("options are required!");
    }
    function onrequest(req: http.IncomingMessage, res: http.ServerResponse) {
        
        requestListener(req, res);
    }
    const serverhttp = http.createServer(config, requestListener);
    const serverspdy = spdy.createServer(config, requestListener);
    serverhttp.removeAllListeners("request");
    serverspdy.removeAllListeners("request");
    serverspdy.addListener("request", onrequest);
    serverhttp.addListener("request", (req, res) => {
        serverspdy.emit("request", req, res);
    });
    serverhttp.addListener(
        "upgrade",
        (response: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
            serverspdy.emit("upgrade", response, socket, head);
        }
    );
    const onconnection = serverspdy.listeners("connection");
    serverspdy.removeAllListeners("connection");
    function handletls(socket: net.Socket) {
        onconnection.forEach((listeners) => listeners.call(serverspdy, socket));
    }
    function handlehttp(socket: net.Socket) {
        serverhttp.emit("connection", socket);
    }
    serverspdy.addListener("connection", connectionListener);

    function connectionListener(socket: net.Socket) {
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
    }

    return serverspdy;
}
export { createServer };
