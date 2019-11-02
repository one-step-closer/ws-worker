"use strict";

const exec = require('child_process').exec;

module.exports = async function() {
    let killResult = await killAemProcesses();
    if (killResult) {
        await pause(1000);                  // run for the second time so that if oak-run util was killed first, and cq-quickstart
        killResult = await killAemProcesses();  // has just started in a batch process, the latter would also be terminated
    }
    if (killResult) {
        await pause(2000);
    }
};

async function killAemProcesses() {
    try {
        const pids = await getAemPids();
        if (pids) {
            pids.forEach(pid => process.kill(pid, 'SIGINT'));
            return true;
        }
    } catch (e) {
        console.error(`Error terminating AEM process: ${e.message || e}`);
    }
    return false;
}

async function getAemPids() {
    return new Promise((resolve, reject) => {
        exec('jps -l -m', (err, stdout) => {
            if (err) {
                return reject(err);
            }
            const javaModRx = /(\d+)\s+(?:cq-quickstart|oak-run)/ig;
            const pids = [];
            let javaMod;
            while ((javaMod = javaModRx.exec(stdout)) != null) {
                pids.push(javaMod[1]);
            }
            resolve(pids.length ? pids : null);
        });
    });
}

async function pause(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

