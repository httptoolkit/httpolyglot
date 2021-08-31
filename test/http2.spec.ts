import * as net from 'net';
import * as http from 'http';
import * as http2 from 'http2';
import { expect } from 'chai';

import { Server } from '..';
import { testKey, testCert, Deferred, getDeferred, streamToBuffer } from './test-util';


describe("HTTP/2", () => {

    let server: Server;
    let serverReqRes: Deferred<[http.IncomingMessage, http.ServerResponse]>;

    beforeEach(() => {
        serverReqRes = getDeferred();
        server = new Server({
            key: testKey,
            cert: testCert,
            ALPNProtocols: ['h2', 'http/1.1']
        }, (req, res) =>
            serverReqRes.resolve([req, res])
        );
        server.listen();
    });

    afterEach(() => {
        server.close();
    });

    it("should be accepted over HTTP", async () => {
        const clientSession = http2.connect(
            `http://localhost:${(server.address() as net.AddressInfo).port}`
        );

        const clientRequest = clientSession.request({
            ':method': 'POST',
            ':path': '/path'
        });
        clientRequest.end('request body');

        const [serverReq, serverRes] = await serverReqRes;

        expect(serverReq.method).to.equal('POST');
        expect(serverReq.url).to.equal('/path');

        const reqBody = await streamToBuffer(serverReq);
        expect(reqBody.toString()).to.equal('request body');

        serverRes.writeHead(200);
        serverRes.end('response body');

        const clientResponse = await new Promise<http2.IncomingHttpStatusHeader>((resolve, reject) => {
            clientRequest.on('response', resolve);
            clientRequest.on('error', reject);
        });

        expect(clientResponse[':status']).to.equal(200);
        const resBody = await streamToBuffer(clientRequest);
        expect(resBody.toString()).to.equal('response body');

        clientSession.close();
    });

    it("should be accepted over HTTPS", async () => {
        const clientSession = http2.connect(
            `https://localhost:${(server.address() as net.AddressInfo).port}`,
            { ca: testCert }
        );

        const clientRequest = clientSession.request({
            ':method': 'POST',
            ':path': '/path'
        });
        clientRequest.end('request body');

        const [serverReq, serverRes] = await serverReqRes;

        expect(serverReq.method).to.equal('POST');
        expect(serverReq.url).to.equal('/path');

        const reqBody = await streamToBuffer(serverReq);
        expect(reqBody.toString()).to.equal('request body');

        serverRes.writeHead(200);
        serverRes.end('response body');

        const clientResponse = await new Promise<http2.IncomingHttpStatusHeader>((resolve, reject) => {
            clientRequest.on('response', resolve);
            clientRequest.on('error', reject);
        });

        expect(clientResponse[':status']).to.equal(200);
        const resBody = await streamToBuffer(clientRequest);
        expect(resBody.toString()).to.equal('response body');

        clientSession.close();
    });

});