import path from 'path';

import bindings from 'bindings';

import FILE_TYPES from 'moseamp/filetypes';

const {loadPlugins, MusicPlayer} = bindings('musicplayer_node');
loadPlugins(path.resolve(__dirname, 'musicplayer_data'));

export const DEFAULT_GAIN = 0.7;
const GAIN_FACTOR = 0.0001;
const SAMPLE_COUNT = 2048;

class DispatchPlayer {
  constructor() {
    this.currentPlayer = null;
    this.players = [
      new MusicPlayerPlayer(),
      new WebAudioPlayer(),
    ];
  }

  async load(filePath) {
    const extension = path.extname(filePath);
    const fileType = Object.values(FILE_TYPES).find(ft => ft.extensions.includes(extension));
    const player = this.players.find(p => p.id === fileType.playerId);

    if (this.currentPlayer) {
      this.currentPlayer.pause();
    }
    this.currentPlayer = player;
    return player.load(filePath);
  }

  setVolume(volume) {
    this.currentPlayer.setVolume(volume);
  }

  seek(song) {
    this.currentPlayer.seek(song);
  }

  async play() {
    return this.currentPlayer.play();
  }

  async pause() {
    return this.currentPlayer.pause();
  }
}

class WebAudioPlayer {
  constructor() {
    this.id = 'webaudioplayer';

    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = DEFAULT_GAIN;
    this.gainNode.connect(this.ctx.destination);
  }

  async load(filePath) {
    this.pause();
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    this.audio = new Audio();
    await new Promise(resolve => {
      this.audio.addEventListener('canplaythrough', resolve);
      this.audio.src = filePath;
    });
    this.sourceNode = this.ctx.createMediaElementSource(this.audio);
    this.sourceNode.connect(this.gainNode);
    this.audio.loop = true;
    this.audio.play();


    return {
      title: path.basename(filePath),
      artist: 'Unknown',
      songs: 0,
    };
  }

  setVolume(volume) {
    this.gainNode.gain.value = volume;
  }

  seek() {
    // NOOP
  }

  async play() {
    await this.ctx.resume();
  }

  async pause() {
    return this.ctx.suspend();
  }
}

// This name is so dumb
class MusicPlayerPlayer {
  constructor() {
    this.id = 'musicplayer';

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
    this.pause();
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
      songs: this.musicPlayer.getMetaInt('songs'),
    };
  }

  setVolume(volume) {
    for (const ctx of this.ctxs) {
      ctx.gainNode.gain.value = volume * GAIN_FACTOR;
    }
  }

  seek(song) {
    this.musicPlayer.seek(song);
  }

  async play() {
    if (this.ctx) {
      await this.ctx.resume();
    }
  }

  async pause() {
    if (this.ctx) {
      return this.ctx.suspend();
    }
  }
}

window.player = new DispatchPlayer();
export default window.player;
