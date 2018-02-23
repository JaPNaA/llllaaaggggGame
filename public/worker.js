'use strict';

const D = {
    obs: [],
    game: {
        width: 0,
        height: 0
    },
    then: Date.now()
};

class Thing {
    constructor(e) {
        this.name = e.n;
        this.id = e.i;

        this.width = e.w;
        this.height = e.h;

        this.color = "#000000";

        this._x = e.x;
        this._y = e.y;
        this.vx = 0;
        this.vy = 0;
        this.tvx = 0;
        this.tvy = 0;

        this.changed = true;
    }

    get x() {
        return this._x;
    }
    set x(e) {
        if (e == this._x) return;
        this._x = e;
        this.changed = true;
    }
    get y() {
        return this._y;
    }
    set y(e) {
        if (e == this._y) return;
        this._y = e;
        this.changed = true;
    }

    moveVel(tt) {
        // this.x += this.vx * tt;
        // this.y += this.vy * tt;
        // this.x += tt * (this.vx + this.tvx * tt ** 2 * 0.01);
        // this.y += tt * (this.vy + this.tvy * tt ** 2 * 0.01);

        // this.vx += this.tvx * (tt / 1000) ** 2;
        // this.vy += this.tvy * (tt / 1000) ** 2;

        var ax = this.tvx,
            ay = this.tvy;
        if (ax && ay) {
            ax *= Math.SQRT1_2;
            ay *= Math.SQRT1_2;
        }

        this.x += this.vx * tt;
        this.y += this.vy * tt;

        this.vx += ax * tt;
        this.vy += ay * tt;

        this.vx = this.vx * 0.995 ** tt;
        this.vy = this.vy * 0.995 ** tt;
    }
    moveBorder(tt) {
        if (this.x < 0) {
            this.x = 0;
            if (this.vx < 0) {
                this.vx = 0;
            }
        } else if (this.x + this.width > D.game.width) {
            this.x = D.game.width - this.width;
            if (this.vx > 0) {
                this.vx = 0;
            }
        }
        if (this.y < 0) {
            this.y = 0;
            if (this.vy < 0) {
                this.vy = 0;
            }
        } else if (this.y + this.height > D.game.height) {
            this.y = D.game.height - this.height;
            if (this.vy > 0) {
                this.vy = 0;
            }
        }
    }

    tick(tt) {
        this.moveVel(tt);
        this.moveBorder(tt);
    }
}

function toUintArray(e) {
    let ab = new ArrayBuffer((e.length + 1) * 4),
        v = new Uint32Array(ab),
        el = e.length;

    new Uint8Array(ab)[0] = 0;

    for (let i = 0; i < el; i++) {
        v[i + 1] = e[i];
    }

    return ab;
}

function parseMessageB(e) {
    let type = new Uint8Array(e)[0];
    switch (type) {
        case 0:
            {
                let pr = 7,
                    r = new Int32Array(e).slice(1),
                    rl = r.length / pr;
                console.log(r);
                for (let i = 0; i < rl; i++) {
                    let d = r.slice(pr * i, pr * (i + 1)),
                        t = D.obs.find(e => e.id == d[0]);
                    if (!t) continue;

                    // r.id, r.x, r.y, r.vx, r.vy, r.tvx, r.tvy
                    t.x = d[1];
                    t.y = d[2];
                    t.vx = d[3] / 1e6;
                    t.vy = d[4] / 1e6;
                    t.tvx = d[5];
                    t.tvy = d[6];
                    t.changed = true;
                }
                break;
            }
        case 3:
            {
                let r = new Int32Array(e).slice(1);
                D.game.width = r[0];
                D.game.height = r[1];
                break
            }
        case 4:
            {
                let r = new Int32Array(e).slice(1),
                    a = D.obs.indexOf(D.obs.find(e => e.id == r[0]));

                if (a >= 0) {
                    console.log("Remove thing", r[0]);
                    D.obs.splice(a, 1);
                } else {
                    console.error("Failed to remove player", r);
                }
            }
    }
}

function parseMessageS(e) {
    var d = e.slice(1);
    switch (e[0]) {
        case 2:
            D.obs.push(new Thing(d[0]));
            console.log("New thing", d);
            break;
    }
}

function tick() {
    var now = Date.now(),
        tt = now - D.then,
        pm = [];
    D.then = now;

    for (let i of D.obs) {
        i.tick(tt);
    }

    for (let i of D.obs) {
        if (!i.changed) continue;
        i.changed = false;

        pm.push(i.id, i.x, i.y);
    }

    if (pm.length) {
        postMessage(toUintArray(pm));
    }
}

addEventListener("message", function (ev) {
    var e = ev.data;

    if (typeof e == "string") {
        switch (e[0]) {
            case "U":
                {
                    tick();
                    break;
                }
        }
    } else {
        if (e instanceof ArrayBuffer) {
            parseMessageB(e);
        } else {
            parseMessageS(e);
        }
    }
});