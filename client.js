
const hooks = require('perf_hooks');
const http = require('http');
const WebSocket = require('ws');
const JSONStream = require('JSONStream');
const DI = require('./di-async');
const di = DI();
di.join(require('./web-modules.json'));
di.set('logger', console );

const runWS = async () => {
    const pump = await di.get('bson_pump');
    const config = await di.get('config');
    const rows = [];
    let counter = 0, fst = 0;
    const ws = new WebSocket(`ws://${config.HOST}:${config.PORT}/gate`);
    ws.on('open', function open() {
        const duplex = WebSocket.createWebSocketStream(ws, {
            readableHighWaterMark: +config.MAX_CAP,
            readable: true,
            writable: true
        });
        //prepare to read
        pump(duplex, rows, (cnt, size, end) => {
            if (end) {
                console.log(hooks.performance.now() - fst, '-ms for bson over websockets');
                console.log(cnt, 'rows', size, 'bytes');
            }
            else {
                //if (cnt - counter < 201) console.log(counter, cnt, size);
                counter = cnt;
            }
        });
        //send query to lots collection
        duplex.write(JSON.stringify({ qry: 1, cname: 'lots', cnt: 20000 }));
        fst = hooks.performance.now();
    });
};

const runBson = async () => {
    const pump = await di.get('bson_pump');
    const config = await di.get('config');
    const req_opts = {
        hostname: config.HOST,
        port: config.PORT,
        path: '/stream/bson?cname=lots&cnt=20000',
        method: 'GET',
    };
    const rows = [];
    let counter = 0, fst = 0;
    const req = http.request(req_opts, res => {
        //res.on('readable', cnt => (cnt) ? console.log(cnt) : null);
        pump(res, rows, (cnt, size, end) => {
            if (end) {
                console.log(hooks.performance.now() - fst, '-ms for bson over http');
                console.log(cnt, 'rows', size, 'bytes');
            }
            else {
                //if (cnt - counter < 101) console.log(counter, cnt, size);
                counter = cnt;
            }
        });
    });
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    req.end();
    fst = hooks.performance.now();
};

const runJson = async () => {
    const config = await di.get('config');
    const req_opts = {
        hostname: config.HOST,
        port: config.PORT,
        path: '/stream/json?cname=lots&cnt=20000',
        method: 'GET',
    };
    const rows = [];
    const req = http.request(req_opts, res => {
        let cnt = 0;
        res.pipe(JSONStream.parse('*'))
        .on('data', row => {
            //console.log(row);
            rows.push(row);
            cnt++;
        })
        .on('end', () => {
            console.log(hooks.performance.now() - fst, '-ms for json over http');
            console.log(cnt, 'rows');
        });
    });
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    req.end();
    fst = hooks.performance.now();
};

//runWS().catch(err => console.error(`Catch: ${err}`));
//481.17809299984947 '-ms for bson over websockets'
//20000 'rows' 11556616 'bytes'

runBson().catch(err => console.error(`Catch: ${err}`));
//394.64331900002435 '-ms for bson over http'
//20000 'rows' 11556616 'bytes'

//runJson().catch(err => console.error(`Catch: ${err}`));
//1247.1204530000687 '-ms for json over http'
//20000 'rows'