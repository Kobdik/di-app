const dotenv = require('dotenv');

module.exports = () => {
    // common config
    const common = dotenv.config({ path: `${__dirname}/.env` });
    if (common.error) {
        throw new Error('Config file .env not found or not parsed!');
    }
    const dst = common.parsed;

    const stage = process.env.NODE_ENV || 'development';

    // select config file
    const select = dotenv.config({ path: `${__dirname}/.${stage}.env` });
    if (select.error) {
        throw new Error(`Config file ${stage}.env not found or not parsed!`);
    }
    const src = select.parsed;

    // src update dst
    const conf = Object.assign(dst, src);
    //console.log(conf);
    return conf;
};

module.exports.sname = "config";