/// <reference types="node" />
import http from "http";
import https from "https";
import net from "net";
declare type ServerOptions = https.ServerOptions;
declare function createServer(
    config: ServerOptions,
    requestListener?: http.RequestListener,
    upgradeListener?: (
        req: http.IncomingMessage,
        socket: net.Socket,
        head: Buffer
    ) => void
): any;
export { createServer };
