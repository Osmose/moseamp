import ffi from 'ffi';
import ref from 'ref';
import StructType from 'ref-struct';
import path from 'path';
import { Map } from 'immutable';
import fs from 'fs-extra';
import crc32 from 'buffer-crc32';

import { readPsfTags, parseTags, decompress } from 'moseamp/utils';

let audioBuffer = Buffer.alloc(8192 * 4);
let bufferWriteIndex = 0;

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

const soxrError = Buffer.alloc(256);
const idone = ref.alloc('size_t');
const odone = ref.alloc('size_t');
let resampler = null;
let resampleOutputRate = null;

const AVInfo = StructType({});
const AVInfoPtr = ref.refType(AVInfo);
const GameInfo = StructType({
  path: 'pointer',
  data: 'pointer',
  size: 'size_t',
  meta: 'pointer',
});
const GameInfoPtr = ref.refType(GameInfo);

const envCallback = ffi.Callback('bool', ['uint', 'pointer'],
  () => {
    return false;
  },
);
const videoCallback = ffi.Callback('void', ['pointer', 'uint', 'uint', 'size_t'],
  () => {
    // Do nothing
  },
);
const audioSampleBatchCallback = ffi.Callback('void', ['pointer', 'size_t'],
  (data, frames) => {
    const audioData = ref.reinterpret(data, frames * 4);
    const resampledLength = Math.ceil(
      frames * (32768 / resampleOutputRate),
    );
    const resampledData = Buffer.alloc(resampledLength * 4);
    soxr.soxr_process(
      resampler,
      audioData.ref(), frames, idone.ref(),
      resampledData.ref(), resampledLength, odone.ref(),
    );
    bufferWriteIndex += resampledData.copy(audioBuffer, bufferWriteIndex, 0);
    console.log(bufferWriteIndex);
  },
);
const inputPollCallback = ffi.Callback('void', [],
  () => {
    // Do nothing
  },
);
const inputStateCallback = ffi.Callback('int16', ['uint', 'uint', 'uint', 'uint'],
  () => {
    return 0;
  },
);

const mgba = ffi.Library(path.resolve(__dirname, 'mgba_libretro.dylib'), {
  retro_init: ['void', []],
  retro_deinit: ['void', []],
  retro_run: ['void', []],
  retro_load_game: ['void', [GameInfoPtr]],
  retro_get_system_av_info: ['void', [AVInfoPtr]],
  retro_set_environment: ['void', ['pointer']],
  retro_set_video_refresh: ['void', ['pointer']],
  retro_set_audio_sample_batch: ['void', ['pointer']],
  retro_set_input_poll: ['void', ['pointer']],
  retro_set_input_state: ['void', ['pointer']],
});

const gameInfo = new GameInfo();

mgba.retro_set_environment(envCallback);
mgba.retro_init();
mgba.retro_set_video_refresh(videoCallback);
mgba.retro_set_audio_sample_batch(audioSampleBatchCallback);
mgba.retro_set_input_poll(inputPollCallback);
mgba.retro_set_input_state(inputStateCallback);

export const driverId = 'mgba';

const CATEGORIES = {
  gba: {
    name: 'Gameboy Advanced',
    extensions: ['gsf', 'minigsf'],
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
        { attr: 'name', name: 'Name', flex: 2 },
        { attr: 'artist', name: 'Artist', flex: 1 },
        { attr: 'game', name: 'Game', flex: 1 },
      ],
    }, info);
  }

  return undefined;
}

export async function createEntries(filename) {
  const category = getCategory(filename);
  let tags;
  try {
    tags = await readPsfTags(filename);
  } catch (err) {
    console.error(err);
    tags = {};
  }

  const title = tags.title || path.basename(filename, path.extname(filename));
  const game = tags.game || path.basename(path.dirname(filename));
  return [
    new Map({
      id: filename,
      name: title,
      game,
      filename,
      category,
      driverId,
      artist: tags.artist || game,
    }),
  ];
}

