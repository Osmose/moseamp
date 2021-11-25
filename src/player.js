import autobind from 'autobind-decorator';
import path from 'path';
import EventEmitter from 'events';

import * as musicMetadata from 'music-metadata';

import { getTypeForExt } from 'moseamp/filetypes';

import { loadPlugins, MusicPlayer } from 'musicplayer_node';
loadPlugins(path.resolve(__dirname, 'musicplayer_data'));

import musicPlayerWorkletCode from 'moseamp/musicPlayer.worklet.js';
const musicPlayerWorkletBlob = new Blob([musicPlayerWorkletCode.toString()], { type: 'text/javascript' });
const musicPlayerWorkletURL = URL.createObjectURL(musicPlayerWorkletBlob);

export const DEFAULT_GAIN = 1;
const GAIN_FACTOR = 0.0001;
const SAMPLE_COUNT = 2048;

@autobind
class DispatchPlayer extends EventEmitter {
  constructor() {
    super();
    this.currentPlayer = null;
    this.players = [new MusicPlayerPlayer(), new WebAudioPlayer()];

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
    const player = this.players.find((p) => p.id === fileType.playerId);

    if (this.currentPlayer) {
      await this.currentPlayer.pause();
      this.currentPlayer.tidy();
    }
    this.currentPlayer = player;

    const meta = await player.load(filePath);
    this.emit('load', meta);
    return meta;
  }

  setVolume(volume) {
    for (const player of this.players) {
      player.setVolume(volume);
    }
    this.currentPlayer?.setVolume(volume);
  }

  seek(song, position) {
    this.currentPlayer.seek(song, position);
  }

  fadeOut(duration) {
    this.currentPlayer.fadeOut(duration);
  }

  async play() {
    return this.currentPlayer.play();
  }

  async pause() {
    return this.currentPlayer.pause();
  }

  async stop() {
    return this.currentPlayer.stop();
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
    await new Promise((resolve) => {
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

  fadeOut() {
    // Unused, all songs have durations for this player.
  }

  async play() {
    await this.ctx.resume();
  }

  async pause() {
    return this.ctx.suspend();
  }

  async stop() {
    await this.ctx.suspend();
    this.emit('ended');
  }
}

// This name is so dumb
class MusicPlayerPlayer extends EventEmitter {
  constructor() {
    super();
    this.id = 'musicplayer';
    this.ctx = null;
    this.musicPlayer = null;
    this.startTime = null;
    this.currentTimeInterval = null;
    this.volume = DEFAULT_GAIN;
  }

  async createContext(sampleRate) {
    const ctx = new AudioContext({ sampleRate });
    ctx.suspend();

    ctx.analyserNode = ctx.createAnalyser();
    ctx.analyserNode.fftSize = 512;
    ctx.timeDomainBuffer = new Uint8Array(ctx.analyserNode.frequencyBinCount);
    ctx.frequencyBuffer = new Uint8Array(ctx.analyserNode.frequencyBinCount);
    ctx.analyserNode.connect(ctx.destination);

    ctx.fadeOutNode = ctx.createGain();
    ctx.fadeOutNode.gain.value = 1;
    ctx.fadeOutNode.connect(ctx.analyserNode);

    ctx.gainNode = ctx.createGain();
    ctx.gainNode.gain.value = this.volume * GAIN_FACTOR;
    ctx.gainNode.connect(ctx.fadeOutNode);

    await ctx.audioWorklet.addModule(musicPlayerWorkletURL);
    ctx.musicPlayerWorkletNode = new AudioWorkletNode(ctx, 'music-player', { outputChannelCount: [2] });
    ctx.musicPlayerWorkletNode.connect(ctx.gainNode);

    return ctx;
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
      nes:
        this.musicPlayer &&
        ['Nintendo NES', 'Famicom'].includes(this.musicPlayer.getMeta('format')) &&
        this.musicPlayer.nesAnalysis(),
    };
  }

  async load(filePath) {
    this.musicPlayer = new MusicPlayer(filePath);
    console.log(this.musicPlayer.getMeta('format'));

    if (this.musicPlayer.getMeta('format') === 'Playstation2') {
      this.ctx = await this.createContext(48000);
    } else {
      this.ctx = await this.createContext(44100);
    }

    this.ctx.musicPlayerWorkletNode.port.postMessage({
      type: 'open',
      filePath,
      musicPlayerPath: path.resolve(__dirname, 'musicplayer_node'),
      pluginPath: path.resolve(__dirname, 'musicplayer_data'),
    });
    this.ctx.fadeOutNode.gain.value = 1.0;

    this.startTime = this.ctx.currentTime;
    this.currentTimeInterval = setInterval(() => {
      this.emit('timeupdate', this.ctx.currentTime - this.startTime);
    }, 1000);

    return {
      title: this.musicPlayer.getMeta('title') || this.musicPlayer.getMeta('sub_title') || path.basename(filePath),
      artist: this.musicPlayer.getMeta('game') || '---',
      songs: this.musicPlayer.getMetaInt('songs'),
      duration: Infinity,
    };
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.ctx) {
      this.ctx.gainNode.gain.value = volume * GAIN_FACTOR;
    }
  }

  fadeOut(duration) {
    if (this.ctx) {
      const gain = this.ctx.fadeOutNode.gain;
      gain.setValueAtTime(gain.value, this.ctx.currentTime);
      gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    }
  }

  seek(song) {
    if (song !== null) {
      this.ctx.musicPlayerWorkletNode.port.postMessage({ type: 'seek', song });
    }
  }

  tidy() {
    if (this.ctx) {
      this.ctx.musicPlayerWorkletNode.port.postMessage({ type: 'free' });
    }
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

  async stop() {
    await this.ctx.suspend();
    this.emit('ended');
  }
}

window.player = new DispatchPlayer();
export default window.player;
