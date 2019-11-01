const WebSocket = require('ws');
const constants = require('./constants.js');

module.exports.run = async(url, command) => {
    if (!url || !command) {
        return Promise.resolve();
    }

    let connection, timeout;
    const connectionPromise = new Promise((resolve, reject) => {
        connection = new WebSocket(url, null, null);
        connection.onopen = () => {
            connection.send(command, {fin: true}, null);
        };
        connection.onerror = (error) => {
            console.error(`WebSocket error: ${error.message}`);
            clearTimeout(timeout);
            reject({url: url, command: command, error: error});
        };
        connection.onmessage = (e) => {
            clearTimeout(timeout);
            resolve({url: url, command: command, data: e.data});
        }
    });

    const timeoutPromise = new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
            if (connection) {
                connection.close();
            }
            reject({url: url, command: command, error: 'timeout'})
        }, constants.COMMAND_TIMEOUT);
    });

    return Promise.race([connectionPromise, timeoutPromise]);
};