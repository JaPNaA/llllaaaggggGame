// var ws = new WebSocket(location.href.replace("http", "ws"));
// ws.onopen = function() {
//     ws.send("HI");

//     var ab = new ArrayBuffer(16),
//         v = new Float64Array(ab);
//     v[0] = 8349028;

//     ws.send(ab);
//     ws.close();
// };

class G {
    constructor() {
        this.cvs = document.getElementById("c");
        this.X = this.cvs.getContext("2d");
        this.obs = [];

        this.socket = new WebSocket(location.href.replace("http", "ws"));
        this.socket.onopen = () => this.ready = true;
        this.socket.onmessage = e => this.onmsg(e);

        this.ready = false;

        this.key = [];
        this.lastDirection = -1;
    }

    get direction() {
        var k = this.key,
            f = 0;

        if (k[37] || k[65]) { // left
            f += 1;
        }
        if (k[38] || k[87]) { // up
            f += 2;
        }
        if (k[39] || k[68]) { // right
            f += 4;
        }
        if (k[40] || k[83]) { // down
            f += 8;
        }

        this.lastDirection = f;

        return f;
    }

    draw() {
        this.X.clearRect(0, 0, this.cvs.width, this.cvs.height);
        for (let i of obs) {
            i.draw();
        }
    }

    sendDir() {
        if (!this.ready) return;

        let ld = this.lastDirection,
            d = this.direction;

        if (ld == d) return;

        let ab = new ArrayBuffer(2),
            v = new Uint8Array(ab);

        v[0] = 0;
        v[1] = d;

        this.socket.send(ab);
    }

    onmsg(e) {
        var reader = new FileReader();
        reader.addEventListener("loadend", () => {
            this.parseMessage(new Float32Array(reader.result));
        });
        reader.readAsArrayBuffer(e.data);
    }
    onresize() {
        this.cvs.width = innerWidth;
        this.cvs.height = innerHeight;
    }

    parseMessage(e) {
        // TEST
        switch(e[0]) {
            case 0:
                this.X.clearRect(0, 0, this.cvs.width, this.cvs.height);
                this.X.fillStyle = "#000";
                this.X.fillRect(e[1] / 1000, e[2] / 1000, 16, 16);
        }
    }

    keydown(e) {
        if (e.repeat) return;

        this.key[e.keyCode] = true;
        this.sendDir();
    }
    keyup(e) {
        if (e.repeat) return;

        this.key[e.keyCode] = false;
        this.sendDir();
    }

    start() {
        addEventListener("keydown", e => this.keydown(e));
        addEventListener("keyup", e => this.keyup(e));
        addEventListener("resize", e => this.onresize(e));

        this.onresize();
    }
}

var g = new G();
g.start();