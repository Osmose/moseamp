import { basename } from 'path';

export function digitalAudioEntry(filename) {
  return {
    id: filename,
    name: basename(filename),
    filename,
    artist: 'Unknown',
  };
}

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
