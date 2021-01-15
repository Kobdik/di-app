const express = require('express');

module.exports = () => {
    const router = express.Router();

    router.get('/:id', (req, res) => {
        res.end(`get rare for id= ${req.params.id}`);
    });
    
    router.get('/', (req, res) => {
        res.end('get rare');
    });
    
    const postRare = async (req, res) => {
        await Promise.resolve('Ok');
        res.end('post rare');
    };
    router.post('/', (req, res, next) => postRare(req, res).catch(next));
    console.log('rare is ready!');
    return router;
};

module.exports.name = "rare-router";