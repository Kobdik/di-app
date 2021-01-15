const http = require('http');
//const logger = { info: console.log, error: console.error }
const di = require('./di-async')();
di.join(require('./web-modules.json'));

const run = async () => {

    const config = await di.get('config');
    const app = await di.get('app');

    server = http.createServer(app);
    di.set('http_server', server);
    //ws_server depends on http_server
    const wss = await di.get('ws_server');
    wss.on('listening', () => console.log('WS Server is listening'));
 
    server.listen(config.PORT, () => {
        console.log(`HTTP Server is listening on port ${config.PORT}`);
    });

    setTimeout(() => {
        di.get("mongo_gate").then(gate => {
            gate.close();
            console.log('gate closed');
        });
        server.close(() => console.log('HTTP Server closed by timeout'));
    }, 90000);
}

run().catch(err => console.error(`Catch error: ${err}`));