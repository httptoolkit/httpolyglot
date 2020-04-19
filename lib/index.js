import http from "http";
import spdy from "spdy";
const notfoundrequestlistener = function (req, res) {
    res.statusCode = 404;
    res.write(404);
    res.end();
};
const notfoundupgradelistener = function (req, socket, head) {
    socket.write(`HTTP/1.1 404 Not Found\r\nConnection: keep-alive\r\n\r\n`);
    socket.destroy();
};
function createServer(config, requestListener = notfoundrequestlistener, upgradeListener = notfoundupgradelistener) {
    if (!(typeof config === "object")) {
        throw new Error("options are required!");
    }
    const serverhttp = http.createServer(config);
    const serverspdy = spdy.createServer(config);
    serverhttp.removeAllListeners("request");
    serverspdy.removeAllListeners("request");
    serverspdy.addListener("request", requestListener);
    serverhttp.addListener("request", (req, res) => {
        serverspdy.emit("request", req, res);
    });
    serverhttp.addListener("upgrade", (req, socket, head) => {
        serverspdy.emit("upgrade", req, socket, head);
    });
    serverspdy.addListener("upgrade", upgradeListener);
    const onconnection = serverspdy.listeners("connection");
    serverspdy.removeAllListeners("connection");
    function handletls(socket) {
        onconnection.forEach((listeners) => Reflect.apply(listeners, serverspdy, [socket]));
    }
    function handlehttp(socket) {
        serverhttp.emit("connection", socket);
    }
    serverspdy.addListener("connection", connectionListener);
    function connectionListener(socket) {
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
    }
    return serverspdy;
}
export { createServer };
