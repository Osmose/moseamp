import path from 'path';
import EventEmitter from 'events';

import bindings from 'bindings';
import * as musicMetadata from 'music-metadata';

import { getTypeForExt } from 'moseamp/filetypes';

const {loadPlugins, MusicPlayer} = bindings('musicplayer_node');
loadPlugins(path.resolve(__dirname, 'musicplayer_data'));

export const DEFAULT_GAIN = 0.7;
const GAIN_FACTOR = 0.0001;
const SAMPLE_COUNT = 2048;

class DispatchPlayer extends EventEmitter {
  constructor() {
    super();
    this.currentPlayer = null;
    this.players = [
      new MusicPlayerPlayer(),
      new WebAudioPlayer(),
    ];

    // Forward timeupdate events.
    for (const player of this.players) {
      player.on('timeupdate', (currentTime) => {
        this.emit('timeupdate', currentTime);
      });
    }

    // Forward ended events.
    for (const player of this.players) {
      player.on('ended', () => {
        this.emit('ended');
      });
    }
  }

  getAnalysis() {
    return this.currentPlayer ? this.currentPlayer.getAnalysis() : {};
  }

  async load(filePath) {
    const extension = path.extname(filePath);
    const fileType = getTypeForExt(extension);
    const player = this.players.find(p => p.id === fileType.playerId);

    if (this.currentPlayer) {
      await this.currentPlayer.pause();
      this.currentPlayer.tidy();
    }
    this.currentPlayer = player;
    return player.load(filePath);
  }

  setVolume(volume) {
    this.currentPlayer.setVolume(volume);
  }

  seek(song, position) {
    this.currentPlayer.seek(song, position);
  }

  async play() {
    return this.currentPlayer.play();
  }

  async pause() {
    return this.currentPlayer.pause();
  }
}

class WebAudioPlayer extends EventEmitter {
  constructor() {
    super();

    this.id = 'webaudioplayer';

    this.ctx = new AudioContext();
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 512;
    this.timeDomainBuffer = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.frequencyBuffer = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.connect(this.ctx.destination);

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = DEFAULT_GAIN;
    this.gainNode.connect(this.analyserNode);
  }

  getAnalysis() {
    this.analyserNode.getByteTimeDomainData(this.timeDomainBuffer);
    this.analyserNode.getByteFrequencyData(this.frequencyBuffer);
    return {
      timeDomainData: this.timeDomainBuffer,
      frequencyData: this.frequencyBuffer,
    };
  }

  async load(filePath) {
    this.audio = new Audio();
    await new Promise(resolve => {
      this.audio.addEventListener('canplaythrough', resolve);
      this.audio.src = filePath;
    });
    this.sourceNode = this.ctx.createMediaElementSource(this.audio);
    this.sourceNode.connect(this.gainNode);
    this.audio.play();
    this.audio.addEventListener('timeupdate', () => {
      this.emit('timeupdate', this.audio.currentTime);
    });
    this.audio.addEventListener('ended', () => {
      this.emit('ended');
    });


    const metadata = {
      title: path.basename(filePath),
      artist: 'Unknown',
      songs: 0,
      duration: this.audio.duration,
    };

    try {
      const { common } = await musicMetadata.parseFile(filePath);
      if (common.title) {
        metadata.title = common.title;
      }
      if (common.artist) {
        metadata.artist = common.artist;
      }
    } catch (err) {
      console.error(err);
    }

    return metadata;
  }

  setVolume(volume) {
    this.gainNode.gain.value = volume;
  }

  seek(song, position) {
    this.audio.currentTime = position;
  }

  tidy() {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
  }

  async play() {
    await this.ctx.resume();
  }

  async pause() {
    return this.ctx.suspend();
  }
}

// This name is so dumb
class MusicPlayerPlayer extends EventEmitter {
  constructor() {
    super();

    this.id = 'musicplayer';

    this.ctx44100 = new AudioContext({sampleRate: 44100});
    this.ctx48000 = new AudioContext({sampleRate: 48000});
    this.ctxs = [this.ctx44100, this.ctx48000];

    this.ctx = null;
    this.musicPlayer = null;
    this.startTime = null;
    this.currentTimeInterval = null;

    for (const ctx of this.ctxs) {
      ctx.suspend();

      ctx.analyserNode = ctx.createAnalyser();
      ctx.analyserNode.fftSize = 512;
      ctx.timeDomainBuffer = new Uint8Array(ctx.analyserNode.frequencyBinCount);
      ctx.frequencyBuffer = new Uint8Array(ctx.analyserNode.frequencyBinCount);
      ctx.analyserNode.connect(ctx.destination);

      ctx.gainNode = ctx.createGain();
      ctx.gainNode.gain.value = DEFAULT_GAIN * GAIN_FACTOR;
      ctx.gainNode.connect(ctx.analyserNode);

      ctx.scriptNode = ctx.createScriptProcessor(SAMPLE_COUNT, 1, 2);
      ctx.scriptNode.onaudioprocess = this.handleAudioProcess.bind(this);
      ctx.scriptNode.connect(ctx.gainNode);
    }
  }

  getAnalysis() {
    if (!this.ctx) {
      return {};
    }

    this.ctx.analyserNode.getByteTimeDomainData(this.ctx.timeDomainBuffer);
    this.ctx.analyserNode.getByteFrequencyData(this.ctx.frequencyBuffer);
    return {
      timeDomainData: this.ctx.timeDomainBuffer,
      frequencyData: this.ctx.frequencyBuffer,
    };
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
    this.musicPlayer = new MusicPlayer(filePath);

    if (this.musicPlayer.getMeta('format') === 'Playstation2') {
      this.ctx = this.ctx48000;
    } else {
      this.ctx = this.ctx44100;
    }

    this.startTime = this.ctx.currentTime;
    this.currentTimeInterval = setInterval(() => {
      this.emit('timeupdate', this.ctx.currentTime - this.startTime);
    }, 1000);

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
      duration: Infinity,
    };
  }

  setVolume(volume) {
    for (const ctx of this.ctxs) {
      ctx.gainNode.gain.value = volume * GAIN_FACTOR;
    }
  }

  seek(song) {
    if (song !== null) {
      this.musicPlayer.seek(song);
    }
  }

  tidy() {
    if (this.musicPlayer) {
      this.musicPlayer.freePlayer();
    }

    if (this.currentTimeInterval) {
      clearInterval(this.currentTimeInterval);
    }
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
