
module.exports = (storage, logger) => {
    let acc = 0;
    return {
        add(a) {
            logger.info(`${a} added to ${acc}`);
            storage.add(a);
            acc += a;
            if (storage.exceeded)
                logger.info(`Storage limit ${storage.limit} exceeded by ${storage.tot - storage.limit} !`);
        },
        get tot() {
            return acc;
        },
    }
};

module.exports.sname = "Accumulator";
module.exports.deps = ["storage", "logger"];