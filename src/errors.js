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
 * @typedef {{
 *     name?: string,
 *     code?: number | string,
 *     message?: string,
 *     cause?: ErrorJSON,
 *     [other: string]: boolean | number | string
 * }} ErrorJSON
 */

/**
 * @param {Error | ErrorJSON | string} error
 * @returns {ErrorJSON}
 */
errors.toJSON = function (error) {
    if (!util.isDefined(error)) return;
    if (util.isFunction(error?.toJSON)) return error.toJSON();

    const
        {name, message, code, stack, cause, ...other} = util.isObject(error) ? error : {message: error},
        errJSON                                       = {
            name:    util.isString(name) ? name : 'Error',
            message: util.isString(message) ? message : 'undefined',
            code:    util.isString(code) || util.isInteger(code) ? code : undefined,
            stack:   stack ? util.isString(stack) : undefined,
            cause:   cause ? errors.toJSON(cause) : undefined
        };

    for (let [key, value] of Object.entries(other)) {
        if ((key in errJSON) || errJSON[key]) continue;
        if (!util.isPrimitive(value)) continue;
        errJSON[key] = value;
    }

    return errJSON;
};

// TODO improve error parsing

const errorParsers = Object.freeze({
    Error:             ({message, cause}) => new errors.Error(message, {cause: errors.fromJSON(cause)}),
    TypeError:         ({message, cause}) => new errors.TypeError(message, {cause: errors.fromJSON(cause)}),
    RangeError:        ({message, cause}) => new errors.RangeError(message, {cause: errors.fromJSON(cause)}),
    SyntaxError:       ({message, cause}) => new errors.SyntaxError(message, {cause: errors.fromJSON(cause)}),
    ReferenceError:    ({message, cause}) => new errors.ReferenceError(message, {cause: errors.fromJSON(cause)}),
    AssertionError:    ({message, actual, expected, operator, cause}) => new errors.AssertionError({
        message,
        actual,
        expected,
        operator,
        cause: errors.fromJSON(cause)
    }),
    AggregateError:    ({message, errors, cause}) => new errors.AggregateError(
        Array.from(errors).map(errors.fromJSON), message,
        {cause: errors.fromJSON(cause)}
    ),
    HTTPRequestError:  ({statusCode, statusMessage, request, cause}) => new errors.http.RequestError({
        statusCode, statusMessage, request, cause
    }),
    HTTPResponseError: ({statusCode, statusMessage, response, cause}) => new errors.http.ResponseError({
        statusCode, statusMessage, response, cause
    })
});

/**
 * @param {Error | ErrorJSON | string} param
 * @returns {Error}
 */
errors.fromJSON = function (param) {
    if (!util.isDefined(param)) return;
    if (param instanceof Error) return param;

    const
        {name, message, code, stack, cause, ...other} = util.isObject(param) ? param : {message: param},
        errorParser                                   = errorParsers[name || 'Error'] || errorParsers.Error,
        error                                         = errorParser({name, message, code, stack, cause, ...other});

    if (util.isString(name)) error.name ??= name;
    if (util.isString(message)) error.message ??= message;
    if (util.isString(code) || util.isInteger(code)) error.code ??= code;
    if (util.isString(stack)) error.stack ??= stack;
    if (util.isObject(cause)) error.cause ??= errors.fromJSON(cause);

    if (!stack) Error.captureStackTrace(error, errors.fromJSON);

    for (let [key, value] of Object.entries(other)) {
        if ((key in error) || error[key]) continue;
        if (!util.isPrimitive(value)) continue;
        error[key] = value;
    }

    return error;
};

(function freeze(target) {
    Object.freeze(target);
    Object.values(target)
        .filter(value => value instanceof Object)
        .forEach(freeze);
})(errors);
module.exports = errors;
