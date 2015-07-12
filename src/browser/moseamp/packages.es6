import fs from 'fs-extra';
import path from 'path';
import remote from 'remote';

import {absReaddirSync} from 'moseamp/util';


const CONFIG_DIR = remote.require('./config').CONFIG_DIR;
const PACKAGE_DIR = path.join(CONFIG_DIR, 'packages');
const DEFAULT_PACKAGE_DIR = path.join(__dirname, 'packages');

export let loadedPackages = [];


export function load() {
    let packageDirectories = (absReaddirSync(DEFAULT_PACKAGE_DIR)
                              .concat(absReaddirSync(PACKAGE_DIR)));
    for (let packageDirectory of packageDirectories) {
        let pack = new Package(packageDirectory);
        loadedPackages.push(pack);
        pack.activate();
    }
}


export class Package {
    constructor(directory) {
        this.directory = directory;
        this.packageJSON = JSON.parse(fs.readFileSync(this.path('package.json')));
        this.main = require(this.path(this.packageJSON.main));
    }

    path(...components) {
        return path.join(this.directory, ...components);
    }

    activate() {
        this.main.activate();
    }

    deactivate() {
        if (this.main.deactivate) {
            this.main.deactivate();
        }
    }
}
