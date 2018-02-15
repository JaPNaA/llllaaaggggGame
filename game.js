'use strict';

const U = require("./utils.js"),
    Data = require("./data.js").Data,
    SQRT2 = Math.SQRT2 || Math.sqrt(2);

class Player {
    constructor(C, game) {
        this.client = C;
        this.game = game;

        this.width = 10000;
        this.height = 10000;

        this._color = "#FF0000";

        this._x = 0;
        this._y = 0;
        this.vx = 0;
        this.vy = 0;
        this.tvx = 0;
        this.tvy = 0;

        this.posChange = false;

        this.fov = 100000;

        this.id = this.game.cid++;

        this.sendStart();
    }

    get x() {
        return this._x;
    }
    set x(e) {
        if(e == this._x) return;
        this._x = e;
        this.posChange = true;
    }
    get y() {
        return this._y;
    }
    set y(e) {
        if (e == this._y) return;
        this._y = e;
        this.posChange = true;
    }

    disconnect() {
        this.game.disconnect(this);
    }

    msg(t, e) {
        if (t != "binary") return;

        var dt = U.bufferToArray(e);

        switch (dt[0]) {
            case 0:
                let d = dt[1],
                    vx = 0,
                    vy = 0;

                if ((d >> 0) % 2) { // left
                    vx--;
                }
                if ((d >> 1) % 2) { // up
                    vy--;
                }
                if ((d >> 2) % 2) { // right
                    vx++;
                }
                if ((d >> 3) % 2) { // down
                    vy++;
                }

                if (vx && vy) {
                    vx /= SQRT2;
                    vy /= SQRT2;
                }

                this.tvx = vx;
                this.tvy = vy;
                break;
        }
    }

    moveVel(tt) {
        this.vx += this.tvx * tt;
        this.vy += this.tvy * tt;

        this.x += this.vx * tt;
        this.y += this.vy * tt;

        this.vx = this.vx * 0.995 ** tt;
        this.vy = this.vy * 0.995 ** tt;
    }
    moveBorder(tt) {
        if (this.x < 0) {
            this.x = 0;
            if (this.vx < 0) {
                this.vx = 0;
            }
        } else if (this.x + this.width> this.game.width) {
            this.x = this.game.width - this.width;
            if (this.vx > 0) {
                this.vx = 0;
            }
        }
        if (this.y < 0) {
            this.y = 0;
            if (this.vy < 0) {
                this.vy = 0;
            }
        } else if (this.y + this.height > this.game.height) {
            this.y = this.game.height - this.height;
            if (this.vy > 0) {
                this.vy = 0;
            }
        }
    }

    tick(tt) {
        this.posChange = false;
        
        this.moveVel(tt);
        this.moveBorder(tt);
    }
    sendTick() {
        this.send(0);
    }

    send(e, ...args) {
        switch (e) {
            case 0:
                { // position(s)
                    let pr = 7,
                        d = [],
                        ix = 0,
                        e;

                    for (let i = 0; i < this.game.clients.length; i++) {
                        let r = this.game.clients[i].plr;
                        if(r.posChange) {
                            d.push(...U.f([r.id, r.x, r.y, r.vx, r.vy, r.tvx, r.tvy]));
                        }
                    }

                    if(d.length > 0) {
                        e = new Data(0, d.length).set(0, d);
                        this.client.send(e.get());
                    }
                    break;
                }
            case 1:
                { // other display info (time, fov...)
                    let d = new Data(1, 1);
                    d.set(0, this.fov);
                    this.client.send(d.get());
                    break;
                }
            case 2:
                { // send data about a player
                    let a = args[0];
                    this.client.send(JSON.stringify({
                        n: "JaP_is_kewl",
                        i: a.id,
                        w: a.width,
                        h: a.height,
                        c: a.color
                    }));
                }
        }
    }
    sendStart() {
        this.send(1);
        this.send(2, this);
    }
}

class Game {
    constructor(server) {
        this.server = server;
        this.then = Date.now();

        this.cid = 0;

        this.obs = [];
        this.width = 50e6;
        this.height = 50e6;

        server.game = this;
    }

    get clients() {
        return this.server.clients;
    }

    add(C) {
        C.plr = new Player(C, this);
    }
    disconnect(C) {
        delete C.client.plr;
    }

    tick() {
        var now = Date.now(),
            tt = now - this.then;
        this.then = now;

        for (let i of this.clients) {
            i.plr.tick(tt);
        }
        for (let i of this.clients) {
            i.plr.sendTick();
        }
    }

    start() {
        this.sI = setInterval(() => this.tick(), 50);
    }
}

module.exports = {
    Game: Game
};