import http from "http";
import net from "net";
import spdy from "spdy";
import {
    requestNotFound,
    upgradeNotFound,
    RequestListener,
    ServerOptions,
    UpgradeListener,
} from "./declaration.js";
export * from "./declaration.js";
export { createServer };
function createServer(
    config: ServerOptions,
    requestListener: RequestListener = requestNotFound,
    upgradeListener: UpgradeListener = upgradeNotFound
): net.Server {
    if (!(config && typeof config === "object")) {
        throw new Error("options are required!");
    }
    requestListener = requestListener || requestNotFound;
    upgradeListener = upgradeListener || upgradeNotFound;

    const servernet = net.createServer(config);
    const serverhttp = http.createServer(config);
    //@ts-ignore
    const serverspdy = spdy.createServer(config);
    serverhttp.addListener("upgrade", upgradeListener);
    serverspdy.addListener("upgrade", upgradeListener);
    serverhttp.addListener("request", requestListener);
    serverspdy.addListener("request", requestListener);
    // serverhttp.addListener(
    //     "upgrade",
    //     (request: ServerRequest, socket: Socket, head: Buffer) => {
    //         serverspdy.emit("upgrade", request, socket, head);
    //     }
    // );
    // serverhttp.removeAllListeners("request");
    // serverspdy.removeAllListeners("request");
    // serverspdy.addListener("request", requestListener);
    // serverhttp.addListener("request", (req, res) => {
    //     serverspdy.emit("request", req, res);
    // });

    // serverspdy.addListener("upgrade", upgradeListener);
    // const onconnection = serverspdy.listeners("connection");
    // serverspdy.removeAllListeners("connection");
    function handletls(socket: net.Socket) {
        serverspdy.emit("connection", socket);
        // onconnection.forEach((listeners: Function) =>
        //     Reflect.apply(listeners, serverspdy, [socket])
        // );
    }
    function handlehttp(socket: net.Socket) {
        serverhttp.emit("connection", socket);
    }
    // serverspdy.addListener("connection", connectionListener);
    servernet.addListener("connection", connectionListener);
    function connectionListener(socket: net.Socket) {
        /* 类型“Socket”上不存在属性“allowHalfOpen” */
        // socket.allowHalfOpen = false;
        //如果没有error监听器就添加error 监听器
        if (!socket.listeners("error").length) {
            socket.on("error", function () {});
        }
        //   let ishttp = false;
        //     let istls = false;

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
                //默认已经是false了
                //// TLS sockets don't allow half open
                //    socket.allowHalfOpen = false;
                handletls(socket);
                //      istls = true;
            } else if (32 < firstByte && firstByte < 127) {
                //   ishttp = true;

                handlehttp(socket);
            } else {
                socket.destroy();
            }
            //   if (ishttp) {

            //    }
            //      if (istls) {

            //        }
        }
        /* 测试发现不能使用on data事件,会收不到响应,多次数据会漏掉 */
    }

    return servernet;
}
