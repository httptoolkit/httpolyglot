export const requestNotFound = function (req, res) {
    res.statusCode = 404;
    res.write("404");
    res.end();
};
export const upgradeNotFound = function (req, socket, head) {
    socket.write(`HTTP/1.1 404 Not Found\r\nConnection: keep-alive\r\n\r\n`);
    socket.destroy();
};
