let url = new URL(location.href);
if (url.protocol === "https:") {
    url.protocol = "wss:";
} else if (url.protocol === "http:") {
    url.protocol = "ws:";
}

let socket = new WebSocket(url.href);
/**
 * @param {string} message
 */
function appendtodom(message) {
    let p = document.createElement("p");
    p.innerText = message;
    document.body.appendChild(p);
}
socket.addEventListener("close", console.log);
socket.addEventListener("open", console.log);
socket.addEventListener("error", console.log);
socket.addEventListener("message", console.log);
socket.addEventListener("message", (e) => {
    appendtodom(e.data);
});
