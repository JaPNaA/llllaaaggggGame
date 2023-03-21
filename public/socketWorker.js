'use strict';

const SocketWorker = {
    ready: false,
    /** @type {WebSocket} */ // @ts-ignore
    socket: null
};

function onmsg(e) {
    if (typeof e.data == "string") {
        postMessage(JSON.parse(e.data));
    } else {
        var reader = new FileReader();
        reader.addEventListener("loadend", () => {
            postMessage(reader.result);
        });
        reader.readAsArrayBuffer(e.data);
    }
}

function main(address) {
    SocketWorker.socket = new WebSocket(address);

    SocketWorker.socket.onopen = () => SocketWorker.ready = true;
    SocketWorker.socket.onclose = () => SocketWorker.ready = false;
    SocketWorker.socket.onmessage = e => onmsg(e);
}

addEventListener("message", function (ev) {
    var e = ev.data;

    if (typeof e == "string") {
        switch (e[0]) {
            case "U":
                main(e.slice(1));
                break;
        }
    } else {
        if (!SocketWorker.ready) return;
        SocketWorker.socket.send(e);
    }
});