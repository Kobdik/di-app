
module.exports = (ClassA) => {

    class DerivedA extends ClassA {

        constructor(name) {
            super(name);
        }

        sum(a, b) {
            return a + b;
        }

    }
    return DerivedA;
    //return new Promise(resolve => setTimeout(resolve, 2000, DerivedA));
};

module.exports.sname = "derived A";
module.exports.deps = ["ClassA"];