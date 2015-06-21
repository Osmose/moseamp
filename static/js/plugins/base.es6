/**
 * Base plugin for loading audio formats natively supported by Chromium.
 * This also serves as a reference for the plugin interface.
 */
import fs from 'fs';
import {basename} from 'path';

import musicmetadata from 'musicmetadata';

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
            let sourceNode = ctx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            resolve(sourceNode);
        });
    })
}


/**
 * Required. Given a file path, return a Promise the resolves with an
 * AudioFile for the audio file at that path.
 */
export function createAudioFile(path) {
    return new Promise((resolve, reject) => {
        musicmetadata(fs.createReadStream(path), {duration: true}, (err, metadata) => {
            let buffer = fs.readFileSync(path);
            resolve(new AudioFile(
                basename(path),
                toArrayBuffer(buffer),
                metadata.duration,
                metadata
            ));
        })
    });
}
