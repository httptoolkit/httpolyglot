import * as net from 'net';
import * as http from 'http';
import * as http2 from 'http2';
import { expect } from 'chai';

import { Server } from '..';
import { testKey, testCert, Deferred, getDeferred, streamToBuffer, sendRawRequest } from './test-util';


describe("HTTP/2", () => {

    let server: Server;
    let serverReqRes: Deferred<[http.IncomingMessage, http.ServerResponse]>;

    beforeEach(() => {
        serverReqRes = getDeferred();
        server = new Server({
            tls: {
                key: testKey,
                cert: testCert,
                ALPNProtocols: ['h2', 'http/1.1']
            }
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

    it("should report client errors with full packet data", async () => {
        serverReqRes.then(() => {
            throw new Error("Request handler should not be called");
        });

        const serverErrorPromise = new Promise<[any, net.Socket]>((resolve) => {
            // Multiple errors will be fired - we want to check the data from the final
            // error (which will contain the whole packet)
            let lastResult: any;

            server.on('clientError', (err: any, socket: net.Socket) => {
                socket.destroy();

                lastResult = [err, socket];
                setImmediate(() => resolve(lastResult));
            });
        });

        sendRawRequest(server, 'QQQ http://example.com HTTP/1.1\r\n\r\n');

        let [serverError, failedSocket] = await serverErrorPromise;

        expect(serverError.message).to.include('Invalid method');

        const combinedPacket = Buffer.concat([
            failedSocket.__httpPeekedData,
            serverError.rawPacket
        ].filter(Boolean));

        expect(combinedPacket.toString('utf8')).to.equal(
            'QQQ http://example.com HTTP/1.1\r\n\r\n'
        );
    });

});