"use strict";

const REQUEST_PARALLEL_COUNT = 100;
const DEFAULT_BG_WORKER_PORT = 45020;

const os = require('os');
const Netmask = require('netmask').Netmask;
const isPortReachable = require('is-port-reachable');

const commander = require('./commander.js');
const config = require('./config.json');

function getInterfaces() {
    const interfaces = os.networkInterfaces();
    return Object.values(interfaces)
        .reduce((arr, candidate) => arr.concat(Array.isArray(candidate) ? candidate : [candidate]), [])
        .filter(addr => addr['address'] && addr['netmask'] && addr['family'] === 'IPv4')
        .filter(addr => addr['address'] !== config.localhost_address)
        .map(addr => new Netmask(addr['address'] + '/' + addr['netmask']));
}

async function isValidHostName(host, port, name) {
    const url = getWsUrl(host, port);
    try {
        const greeting = await commander.run(url, 'hello');
        if (Array.isArray(name) && name.length) {
            return name.includes(greeting.data)
        } else if (name && !Array.isArray(name)) {
            return greeting.data === name;
        }
        return greeting.data;
    } catch {
        return false;
    }
}

function getWsUrl(host, port) {
    return `ws://${host}:${port}`;
}

module.exports.findWorkerUrl = async function() {
    process.stdout.write('Looking for WS-WORKER instances on the network... ');

    const allowedPorts = config.background_worker_port || DEFAULT_BG_WORKER_PORT;
    const allowedHostnames = config.allowed_background_worker_hostnames;

    const candidates = config.allow_localhost_worker ? [config.localhost_address] : [];
    getInterfaces().forEach(intf => intf.forEach(addr => {
        candidates.push(addr);
    }));

    let pos = 0;
    while (pos < candidates.length) {
        const promises = candidates.slice(pos, pos + REQUEST_PARALLEL_COUNT)
            .map(c => isPortReachable(allowedPorts, {host: c}).then(res => Promise.resolve({host: c, result: res})));
        const results = await Promise.all(promises);

        const hit = results.find(r => r.result);
        if (hit && await isValidHostName(hit.host, allowedPorts, allowedHostnames)) {
            const url = getWsUrl(hit.host, allowedPorts);
            console.log(`found at ${url}`);
            return url;
        }
        pos += REQUEST_PARALLEL_COUNT;
    }
    console.log('none found.');
    return false;
};