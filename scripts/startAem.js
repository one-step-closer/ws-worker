"use strict";

const START_AEM_FILENAME_RX = /startAEM\.cmd$/;
const SKIPPED_FILENAMES_RX = /[\/\\](?:windows|temp|crx-quickstart|\$RECYCLE.BIN|AppData)[\/\\]/i;

const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;

module.exports = async function() {
    const fileName = await getStartAemFilename();
    if (fileName) {
        console.log('Located AEM runner at ' + fileName);
        exec('node ./process-runner.js --cmd="' + fileName + '"');
    }
};

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