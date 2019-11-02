"use strict";

const {exec, spawn} = require('child_process');
const path = require('path');
const minimist = require('minimist');

(async() => {
    const args = minimist(process.argv.slice(2));
    if (args['exe']) {
        exec(args['exe'], {cwd: path.dirname(args['exe'])}, runnerCallback);
    } else if (args['cmd']) {
        exec('start cmd @cmd /k "' + args['cmd'] + '"', {cwd: path.dirname(args['cmd'])});
    }
    await pause(1000);
    process.exit(0);
})();

async function pause(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}
