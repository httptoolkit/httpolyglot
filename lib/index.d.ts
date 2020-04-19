/// <reference types="node" />
import http from "http";
import net from "net";
import https from "https";
declare type ServerOptions = http.ServerOptions & https.ServerOptions;
declare class Server extends net.Server {
    constructor(config: ServerOptions, requestListener: http.RequestListener);
}
declare function createServer(config: ServerOptions, requestListener: http.RequestListener): Server;
export { createServer, Server };
