
module.exports = (person) => {

    return {
        ask() {
            return `My name is ${person.name}`;
        }
    }    
};

module.exports.sname = "student service";
module.exports.deps = ["person"];