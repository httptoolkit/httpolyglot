/// <reference types="node" />
import net from "net";
import { RequestListener, ServerOptions, UpgradeListener } from "./declaration.js";
export * from "./declaration.js";
export { createServer };
declare function createServer(config: ServerOptions, requestListener?: RequestListener, upgradeListener?: UpgradeListener): net.Server;
