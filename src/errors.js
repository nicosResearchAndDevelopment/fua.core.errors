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
errors.toJSON = function (error) {
    if (!util.isError(error)) return;
    switch (error.name) {
        case 'AggregateError':
            return {
                type:    error.name,
                message: error.message,
                errors:  Array.from(error.errors).map(errors.toJSON),
                cause:   errors.toJSON(error.cause)
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
errors.fromJSON = function (param) {
    if (!util.isObject(param)) return;
    switch (param.type || param.name) {
        case 'AggregateError':
            return new errors.AggregateError(
                Array.from(param.errors).map(errors.fromJSON),
                param.message,
                {cause: errors.fromJSON(param.cause)}
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
            return new errors.TypeError(param.message, {cause: errors.fromJSON(param.cause)});
        case 'RangeError':
            return new errors.RangeError(param.message, {cause: errors.fromJSON(param.cause)});
        case 'ReferenceError':
            return new errors.ReferenceError(param.message, {cause: errors.fromJSON(param.cause)});
        case 'SyntaxError':
            return new errors.SyntaxError(param.message, {cause: errors.fromJSON(param.cause)});
        case 'Error':
        default:
            const error = new errors.Error(param.message, {cause: errors.fromJSON(param.cause)});
            if (param.type) error.name = param.type;
            if (param.name) error.name = param.name;
            if (param.code) error.code = param.code;
            return error;
    }
};

/**
 * @param {Error} error
 * @returns {string}
 */
exports.stringify = function (error) {
    if (!util.isError(error)) throw new Error('error must be an error');
    const param = errors.toJSON(error);
    if (!util.isObject(param)) throw new Error('param must be an object');
    return JSON.stringify(param);
};

/**
 * @param {string | Buffer} value
 * @returns {Error}
 */
exports.parse = function (value) {
    if (!util.isString(value) && !util.isBuffer(value)) throw new Error('value must be a string or a Buffer');
    const param = JSON.parse(value);
    if (!util.isObject(param)) throw new Error('param must be an object');
    return errors.fromJSON(param);
};

/**
 * @param {string} [errName='Error']
 * @param {string} [errCode='']
 * @param {function(this: Error, ...args: any): void} [errInit]
 * @returns {function(message: string, ...args: any): Error}
 */
errors.createClass = function (errName = 'Error', errCode = '', errInit) {
    const CustomError = function (message = '', ...args) {
        if (!new .target) {
            const that = new CustomError(message, ...args);
            Error.captureStackTrace(that, CustomError);
            return that;
        }
        Error.captureStackTrace(this, CustomError);
        Object.defineProperties(this, {
            message: {value: message}
        });
        if (errInit) errInit.apply(this, args);
    };

    CustomError.prototype = Object.create(Error.prototype);

    Object.defineProperties(CustomError.prototype, {
        constructor: {value: CustomError},
        name:        {value: errName},
        code:        {value: errCode}
    });

    Object.defineProperties(CustomError, {
        name: {value: errName}
    });

    return CustomError;
};

(function freeze(target) {
    if (Error === target || Error.isPrototypeOf(target)) return;
    Object.freeze(target);
    Object.values(target)
        .filter(value => value instanceof Object)
        .forEach(freeze);
})(errors);
module.exports = errors;
