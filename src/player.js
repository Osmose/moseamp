import { createSound } from 'moseamp/drivers';
import store from 'moseamp/store';
import { setDuration, setCurrentTime, setPlaying } from 'moseamp/ducks/player';

export const DEFAULT_GAIN = 0.7;

class Player {
  constructor() {
    this.ctx44100 = new AudioContext({sampleRate: 44100});
    this.ctx48000 = new AudioContext({sampleRate: 48000});
    this.ctx = this.ctx44100;

    for (const ctx of [this.ctx44100, this.ctx48000]) {
      ctx.gainNode = ctx.createGain();
      ctx.gainNode.gain.value = DEFAULT_GAIN;
      ctx.gainNode.connect(ctx.destination);
    }
  }

  async loadSound(entry) {
    if (this.playing) {
      this.pause();
    }

    if (this.currentSound) {
      this.currentSound.sourceNode.disconnect(this.gainNode);
      if (this.currentSound.supportsTime) {
        this.currentSound.removeListener(this);
      }
      if (this.currentSound.onDelete) {
        this.currentSound.onDelete();
      }
    }

    if (entry.get('category') === 'ps2') {
      this.ctx = this.ctx48000;
    } else {
      this.ctx = this.ctx44100;
    }
    this.currentSound = await createSound(entry, this.ctx);

    this.currentSound.sourceNode.connect(this.ctx.gainNode);
    if (this.currentSound.supportsTime) {
      store.dispatch(setDuration(this.currentSound.duration));
      this.currentSound.addListener(this);
    } else {
      store.dispatch(setCurrentTime(null));
      store.dispatch(setDuration(null));
    }
  }

  setVolume(volume) {
    this.ctx.gainNode.gain.value = volume;
  }

  seek(time) {
    if (!this.currentSound || !this.currentSound.supportsTime) {
      throw new Error('Cannot seek');
    }

    this.currentSound.seek(time);
  }

  play() {
    if (!this.currentSound) {
      throw new Error('No sound to play.');
    }

    this.currentSound.play();
  }

  pause() {
    if (!this.currentSound) {
      throw new Error('No sound to pause.');
    }

    this.currentSound.pause();
  }

  handleEvent(event) {
    switch (event.type) {
      case 'timeupdate':
        store.dispatch(setCurrentTime(event.target.currentTime));
        break;
      case 'ended':
        store.dispatch(setPlaying(false));
        break;
      default:
        // Do nothing
    }
  }
}

export default new Player();
