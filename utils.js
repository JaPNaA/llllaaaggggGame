'use strict';

function bufferToArray(buf) {
    var bl = buf.length,
        v = new Uint8Array(bl);

    for (var i = 0; i < bl; i++) {
        v[i] = buf[i];
    }

    return v;
}

function arrayToBuffer(ab) {
    var b = Buffer.alloc(ab.byteLength),
        v = new Uint8Array(ab),
        bl = b.length;

    for (var i = 0; i < bl; i++) {
        b[i] = v[i];
    }

    return b;
}

function f(e) {
    let el = e.length;
    for(let i = 0; i < el; i++) {
        e[i] = Math.round(e[i]);
    }
    return e;
}

function rand(e, f) {
    var d = f - e;
    return e + (Math.random() * d)
}

module.exports = {
    arrayToBuffer: arrayToBuffer,
    bufferToArray: bufferToArray,
    f: f,
    rand: rand
};