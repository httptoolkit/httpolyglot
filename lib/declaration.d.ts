/// <reference types="node" />
import http from "http";
import net from "net";
import spdy from "spdy";
import tls from "tls";
import stream from "stream";
import https from "https";
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
    push?: (pathname: string, options?: PushOptions) => stream.Writable;
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
export declare type ServerOptions = spdy.ServerOptions & {
    allowHalfOpen?: boolean | undefined;
    pauseOnConnect?: boolean | undefined;
} & http.ServerOptions &
    tls.TlsOptions &
    https.ServerOptions;
export declare const notfoundrequestlistener: (
    req: ServerRequest,
    res: ServerResponse
) => void;
export declare const notfoundupgradelistener: (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) => void;
export {};
