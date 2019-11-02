"use strict";

const WebSocket = require('ws');
const os = require('os');
const config = require('./config.json');

module.exports.run = async(url, command) => {
    if (!url || !command) {
        return Promise.resolve({url: url, command: command, error: new Error('Invalid arguments')});
    }

    let connection, timeout;
    const connectionPromise = new Promise((resolve, reject) => {
        connection = new WebSocket(url, null, {headers: {from: os.hostname()}});
        connection.onopen = () => {
            connection.send(command, {fin: true}, null);
        };
        connection.onerror = (error) => {
            if (!error.message.includes('401') || command !== 'hello') {
                console.error(`WebSocket error: ${error.message}`);
            }
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
            reject({url: url, command: command, error: new Error('Timeout')})
        }, config.command_timeout);
    });

    return Promise.race([connectionPromise, timeoutPromise]);
};