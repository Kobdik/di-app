const { MongoClient } = require("mongodb");

module.exports = (config) => {
    const client = new MongoClient(config.MONGO_GATE, {
        keepAlive: true,
        keepAliveInitialDelay: 12000,
        connectTimeoutMS: 6000,
        socketTimeoutMS: 60000,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });
    // promised client
    return client.connect();
};

module.exports.sname = "mongo gate";
module.exports.deps = ["config"];