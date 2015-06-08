/**
 * Base plugin for loading audio formats natively supported by Chromium.
 * This also serves as a reference for the plugin interface.
 */
import fs from 'fs';
import {basename} from 'path';

import {AudioFile} from '../audio.js';
import {toArrayBuffer} from '../util.js';


/**
 * Required. List of all file extensions this plugin supports.
 */
export let supportedExtensions = ['opus', 'weba', 'ogg', 'wav', 'mp3'];


/**
 * Required. Generic name used to refer to the types of files that this
 * plugin supports in the file open dialog.
 */
export let filetypeName = 'Audio files';


/**
 * Required. Given an AudioContext and AudioFile instance, return a
 * Promise that resolves with an AudioNode-compatible object that will
 * stream the audio for the given file.
 */
export function createAudioNode(ctx, audioFile) {
    return new Promise((resolve, reject) => {
        ctx.decodeAudioData(audioFile.arrayBuffer, (audioBuffer) => {
            resolve(new PauseableAudioBufferSourceNode(ctx, audioBuffer));
        });
    })
}


/**
 * Required. Given a file path, return an AudioFile for the audio file
 * at that path, or null if the file isn't valid.
 */
export function createAudioFile(path) {
    let buffer = fs.readFileSync(path);
    return new AudioFile(
        basename(path),
        toArrayBuffer(buffer),
        {}
    );
}


/**
 * AudioBufferSourceNode that supports pausing playback by wrapping an
 * AudioBufferSource node and re-creating it after stopping it.
 */
class PauseableAudioBufferSourceNode {
    constructor(ctx, audioBuffer) {
        this.type = 'default';
        this._ctx = ctx;
        this._buffer = audioBuffer;
        this._paused = false;
        this._outNode = null;
        this._startTime = 0; // Time when playback last started.
        this._startOffset = 0; // Current position within the song, updated
                               // on pause.

        this._source = this._createSource();
    }

    get paused() {
        return this._paused;
    }

    set paused(paused) {
        if (paused != this._paused) {
            this._paused = paused;
            if (paused) {
                this._source.stop();
                this._startOffset += this._ctx.currentTime - this._startTime;
            } else {
                this._source = this._createSource();
                this.connect(this._outNode);
                this.start(0, this._startOffset % this._buffer.duration);
            }
        }
    }

    get currentTime() {
        if (this.paused) {
            return this._startOffset;
        } else {
            return this._ctx.currentTime - this._startTime + this._startOffset;
        }
    }

    get duration() {
        return this._buffer.duration;
    }

    _createSource() {
        let source = this._ctx.createBufferSource();
        source.buffer = this._buffer;
        return source;
    }

    connect(outNode) {
        this._outNode = outNode;
        this._source.connect(outNode);
    }

    disconnect() {
        this._source.disconnect();
    }

    start(...args) {
        this._startTime = this._ctx.currentTime;
        this._source.start(...args);
    }
}
