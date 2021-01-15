
module.exports = (mongo_gate) => {
    const db = mongo_gate.db();
    return function (cname, opts) {
        return new Promise((resolve, reject) => {
            db.collection(cname, opts, (err, collection) => {
                if (err) reject(err);
                resolve(collection);
            });
        });
    }
};

module.exports.sname = "gate collection";
module.exports.deps = ["mongo_gate"];