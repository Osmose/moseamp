import ffi from 'ffi';
import ref from 'ref';
import StructType from 'ref-struct';
import ArrayType from 'ref-array';
import path from 'path';
import { Map } from 'immutable';

const MusicEmu = ref.types.void;
const MusicEmuPtr = ref.refType(MusicEmu);
const MusicEmuPtrPtr = ref.refType(MusicEmuPtr);
const AudioBufferArray = ArrayType(ref.types.short);
const InfoType = StructType({
  length: ref.types.int,
  intro_length: ref.types.int,
  loop_length: ref.types.int,
  play_length: ref.types.int,

  i4: ref.types.int,
  i5: ref.types.int,
  i6: ref.types.int,
  i7: ref.types.int,
  i8: ref.types.int,
  i9: ref.types.int,
  i10: ref.types.int,
  i11: ref.types.int,
  i12: ref.types.int,
  i13: ref.types.int,
  i14: ref.types.int,
  i15: ref.types.int,

  system: 'string',
  game: 'string',
  song: 'string',
  author: 'string',
  copyright: 'string',
  comment: 'string',
  dumper: 'string',

  s7: 'string',
  s8: 'string',
  s9: 'string',
  s10: 'string',
  s11: 'string',
  s12: 'string',
  s13: 'string',
  s14: 'string',
  s15: 'string',
});
const InfoTypePtr = ref.refType(ArrayType(ref.types.char, 192));
const GmeType = StructType({
  system: 'string',
  track_count: ref.types.int,
  new_emu: 'pointer',
  new_info: 'pointer',
  extension: 'string',
  flags: ref.types.int,
});
const GmeTypeList = ArrayType(GmeType);

const gme = ffi.Library(path.resolve(__dirname, 'libgme.dylib'), {
  gme_open_file: ['string', ['string', MusicEmuPtrPtr, 'long']],
  gme_start_track: ['string', [MusicEmuPtr, 'int']],
  gme_seek: ['string', [MusicEmuPtr, 'long']],
  gme_tell: ['long', [MusicEmuPtr]],
  gme_play: ['string', [MusicEmuPtr, 'long', AudioBufferArray]],
  gme_track_ended: ['int', [MusicEmuPtr]],
  gme_warning: ['string', [MusicEmuPtr]],
  gme_track_count: ['int', [MusicEmuPtr]],
  gme_track_info: ['string', [MusicEmuPtr, InfoTypePtr, 'int']],
  gme_free_info: ['void', [InfoTypePtr]],
  gme_type_list: [GmeTypeList, []],
});

const infoEmu = ref.alloc(MusicEmuPtrPtr);
const infoType = ref.alloc(InfoTypePtr);
const musicEmu = ref.alloc(MusicEmuPtrPtr);
const audioBuffer = new AudioBufferArray(8192 * 2);

export const driverId = 'gme';

const CATEGORIES = {
  spectrum_zx: {
    name: 'Spectrum ZX',
    extensions: ['ay'],
  },
  gb: {
    name: 'Gameboy',
    extensions: ['gbs'],
  },
  genesis: {
    name: 'Genesis',
    extensions: ['gym'],
  },
  nec_pc_engine: {
    name: 'NEC PC Engine',
    extensions: ['hes'],
  },
  turbografx_16: {
    name: '',
    extensions: ['kss'], // TODO: kss is used by other sega stuff
  },
  nes: {
    name: 'Nintendo (NES)',
    extensions: ['nsf', 'nsfe'],
  },
  snes: {
    name: 'Super Nintendo',
    extensions: ['spc'],
  },
  master_system: {
    name: 'Sega Master System',
    extensions: ['vgm'], // TODO: vgm is three consoles in one
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
      sort: ['game', 'track'],
      searchFields: ['name', 'game', 'filename'],
      columns: [
        { attr: 'name', name: 'Name', flex: 4 },
        { attr: 'track', name: 'Track', flex: 1 },
        { attr: 'game', name: 'Game', flex: 2 },
      ],
    }, info);
  }

  return undefined;
}

export function createEntries(filename) {
  gme.gme_open_file(filename, infoEmu, -1);
  const trackCount = gme.gme_track_count(infoEmu.deref());
  const trackEntries = [];
  for (let k = 0; k < trackCount; k++) {
    gme.gme_track_info(infoEmu.deref(), infoType, k);
    const info = new InfoType(ref.reinterpret(infoType.deref(), 192, 0));

    const game = info.game || path.basename(filename, path.extname(filename));
    const song = info.song || game;
    const author = info.author || info.dumper;

    trackEntries.push(new Map({
      id: `${filename}:${k}`,
      track: k,
      name: song,
      game,
      filename,
      category: getCategory(filename),
      driverId,
      artist: author ? `${author} - ${game}` : game,
    }));

    gme.gme_free_info(infoType.deref());
  }

  return trackEntries;
}

export class Sound {
  constructor(entry, ctx) {
    this.entry = entry;
    this.promiseLoaded = new Promise(resolve => {
      gme.gme_open_file(entry.get('filename'), musicEmu, ctx.sampleRate);
      gme.gme_start_track(musicEmu.deref(), entry.get('track'));
      resolve();
    });

    this.sourceNode = ctx.createGain();
    this.sourceNode.gain.value = 0.0001;
    this.scriptNode = ctx.createScriptProcessor(8192, 1, 2);
    this.scriptNode.onaudioprocess = this.handleAudioProcess.bind(this);
    this.scriptNode.connect(this.sourceNode);

    this.playing = false;
    this.supportsTime = false;
  }

  handleAudioProcess(event) {
    const left = event.outputBuffer.getChannelData(0);
    const right = event.outputBuffer.getChannelData(1);
    if (this.playing) {
      gme.gme_play(musicEmu.deref(), 8192 * 2, audioBuffer);
      for (let k = 0; k < 8192; k++) {
        left[k] = audioBuffer[k * 2];
        right[k] = audioBuffer[(k * 2) + 1];
      }
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
