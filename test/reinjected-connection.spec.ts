import * as net from 'net';
import * as http from 'http';
import { expect } from 'chai';

import * as httpolyglot from '..';
import { Deferred, getDeferred } from './test-util';

describe("A re-injected connection", () => {

    let server: httpolyglot.Server;
    let tunnelServer: net.Server;
    let serverReqRes: Deferred<[http.IncomingMessage, http.ServerResponse]>;

    beforeEach(async () => {
        serverReqRes = getDeferred();
        server = httpolyglot.createServer((req, res) => serverReqRes.resolve([req, res]));
        server.listen();

        // Stands in for a proxy's CONNECT handler: it takes the raw socket itself, and
        // then hands it back to the polyglot server to be sniffed and routed as usual.
        tunnelServer = net.createServer((socket) => server.emit('connection', socket));
        await new Promise<void>((resolve) => { tunnelServer.listen(() => resolve()); });
    });

    afterEach(() => {
        server.close();
        tunnelServer.close();
    });

    it("should be sniffed and routed like any other connection", async () => {
        const client = new net.Socket();
        await new Promise<void>((resolve) => {
            client.connect((tunnelServer.address() as net.AddressInfo).port, '127.0.0.1', () => resolve());
        });
        client.write('GET /re-injected HTTP/1.1\r\nHost: localhost\r\n\r\n');

        const [req, res] = await serverReqRes;
        expect(req.url).to.equal('/re-injected');

        res.writeHead(200);
        res.end();
        client.destroy();
    });
});
