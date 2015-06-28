import {basename} from 'path';

import React from '../lib/react.js';
import {AudioFile} from '../audio.js';
import {FontAwesome, PluginContainer} from '../components.js';
import {toArrayBuffer} from '../util.js';


let gme = {
    openFile: Module.cwrap('open_file', null, ['string', 'number']),
    generateSoundData: Module.cwrap('generate_sound_data', 'number'),
    songInfo: Module.cwrap('song_info', 'string', ['string', 'number']),
    startTrack: Module.cwrap('start_track', null, ['number']),
    seek: Module.cwrap('seek', null, ['number']),
    currentTime: Module.cwrap('current_time', 'number'),
    trackHasEnded: Module.cwrap('track_has_ended', 'number'),
    currentTrack: Module.cwrap('current_track', 'number'),
}


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

        let songInfo = JSON.parse(gme.songInfo(filename, 0));
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
            songInfo.length / 1000,
            songInfo
        ));
    });
}


export function onLoad(audioFile) {
    gme.openFile(audioFile.filename, 0);
}


class GMEAudioNode {
    constructor(ctx, audioFile) {
        this.audioFile = audioFile;
        this.playing = true;

        this.scriptProcessor = ctx.createScriptProcessor(8192, 1, 2);
        this.scriptProcessor.onaudioprocess = (e) => {
            if (this.playing) {
                if (gme.trackHasEnded()) {
                    this.playing = false;
                    if (this.onended) {
                        this.onended();
                    }
                } else {
                    let left = e.outputBuffer.getChannelData(0);
                    let right = e.outputBuffer.getChannelData(1);
                    this.synthCallback(left, right, 8192);
                }
            }
        };

        this.gainNode = ctx.createGain();
        this.gainNode.gain.value = 0.0001;
        this.scriptProcessor.connect(this.gainNode);
    }

    synthCallback(left, right, bufferSize) {
        var ptr = gme.generateSoundData();
        for (var i = 0; i < bufferSize; i++) {
            left[i] = Module.getValue(ptr + (i * 4), 'i16');
            right[i] = Module.getValue(ptr + (i * 4) + 2, 'i16');
        }
    }

    get currentTime() {
        return gme.currentTime() / 1000;
    }

    start(delay, time) {
        gme.seek(time * 1000);
    }

    stop() {
        this.playing = false;
    }

    connect(destination) {
        this.gainNode.connect(destination);
    }

    disconnect() {
        this.gainNode.disconnect();
    }
}


export class PluginComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentTrack: gme.currentTrack()
        };
    }

    render() {
        let audioFile = this.props.audioFile;
        if (!audioFile) {
            return <div className="plugin-ui gme-plugin" />;
        }

        return (
            <PluginContainer name="Game Music Emulator Controls" className="gme-plugin">
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
            </PluginContainer>
        );
    }

    handlePreviousTrack() {
        let currentTrack = gme.currentTrack();
        if (currentTrack > 0) {
            gme.startTrack(currentTrack + 1);
        }
        this.setState({currentTrack: gme.currentTrack()});
    }

    handleNextTrack() {
        let currentTrack = gme.currentTrack();
        if (currentTrack < this.props.audioFile.trackCount - 1) {
            gme.startTrack(currentTrack + 1);
        }
        this.setState({currentTrack: gme.currentTrack()});
    }
}
PluginComponent.height = 67;
