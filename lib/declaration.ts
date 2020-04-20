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
export type Socket = Partial<tls.TLSSocket> & net.Socket;
export type RequestListener = (req: ServerRequest, res: ServerResponse) => void;
export type UpgradeListener = (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) => void;
export type ServerOptions = spdy.ServerOptions & {
    allowHalfOpen?: boolean | undefined;
    pauseOnConnect?: boolean | undefined;
} & http.ServerOptions &
    tls.TlsOptions &
    https.ServerOptions;
export const requestNotFound = function (
    req: ServerRequest,
    res: ServerResponse
) {
    res.statusCode = 404;
    res.setHeader("content-type", "text/html");
    res.write("404");
    res.end();
};
export const upgradeNotFound = function (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) {
    socket.write(`HTTP/1.1 404 Not Found\r\nConnection: keep-alive\r\n\r\n`);
    socket.destroy();
};
