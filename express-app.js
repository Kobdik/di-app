
const express = require('express');

module.exports = (routes) => {
    const app = express();
    app.get('/', (_req, res) => res.end('Hello!'));
    //bson or json stream
    app.use('/stream', routes.stream_router);
    //some rarely used routes
    routes.mount(app, '/rare1', 'rare_router');
    routes.mount(app, '/rare2', 'rare_router');
        
    app.use((error, req, res, next) => {
        console.error('Log error:', error);
        next(error);
    });
    
    app.use((error, req, res, next) => {
        console.error('Handled url:', req.url);
        res.status(500).send('Something broken!');
        next(error);
    });

    return app;
}

module.exports.sname = "express-app";
module.exports.deps = ["routes"];