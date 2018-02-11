const HTTP = require("http"),
    WS = require("websocket").server,
    FS = require("fs");

class Server {
    constructor(port) {
        this.port = port;
        this.server = HTTP.createServer((q, r) => this.httpServerFunc(q, r));
        this.wsServer = new WS({
            httpServer: this.server
        });

        this.mimes = JSON.parse(FS.readFileSync("mimes.json").toString());
        this.data404 = FS.readFileSync("404.html");

        this.cache = {};
        this.redi = {
            "/": "/index.html"
        };

        this.connectHttpServer();
    }
    httpServerFunc(q, r) {
        var address = q.url,
            cacheD = this.cache[address];

        if (cacheD) {
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

    connectHttpServer() {
        this.server.listen(this.port);
        console.log(`Hosting on port ${this.port}.`);
    }
}

module.exports = {
    Server: Server
};