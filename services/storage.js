
module.exports = (tresshold) => {
    let acc = 0;
    return {
        add(a) {
            acc += a;
        },
        get exceeded() {
            return acc > tresshold.val;
        },
        get limit() {
            return tresshold.val;
        },
        get tot() {
            return acc;
        }
    }
};

module.exports.sname = "Storage";
module.exports.deps = ["tresshold"];