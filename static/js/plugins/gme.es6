import {AudioFile} from '../audio.js';


let gmeOpenFile = Module.cwrap('gme_open_file', null, ['string', 'number']);
let gmeGenerateSoundData = Module.cwrap('gme_generate_sound_data', 'number');
let gmeSongInfo = Module.cwrap('gme_song_info', 'string', ['number']);
let gmeStartTrack = Module.cwrap('gme_start_track', null, ['number']);


export let plugin = {
    supportedExtensions: ['nsf'],
    playing: false,

    songToStream(ctx, song) {
        return new Promise((resolve, reject) => {
            song.getArrayBuffer().then((arrayBuffer) => {
                FS.writeFile(song.file.name, new Int8Array(reader.result), {
                    flags: 'w',
                    encoding: 'binary'
                });

                gmeOpenFile(song.file.name, 0);
            });
        });
    },

    streamCallback(left, right, bufferSize) {
        if (this.playing) {
            for (let k = 0; k < bufferSize; k++) {
                left[k] = 0;
                right[k] = 0;
            }
        } else {
            var ptr = gmeGenerateSoundData();
            for (let i = 0; i < bufferSize; i++) {
                left[i] = Module.getValue(ptr + (i * 4), 'i16');
                right[i] = Module.getValue(ptr + (i * 4) + 2, 'i16');
            }
        }
    },
}
