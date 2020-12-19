
module.exports = () => {
    let limit = 500;
    return {
        set val(a) {
            limit = a;
        },
        get val() {
            return limit;
        },
    }
};

module.exports.sname = "Tresshold";