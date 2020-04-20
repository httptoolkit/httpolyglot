/// <reference types="node" />
import http from "http";
import https from "https";
import net from "net";
import spdy from "spdy";
import tls from "tls";
import stream from "stream";
export interface ServerRequest extends http.IncomingMessage {
    socket: Socket;
}
interface PushOptions {
    status?: number;
    method?: string;
    request?: http.OutgoingHttpHeaders;
    response?: http.OutgoingHttpHeaders;
}
export interface ServerResponse extends http.ServerResponse {
    socket: Socket;
    push?: (pathname: string, options: PushOptions) => stream.Writable;
}
export declare type Socket = Partial<tls.TLSSocket> & net.Socket;
export declare type RequestListener = (
    req: ServerRequest,
    res: ServerResponse
) => void;
export declare type UpgradeListener = (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) => void;
export declare type ServerOptions = spdy.ServerOptions;
declare function createServer(
    config: ServerOptions,
    requestListener?: RequestListener,
    upgradeListener?: UpgradeListener
): https.Server;
export { createServer };