export class Sound {
  constructor(entry, ctx) {
    this.entry = entry;
    this.promiseLoaded = new Promise((resolve, reject) => {
      loadGsfRom(entry.get('filename')).then(gsfRom => {
        const data = Buffer.from(gsfRom);
        data.type = ref.types.char;
        gameInfo.path = null;
        gameInfo.data = data;
        gameInfo.size = data.length;
        gameInfo.meta = null;
        mgba.retro_load_game(gameInfo.ref());
        resolve();
      }).catch(reject);
    });

    this.sourceNode = ctx.createGain();
    this.sourceNode.gain.value = 0.0001;
    this.scriptNode = ctx.createScriptProcessor(8192, 1, 2);
    this.scriptNode.onaudioprocess = this.handleAudioProcess.bind(this);
    this.scriptNode.connect(this.sourceNode);

    resampleOutputRate = ctx.sampleRate;
    const iospec = soxr.soxr_io_spec(3, 3);
    resampler = soxr.soxr_create(
      32768, ctx.sampleRate, 2, soxrError.ref(), iospec.ref(), null, null,
    );

    this.playing = false;
    this.supportsTime = false;
  }

  handleAudioProcess(event) {
    const left = event.outputBuffer.getChannelData(0);
    const right = event.outputBuffer.getChannelData(1);
    if (this.playing) {
      while (bufferWriteIndex < 8192 * 4) {
        mgba.retro_run();
      }

      for (let k = 0; k < 8192; k++) {
        left[k] = audioBuffer.readInt16LE(k * 4);
        right[k] = audioBuffer.readInt16LE((k * 4) + 2);
      }

      const newBuffer = Buffer.alloc(8192 * 4);
      audioBuffer.copy(newBuffer, 0, 8192 * 4);
      audioBuffer = newBuffer;
      bufferWriteIndex -= 8192 * 4;
    } else {
      for (let k = 0; k < 8192; k++) {
        left[k] = 0;
        right[k] = 0;
      }
    }
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }
}

function superimpose(original, toAdd, offset) {
  const buffer = Buffer.alloc(Math.max(original.length, offset + toAdd.length));
  original.copy(buffer);
  toAdd.copy(buffer, offset);
  return buffer;
}

async function loadPsfFile(filename) {
  const buf = await fs.readFile(filename);
  if (buf.toString('ascii', 0, 3) !== 'PSF') {
    throw new Error(`${filename} is not a valid PSF file.`);
  }

  const reservedSize = buf.readUInt32LE(4);
  const programSize = buf.readUInt32LE(8);
  const testCrc32 = buf.readUInt32LE(12);

  const compressedProgramData = buf.slice(16 + reservedSize, 16 + reservedSize + programSize);
  if (crc32.unsigned(compressedProgramData) !== testCrc32) {
    throw new Error('CRC32 check failed.');
  }

  const programData = await decompress(compressedProgramData);
  return { buf, programSize, reservedSize, programData };
}

async function loadGsfRom(filename) {
  const {
    reservedSize,
    programSize,
    programData: psfProgramData,
    buf: psfBuffer,
  } = await loadPsfFile(filename);

  const gsfOffset = psfProgramData.readUInt32LE(4) - psfProgramData.readUInt32LE(0);
  const gsfSize = psfProgramData.readUInt32LE(8);
  const tags = parseTags(psfBuffer, reservedSize, programSize);

  let gsfProgramData;
  if (tags._lib) {
    const libPath = path.resolve(path.dirname(filename), tags._lib);
    const lib = await loadLib(libPath);
    gsfProgramData = Buffer.alloc(Math.max(lib.offset + lib.size, gsfOffset + gsfSize));
    lib.programData.copy(gsfProgramData, lib.offset, 0, lib.size);
    psfProgramData.copy(gsfProgramData, gsfOffset, 12, 12 + gsfSize);
  } else {
    gsfProgramData = Buffer.alloc(gsfOffset + gsfSize);
    psfProgramData.copy(gsfProgramData, gsfOffset, 12, 12 + gsfSize);
  }

  for (let k = 1; k < 9; k++) {
    if (tags[`_lib${k}`]) {
      try {
        const libPath = path.resolve(path.dirname(filename), tags[`_lib${k}`]);
        // eslint-disable-next-line no-await-in-loop
        const lib = await loadLib(libPath);
        gsfProgramData = superimpose(gsfProgramData, lib.programData, lib.offset);
      } catch (err) {
        console.error(err);
        break;
      }
    }
  }

  return gsfProgramData;
}

async function loadLib(filename) {
  const { programData } = await loadPsfFile(filename);

  const offset = programData.readUInt32LE(4) - programData.readUInt32LE(0);
  const size = programData.readUInt32LE(8);
  console.log(`Lib ${filename}`);
  console.log(`offset ${offset}`);
  console.log(`size ${size}`);

  return {
    offset,
    size,
    programData: programData.slice(12, 12 + size),
  };
}
