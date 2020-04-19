/// <reference types="node" />
import http from "http";
import https from "https";
declare type ServerOptions = https.ServerOptions;
declare function createServer(config: ServerOptions, requestListener: http.RequestListener): https.Server;
export { createServer };
