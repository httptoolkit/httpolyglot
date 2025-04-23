import * as net from 'net';
import * as http from 'http';
import { expect } from 'chai';

import * as httpolyglot from '..';
import { Deferred, getDeferred, streamToBuffer, sendRawRequest } from './test-util';

describe("HTTP", () => {

    let server: httpolyglot.Server;
    let serverReqRes: Deferred<[http.IncomingMessage, http.ServerResponse]>;

    beforeEach(() => {
        serverReqRes = getDeferred();
        server = httpolyglot.createServer((req, res) => serverReqRes.resolve([req, res]));
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