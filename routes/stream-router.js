const express = require('express');
const JSONStream = require('JSONStream');

module.exports = (find_collection) => {

    const router = express.Router();

    const get_bson = async (req, res) => {
        const cname = req.query.cname;
        const cnt = +req.query.cnt || 20;
        //console.log(cname, cnt, 'requested');
        res.set('Content-Type', 'application/octet-stream');
        find_collection(cname, {
            w: 0,
            raw: true, // data as BSON
            strict: true
        }).then(collection =>
            collection
            .find({}, { skip: 0, limit: cnt })
            .pipe(res)
        );
    };

    const get_json = async (req, res) => {
        const cname = req.query.cname;
        const cnt = +req.query.cnt || 20;
        //console.log(cname, cnt, requested');
        res.set('Content-Type', 'application/json');
        find_collection(cname, {
            w: 0,
            raw: false, //data as JSON
            strict: true
        }).then(collection =>
            collection
            .find({}, { skip: 0, limit: cnt })
            .pipe(JSONStream.stringify('[', ',', ']'))
            .pipe(res)
        );
    };

    router.get('/bson', (req, res, next) => get_bson(req, res).catch(next));

    router.get('/json', (req, res, next) => get_json(req, res).catch(next));

    return router;
}

module.exports.sname = "stream-router";
module.exports.deps = [ "find_collection" ];