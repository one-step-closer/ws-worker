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
    hostile.set(host[0], 'aemhost', err => {
        if (!err) {
            console.log(`Set "aemhost" alias to ${host} in HOSTS file`);
        } else if (err['code'] === 'EPERM') {
            console.error('Cannot set "aemhost" alias to HOSTS file, try to run as root/Administrator');
        } else{
            console.error(err)
        }
    });
};