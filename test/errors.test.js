const
    {describe, test} = require('mocha'),
    expect           = require('expect'),
    errors           = require('../src/errors.js');

describe('fua.core.errors', function () {

    test.only('develop', function () {
        console.log(errors);
    });

});
