import {EventEmitter} from 'events';
import {basename} from 'path';


export class AudioFile {
    constructor(path) {
        this.path = path;
        this.filename = basename(path);

        this.title = this.filename;
        this.album = 'Unknown';
        this.artist = 'Unknown';
    }

    createAudioNode(ctx) { // eslint-disable-line no-unused-vars
        throw Error('AudioFile subclasses must implement createAudioNode.');
    }

    load() {
        // Overridable by plugins that need to do something when loading a
        // specific audio file.
    }

    extraControls() {
        return null;
    }
}


export class AudioPlayer {
    constructor() {
        this.ctx = new AudioContext();
        this._gainNode = this.ctx.createGain();
        this._gainNode.connect(this.ctx.destination);

        this.currentAudioFile = null;
        this.currentSource = null;
        this.startOffset = 0;
        this.lastStart = null;
        this._state = 'stopped';

        this.emitter = new EventEmitter();
        this.playbackInterval = null;
    }

    removeCurrentSource() {
        this.currentSource.onended = null;
        this.currentSource.stop();
        this.currentSource.disconnect();
        this.currentSource = null;
    }

    get volume() {
        return this._gainNode.gain.value;
    }

    set volume(volume) {
        this._gainNode.gain.value = volume;
    }

    load(audioFile) {
        this.currentAudioFile = audioFile;
        this.stop();
        audioFile.load();
        this.emitter.emit('load', audioFile);
    }

    get state() {
        return this._state;
    }

    set state(newState) {
        this._state = newState;

        if (newState === 'playing') {
            this.startPlaybackInterval();
        } else {
            this.stopPlaybackInterval();
        }

        this.emitter.emit('stateChanged');
    }

    get currentTime() {
        if (this.state === 'paused') {
            return this.startOffset;
        } else if (this.state === 'playing') {
            return this.ctx.currentTime - this.lastStart + this.startOffset;
        } else {
            return 0;
        }
    }

    set currentTime(time) {
        this.startOffset = time;

        if (this.currentSource) {
            this.removeCurrentSource();

            if (this.state === 'playing') {
                this.play();
            }
        }
    }

    async play() {
        if (!this.currentSource) {
            this.currentSource = await this.currentAudioFile.createAudioNode(this.ctx);
            this.currentSource.connect(this._gainNode);
            this.currentSource.onended = () => {
                this.currentSource = null;
                this.startOffset = 0;
                this.state = 'stopped';
            };
        }

        this.lastStart = this.ctx.currentTime;
        this.currentSource.start(0, this.startOffset % this.currentAudioFile.duration);
        this.state = 'playing';
    }

    pause() {
        if (this.currentSource) {
            this.removeCurrentSource();
        }
        this.startOffset += this.ctx.currentTime - this.lastStart;
        this.state = 'paused';
    }

    stop() {
        if (this.currentSource) {
            this.removeCurrentSource();
        }
        this.startOffset = 0;
        this.state = 'stopped';
    }

    on(event, listener) {
        this.emitter.on(event, listener);
    }

    playbackIntervalCallback() {
        this.emitter.emit('playback');
    }

    startPlaybackInterval() {
        if (!this.playbackInterval) {
            let cb = this.playbackIntervalCallback.bind(this);
            this.playbackInterval = setInterval(cb, 250);
        }
    }

    stopPlaybackInterval() {
        if (this.playbackInterval) {
            clearTimeout(this.playbackInterval);
            this.playbackInterval = null;
        }
    }
}
