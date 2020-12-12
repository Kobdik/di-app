
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
    //return new Promise(resolve => setTimeout(resolve, 2000, DerivedA));
};

module.exports.sname = "derived A";
module.exports.deps = ["ClassA", "logger"];