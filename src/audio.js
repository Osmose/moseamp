import { basename } from 'path';
import mime from 'mime';

import { CATEGORY_AUDIO } from './categories';

export const entryBuilder = {
  audio: new Audio(),
  canHandle(filename) {
    const mimetype = mime.lookup(filename);
    return this.audio.canPlayType(mimetype) === 'probably';
  },

  build(filename) {
    return {
      id: filename,
      filename,
      category: CATEGORY_AUDIO,
      name: basename(filename),
      artist: 'Unknown',
      soundDriver: 'audio',
    };
  }
};

export class DigitalAudioSound {
  constructor(entry, ctx) {
    this.entry = entry;
    this.audio = new Audio();
    this.promiseLoaded = new Promise(resolve => {
      this.audio.addEventListener('canplaythrough', resolve);
      this.audio.src = entry.filename;
    });
    this.sourceNode = ctx.createMediaElementSource(this.audio);
    this.supportsTime = true;
  }

  get duration() {
    return this.audio.duration;
  }

  addListener(listener) {
    this.audio.addEventListener('timeupdate', listener);
    this.audio.addEventListener('ended', listener);
  }

  removeListener(listener) {
    this.audio.removeEventListener('timeupdate', listener);
    this.audio.removeEventListener('ended', listener);
  }

  play() {
    this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  seek(time) {
    this.audio.currentTime = time;
  }
}
