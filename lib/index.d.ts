/// <reference types="node" />
import http from "http";
import https from "https";
import net from "net";
import tls from "tls";
export interface ServerRequest extends http.IncomingMessage {
    socket: Socket;
}
export interface ServerResponse extends http.ServerResponse {
    socket: Socket;
}
export declare type Socket = tls.TLSSocket | net.Socket;
export declare type RequestListener = (req: ServerRequest, res: ServerResponse) => void;
export declare type UpgradeListener = (req: ServerRequest, socket: Socket, head: Buffer) => void;
export declare type ServerOptions = https.ServerOptions;
declare function createServer(config: ServerOptions, requestListener?: RequestListener, upgradeListener?: UpgradeListener): https.Server;
export { createServer };
