import fs from 'fs-extra';
import path from 'path';

import {CONFIG_DIR} from 'moseamp/config';
import {absReaddirSync} from 'moseamp/util';


const PACKAGE_DIR = path.join(CONFIG_DIR, 'packages');

export let loadedPackages = [];


export function load() {
    for (let packageDirectory of absReaddirSync(PACKAGE_DIR)) {
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
