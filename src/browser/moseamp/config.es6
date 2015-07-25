import fs from 'fs-extra';
import path from 'path';

//import cson from 'season';
import osenv from 'osenv';


export const CONFIG_DIR = path.resolve(osenv.home(), '.moseamp');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.cson');
const CONFIG_TEMPLATE = path.resolve(__dirname, '../../../dot-moseamp');

let config = {};


export function load() {
    // If config directory doesn't exist, create it from the template.
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.copySync(CONFIG_TEMPLATE, CONFIG_DIR);
    }

    //config = cson.readFileSync(CONFIG_PATH);
}


export function get(key, defaultValue=undefined) {
    let currentValue = config;
    let segments = key.split('.');
    for (let subKey of segments) {
        if (!currentValue.hasOwnProperty(subKey)) {
            return defaultValue;
        }
        currentValue = currentValue[subKey];
    }

    return currentValue;
}


export function set(key, value) {
    let currentValue = config;
    let segments = key.split('.');
    let childKey = segments.pop();
    for (let subKey of segments) {
        if (!currentValue.hasOwnProperty(subKey)) {
            currentValue[subKey] = {};
        }
        currentValue = currentValue[subKey];
    }
    currentValue[childKey] = value;

    //cson.writeFileSync(CONFIG_PATH, config);
}