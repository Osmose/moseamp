import path from 'path';

import bindings from 'bindings';

const {loadPlugins, MusicPlayer} = bindings('musicplayer_node');
loadPlugins(path.resolve(__dirname, 'musicplayer_data'));

export const DEFAULT_GAIN = 0.7;
const GAIN_FACTOR = 0.0001;
const SAMPLE_COUNT = 2048;

class Player {
  constructor() {
    this.ctx44100 = new AudioContext({sampleRate: 44100});
    this.ctx48000 = new AudioContext({sampleRate: 48000});
    this.ctxs = [this.ctx44100, this.ctx48000];

    this.ctx = null;
    this.musicPlayer = null;

    for (const ctx of this.ctxs) {
      ctx.suspend();

      ctx.gainNode = ctx.createGain();
      ctx.gainNode.gain.value = DEFAULT_GAIN * GAIN_FACTOR;
      ctx.gainNode.connect(ctx.destination);

      ctx.scriptNode = ctx.createScriptProcessor(SAMPLE_COUNT, 1, 2);
      ctx.scriptNode.onaudioprocess = this.handleAudioProcess.bind(this);
      ctx.scriptNode.connect(ctx.gainNode);
    }
  }

  handleAudioProcess(event) {
    if (!this.musicPlayer) {
      return;
    }

    const left = event.outputBuffer.getChannelData(0);
    const right = event.outputBuffer.getChannelData(1);
    const samples = this.musicPlayer.play(SAMPLE_COUNT * 2);
    for (let k = 0; k < SAMPLE_COUNT; k++) {
      left[k] = samples[k * 2];
      right[k] = samples[(k * 2) + 1];
    }
  }

  async load(filePath) {
    if (this.musicPlayer) {
      this.musicPlayer.freePlayer();
    }

    this.musicPlayer = new MusicPlayer(filePath);

    if (this.musicPlayer.getMeta('format') === 'Playstation2') {
      this.ctx = this.ctx48000;
    } else {
      this.ctx = this.ctx44100;
    }

    return {
      title: (
        this.musicPlayer.getMeta('title')
        || this.musicPlayer.getMeta('sub_title')
        || path.basename(filePath)
      ),
      artist: (
        this.musicPlayer.getMeta('game')
        || '---'
      ),
    };
  }

  setVolume(volume) {
    for (const ctx of this.ctxs) {
      ctx.gainNode.gain.value = volume * GAIN_FACTOR;
    }
  }

  async play() {
    if (this.ctx) {
      return this.ctx.resume();
    }
  }

  async pause() {
    if (this.ctx) {
      return this.ctx.suspend();
    }
  }
}

export default new Player();
