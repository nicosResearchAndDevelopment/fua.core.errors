const errors = exports;

// TODO

(function freeze(target) {
    Object.freeze(target);
    Object.values(target)
        .filter(value => value instanceof Object)
        .forEach(freeze);
})(errors);
module.exports = errors;
