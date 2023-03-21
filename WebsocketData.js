'use strict';

const U = require("./utils.js");

class WebsocketData {
    constructor(type, len) {
        len++; // make space for type

        switch (type) {
            case 0: // position
            case 1: // other info ([here and down] may need to split)
            case 3: // map data
            case 4: // remove player
                this.ab = new ArrayBuffer(len * 4); // *4 for 32bit
                this.v = new Int32Array(this.ab);
                break;

            case 2: // player info
            default:
                throw new Error("Invalid type: " + type);
        }

        this.setType(type);
    }

    setType(e) {
        new Uint8Array(this.ab)[0] = e;
    }

    set(e, v) {
        if (typeof v == "object") {
            for (let i of v) {
                this.v[(e++) + 1] = i;
            }

            return this;
        }

        this.v[e + 1] = v;
        return this;
    }

    get() {
        return U.arrayToBuffer(this.ab);
    }
}

module.exports = {
    Data: WebsocketData
};