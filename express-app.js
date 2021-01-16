
const express = require('express');

module.exports = (lazy_mount, logger) => {
    const app = express();
    app.get('/', (_req, res) => res.end('Hello!'));
    // bson or json stream from mongodb cursor
    lazy_mount(app, '/stream', 'stream_router');
    // some rarely used router
    lazy_mount(app, '/rare', 'rare_router');
    
    app.use((error, req, res, next) => {
        logger.error('Log error:', error);
        next(error);
    });
    
    app.use((error, req, res, next) => {
        logger.error('Handled url:', req.url);
        res.status(500).send('Something broken!');
        next(error);
    });

    return app;
}

module.exports.sname = "express-app";
module.exports.deps = [ "lazy_mount", "logger" ];