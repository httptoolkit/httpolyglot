import * as net from 'net';
import * as socks from 'socks';
import * as http from 'http';
import * as streamConsumers from 'stream/consumers';

import { expect } from 'chai';

import * as httpolyglot from '..';

describe("SOCKSv5", () => {

    let server: httpolyglot.Server;

    afterEach(() => {
        server?.close();
    });

    it("should be passed to the handler", async () => {
        const socksHandler = net.createServer();

        server = httpolyglot.createServer({
            socks: socksHandler
        }, () => {
            throw new Error("Should not be called");
        });
        await new Promise<void>(resolve => server.listen(0, resolve));
        const socksPort = (server.address() as net.AddressInfo).port;

        const socksConn = socks.SocksClient.createConnection({
            proxy: {
                host: 'localhost',
                port: socksPort,
                type: 5
            },
            command: 'connect',
            destination: {
                host: 'invalid.example',
                port: 80
            }
        });

        const incomingSockConn = await new Promise<net.Socket>((resolve, reject) => {
            socksConn.catch(reject);
            socksHandler.on('connection', resolve);
        });
        await new Promise<void>(resolve => incomingSockConn.once('readable', resolve));

        const data = incomingSockConn.read();
        expect(data).to.deep.equal(Buffer.from([
            0x05, // SOCKS version
            0x01, // Number of auth methods
            0x00  // No auth
        ]));

        incomingSockConn.end();
    });

    it("should be able to loopback and handle proxied HTTP", async () => {
        const socksHandler = net.createServer();

        server = httpolyglot.createServer({
            socks: socksHandler
        }, (_req, res) => {
            res.writeHead(200);
            res.end('HTTP response body');
        });
        await new Promise<void>(resolve => server.listen(0, resolve));
        const socksPort = (server.address() as net.AddressInfo).port;

        const socksConn = socks.SocksClient.createConnection({
            proxy: {
                host: 'localhost',
                port: socksPort,
                type: 5
            },
            command: 'connect',
            destination: {
                host: 'invalid.example',
                port: 80
            }
        });

        const incomingSockConn = await new Promise<net.Socket>((resolve, reject) => {
            socksConn.catch(reject);
            socksHandler.on('connection', resolve);
        });

        await new Promise<void>(resolve => incomingSockConn.once('readable', resolve));
        incomingSockConn.read();

        incomingSockConn.write(Buffer.from([
            0x05, // SOCKS version
            0x00, // No auth
        ]));

        // Expect the connection to now send us an address:
        await new Promise<void>(resolve => incomingSockConn.once('readable', resolve));
        const data = incomingSockConn.read();

        expect(data).to.deep.equal(Buffer.from([
            0x05, // SOCKS version
            0x01, // Connect
            0x00, // Reserved
            0x03, // Domain name
            'invalid.example'.length, // Length of domain name
            ...Buffer.from('invalid.example'), // Domain name
            0, 80, // Port
        ]));

        incomingSockConn.write(Buffer.from([
            0x05, // SOCKS version
            0x00, // Success
            0x00, // Reserved
            0x01, // IPv4
            0x7f, 0x00, 0x00, 0x01, // Loopback
            0x00, 0x00 // Port
        ]));

        // Pass the socket back to the httpolyglot server to continue handling:
        server.emit('connection', incomingSockConn);

        const result = await socksConn;
        const req = http.request('http://google.com', {
            createConnection: () => result.socket
        });
        req.end();

        const response = await new Promise<http.ServerResponse>(resolve => req.on('response', resolve));
        expect(response.statusCode).to.equal(200);
        expect(await streamConsumers.text(response as any)).to.equal('HTTP response body');

        incomingSockConn.end();
    });

});


describe("SOCKSv4", () => {

    let server: httpolyglot.Server;

    afterEach(() => {
        server?.close();
    });

    it("should be passed to the handler", async () => {
        const socksHandler = net.createServer();

        server = httpolyglot.createServer({
            socks: socksHandler
        }, () => {
            throw new Error("Should not be called");
        });
        await new Promise<void>(resolve => server.listen(0, resolve));
        const socksPort = (server.address() as net.AddressInfo).port;

        const socksConn = socks.SocksClient.createConnection({
            proxy: {
                host: 'localhost',
                port: socksPort,
                type: 4
            },
            command: 'connect',
            destination: {
                host: '1.2.3.4',
                port: 80
            }
        });

        const incomingSockConn = await new Promise<net.Socket>((resolve, reject) => {
            socksConn.catch(reject);
            socksHandler.on('connection', resolve);
        });
        await new Promise<void>(resolve => incomingSockConn.once('readable', resolve));

        const data = incomingSockConn.read();
        expect(data).to.deep.equal(Buffer.from([
            0x04, // SOCKS version
            0x01, // Connect
            0, 80, // Port
            0x1, 0x2, 0x3, 0x4, // IP
            0x0 // User ID
        ]));

        incomingSockConn.end();
    });

    it("should be able to loopback and handle proxied HTTP", async () => {
        const socksHandler = net.createServer();

        server = httpolyglot.createServer({
            socks: socksHandler
        }, (_req, res) => {
            res.writeHead(200);
            res.end('HTTP response body');
        });
        await new Promise<void>(resolve => server.listen(0, resolve));
        const socksPort = (server.address() as net.AddressInfo).port;

        const socksConn = socks.SocksClient.createConnection({
            proxy: {
                host: 'localhost',
                port: socksPort,
                type: 4
            },
            command: 'connect',
            destination: {
                host: 'invalid.example',
                port: 80
            }
        });

        const incomingSockConn = await new Promise<net.Socket>((resolve, reject) => {
            socksConn.catch(reject);
            socksHandler.on('connection', resolve);
        });

        // Expect the connection to now send us an address:
        await new Promise<void>(resolve => incomingSockConn.once('readable', resolve));
        incomingSockConn.read();

        incomingSockConn.write(Buffer.from([
            0x00, // Null byte
            0x5a, // Success
            0x00, 0x00, // Port (unused in connect)
            0x00, 0x00, 0x00, 0x00 // Address (unused in connect)
        ]));

        // Pass the socket back to the httpolyglot server to continue handling:
        server.emit('connection', incomingSockConn);

        const result = await socksConn;
        const req = http.request('http://google.com', {
            createConnection: () => result.socket
        });
        req.end();

        const response = await new Promise<http.ServerResponse>(resolve => req.on('response', resolve));
        expect(response.statusCode).to.equal(200);
        expect(await streamConsumers.text(response as any)).to.equal('HTTP response body');

        incomingSockConn.end();
    });

});