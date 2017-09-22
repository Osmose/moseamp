import mime from 'mime';
import { Map } from 'immutable';
import id3 from 'id3js';
import path from 'path';

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
      sort: ['artist', 'album', 'track', 'name'],
      searchFields: ['name', 'filename', 'artist', 'album'],
      columns: [
        { attr: 'name', name: 'Name', flex: 4 },
        { attr: 'artist', name: 'Artist', flex: 3 },
        { attr: 'track', name: 'Track', flex: 1 },
        { attr: 'album', name: 'Album', flex: 2 },
      ],
    };
  }
  return undefined;
}

export async function createEntries(filename) {
  let metadata = {};
  if (path.extname(filename) === '.mp3') {
    metadata = await new Promise(resolve => {
      id3({ file: filename, type: id3.OPEN_LOCAL }, (err, tags) => {
        if (err) {
          console.error(err);
          resolve({});
        } else {
          resolve({
            title: tags.title || '',
            artist: tags.artist || '',
            track: tags.v2.track || tags.v1.track,
            album: tags.album || '',
          });
        }
      });
    });
  }

  return [
    new Map({
      id: filename,
      filename,
      category: 'audio',
      name: metadata.title.trim() || path.basename(filename),
      basename: path.basename(filename),
      artist: metadata.artist.trim() || 'Unknown',
      track: Number.parseInt(metadata.track, 10) || null,
      album: metadata.album.trim() || path.basename(path.dirname(filename)),
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
