"use strict";

const LOG_TRUNK_LENGTH = 150;

const WebSocket = require('ws');
const requireFromString = require('require-from-string');
const os = require('os');

const config = require('./config.json');

module.exports.start = (port) => {
    console.log('WS-WORKER listening at port ' + port);
    const startMessageLoop = ws => ws.on('message', async message => {
        const response = await handleCommand(message);
        ws.send(response);
        ws.close();
    });
    const verifyClientFunc = info => {
        const headers = info.req.headers;
        if (!config.allowed_client_hostnames.length || headers.host.startsWith(config.localhost_address)) {
            return true;
        }
        if (!headers.from) {
            return false;
        }
        return config.allowed_client_hostnames.includes(headers.from);
    };
    const webSocketServer = new WebSocket.Server({port: port, verifyClient: verifyClientFunc});
    webSocketServer.on('connection', startMessageLoop);
};

const builtInHandlers = {
    hello: () => os.hostname(),
    locate: () => 'true'
};

async function handleCommand(value) {
    let result ='';
    if (!value) {
        return result;
    }
    if (value in builtInHandlers) {
        process.stdout.write(`>> [  ${value}  ]`);
        result = await builtInHandlers[value]();
        console.log('  << ' + result);
        return result;
    }

    process.stdout.write(`>> {  ${truncateCommand(value)}  }`);

    try {
        result = await requireFromString(value)();
        console.log('  << ' + result);
    } catch (e) {
        console.log(`  << error: ${e.message || e.toString()}`);
    }
    return result + '';
}

function truncateCommand(value) {
    let trunk = value.replace(/['"]use strict['"];/i, '').replace(/\s+/gs, ' ').trim();
    if (trunk.length > LOG_TRUNK_LENGTH) {
        trunk = trunk.slice(0, LOG_TRUNK_LENGTH-3) + '...';
    }
    return trunk;
}

