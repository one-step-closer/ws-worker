const WORKER = require('./worker.js');
const SCOUT = require('./scout.js');
const COMMANDER = require('./commander.js');

const path = require('path');
const constants = require('./constants.js');

function getSecondaryScript(scriptArg) {
    const noop = ()=>{};
    if (!scriptArg || !/\.js$/.test(scriptArg)) {
        return noop;
    }
    try {
        return require(path.resolve(process.cwd(), scriptArg));
    } catch (e) {
        return noop;
    }
}

(async () => {
    const args = require('minimist')(process.argv.slice(2));
    const command = args['command'];

    const successScript = args['ifYes'] || args['ifTrue'] || args['ifResult'];
    const failureScript = args['ifNo'] || args['ifFalse'] || args['ifNoResult'];

    let url = args['url'];

    if (!url && !command) {
        WORKER.start(constants.WORKER_PORT);
        return;
    }

    url = url || await SCOUT.getWorkerUrl(constants.WORKER_PORT, constants.WORKER_NAME);
    if (!url) {
        return getSecondaryScript(failureScript)();
    }

    let result;
    try {
        result = await COMMANDER.run(url, command);
    } catch (e) {
        let errorMsg = ('error' in e) ? e.error : e;
        if ('message' in errorMsg) errorMsg = e.message;
        console.error(errorMsg);
        return;
    }

    if (result.data) {
        getSecondaryScript(successScript)(result);
    } else {
        getSecondaryScript(failureScript)(result);
    }
})();

