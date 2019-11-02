"use strict";

const hostile = require('hostile');

module.exports = () => {
    hostile.set('127.0.0.1', 'aemhost', err => {
        if (!err) {
            console.log(`Set "aemhost" alias to 127.0.0.1 in HOSTS file`);
        } else if (err['code'] === 'EPERM') {
            console.error('Cannot write "aemhost" alias to HOSTS, try run as root/Administrator');
        } else{
            console.error(err)
        }
    });
};