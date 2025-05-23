import * as net from 'net';
import { expect } from 'chai';

import * as httpolyglot from '..';
import { sendRawRequest } from './test-util';

describe("Unknown protocols", () => {

    let server: httpolyglot.Server;

    afterEach(() => {
        server.close();
    });

    it("should be passed to the unknownProtocol handler, if provided", async () => {
        const unknownProtocolHandler = net.createServer((socket) => {
            socket.end('Custom unknown protocol response');
        });

        server = httpolyglot.createServer({
            unknownProtocol: unknownProtocolHandler
        }, () => {
            throw new Error('HTTP handler should never be called');
        });
        server.listen(0);

        const response = await sendRawRequest(server, 'UNKNOWN PROTOCOL REQUEST');
        expect(response).to.equal('Custom unknown protocol response');
    });

    it("should be passed to the HTTP client-error handler for rejection by default", async () => {
        server = httpolyglot.createServer(() => {
            throw new Error('HTTP handler should never be called');
        });
        server.listen(0);

        const response = await sendRawRequest(server, 'UNKNOWN PROTOCOL REQUEST');
        expect(response).to.include('HTTP/1.1 400 Bad Request');
    });

    it("should be passed to the HTTP handler for HTTP-like requests, if close enough", async () => {
        const unknownProtocolHandler = net.createServer((socket) => {
            socket.end('Custom unknown protocol response');
        });

        server = httpolyglot.createServer({
            unknownProtocol: unknownProtocolHandler
        }, () => {
            throw new Error('HTTP handler should never be called');
        });
        server.listen(0);

        const response = await sendRawRequest(server, 'PUT PUT PUT');
        expect(response).to.include('HTTP/1.1 400 Bad Request');
    });

});