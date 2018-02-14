const U = require("./utils.js"),
    Data = require("./data.js").Data, 
    SQRT2 = Math.SQRT2 || Math.sqrt(2);

class Player {
    constructor(C, game) {
        this.client = C;
        this.game = game;

        this.x = 0;
        this.y = 0;

        this.vx = 0;
        this.vy = 0;

        this.tvx = 0;
        this.tvy = 0;

        this.id = this.game.cid++;
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

                if(vx && vy) {
                    vx /= SQRT2;
                    vy /= SQRT2;
                }

                this.tvx = vx;
                this.tvy = vy;
                break;
        }
    }
    tick(tt) {
        this.vx += this.tvx * tt;
        this.vy += this.tvy * tt;

        this.x += this.vx * tt;
        this.y += this.vy * tt;

        this.vx = this.vx * 0.995 ** tt;
        this.vy = this.vy * 0.995 ** tt;

        this.send(0);
    }
    send(e) {
        switch(e) {
            case 0: // position(s)
                let pr = 7,
                    d = new Data(0, this.game.clients.length * pr);

                for(let i = 0; i < this.game.clients.length; i++) {
                    let r = this.game.clients[i].plr;
                    d.set(i * pr, U.f([r.id, r.x, r.y, r.vx, r.vy, r.tvx, r.tvy]));
                }
                
                this.client.send(d.get());
                break;
        }
    }
}

class Game {
    constructor(server) {
        this.server = server;
        this.then = Date.now();

        this.cid = 0;

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

        for(let i of this.clients) {
            i.plr.tick(tt);
        }
    }

    start() {
        this.sI = setInterval(() => this.tick(), 50);
    }
}

module.exports = {
    Game: Game
};