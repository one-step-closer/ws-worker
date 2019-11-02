"use strict";

const START_AEM_FILENAME_RX = /startAEM\.cmd$/;
const SKIPPED_FILENAMES_RX = /[\/\\](?:windows|temp|crx-quickstart|\$RECYCLE.BIN|AppData)[\/\\]/i;

const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;

module.exports = async function() {
    let killResult = await killAemProcesses();
    if (killResult) {
        await pause(1000);                  // run for the second time so that if oak-run util was killed first, and cq-quickstart
        killResult = await killAemProcesses();  // has just started in a batch process, the latter would also be terminated
    }
    if (killResult) {
        await pause(5000);
    }
    const fileName = await getStartAemFilename();
    if (fileName) {
        exec('cmd /c "' + fileName + '"', {cwd: path.dirname(fileName)});
    }
};

async function pause(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

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

async function getStartAemFilename() {
    return getWindowsDriveNames().then(driveNames => {
        if (!driveNames) {
            return '';
        }
        const search = (base) => {
            if (SKIPPED_FILENAMES_RX.test(base)) {
                return false;
            }
            let stat;
            try {
                stat = fs.statSync(base);
            } catch {
                return false; // this dir/file is inaccessible
            }
            if (stat.isDirectory()) {
                let entries;
                try {
                    entries = fs.readdirSync(base);
                } catch {
                    return false; // this directory cannot be listed
                }
                for (const file of entries) {
                    const entry_result = search(path.join(base, file));
                    if (entry_result) {
                        return entry_result;
                    }
                }
            }
            return START_AEM_FILENAME_RX.test(base) ? base : false;
        };
        for (const dn of driveNames) {
            const result = search(`${dn}:\\`);
            if (result) {
                return result;
            }
        }
        return '';
    });
}

async function getWindowsDriveNames() {
    return new Promise((resolve, reject) => {
        exec('wmic logicaldisk get name', (err, stdout) => {
            if (err) {
                return reject(err);
            }
            const driveRx = /(^\w):/gm;
            const drives = [];
            let driveMatch;
            while ((driveMatch = driveRx.exec(stdout)) != null) {
                drives.push(driveMatch[1]);
            }
            resolve(drives.length ? drives : null);
        })
    });
}