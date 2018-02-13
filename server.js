const HTTP = require("http"),
    WS = require("websocket").server,
    FS = require("fs");

class Server {
    constructor(port) {
        this.game = null;

        this.port = port;
        this.server = HTTP.createServer((q, r) => this.httpServerFunc(q, r));
        this.wsServer = new WS({
            httpServer: this.server
        });

        this.mimes = JSON.parse(FS.readFileSync("mimes.json").toString());
        this.data404 = FS.readFileSync("404.html");

        this.disableCache = true; // -------------------------------- ENABLE WHEN DONE

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
                    let mime = this.mimes[
                        rAddress.substring(
                            rAddress.lastIndexOf('.'),
                            rAddress.length
                        )
                    ] || "text/plain";

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
            let C = req.accept(null);

            this.clients.push(C);
            this.game.add(C);

            C.on("message", e => {
                // console.log("WS Msg " + e.type + " ->", e.utf8Data || e.binaryData);
                C.plr.msg(e.type, e.utf8Data || e.binaryData);
            });
            C.on("close", e => {
                this.clients.splice(this.clients.indexOf(C), 1);
                console.log("WS Disconnect " + this.clients.length);

                C.plr.disconnect();
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