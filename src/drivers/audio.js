import { basename } from 'path';
import mime from 'mime';
import { Map } from 'immutable';

import { CATEGORY_AUDIO } from 'moseamp/categories';

export const driverId = 'audio';

const _audio = new Audio();
export function supports(filename) {
  const mimetype = mime.lookup(filename);
  return _audio.canPlayType(mimetype) === 'probably';
}

export function createEntries(filename) {
  return [
    new Map({
      id: filename,
      filename,
      category: CATEGORY_AUDIO,
      name: basename(filename),
      artist: 'Unknown',
      driverId,
    }),
  ];
}

export class Sound {
  constructor(entry, ctx) {
    this.entry = entry;
    this.audio = new Audio();
    this.promiseLoaded = new Promise(resolve => {
      this.audio.addEventListener('canplaythrough', resolve);
      this.audio.src = entry.get('filename');
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
