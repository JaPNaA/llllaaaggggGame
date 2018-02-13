const Server = require("./server.js").Server,
      Game = require("./game.js").Game;

var server = new Server(80),
    game = new Game(server);

server.start();
game.start();