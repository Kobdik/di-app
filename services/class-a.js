
module.exports = (logger) => {

    class ClassA {

        constructor(name) {
            this._name = name;
            logger.info(`${this.name} saccessfully created`);
        }

        get name() {
            return this._name;
        }

    }

    return ClassA;
};

module.exports.sname = "class A";
module.exports.deps = ["logger"];