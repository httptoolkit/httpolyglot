import events from "events";
import http from "http";
import https from "https";
import net from "net";
import spdy from "spdy";
// import { Duplex } from "stream";
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

    const onconnection = serverspdy.listeners("connection");
    events.EventEmitter.prototype.removeAllListeners.call(
        serverspdy,
        "connection"
    );
    function handletls(socket: net.Socket) {
        onconnection.forEach((listeners) => listeners.call(serverspdy, socket));
    }
    function handlehttp(socket: net.Socket) {
        serverhttp.emit("connection", socket);
    }
    const connectionListener = function (socket: net.Socket) {
        socket.on("error", function onError() {});
        // let firsthandle = true;
        let ishttp = false;
        let istls = false;

        // const streamhttp = new Duplex({
        //     write(
        //         chunk: any,
        //         encoding: string,
        //         callback: (error?: Error | null | undefined) => void
        //     ) {},
        //     writev(
        //         chunks: {
        //             chunk: any;
        //             encoding: string;
        //         }[],
        //         callback: (error?: Error | null | undefined) => void
        //     ) {},

        //     final(callback: (error?: Error | null | undefined) => void) {},
        //     read(size: number) {},
        //     destroy(
        //         error: Error | null,
        //         callback: (error: Error | null) => void
        //     ) {},
        // });

        // const streamtls = new Duplex({
        //     write(
        //         chunk: any,
        //         encoding: string,
        //         callback: (error?: Error | null | undefined) => void
        //     ) {},
        //     writev(
        //         chunks: {
        //             chunk: any;
        //             encoding: string;
        //         }[],
        //         callback: (error?: Error | null | undefined) => void
        //     ) {},

        //     final(callback: (error?: Error | null | undefined) => void) {},
        //     read(size: number) {},
        //     destroy(
        //         error: Error | null,
        //         callback: (error: Error | null) => void
        //     ) {},
        // });

        // Reflect.set(streamhttp, "write", function (
        //     chunk: string | Uint8Array,
        //     encoding: string | undefined,
        //     callback: ((err?: Error | undefined) => void) | undefined
        // ) {
        //     if (ishttp) {
        //         console.log("http data write", chunk);
        //         return socket.write(chunk, encoding, callback);
        //     } else {
        //         callback?.();
        //         return true;
        //     }
        // });
        // Reflect.set(streamtls, "write", function (
        //     chunk: string | Uint8Array,
        //     encoding: string | undefined,
        //     callback: ((err?: Error | undefined) => void) | undefined
        // ) {
        //     if (istls) {
        //         console.log("tls data write", chunk);
        //         return socket.write(chunk, encoding, callback);
        //     } else {
        //         callback?.();
        //         return true;
        //     }
        // });
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
            }
            if (ishttp) {
                handlehttp(socket);
            }
            if (istls) {
                handletls(socket);
            }
        }
        /* 测试发现不能使用on data事件,会收不到响应 */
        // socket.once("data", (data) => {
        //     if (firsthandle) {
        //         firsthandle = false;
        //         // const firstByte = data[0];
        //         // socket.unshift(data);
        //         // if (firstByte === 22) {
        //         //     istls = true;
        //         // } else if (32 < firstByte && firstByte < 127) {
        //         //     ishttp = true;
        //         // }
        //         // if (ishttp) {
        //         //     serverhttp.emit("connection", socket);
        //         // }
        //         // if (istls) {
        //         //     onconnection.forEach((listeners) =>
        //         //         listeners.call(serverspdy, socket)
        //         //     );
        //         // }
        //     }
        //     // if (ishttp) {
        //     //     streamhttp.emit("data", data);
        //     //     console.log("http data recv", data);
        //     // }
        //     // if (istls) {
        //     //     streamtls.emit("data", data);
        //     //     console.log("tls data recv", data);
        //     // }
        // });
    };
    events.EventEmitter.prototype.on.call(
        serverspdy,
        "connection",
        connectionListener
    );

    return serverspdy;
}
export { createServer };
