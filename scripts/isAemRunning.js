"use strict";

const isPortReachable = require('is-port-reachable');
const AEM_PORT = 4502;

module.exports = async function () {
    try {
        return await isPortReachable(AEM_PORT);
    } catch {
        return false;
    }
};