import {basename} from 'path';

import React from '../lib/react.js';
import {AudioFile} from '../audio.js';
import {FontAwesome} from '../components.js';
import {toArrayBuffer} from '../util.js';


let gmeOpenFile = Module.cwrap('open_file', null, ['string', 'number']);
let gmeGenerateSoundData = Module.cwrap('generate_sound_data', 'number');
let gmeSongInfo = Module.cwrap('song_info', 'string', ['string', 'number']);
let gmeStartTrack = Module.cwrap('start_track', null, ['number']);


let currentTrack = 0;


export let supportedExtensions = ['ay', 'gbs', 'gym', 'hes', 'kss', 'nsf',
                                  'nsfe', 'sap', 'spc', 'vgm', 'vgz'];
export let filetypeName = 'Game Music files';


export function createAudioNode(ctx, audioFile) {
    return new Promise((resolve, reject) => {
        resolve(new GMEAudioNode(ctx, audioFile));
    });
}


export function createAudioFile(path) {
    return new Promise((resolve, reject) => {
        let buffer = fs.readFileSync(path);
        let arrayBuffer = toArrayBuffer(buffer);
        let filename = basename(path);

        FS.writeFile(filename, new Int8Array(arrayBuffer), {
            flags: 'w',
            encoding: 'binary'
        });

        let songInfo = JSON.parse(gmeSongInfo(filename, 0));
        songInfo.title = songInfo.game;
        if (songInfo.author) {
            songInfo.artist = songInfo.author;
        }
        if (songInfo.system) {
            songInfo.album = songInfo.system;
        }

        resolve(new AudioFile(
            basename(path),
            toArrayBuffer(buffer),
            null,
            songInfo
        ));
    });
}


class GMEAudioNode {
    constructor(ctx, audioFile) {
        this.audioFile = audioFile;
        this.playing = false;

        this.scriptProcessor = ctx.createScriptProcessor(8192, 1, 2);
        this.scriptProcessor.onaudioprocess = (e) => {
            var left = e.outputBuffer.getChannelData(0);
            var right = e.outputBuffer.getChannelData(1);
            this.synthCallback(left, right, 8192);
        };

        this.gainNode = ctx.createGain();
        this.gainNode.gain.value = 0.0001;
        this.scriptProcessor.connect(this.gainNode);
    }

    synthCallback(left, right, bufferSize) {
        if (this.playing) {
            var ptr = gmeGenerateSoundData();
            for (var i = 0; i < bufferSize; i++) {
                left[i] = Module.getValue(ptr + (i * 4), 'i16');
                right[i] = Module.getValue(ptr + (i * 4) + 2, 'i16');
            }
        } else {
            for (var i = 0; i < bufferSize; i++) {
                left[i] = 0;
                right[i] = 0;
            }
        }
    }

    start() {
        gmeOpenFile(this.audioFile.filename, 0);
        this.playing = true;
    }

    stop() {
        this.playing = false;
        this.gainNode.disconnect();
    }

    connect(destination) {
        this.gainNode.connect(destination);
    }
}


export class PluginComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentTrack: currentTrack
        };
    }

    render() {
        let audioFile = this.props.audioFile;
        if (!audioFile) {
            return <div className="plugin-ui gme-plugin" />;
        }

        return (
            <div className="plugin-ui gme-plugin">
                <div className="gme-info">
                    <div className="current-track">
                        Track: {this.state.currentTrack + 1} / {audioFile.trackCount}
                    </div>
                </div>
                <div className="controls gme-controls">
                    <button className="button"
                            onClick={this.handlePreviousTrack.bind(this)}>
                        <FontAwesome name="step-backward" />
                    </button>
                    <button className="button"
                            onClick={this.handleNextTrack.bind(this)}>
                        <FontAwesome name="step-forward" />
                    </button>
                </div>
            </div>
        );
    }

    handlePreviousTrack() {
        if (currentTrack > 0) {
            currentTrack--;
        }
        gmeStartTrack(currentTrack);
        this.setState({currentTrack: currentTrack});
    }

    handleNextTrack() {
        if (currentTrack < this.props.audioFile.trackCount - 1) {
            currentTrack++;
        }
        gmeStartTrack(currentTrack);
        this.setState({currentTrack: currentTrack});
    }
}
PluginComponent.height = 42;
