/**
 * Audio playback tools.
 */


export class AudioFile {
    constructor(name, arrayBuffer, metadata) {
        this.name = name;
        this.arrayBuffer = arrayBuffer;
        this.metadata = metadata;
    }
}


/**
 * Handles playback of AudioNodes.
 *
 * Specifically this expects customized AudioNodes that have a `paused`
 * property that can be read from, and will pause the audio streaming
 * from the node when set to true and un-pause it when set to false.
 */
export class AudioPlayer {
    constructor() {
        this.ctx = new AudioContext();
        this._gainNode = this.ctx.createGain();
        this._gainNode.connect(this.ctx.destination);

        this._currentSource = null;
        this._paused = false;
        this._buffer = null;

    }

    get volume() {
        return this._gainNode.gain.value;
    }

    set volume(volume) {
        this._gainNode.gain.value = volume;
    }

    get currentSource() {
        return this._currentSource;
    }

    set currentSource(source) {
        if (this._currentSource) {
            this._currentSource.disconnect();
        }
        this._currentSource = source;
        this._currentSource.connect(this._gainNode);
    }

    get paused() {
        return this._currentSource ? this._currentSource.paused : false;
    }

    set paused(paused) {
        if (this._currentSource) {
            this._currentSource.paused = paused;
        }
    }

    get currentTime() {
        return this._currentSource ? this._currentSource.currentTime : null;
    }

    get duration() {
        return this._currentSource ? this._currentSource.duration : null;
    }

    load(source) {
        this.currentSource = source;
    }

    play() {
        this.currentSource.start(0);
    }
}
