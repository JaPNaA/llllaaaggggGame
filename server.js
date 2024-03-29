'use strict';

const HTTP = require("http"),
    WS = require("websocket").server,
    FS = require("fs");

/**
 * @typedef ClientAccepter
 * @property {(client: import("websocket").connection) => ClientState} add
 * 
 * @typedef ClientState
 * @property {(type: "utf8" | "binary", message: string | Buffer) => void} msg
 * @property {() => void} disconnect
 */

class Server {
    /**
     * @param {number} port
     */
    constructor(port) {
        /** @type {ClientAccepter | null} */
        this.game = null;

        this.port = port;
        this.server = HTTP.createServer((q, r) => this.httpServerFunc(q, r));
        this.server.on("error", function () {
            throw new Error("failed to connect");
        });

        this.wsServer = new WS({
            httpServer: this.server
        });

        this.mimes = JSON.parse(FS.readFileSync("mimes.json").toString());
        this.data404 = FS.readFileSync("404.html");

        this.disableCache = true || false;

        this.cache = {};
        this.redi = {
            "/": "/index.html"
        };

        this.clients = [];
    }

    httpServerFunc(q, r) {
        var address = q.url,
            cacheD = this.cache[address];

        if (cacheD && !this.disableCache) {
            r.writeHead(200, {
                'content-type': cacheD[1]
            });
            r.end(cacheD[0]);
        } else {
            console.log("  new address:");
            var rAddress = this.redi[address];

            if (!rAddress) {
                rAddress = address;
            }

            rAddress = "public" + rAddress;

            this.readFile(rAddress)
                .then((d) => {
                    let mime = d[0] == 200 ? this.mimes[
                        rAddress.substring(
                            rAddress.lastIndexOf('.'),
                            rAddress.length
                        )
                    ] || "text/plain" : "text/html";

                    r.writeHead(d[0], {
                        'content-type': mime
                    });
                    r.end(d[1]);

                    if (d[0] == 200) {
                        this.cache[address] = [d[1], mime];
                    }
                });
        }

        console.log("GET " + q.connection.remoteAddress + " <- " + q.url);
    }

    async readFile(u) {
        var a = await new Promise((res, rej) => {
            FS.readFile(u, (e, d) => {
                if (e) {
                    res([404, this.data404]);
                } else {
                    res([200, d]);
                }
            });
        });
        return a;
    }

    connectServer() {
        this.server.listen(this.port);
        console.log(`Hosting on port ${this.port}.`);

        this.wsServer.on("request", req => {
            if (!this.game) { req.reject(500); return; }

            const client = req.accept(null);

            this.clients.push(client);
            const clientState = this.game.add(client);

            client.on("message", e => {
                // console.log("WS Msg " + e.type + " ->", e.utf8Data || e.binaryData);
                if (e.type === "utf8") {
                    clientState.msg(e.type, e.utf8Data);
                } else {
                    clientState.msg(e.type, e.binaryData);
                }
            });
            client.on("close", e => {
                clientState.disconnect();

                this.clients.splice(this.clients.indexOf(client), 1);
                console.log("WS Disconnect " + this.clients.length);
            });

            console.log("WS Connect " + this.clients.length);
        });
    }

    start() {
        this.connectServer();
    }
}

module.exports = {
    Server: Server
};