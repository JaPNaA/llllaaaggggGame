'use strict';

const UTILS = require("./utils.js"),
    Data = require("./WebsocketData.js").Data,
    VERSION = "0.1",
    SQRT2 = Math.SQRT2 || Math.sqrt(2);

class Player {
    /**
     * @param {import("websocket").connection} C
     * @param {Game} game
     */
    constructor(C, game) {
        this.client = C;
        this.game = game;

        /** @type {Player[]} */
        this.playersSee = [];
        /** @type { { add: Player[], rem: Player[] }} */
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
        for (const [player, _] of this.game.clients) {
            let j = player;

            if (j.playersSee.includes(this)) {
                j.playersSeeChanges.rem.push(this);
            }
        }

        this.game.disconnect(this);
    }

    /**
     * @param {"utf8" | "binary"} type 
     * @param {string | Buffer} data
     */
    msg(type, data) {
        if (type != "binary") return;

        const dataAsUint8Arr = UTILS.bufferToArray(data);

        switch (dataAsUint8Arr[0]) {
            case 0:
                const d = dataAsUint8Arr[1];
                let vx = 0;
                let vy = 0;

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
                }, UTILS.rand(this.game.lagTimeout, this.game.lagRange));
                break;
        }
    }

    /** @param {number} tt */
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

    /** @param {number} tt */
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

        if (
            this.x - fov2 < plr.x &&
            this.x + fov2 > plr.x &&
            this.y - fov2 < plr.y &&
            this.y + fov2 > plr.y
        ) {
            return true;
        }
        if (plr == this) debugger;
        return false;
    }

    updPlayersSee() {
        // get rid of players too far away from fov, add players that can be seen by fov
        for (const [player, _] of this.game.clients) {
            if (!this.playersSee.includes(player) && this.canSee(player)) {
                this.playersSeeChanges.add.push(player);
            }
        }
        for (const i of this.playersSee) {
            if (!this.canSee(i)) {
                this.playersSeeChanges.rem.push(i);
            }
        }

        // add players
        for (const i of this.playersSeeChanges.add) {
            this.playersSee.push(i);
            this.send(2, i);
            console.log(this.id + " <- new " + i.id);
        }
        this.playersSeeChanges.add.length = 0;

        // remove players
        for (const i of this.playersSeeChanges.rem) {
            this.send(4, i.id);
            console.log(this.id + " <- rem " + i.id);
            this.playersSee.splice(this.playersSee.indexOf(i), 1);
        }
        this.playersSeeChanges.rem.length = 0;
    }

    /** @param {number} tt */
    tick(tt) {
        this.posChange = false;

        this.moveVel(tt);
        this.moveBorder(tt);
        this.updPlayersSee();
    }

    sendTick() {
        this.send(0);
    }

    /**
     * @param {number} type
     * @param {...any} args
     */
    send(type, ...args) {
        switch (type) {
            case 0:
                { // position(s)
                    const positionIntegers = [];

                    for (const [player, _] of this.game.clients) {
                        if (player.posChange) {
                            positionIntegers.push(...UTILS.floorAll([player.id, player.x, player.y, player.vx * 1e6, player.vy * 1e6, player.tvx, player.tvy]));
                        }
                    }

                    if (positionIntegers.length > 0) {
                        const data = new Data(0, positionIntegers.length).set(0, positionIntegers);
                        this.client.send(data.get());
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
    /** @param {import("./server").Server} server */
    constructor(server) {
        this.server = server;
        this.then = Date.now();

        this.cid = 0;

        this.obs = [];
        this.width = 50e6;
        this.height = 50e6;

        this.lagTimeout = 650;
        // this.lagTimeout = 0;
        this.lagRange = 100;
        // this.lagRange = 0;
        this.tps = 30;

        /** @type {Map<Player, import("websocket").connection>} */
        this.clients = new Map();

        server.game = this;
    }

    /** @param {import("websocket").connection} connection */
    add(connection) {
        const newPlayer = new Player(connection, this);
        this.clients.set(newPlayer, connection);
        return newPlayer;
    }

    /** @param {Player} player */
    disconnect(player) {
        this.clients.delete(player);
    }

    tick() {
        var now = Date.now(),
            tt = now - this.then;
        this.then = now;

        for (const [player, _] of this.clients) {
            player.tick(tt);
        }
        for (const [player, _] of this.clients) {
            player.sendTick();
        }
    }

    start() {
        this.sI = setInterval(() => this.tick(), 1000 / this.tps);
    }
}

module.exports = {
    Game: Game
};