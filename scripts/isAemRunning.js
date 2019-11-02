"use strict";

const http = require('http');
const isPortReachable = require('is-port-reachable');

const AEM_PORT = 4502;
const AEM_BASIC_AUTH = 'admin:admin';

async function isHttpServerOn() {
    return new Promise((resolve, reject) => {
        http.get({host: '127.0.0.1', port: AEM_PORT, path: '/', method: 'HEAD', auth: AEM_BASIC_AUTH}, response => {
            if (response.statusCode === 200) {
                return resolve(true);
            }
            resolve(false);
        }).on('error', function(e) {
            reject(e);
        });
    });
}

module.exports = async function () {
    try {
        if (!await isPortReachable(AEM_PORT)) {
            return false;
        }
        return await isHttpServerOn();
    } catch {
        return false;
    }
};

