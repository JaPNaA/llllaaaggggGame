'use strict';

const Server = require("./server.js").Server;
const Game = require("./game.js").Game;

var server = new Server(process.env.PORT ? parseInt(process.env.PORT) : 80),
    game = new Game(server);

server.start();
game.start();

global.server = server;
global.game = game;