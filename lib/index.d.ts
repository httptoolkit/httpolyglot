/// <reference types="node" />
import http from "http";
import https from "https";
import net from "net";
export declare type RequestListener = http.RequestListener;
export declare type UpgradeListener = (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => void;
export declare type ServerOptions = https.ServerOptions;
declare function createServer(config: ServerOptions, requestListener?: RequestListener, upgradeListener?: UpgradeListener): https.Server;
export { createServer };
