const util = require('./util.js');

/** An error that occurred on the client because of a faulty server response. */
class HTTPResponseError extends Error {

    name = 'HTTPResponseError';

    constructor(...args) {
        let statusCode, statusText, httpResponse, errorCause;
        if (util.isNumber(args[0])) {
            statusCode   = util.isInteger(args[0]) && util.HTTP_STATUS_CODES[args[0]] && args[0] || 500;
            statusText   = util.isString(args[1]) && args[1] || util.HTTP_STATUS_CODES[statusCode];
            httpResponse = util.isObject(args[1]) && args[1].headers && args[1] || util.isObject(args[2]) && args[2].headers && args[2] || null;
            errorCause   = util.isObject(args[1]) && args[1].cause || util.isObject(args[2]) && args[2].cause || util.isObject(args[3]) && args[3].cause || null;
        } else if (util.isString(args[0])) {
            statusCode   = 500;
            statusText   = args[0] || util.HTTP_STATUS_CODES[statusCode];
            httpResponse = util.isObject(args[1]) && args[1].headers && args[1] || null;
            errorCause   = util.isObject(args[1]) && args[1].cause || util.isObject(args[2]) && args[2].cause || null;
        } else if (util.isObject(args[0])) {
            statusCode   = util.isInteger(args[0].status) && util.HTTP_STATUS_CODES[args[0].status] && args[0].status || util.isInteger(args[1].statusCode) && util.HTTP_STATUS_CODES[args[1].statusCode] && args[1].statusCode || 500;
            statusText   = util.isString(args[0].statusText) && args[0].statusText || util.isString(args[0].statusMessage) && args[0].statusMessage || util.HTTP_STATUS_CODES[statusCode];
            httpResponse = args[0].headers && args[0] || util.isObject(args[1]) && args[1].headers && args[1] || null;
            errorCause   = util.isObject(args[1]) && args[1].cause || util.isObject(args[2]) && args[2].cause || null;
        } else {
            statusCode   = 500;
            statusText   = util.HTTP_STATUS_CODES[statusCode];
            httpResponse = null;
            errorCause   = util.isObject(args[1]) && args[1].cause || null;
        }

        super(`[${statusCode}] ${statusText}`, errorCause && {cause: errorCause});
        this.code       = `ERR_HTTP_STATUS_${statusCode}`;
        this.status     = this.statusCode = statusCode;
        this.statusText = this.statusMessage = statusText;
        this.response   = httpResponse;
        util.hideProp(this, 'response', 'message', 'code', 'status', 'statusText');
        util.lockProp(this, 'response', 'message', 'code', 'status', 'statusText', 'statusCode', 'statusMessage');
    }

}

module.exports = HTTPResponseError;
