import * as net from 'net';
import * as tls from 'tls';
import * as http from 'http';
import * as https from 'https';
import { expect } from 'chai';

import { Server } from '..';
import { testKey, testCert, Deferred, getDeferred, streamToBuffer } from './test-util';

describe("HTTPS", () => {

    let server: Server;
    let serverReqRes: Deferred<[http.IncomingMessage, http.ServerResponse]>;

    beforeEach(() => {
        serverReqRes = getDeferred();
        server = new Server({ key: testKey, cert: testCert }, (req, res) =>
            serverReqRes.resolve([req, res])
        );
        server.listen();
    });

    afterEach(() => {
        server.close();
    });

    it("should be accepted", async () => {
        const clientRequest = https.request({
            host: 'localhost',
            port: (server.address() as net.AddressInfo).port,
            method: 'POST',
            path: '/path',
            ca: testCert
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

    it("should handle immediate TCP closure", async () => {
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

    it("should handle immediate TLS closure", async () => {
        const socket = tls.connect({
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