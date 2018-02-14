var D = {
    ready: false,
    socket: null
};

function onmsg(e) {
    var reader = new FileReader();
    reader.addEventListener("loadend", () => {
        postMessage(reader.result);
    });
    reader.readAsArrayBuffer(e.data);
}

function main(address) {
    D.socket = new WebSocket(address);

    D.socket.onopen = () => D.ready = true;
    D.socket.onclose = () => D.ready = false;
    D.socket.onmessage = e => onmsg(e);
}

addEventListener("message", function(ev) {
    var e = ev.data;

    if(typeof e == "string") {
        switch(e[0]) {
            case "U":
                main(e.slice(1));
                break;
        }
    } else {
        if(!D.ready) return;
        D.socket.send(e);
    }
});