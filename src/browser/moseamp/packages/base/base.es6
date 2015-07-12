/**
 * Base plugin for loading audio formats natively supported by Chromium.
 * This also serves as a reference for the plugin interface.
 */
import fs from 'fs';

import musicmetadata from 'musicmetadata';

import {AudioFile} from 'moseamp/audio';
import * as formats from 'moseamp/formats';
import {toArrayBuffer} from 'moseamp/util';


export function activate() {
    formats.register(
        'Audio files',
        ['opus', 'weba', 'ogg', 'wav', 'mp3'],
        BaseAudioFile
    );
}


export class BaseAudioFile extends AudioFile {
    constructor(path) {
        super(path);
        this.arrayBuffer = toArrayBuffer(fs.readFileSync(path));

        musicmetadata(fs.createReadStream(path), {duration: true}, (err, metadata) => {
            this.metadata = metadata;
            this.title = metadata.title;
            this.album = metadata.album || this.album;
            this.artist = metadata.artist || this.artist;
            this.duration = metadata.duration;
        });
    }

    createAudioNode(ctx) {
        return new Promise((resolve) => {
            ctx.decodeAudioData(this.arrayBuffer, (audioBuffer) => {
                let sourceNode = ctx.createBufferSource();
                sourceNode.buffer = audioBuffer;
                resolve(sourceNode);
            });
        });
    }
}
