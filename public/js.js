'use strict';

const VERSION = "0.1";

class Thing {
    constructor(e, g) {
        this.game = g;

        this.follow = e.f;
        if (this.follow) {
            this.game.camera.follow = this;
        }

        this.name = e.n;
        this.id = e.i;

        this._width = 0;
        this._height = 0;
        this._x = 0;
        this._y = 0;

        this.width = e.w;
        this.height = e.h;

        this.color = "#000000";

        this.x = e.x;
        this.y = e.y;
    }
    get width() {
        return this._width * this.game.camera.scale;
    }
    set width(e) {
        this._width = e;
    }

    get height() {
        return this._height * this.game.camera.scale;
    }
    set height(e) {
        this._height = e;
    }

    get x() {
        return this._x * this.game.camera.scale;
    }
    set x(e) {
        this._x = e;
    }

    get y() {
        return this._y * this.game.camera.scale;
    }
    set y(e) {
        this._y = e;
    }

    draw() {
        var X = this.game.X;

        X.fillStyle = this.color;
        X.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.scale = 0.001;

        this.tx = 0;
        this.ty = 0;
        this.tscale = 0.001;

        this.follow = null;

        this.s = {
            w: 0,
            h: 0,
            lx2: 0,
            ly2: 0
        };
    }

    get x2() {
        if(!this.follow) return this.s.lx2;
        return (this.s.w - this.follow.width) / 2;
    }
    get y2() {
        if(!this.follow) return this.s.ly2;
        return (this.s.h - this.follow.height) / 2;
    }

    move(tt) {
        if (this.follow) {
            this.tx = this.follow.x;
            this.ty = this.follow.y;
        }

        this.x += (this.tx - this.x) / 10;
        this.y += (this.ty - this.y) / 10;
        this.scale += (this.tscale - this.scale) / 10;
    }
    changeScale(s, i) {
        var a = Math.max(innerWidth, innerHeight * 16 / 9) * (window.devicePixelRatio || 1) / s;

        this.tscale = a;
        if (i) this.scale = a;
    }
}

class G {
    constructor() {
        this.cvs = document.getElementById("c");
        this.X = this.cvs.getContext("2d");
        this.obs = [];

        this.socketWorker = new Worker("socketWorker.js");
        this.socketWorker.onmessage = e => this.parseMessage(e);
        this.socketWorker.postMessage("U" + location.href.replace("http", "ws"));

        this.worker = new Worker("worker.js");
        this.worker.onmessage = e => this.parseTickMessage(e);

        this.camera = new Camera();

        this.key = [];
        this.lastDirection = -1;

        this.then = 0;
        this.fov = 100;

        this.resize();
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

    draw(e) {
        var tt = 0;

        if (e) {
            tt = e - this.then;
            this.then = e;
        }

        this.worker.postMessage("U");

        this.X.clearRect(0, 0, this.cvs.width, this.cvs.height);

        this.camera.move(tt);
        this.X.save();
        this.X.translate(this.camera.x2, this.camera.y2);
        this.X.translate(-this.camera.x, -this.camera.y);

        for (let i of this.obs) {
            i.draw();
        }

        this.X.restore();

        requestAnimationFrame(e => this.draw(e));
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

    resize() {
        var d = window.devicePixelRatio || 1;

        this.camera.s.w = this.cvs.width = innerWidth * d;
        this.camera.s.h = this.cvs.height = innerHeight * d;

        this.camera.changeScale(this.fov, true);
    }

    parseMessage(e) {
        let r = e.data;
        this.worker.postMessage(r); // send to worker

        if (r instanceof ArrayBuffer) {
            this.parseMessageB(r);
        } else {
            this.parseMessageS(r);
        }
    }

    parseTickMessage(e) {
        let r = e.data,
            type = new Uint8Array(r)[0];

        switch (type) {
            case 0:
                {
                    let pr = 3,
                        dt = new Uint32Array(r).slice(1),
                        dtl = dt.length / 3;

                    for (let i = 0; i < dtl; i++) {
                        let r = dt.slice(i * pr, (i + 1) * pr),
                            d = this.obs.find(e => e.id == r[0]);

                        if (!d) continue;

                        d.x = r[1];
                        d.y = r[2];
                    }

                    break;
                }
        }
    }

    parseMessageS(e) {
        var d = e.slice(1);
        switch (e[0]) {
            case "version":
                if (d == VERSION) {
                    console.log("Version: " + d);
                } else {
                    location.reload(true);
                }
                break;
            case 2:
                this.obs.push(new Thing(d[0], this));
        }
    }

    parseMessageB(e) {
        let type = new Uint8Array(e)[0];

        switch (type) {
            case 1:
                {
                    let r = new Int32Array(e).slice(1);
                    this.fov = r[0];
                    console.log("FOV: " + this.fov);
                    this.camera.changeScale(this.fov);
                    break;
                }
            case 4:
                {
                    let r = new Int32Array(e).slice(1),
                        a = this.obs.indexOf(this.obs.find(e => e.id == r[0]));

                    if (a >= 0) {
                        this.obs.splice(this.obs.indexOf(a), r[0]);
                    } else {
                        console.error("Failed to remove player", r);
                    }
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
        addEventListener("resize", e => this.resize(e));

        this.resize();
        this.draw();
    }
}

var g = new G();
g.start();