const express = require('express');

module.exports = (logger) => {
    const router = express.Router();

    router.get('/:id', (req, res) => {
        logger.info(`rare requested with id=${req.params.id}`)
        res.end(`get rare for id=${req.params.id}`);
    });
    
    router.get('/', (req, res) => {
        logger.info('get rare');
        res.end('get rare');
    });
    
    const postRare = async (req, res) => {
        await Promise.resolve('Ok');
        logger.info('post rare');
        res.end('post rare');
    };
    router.post('/', (req, res, next) => postRare(req, res).catch(next));

    logger.info('The rare-router is ready to use!');
    return router;
};

module.exports.name = "rare-router";
module.exports.deps = [ "logger" ];