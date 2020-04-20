export const notfoundrequestlistener = function (req, res) {
    res.statusCode = 404;
    res.write("404");
    res.end();
};
export const notfoundupgradelistener = function (req, socket, head) {
    socket.write(`HTTP/1.1 404 Not Found\r\nConnection: keep-alive\r\n\r\n`);
    socket.destroy();
};
