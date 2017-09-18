import { basename } from 'path';
import mime from 'mime';
import { Map } from 'immutable';

export const driverId = 'audio';

const _audio = new Audio();
export function supportsFile(filename) {
  const mimetype = mime.lookup(filename);
  return _audio.canPlayType(mimetype) === 'probably';
}

export function getCategoryInfo(category) {
  if (category === 'audio') {
    return {
      name: 'Audio',
      sort: ['name'],
      columns: [
        { attr: 'name', name: 'Name', flex: 2 },
        { attr: 'filename', name: 'Filename', flex: 1 },
      ],
    };
  }
  return undefined;
}

export function createEntries(filename) {
  return [
    new Map({
      id: filename,
      filename,
      category: 'audio',
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
