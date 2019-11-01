const WebSocket = require('ws');
const os = require('os');
const isPortReachable = require('is-port-reachable');

const constants = require('./constants.js');

module.exports.start = (port) => {
    console.log('WS-WORKER listening at port ' + port);
    const startMessageLoop = ws => ws.on('message', async message => {
        const response = await handleMessage(message);
        ws.send(response);
        ws.close();
    });
    new WebSocket.Server({port: port}).on('connection', startMessageLoop);
};

const handlers = {
    introduce: () => os.hostname(),
    is_aem_on: () => isPortReachable(constants.AEM_PORT),
};

async function handleMessage(value) {
    process.stdout.write(`>> ${value}`);
    if (value in handlers) {
        const result = await handlers[value]();
        console.log(' << ' + result);
        return result;
    }
    console.log(' [unknown command]');
    return value;
}

