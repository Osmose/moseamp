import ffi from 'ffi';
import ref from 'ref';
import path from 'path';
import ArrayType from 'ref-array';
import StructType from 'ref-struct';
import { Map } from 'immutable';

const IOSpecType = StructType({
  itype: 'int',
  otype: 'int',
  scale: 'double',
  e: 'pointer',
  flags: 'ulong',
});

const soxr = ffi.Library(path.resolve(__dirname, 'libsoxr.dylib'), {
  soxr_io_spec: [IOSpecType, ['int', 'int']],
  soxr_create: ['pointer', ['double', 'double', 'uint', 'pointer', 'pointer', 'pointer', 'pointer']],
  soxr_process: ['pointer', ['pointer', 'pointer', 'size_t', 'pointer', 'pointer', 'size_t', 'pointer']],
});

const AudioBufferArray = ArrayType(ref.types.short);

console.log(path.resolve(__dirname, 'libmusicplayer.dylib'));
const musicplayer = ffi.Library(path.resolve(__dirname, 'libmusicplayer.dylib'), {
  init: ['void', ['string']],
  playerFor: ['pointer', ['string']],
  getMeta: ['string', ['pointer', 'string']],
  getMetaInt: [ref.types.int, ['pointer', 'string']],
  play: ['void', ['pointer', AudioBufferArray, ref.types.int]],
  freePlayer: ['void', ['pointer']],
});

musicplayer.init('/Users/osmose/Projects/musicplayer/data');

class Resampler {
  constructor(inputRate, outputRate, outputSamples) {
    this.outputRate = outputRate;
    this.inputRate = inputRate;
    this.idone = ref.alloc('size_t');
    this.odone = ref.alloc('size_t');

    const iospec = soxr.soxr_io_spec(3, 3);
    const soxrError = Buffer.alloc(256);
    this.resampler = soxr.soxr_create(
      this.inputRate, this.outputRate, 2, soxrError.ref(), iospec.ref(), null, null,
    );

    this.outputSamples = outputSamples;
    this.inputSamples = Math.floor(((outputSamples - 0.5) * this.inputRate) / this.outputRate);
    this.resampledData = Buffer.alloc(outputSamples * 4);
  }

  resample(inputData) {
    const err = soxr.soxr_process(
      this.resampler,
      inputData, this.inputSamples, this.idone.ref(),
      this.resampledData, this.outputSamples, this.odone.ref(),
    );
    if (!err.isNull()) {
      throw new Error(err.readCString());
    }

    return this.resampledData;
  }
}

export const driverId = 'musicplayer';

const CATEGORIES = {
  n64: {
    name: 'Nintendo64',
    extensions: ['usf', 'miniusf'],
  },
  ps1: {
    name: 'Playstation',
    extensions: ['psf', 'minipsf'],
  },
  ps2: {
    name: 'Playstation 2',
    extensions: ['psf2', 'minipsf2'],
  },
};

export function getDisplayName(category) {
  return CATEGORIES[category].name;
}

function getCategory(filename) {
  const ext = path.extname(filename).slice(1).toLowerCase();
  for (const [category, { extensions }] of Object.entries(CATEGORIES)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return null;
}

export function supportsFile(filename) {
  return getCategory(filename) !== null;
}

export function getCategoryInfo(category) {
  const info = CATEGORIES[category];
  if (info) {
    return Object.assign({
      sort: ['filename', 'name'],
      searchFields: ['name', 'artist', 'game', 'filename'],
      columns: [
        { attr: 'game', name: 'Game', flex: 1 },
        { attr: 'name', name: 'Name', flex: 2 },
      ],
    }, info);
  }

  return undefined;
}

export async function createEntries(filename) {
  const category = getCategory(filename);
  // const player = musicplayer.playerFor(filename);
  // console.log(player.isNull());
  // if (player.isNull()) {
  //   return [];
  // }

  const title = path.basename(filename, path.extname(filename));
  const game = path.basename(path.dirname(filename));
  // musicplayer.freePlayer(player);
  return [
    new Map({
      id: filename,
      name: title,
      game,
      filename,
      category,
      driverId,
    }),
  ];
}

export class Sound {
  constructor(entry, ctx) {
    this.entry = entry;
    this.buffer = new AudioBufferArray(8192 * 2);
    this.promiseLoaded = new Promise((resolve, reject) => {
      this.player = musicplayer.playerFor(entry.get('filename'));
      if (this.player.isNull()) {
        this.player = null;
        reject(new Error('No plugin could handle file.'));
      } else {
        resolve();
      }
    });

    this.sourceNode = ctx.createGain();
    this.sourceNode.gain.value = 0.0001;
    this.scriptNode = ctx.createScriptProcessor(8192, 1, 2);
    this.scriptNode.onaudioprocess = this.handleAudioProcess.bind(this);
    this.scriptNode.connect(this.sourceNode);
    // if (entry.get('category') === 'ps2') {
    //   this.resampler = new Resampler(48000, ctx.sampleRate, 8192);
    // }

    this.playing = false;
    this.supportsTime = false;
  }

  handleAudioProcess(event) {
    const left = event.outputBuffer.getChannelData(0);
    const right = event.outputBuffer.getChannelData(1);
    if (this.playing && this.player) {
      musicplayer.play(this.player, this.buffer, 8192 * 2);

      if (this.resampler) {
        const resampledBuffer = this.resampler.resample(this.buffer.buffer);
        for (let k = 0; k < 8192; k++) {
          left[k] = resampledBuffer.readInt16LE(k * 4);
          right[k] = resampledBuffer.readInt16LE((k * 4) + 2);
        }
      } else {
        for (let k = 0; k < 8192; k++) {
          left[k] = this.buffer[k * 2];
          right[k] = this.buffer[(k * 2) + 1];
        }
      }
    } else {
      for (let k = 0; k < 8192; k++) {
        left[k] = 0;
        right[k] = 0;
      }
    }
  }

  onDelete() {
    if (this.player) {
      //musicplayer.freePlayer(this.player);
      this.player = null;
    }
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }
}
