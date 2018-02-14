const U = require("./utils.js");

class Data {
    constructor(type, len) {
        len++; // make space for type

        switch(type) {
            case 0:
                this.ab = new ArrayBuffer(len * 4); // *4 for 32bit *2 for x and y
                this.v = new Int32Array(this.ab);
                break;
            default:
                throw new Error("Invalid type: " + type);
        }
        
        this.setType(type);
    }
    setType(e) {
        new Uint8Array(this.ab)[0] = e;
    }
    set(e, v) {
        if(typeof v == "object") {
            for(let i of v) {
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
    Data: Data
};