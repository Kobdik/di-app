const http = require('http');
const di = require('di-async')();
di.join(require('./web-modules.json'));

const run = async () => {
    const logger = await di.get('logger');
    const config = await di.get('config');
    // express-app service
    const app = await di.get('app');

    server = http.createServer(app);
    di.set('http_server', server);
    //ws_server depends on http_server
    const wss = await di.get('ws_server');
    wss.on('listening', () => logger.info('WS Server is listening'));
 
    server.listen(config.PORT, () => {
        logger.info(`HTTP Server is listening on port ${config.PORT}`);
    });

    setTimeout(() => {
        di.get("mongo_gate").then(gate => {
            gate.close();
            logger.info('gate closed');
        });
        server.close(() => logger.info('HTTP Server closed by timeout'));
    }, 60000);
}

run().catch(err => logger.error(`Catch error: ${err}`));