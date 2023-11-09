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

// TODO improve error/json conversion and naming

// /**
//  * @typedef {{
//  *     name?: string,
//  *     code?: number | string,
//  *     message?: string,
//  *     cause?: ErrorJSON,
//  *     [other: string]: boolean | number | string
//  * }} ErrorJSON
//  */
//
// /**
//  * @param {Error | ErrorJSON | string} err
//  * @returns {ErrorJSON}
//  */
// errors.toJSON = function (err) {
//     if (util.isFunction(err?.toJSON)) return err.toJSON();
//     const
//         {name, code, message, cause, ...other} = util.isObject(err) ? err : {message: err},
//         errJSON                                = {
//             name:    util.isString(name) ? name : 'Error',
//             code:    util.isString(code) || util.isNumber(code) ? code : undefined,
//             message: util.isString(message) ? message : 'unknown',
//             cause:   cause ? errors.toJSON(cause) : undefined
//         };
//     for (let [key, value] of Object.entries(other)) {
//         if (errJSON[key]) continue;
//         if (!util.isPrimitive(value)) continue;
//         errJSON[key] = value;
//     }
//     return errJSON;
// };
//
// errors.fromJSON = function (errJSON) {
//     if (errJSON instanceof Error) return errJSON;
//     const
//         customErrors                           = {
//             HTTPRequestError:  () => new errors.http.RequestError(errJSON),
//             HTTPResponseError: () => new errors.http.ResponseError(errJSON)
//         },
//         {name, code, message, cause, ...other} = util.isObject(errJSON) ? errJSON : {message: errJSON};
//     if (name in customErrors) return customErrors[name]();
//     const
//         nativeErrors = {
//             Error,
//             TypeError
//         },
//         err          = new (nativeErrors[name] || Error)(
//             util.isString(message) ? message : 'unknown',
//             cause ? {cause: errors.fromJSON(cause)} : undefined
//         );
//     if (util.isString(name)) err.name = name;
//     if (util.isString(code) || util.isNumber(code)) err.code = code;
//     Error.captureStackTrace(err, errors.fromJSON);
//     let errCause = err.cause;
//     while (errCause) {
//         Error.captureStackTrace(errCause, errors.fromJSON);
//         errCause = errCause.cause;
//     }
//     for (let [key, value] of Object.entries(other)) {
//         if (err[key]) continue;
//         if (!util.isPrimitive(value)) continue;
//         err[key] = value;
//     }
//     return err;
// };

(function freeze(target) {
    Object.freeze(target);
    Object.values(target)
        .filter(value => value instanceof Object)
        .forEach(freeze);
})(errors);
module.exports = errors;
