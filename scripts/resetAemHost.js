"use strict";

const hostile = require('hostile');

module.exports = () => {
    hostile.set('127.0.0.1', 'aemhost', err => {
        if (!err) {
            console.log(`Reset "aemhost" alias to 127.0.0.1 in HOSTS file`);
        } else if (err['code'] === 'EPERM') {
            console.error('Cannot reset "aemhost" alias in HOSTS file, try to run as root/Administrator');
        } else{
            console.error(err)
        }
    });
};