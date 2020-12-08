
module.exports = () => {

    class ClassA {

        constructor(name) {
            this._name = name;
        }

        get name() {
            return this._name;
        }

    }

    return ClassA;
};

module.exports.sname = "class A";