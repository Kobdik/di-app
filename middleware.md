# Lazy loading Express middleware

Imagine a web server that has dozens of services. If its startup speed is critical, then asynchronous **Lazy Loading** of services solves that problem. It will allow the application to launch faster, with the minimal count of necessary services. Even while loading dependencies graph the server stays still responsive.

For example, there are *rare_router* service, that still not loaded. The middleware function mounted at the path */rare*. Only when it executed first time, the appropriate service will load and mount at the specified path, then will respond to the client request.

``` js
// fragment from express-app.js
const express = require('express');

module.exports = (lazy_mount) => {
    const app = express();
    app.get('/', (_req, res) => res.end('Hello!'));

    // some rarely used testing router 
    lazy_mount(app, '/rare', 'rare_router');
    
    return app;
}

module.exports.sname = "express-app";
module.exports.deps = [ "lazy_mount", "logger" ];

// function definition from lazy-mount.js
function lazy_mount(app, path, key) {
    let mounted = false;
    app.use(path, (_req, _res, next) => {
        // when mounted skip to the next middleware
        // (router) mounted at the specified path
        if (mounted) next();
        else di.get(key, 'lazy-mount')
        .then(router => {
            // mount loaded router
            app.use(path, router);
            logger.info(`The router ${key} was mounted on ${path}`);
            mounted = true;
            next();
        })
        .catch(next);
    });
}

```

Simple HTTP Server with Express.

``` js
// server.js
const http = require('http');
const di = require('di-async')();
di.join(require('./web-modules.json'));

const run = async () => {

    const logger = await di.get('logger');
    const config = await di.get('config');
    // express-app service
    const app = await di.get('app');

    server = http.createServer(app);
 
    server.listen(config.PORT, () => {
        logger.info(`HTTP Server is listening on port ${config.PORT}`);
    });

    setTimeout(() => {
        server.close(() => logger.info('HTTP Server closed by timeout'));
    }, 60000);
}

run().catch(err => logger.error(`Catch error: ${err}`));
```

Run it and make some requests from the browser.

``` log
info: WS Server is listening
info: HTTP Server is listening on port 4000

http://localhost:4000/rare/1
info: The rare-router is ready to use!
info: The router rare_router was mounted on /rare
info: rare requested with id=1

http://localhost:4000/rare/2
info: rare requested with id=2

info: HTTP Server closed by timeout
```
