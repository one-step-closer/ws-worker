"use strict";

const hostile = require('hostile');

module.exports = results => {
    if (!results.data) {
        return;
    }
    const host = /(?:\d+\.){3}\d+/.exec(results.url);
    if (!host) {
        return;
    }
    hostile.set(host, 'aemhost', err => {
        if (!err) {
            console.log(`Set ${host} as "aemhost" address to HOSTS file`);
        } else {
            console.error(err)
        }
    });
};