const WebSocket = require('ws');
//const MAX_CAP = 128*1024;

module.exports = (config, http_server, find_collection, logger) => {
    const wss = new WebSocket.Server({
        server: http_server,
        path: '/gate',
        maxPayload: 1024*1024
    });
    wss.on('connection', function(ws, request) {
        const stream = WebSocket.createWebSocketStream(ws, {
            writableHighWaterMark: +config.MAX_CAP,
            readable: false,
            writable: true 
        });
        //console.info(JSON.stringify(stream));
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            const { qry, cname, cnt } = message;
            if (qry === 1) {
                find_collection(cname, {
                    w: 0,
                    raw: true,
                    strict: true
                }).then(collection => {
                    const cursor = collection.find({}, { skip: 0, limit: cnt || 20 });
                    //cursor.pipe(stream);
                    pump(cursor, stream, () => logger.info(`${cname} sent`));
                    //pump_loop(cursor, stream, () => logger.info(`${cname} sent`));
                });
            }
        });
        ws.on('close', function(code, _reason) {
            logger.info(`Peer disconnected with ${code}.`);
        });    
    });
    wss.on('error', (error) => logger.error('WS Server error', error));
    
    return wss;
};

module.exports.sname = "web-socket server";
module.exports.deps = [ "config", "http_server", "find_collection", "logger" ];

// works little faster than pipe
function pump(cursor, stream, cb) {
    //let size = 0;
    cursor.on('data', (data) => {
        //size += data.length;
        if (!stream.write(data)) {
            cursor.pause();
            //logger.info(size, 'drained');
            stream.once('drain', () => cursor.resume());
        }
    });
    cursor.on('end', () => {
        stream.end();
        if (cb) cb();
    });
}
// works a bit slower than pump
function pump_loop(cursor, stream, cb) {
    async function writeData() {
        //let cap = 0;
        let drain = true, rest = true;
        //logger.info('start draining');
        while (drain && rest) {
            rest = await cursor.hasNext();
            if (rest) {
                const data = await cursor.next();
                //cap += data.length;
                drain = stream.write(data);
                if (!drain) {
                    stream.once('drain', writeData);
                    //logger.info(cap, 'stop draining');
                }
            }
        }
        if (!rest) {
            stream.end();
            if (cb) cb();
        }
    }    
    writeData();
}