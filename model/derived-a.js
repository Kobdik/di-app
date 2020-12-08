
module.exports = (ClassA, logger) => {

    class DerivedA extends ClassA {

        constructor(name) {
            super(name);
        }

        sum(a, b) {
            logger.info(`${this.name} calculated ${a} + ${b}`);
            return a + b;
        }
        //throw new Error('DerivedA class fault!!');
    }

    return DerivedA;
};

module.exports.sname = "derived A";
module.exports.deps = ["ClassA", "logger"];
module.exports.detach = true;