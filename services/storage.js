
module.exports = (thresshold) => {
    let acc = 0;
    return {
        add(a) {
            acc += a;
        },
        get exceeded() {
            return acc > thresshold.val;
        },
        get limit() {
            return thresshold.val;
        },
        get tot() {
            return acc;
        }
    }
};

module.exports.sname = "Storage";
module.exports.deps = ["thresshold"];