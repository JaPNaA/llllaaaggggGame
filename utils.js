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
    var b = new Buffer(ab.byteLength),
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

module.exports = {
    arrayToBuffer: arrayToBuffer,
    bufferToArray: bufferToArray,
    f: f
};