const ports = [8998, 9002, 9001, 9000, 8999];
const host = "localhost";
const protocols = ["https:", "http:"];
const urls = protocols
    .map((protocol) => ports.map((port) => `${protocol}//${host}:${port}/`))
    // @ts-ignore
    .flat(1 / 0);
export { urls };
