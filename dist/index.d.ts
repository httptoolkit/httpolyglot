/// <reference types="node" />
import http from "http";
import https from "https";
import net from "net";
import spdy from "spdy";
import stream from "stream";
import tls from "tls";

export declare function createServer(
    config: ServerOptions,
    requestListener?: RequestListener,
    upgradeListener?: UpgradeListener
): net.Server;

export declare interface PushOptions {
    status?: number;
    method?: string;
    request?: http.OutgoingHttpHeaders;
    response?: http.OutgoingHttpHeaders;
}

export declare type RequestListener = (
    req: ServerRequest,
    res: ServerResponse
) => void;

export declare const requestNotFound: (
    req: ServerRequest,
    res: ServerResponse
) => void;

export declare type ServerOptions = spdy.ServerOptions & {
    allowHalfOpen?: boolean | undefined;
    pauseOnConnect?: boolean | undefined;
} & http.ServerOptions &
    tls.TlsOptions &
    https.ServerOptions;

export declare interface ServerRequest extends http.IncomingMessage {
    socket: Socket;
}

export declare interface ServerResponse extends http.ServerResponse {
    socket: Socket;
    push?: (pathname: string, options?: PushOptions) => stream.Writable;
}

export declare type Socket = Partial<tls.TLSSocket> & net.Socket;

export declare type UpgradeListener = (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) => void;

export declare const upgradeNotFound: (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) => void;

export {};
