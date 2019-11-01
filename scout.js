const REQUEST_PARALLEL_COUNT = 100;

const os = require('os');
const Netmask = require('netmask').Netmask;
const isPortReachable = require('is-port-reachable');

const COMMANDER = require('./commander.js');

function getInterfaces() {
    const interfaces = os.networkInterfaces();
    return Object.values(interfaces)
        .reduce((arr, candidate) => arr.concat(Array.isArray(candidate) ? candidate : [candidate]), [])
        .filter(addr => addr['address'] && addr['netmask'] && addr['family'] === 'IPv4')
        .filter(addr => addr['address'] !== '127.0.0.1')
        .map(addr => new Netmask(addr['address'] + '/' + addr['netmask']));
}

async function isValidHostName(host, port, name) {
    if (!name)  {
        return true
    }
    const introduction = await COMMANDER.run(getWssLink(host, port), 'introduce');
    return introduction.data === name;
}

function getWssLink(host, port) {
    return `ws://${host}:${port}`;
}

module.exports.getWorkerUrl = async function(port, hostname) {
    process.stdout.write('Looking for WS-WORKER instances on the network... ');
    const candidates = [];
    getInterfaces().forEach(intf => intf.forEach(addr => {
        candidates.push(addr);
    }));
    let pos = 0;
    while (pos < candidates.length) {
        const promises = candidates.slice(pos, pos + REQUEST_PARALLEL_COUNT)
            .map(c => isPortReachable(port, {host: c}).then(res => Promise.resolve({host: c, result: res})));
        const results = await Promise.all(promises);

        const hit = results.find(r => r.result);
        if (hit && await isValidHostName(hit.host, port, hostname)) {
            const url = getWssLink(hit.host, port);
            console.log(`found at ${url}`);
            return url;
        }
        pos += REQUEST_PARALLEL_COUNT;
    }
    console.log('none found.');
    return false;
};