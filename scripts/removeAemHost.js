"use strict";

const hostile = require('hostile');

module.exports = () => {
    hostile.set('127.0.0.1', 'aemhost', err => {
        if (!err) {
            console.log(`Set 127.0.0.1 as "aemhost" address to HOSTS file`);
        } else {
            console.error(err)
        }
    });
};