'use strict';

class G {
    constructor() {
        this.cvs = document.getElementById("c");
        this.X = this.cvs.getContext("2d");
        this.obs = [];

        this.socketWorker = new Worker("socketWorker.js");
        this.socketWorker.onmessage = e => this.parseMessage(e);
        this.socketWorker.postMessage("U" + location.href.replace("http", "ws"));

        this.key = [];
        this.lastDirection = -1;

        this.fov = 1;
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
        let ld = this.lastDirection,
            d = this.direction;

        if (ld == d) return;

        let ab = new ArrayBuffer(2),
            v = new Uint8Array(ab);

        v[0] = 0;
        v[1] = d;

        this.socketWorker.postMessage(ab);
    }

    onresize() {
        this.cvs.width = innerWidth;
        this.cvs.height = innerHeight;
    }

    parseMessage(e) {
        let r = e.data;
        if (r.constructor == ArrayBuffer) {
            this.parseMessageB(r);
        } else {
            this.parseMessageS(r);
        }
    }

    parseMessageS(e) {
        console.log(e);
    }

    parseMessageB(e) {
        let type = new Uint8Array(e)[0];
        switch (type) {
            case 0: {
                let pr = 7,
                    r = new Int32Array(e).slice(1),
                    rl = r.length / pr;

                this.X.clearRect(0, 0, this.cvs.width, this.cvs.height);

                for (let i = 0; i < rl; i++) {
                    this.X.fillStyle = "#000";
                    this.X.fillRect(r[1 + pr * i] / 1000, r[2 + pr * i] / 1000, 16, 16);
                }
                console.log("C");
                
                break;
            }

            case 1: {
                let r = new Int32Array(e).slice(1);
                this.fov = r[0];
                console.log(this.fov);
            }
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