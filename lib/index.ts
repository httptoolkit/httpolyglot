import assert from "assert";
import http from "http";
import net from "net";
import spdy from "spdy";
import tls from "tls";
import {
    RequestListener,
    requestNotFound,
    ServerOptions,
    UpgradeListener,
    upgradeNotFound,
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
    servernet.addListener("error", () => {});
    serverhttp.addListener("ClientError", (err: Error, socket: net.Socket) => {
        socket.destroy();
    });
    serverhttp.addListener("error", () => {});
    serverspdy.addListener(
        "tlsClientError",
        (err: Error, socket: tls.TLSSocket) => {
            socket.destroy();
        }
    );
    serverspdy.addListener("error", () => {});
    serverspdy.prependListener("secureConnection", (socket: tls.TLSSocket) => {
        if (!socket.listeners("error").length) {
            socket.on("error", () => {});
        }
    });
    serverhttp.addListener("upgrade", upgradeListener);
    serverspdy.addListener("upgrade", upgradeListener);
    serverhttp.addListener("request", requestListener);
    serverspdy.addListener("request", requestListener);
    /* 修复bug
    程序没有监听套接字上的error事件,然后程序崩溃了
net.Socket
tls.TLSSocket
自动监听error事件,防止服务器意外退出
*/
    function handletls(socket: net.Socket) {
        serverspdy.emit("connection", socket);
    }
    function handlehttp(socket: net.Socket) {
        serverhttp.emit("connection", socket);
    }
    // serverspdy.addListener("connection", connectionListener);
    servernet.addListener("connection", connectionListener);
    function connectionListener(socket: net.Socket) {
        assert(Reflect.get(socket, "allowHalfOpen") === false);
        /* 类型“Socket”上不存在属性“allowHalfOpen” */
        // socket.allowHalfOpen = false;
        //如果没有error监听器就添加error 监听器
        if (!socket.listeners("error").length) {
            socket.on("error", () => {});
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
        }
        /* 测试发现不能使用on data事件,会收不到响应,多次数据会漏掉 */
    }

    return servernet;
}
