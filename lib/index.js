import http from "http";
import spdy from "spdy";
function createServer(config, requestListener) {
    if (!(typeof config === "object")) {
        throw new Error("options are required!");
    }
    function onrequest(req, res) {
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
    serverhttp.addListener("upgrade", (response, socket, head) => {
        serverspdy.emit("upgrade", response, socket, head);
    });
    const onconnection = serverspdy.listeners("connection");
    serverspdy.removeAllListeners("connection");
    function handletls(socket) {
        onconnection.forEach((listeners) => listeners.call(serverspdy, socket));
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
