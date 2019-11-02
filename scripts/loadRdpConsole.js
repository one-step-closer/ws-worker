"use strict";

const exec = require('child_process').exec;

module.exports = function(result) {
    const host = /(?:\d+\.){3}\d/.exec(result.url)[0];
    exec(`mstsc /console /v:${host}`);
};