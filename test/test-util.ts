import * as stream from 'stream';
import * as fs from 'fs';
import * as net from 'net';
import * as tls from 'tls';

export const testKey = fs.readFileSync(__dirname + '/fixtures/server.key');
export const testCert = fs.readFileSync(__dirname + '/fixtures/server.crt');

export type Deferred<T> = Promise<T> & {
    resolve(value: T): void,
    reject(e: Error): void
}

export function getDeferred<T>(): Deferred<T> {
    let resolveCallback: (value: T) => void;
    let rejectCallback: (e: Error) => void;
    let result = <Deferred<T>> new Promise((resolve, reject) => {
        resolveCallback = resolve;
        rejectCallback = reject;
    });
    result.resolve = resolveCallback!;
    result.reject = rejectCallback!;

    return result;
}

export async function streamToBuffer(stream: stream.Readable): Promise<Buffer> {
    const data: Buffer[] = [];
    stream.on('data', (d) => data.push(d));

    return new Promise((resolve, reject) => {
        stream.on('end', () => resolve(Buffer.concat(data)));
        stream.on('error', reject);
    });
}

export async function sendRawRequest(target: net.Server | net.Socket, requestContent: string): Promise<string> {
    let client: net.Socket;
    if (target instanceof net.Server) {
        client = new net.Socket();
        await new Promise<void>((resolve) => client.connect((target.address() as net.AddressInfo).port, '127.0.0.1', resolve));
    } else {
        client = target;
    }

    const dataPromise = new Promise<string>((resolve) => {
        client.on('data', function(data) {
            resolve(data.toString());
            client.destroy();
        });
    });

    client.write(requestContent);
    client.end();
    return dataPromise;
}

export async function openRawTlsSocket(
    target: net.Server,
    options: tls.ConnectionOptions = {}
): Promise<tls.TLSSocket> {
    return await new Promise<tls.TLSSocket>((resolve, reject) => {
        const socket: tls.TLSSocket = tls.connect({
            host: '127.0.0.1',
            port: (target.address() as net.AddressInfo).port,
            ...options
        });
        socket.once('secureConnect', () => resolve(socket));
        socket.once('error', reject);
    });
}