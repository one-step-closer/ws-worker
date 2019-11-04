"use strict";

const background = require('./background.js');
const scout = require('./scout.js');
const commander = require('./commander.js');

const path = require('path');
const fs = require('fs');
const Service = require('node-windows').Service;

const config = require('./config.json');

const noop = ()=>{};

(async () => {
    const args = require('minimist')(process.argv.slice(2));

    if (args['install']) {
        return installService();
    } else if (args['uninstall']) {
        return uninstallService();
    }

    const command = args['command'] || args ['run'];

    const successScript = args['ifYes'] || args['ifTrue'] || args['ifResult'];
    const failureScript = args['ifNo'] || args['ifFalse'] || args['ifNoResult'];

    let url = args['url'];

    if (!url && !command) {
        background.start(config.background_worker_port);
        return;
    }

    url = url || await scout.findWorkerUrl();
    if (!url) {
        return getSecondaryScript(failureScript)();
    }

    let result;
    try {
        if (!/,/.test(command)) {
            result = await commander.run(url, getSecondaryScript(command, true));
        } else {
            for (const cmd of command.split(',')) {
                result = await commander.run(url, getSecondaryScript(cmd, true));
            }
        }
    } catch (e) {
        if (e.error && e.error.message) {
            console.error(e.error.message);
        } else if (e.message) {
            console.error(e.message);
        } else {
            console.error(e);
        }
        return;
    }

    if (result.data && !/^false$/i.test(result.data)) {
        getSecondaryScript(successScript)(result);
    } else {
        getSecondaryScript(failureScript)(result);
    }
})();


function installService() {
    const svc = getService();
    if (svc.exists) {
        return svc.restart();
    }
    svc.on('install',  () => svc.start());
    svc.install();
}

function uninstallService() {
    getService().uninstall()
}

function getService() {
    return new Service({
        name:'WsWorker',
        description: 'WsWorker Service for remotely running JS code',
        script: path.join(__dirname, 'ws-worker.js')
    });
}

function getSecondaryScript(scriptArg, asString) {
    const defaultResult = asString ? '' : noop;
    if (!scriptArg) {
        return defaultResult;
    } else if (scriptArg.startsWith('@')) {
        return scriptArg.substring(1);
    }
    const scriptPath = !/\.js/i.test(scriptArg)
        ? path.resolve(process.cwd(), 'scripts', scriptArg + '.js')
        : path.resolve(process.cwd(), scriptArg);
    if (!fs.existsSync(scriptPath)) {
        return defaultResult;
    }
    try {
        return asString
            ? fs.readFileSync(scriptPath, 'utf8')
            : require(scriptPath);
    } catch (e) {
        return defaultResult;
    }
}

