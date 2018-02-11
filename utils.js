function bufferToArray(buf) {
    var ab = new ArrayBuffer(buf.length),
        v = new Uint8Array(ab),
        bl = buf.length;

    for (var i = 0; i < bl; i++) {
        v[i] = buf[i];
    }

    return ab;
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

module.exports = {
    arrayToBuffer: arrayToBuffer,
    bufferToArray: bufferToArray
};