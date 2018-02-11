class Player {
    constructor(C, game) {
        this.client = C;
        this.game = game;

        this.x = 0;
        this.y = 0;
    }
    disconnect() {
        this.game.disconnect(this);
    }

    msg(t, e) {
        // parse data
    }
}

class Game {
    constructor(server) {
        this.server = server;
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
}

module.exports = {
    Game: Game
};