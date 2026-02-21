
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

const getFiles = (pattern) => {
    // glob patterns must use forward slashes even on Windows
    const p = pattern.replace(/\\/g, '/');
    return new Promise((resolve, reject) => {
        glob(p, (err, files) => {
            if (err) reject(err);
            else resolve(files);
        });
    });
};

const ensureDir = async (dir) => {
    await fs.ensureDir(dir);
};

const log = {
    info: (msg) => console.log(chalk.blue(msg)),
    success: (msg) => console.log(chalk.green(msg)),
    error: (msg) => console.log(chalk.red(msg)),
    warn: (msg) => console.log(chalk.yellow(msg)),
};

module.exports = {
    getFiles,
    ensureDir,
    log,
};
