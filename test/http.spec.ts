import * as net from 'net';
import * as http from 'http';
import { expect } from 'chai';

import { Server } from '..';
import { Deferred, getDeferred, streamToBuffer } from './test-util';

describe("HTTP", () => {

    let server: Server;
    let serverReqRes: Deferred<[http.IncomingMessage, http.ServerResponse]>;

    beforeEach(() => {
        serverReqRes = getDeferred();
        server = new Server((req, res) => serverReqRes.resolve([req, res]));
        server.listen();
    });

    afterEach(() => {
        server.close();
    });

    it("should be accepted", async () => {
        const clientRequest = http.request({
            host: 'localhost',
            port: (server.address() as net.AddressInfo).port,
            method: 'POST',
            path: '/path',
        });
        clientRequest.end('request body');

        const [serverReq, serverRes] = await serverReqRes;

        expect(serverReq.method).to.equal('POST');
        expect(serverReq.url).to.equal('/path');

        const reqBody = await streamToBuffer(serverReq);
        expect(reqBody.toString()).to.equal('request body');

        serverRes.writeHead(200);
        serverRes.end('response body');

        const clientResponse = await new Promise<http.IncomingMessage>((resolve, reject) => {
            clientRequest.on('response', resolve);
            clientRequest.on('error', reject);
        });

        expect(clientResponse.statusCode).to.equal(200);
        const resBody = await streamToBuffer(clientResponse);
        expect(resBody.toString()).to.equal('response body');
    });

    it("should handle immediate closure", async () => {
        const socket = net.connect({
            host: 'localhost',
            port: (server.address() as net.AddressInfo).port
        });

        serverReqRes.then(() => {
            throw new Error("Request handler should not be called");
        });

        await new Promise((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('error', reject);
        });

        socket.end();
    });

});