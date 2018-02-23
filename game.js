'use strict';

const U = require("./utils.js"),
    Data = require("./data.js").Data,
    VERSION = "0.1",
    SQRT2 = Math.SQRT2 || Math.sqrt(2);

class Player {
    constructor(C, game) {
        this.client = C;
        this.game = game;

        this.playersSee = [];
        this.playersSeeChanges = {
            add: [],
            rem: []
        };

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

        this.fov = 1000000;

        this.id = this.game.cid++;

        this.sendStart();
    }

    get x() {
        return this._x;
    }
    set x(e) {
        if (Math.floor(e) != Math.floor(this._x)) {
            this.posChange = true;
        }
        this._x = e;
    }
    get y() {
        return this._y;
    }
    set y(e) {
        if (Math.floor(e) != Math.floor(this._y)) {
            this.posChange = true;
        }
        this._y = e;
    }

    disconnect() {
        for(let i of this.game.clients) {
            let j = i.plr;

            if (j.playersSee.includes(this)) {
                j.playersSeeChanges.rem.push(this);
            }
        }
        
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

                setTimeout(() => { // lagging componet
                    this.tvx = vx;
                    this.tvy = vy;
                }, U.rand(this.game.lagTimeout, this.game.lagRange));
                break;
        }
    }

    moveVel(tt) {
        
        // this.x += this.vx * tt;
        // this.y += this.vy * tt;
        this.x += this.vx * tt;
        this.y += this.vy * tt;

        this.vx += this.tvx * tt;
        this.vy += this.tvy * tt;

        this.vx = this.vx * 0.995 ** tt;
        this.vy = this.vy * 0.995 ** tt;
    }
    moveBorder(tt) {
        if (this.x < 0) {
            this.x = 0;
            if (this.vx < 0) {
                this.vx = 0;
            }
        } else if (this.x + this.width > this.game.width) {
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
    canSee(plr) {
        let fov2 = this.fov / 2;

        if(
            this.x - fov2 < plr.x &&
            this.x + fov2 > plr.x &&
            this.y - fov2 < plr.y &&
            this.y + fov2 > plr.y
        ) {
            return true;
        }
        if(plr == this) debugger;
        return false;
    }
    updPlayersSee() {
        // get rid of players too far away from fov, add players that can be seen by fov
        for(let i of this.game.clients) {
            let j = i.plr;
            if(!this.playersSee.includes(j) && this.canSee(j)) {
                this.playersSeeChanges.add.push(j);
            }
        }
        for(let i of this.playersSee) {
            if(!this.canSee(i)) {
                this.playersSeeChanges.rem.push(i);
            }
        }

        // add players
        for(let i of this.playersSeeChanges.add) {
            this.playersSee.push(i);
            this.send(2, i);
            console.log("\x1b[31m", this.id + " <- new " + i.id);
        }
        this.playersSeeChanges.add.length = 0;

        // remove players
        for(let i of this.playersSeeChanges.rem) {
            this.send(4, i.id);
            console.log("\x1b[31m", this.id + " <- rem " + i.id);
            this.playersSee.splice(this.playersSee.indexOf(i), 1);
        }
        this.playersSeeChanges.rem.length = 0;
    }

    tick(tt) {
        this.posChange = false;
        
        this.moveVel(tt);
        this.moveBorder(tt);
        this.updPlayersSee();
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
                            d.push(...U.f([r.id, r.x, r.y, r.vx * 1e6, r.vy * 1e6, r.tvx, r.tvy]));
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
                    this.client.send(JSON.stringify([2, {
                        n: "JaP_is_kewl",
                        i: a.id,
                        w: a.width,
                        h: a.height,
                        x: a.x,
                        y: a.x,
                        c: a.color,
                        f: this.id == a.id
                    }]));
                    break;
                }
            case 3:
                { // send data about game
                    let d = new Data(3, 2);
                    d.set(0, this.game.width)
                     .set(1, this.game.height);
                    
                    this.client.send(d.get());
                    break;
                }
            case 4:
                { // tell to remove player
                    let d = new Data(4, 1);
                    d.set(0, args[0]);

                    this.client.send(d.get());
                }
        }
    }
    sendStart() {
        this.send(3);
        this.send(1);
        this.client.send(`["version", "${VERSION}"]`);
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

        // this.lagTimeout = 650;
        this.lagTimeout = 0;
        // this.lagRange = 100;
        this.lagRange = 0;

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
        this.sI = setInterval(() => this.tick(), 100);
    }
}

module.exports = {
    Game: Game
};