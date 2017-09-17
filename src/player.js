import { createSound } from 'moseamp/drivers';
import store from 'moseamp/store';
import { setDuration, setCurrentTime, setPlaying } from 'moseamp/ducks/player';

export const DEFAULT_GAIN = 0.7;

class Player {
  constructor() {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = DEFAULT_GAIN;
    this.gainNode.connect(this.ctx.destination);
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
    }

    this.currentSound = createSound(entry, this.ctx);
    await this.currentSound.promiseLoaded;

    this.currentSound.sourceNode.connect(this.gainNode);
    if (this.currentSound.supportsTime) {
      store.dispatch(setDuration(this.currentSound.duration));
      this.currentSound.addListener(this);
    } else {
      store.dispatch(setCurrentTime(null));
      store.dispatch(setDuration(null));
    }
  }

  setVolume(volume) {
    this.gainNode.gain.value = volume;
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
