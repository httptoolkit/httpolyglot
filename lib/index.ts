import events from "events";
import http from "http";
import https from "https";
import net from "net";
import spdy from "spdy";
import { Duplex } from "stream";
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

    const connectionListener = function (socket: net.Socket) {
        let firsthandle = true;
        let ishttp = false;
        let istls = false;
   
        const streamhttp = new Duplex({
            write(
                chunk: any,
                encoding: string,
                callback: (error?: Error | null | undefined) => void
            ) {},
            writev(
                chunks: {
                    chunk: any;
                    encoding: string;
                }[],
                callback: (error?: Error | null | undefined) => void
            ) {},

            final(callback: (error?: Error | null | undefined) => void) {},
            read(size: number) {},
            destroy(
                error: Error | null,
                callback: (error: Error | null) => void
            ) {},
        });
      
        const streamtls = new Duplex({
            write(
                chunk: any,
                encoding: string,
                callback: (error?: Error | null | undefined) => void
            ) {},
            writev(
                chunks: {
                    chunk: any;
                    encoding: string;
                }[],
                callback: (error?: Error | null | undefined) => void
            ) {},

            final(callback: (error?: Error | null | undefined) => void) {},
            read(size: number) {},
            destroy(
                error: Error | null,
                callback: (error: Error | null) => void
            ) {},
        });

        Reflect.set(streamhttp, "write", function (
            chunk: string | Uint8Array,
            encoding: string | undefined,
            callback: ((err?: Error | undefined) => void) | undefined
        ) {
            if (ishttp) {
                console.log("http data write", chunk);
                return socket.write(chunk, encoding, callback);
            } else {
                callback?.();
                return true;
            }
        });
        Reflect.set(streamtls, "write", function (
            chunk: string | Uint8Array,
            encoding: string | undefined,
            callback: ((err?: Error | undefined) => void) | undefined
        ) {
            if (istls) {
                console.log("tls data write", chunk);
                return socket.write(chunk, encoding, callback);
            } else {
                callback?.();
                return true;
            }
        });

        socket.on("error", function onError() {});
        socket.on("data", (data) => {
            if (firsthandle) {
                firsthandle = false;
                const firstByte = data[0];
                if (firstByte === 22) {
                    istls = true;
                } else if (32 < firstByte && firstByte < 127) {
                    ishttp = true;
                }
                if (ishttp) {
                    serverhttp.emit("connection", streamhttp);
                }
                if (istls) {
                    onconnection.forEach((listeners) =>
                        listeners.call(serverspdy, streamtls)
                    );
                }
            }
            if (ishttp) {
                streamhttp.emit("data", data);
                console.log("http data recv", data);
            }
            if (istls) {
                streamtls.emit("data", data);
                console.log("tls data recv", data);
            }
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
