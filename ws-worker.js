"use strict";

const background = require('./background.js');
const scout = require('./scout.js');
const commander = require('./commander.js');

const path = require('path');
const fs = require('fs');

const config = require('./config.json');

const noop = ()=>{};

function getSecondaryScript(scriptArg, asString) {
    const defaultResult = asString ? '' : noop;
    if (!scriptArg) {
        return defaultResult;
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

(async () => {
    const args = require('minimist')(process.argv.slice(2));
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
        result = await commander.run(url, getSecondaryScript(command, true));
    } catch (e) {
        let errorMsg = ('error' in e) ? e.error : e;
        if ('message' in errorMsg) errorMsg = e.message;
        console.error(errorMsg);
        return;
    }

    if (result.data && !/^false$/i.test(result.data)) {
        getSecondaryScript(successScript)(result);
    } else {
        getSecondaryScript(failureScript)(result);
    }
})();

