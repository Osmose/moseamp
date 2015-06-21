import moment from './lib/moment.js';


/**
 * Taken from a lovely StackOverflow answer by Martin Thomson.
 * http://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
 */
export function toArrayBuffer(buffer) {
    let ab = new ArrayBuffer(buffer.length);
    let view = new Uint8Array(ab);
    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}


export function secondsToTime(seconds) {
    let t = moment.duration(seconds, 'seconds');
    return `${t.minutes()}:${zpad(t.seconds())}`;
}


export function zpad(number, digits=2) {
    let string = number.toString();
    if (string.length < digits) {
        return '0'.repeat(digits - string.length) + string;
    } else {
        return string;
    }
}
