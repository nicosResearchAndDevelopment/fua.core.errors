const
    util   = require('./util.js'),
    errors = exports;

/** @see https://nodejs.org/api/errors.html */
errors.Error = Error;
errors.TypeError      = TypeError;
errors.RangeError     = RangeError;
errors.ReferenceError = ReferenceError;
errors.SyntaxError    = SyntaxError;
/** @see https://nodejs.org/api/assert.html#class-assertassertionerror */
errors.AssertionError = require('assert').AssertionError;
errors.AggregateError = AggregateError;

errors.http = {
    statusCodes:   util.HTTP_STATUS_CODES,
    RequestError:  require('./HTTPRequestError.js'),
    ResponseError: require('./HTTPResponseError.js')
};

/**
 * @param {Error} error
 * @returns {{
 *     type: string,
 *     [other: string]: any
 * }}
 */
errors.serialize = function (error) {
    if (!util.isError(error)) return;
    switch (error.name) {
        case 'AggregateError':
            return {
                type:    error.name,
                message: error.message,
                errors:  Array.from(error.errors).map(errors.serialize),
                cause:   errors.serialize(error.cause)
            };
        case 'AssertionError':
            return {
                type:     error.name,
                message:  error.message,
                code:     error.code,
                actual:   error.actual,
                expected: error.expected,
                operator: error.operator
            };
        case 'HTTPRequestError':
        case 'HTTPResponseError':
            return {
                type:          error.name,
                statusCode:    error.statusCode,
                statusMessage: error.statusMessage
            };
        case 'TypeError':
        case 'RangeError':
        case 'ReferenceError':
        case 'SyntaxError':
            return {
                type:    error.name,
                message: error.message
            };
        case 'Error':
        default:
            return {
                type:    error.name,
                message: error.message,
                code:    error.code
            };
    }
};

/**
 * @param {{
 *     type: string,
 *     [other: string]: any
 * }} param
 * @returns {Error}
 */
errors.parse = function (param) {
    if (!util.isObject(param)) return;
    switch (param.type || param.name) {
        case 'AggregateError':
            return new errors.AggregateError(
                Array.from(param.errors).map(errors.parse),
                param.message,
                {cause: errors.parse(param.cause)}
            );
        case 'AssertionError':
            return new errors.AssertionError({
                message:  param.message,
                actual:   param.actual,
                expected: param.expected,
                operator: param.operator
            });
        case 'HTTPRequestError':
            return new errors.http.RequestError({
                statusCode:    param.statusCode,
                statusMessage: param.statusMessage
            });
        case 'HTTPResponseError':
            return new errors.http.ResponseError({
                statusCode:    param.statusCode,
                statusMessage: param.statusMessage
            });
        case 'TypeError':
            return new errors.TypeError(param.message, {cause: errors.parse(param.cause)});
        case 'RangeError':
            return new errors.RangeError(param.message, {cause: errors.parse(param.cause)});
        case 'ReferenceError':
            return new errors.ReferenceError(param.message, {cause: errors.parse(param.cause)});
        case 'SyntaxError':
            return new errors.SyntaxError(param.message, {cause: errors.parse(param.cause)});
        case 'Error':
        default:
            const error = new errors.Error(param.message, {cause: errors.parse(param.cause)});
            if (param.type) error.name = param.type;
            if (param.name) error.name = param.name;
            if (param.code) error.code = param.code;
            return error;
    }
};

(function freeze(target) {
    Object.freeze(target);
    Object.values(target)
        .filter(value => value instanceof Object)
        .forEach(freeze);
})(errors);
module.exports = errors;
