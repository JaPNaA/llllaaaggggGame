var ws = new WebSocket(location.href.replace("http", "ws"));
ws.onopen = function() {
    ws.send("HI");

    var ab = new ArrayBuffer(16),
        v = new Float64Array(ab);
    v[0] = 8349028;

    ws.send(ab);
    ws.close();
};