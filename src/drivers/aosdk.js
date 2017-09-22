import ffi from 'ffi';
import ref from 'ref';
import StructType from 'ref-struct';
import path from 'path';
import fs from 'fs';
import { Map } from 'immutable';

import { createResamplerNode } from 'moseamp/vendor/resampler';
import { readPsfTags } from 'moseamp/utils';

const StereoSample = StructType({
  l: ref.types.int16,
  r: ref.types.int16,
});
const StereoSamplePtr = ref.refType(StereoSample);

// Tag info: https://web.archive.org/web/20140125155137/http://wiki.neillcorlett.com:80/PSFFormat
// https://web.archive.org/web/20110902100659/http://wiki.neillcorlett.com/PSFTagFormat
// https://web.archive.org/web/20110907045633/http://wiki.neillcorlett.com:80/MiniPSF
const aosdk = ffi.Library(path.resolve(__dirname, 'libaosdk.dylib'), {
  psf_start: [ref.types.int32, ['pointer', ref.types.uint32]],
  psf_sample: [ref.types.int32, [StereoSamplePtr]],
  psf_stop: [ref.types.int32, []],

  psf2_start: [ref.types.int32, ['pointer', ref.types.uint32]],
  psf2_sample: [ref.types.int32, [StereoSamplePtr]],
  psf2_stop: [ref.types.int32, []],
});

const sample = new StereoSample();

export const driverId = 'aosdk';

const CATEGORIES = {
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

const aosdkDrivers = {
  ps1: {
    start: aosdk.psf_start,
    sample: aosdk.psf_sample,
    stop: aosdk.psf_stop,
    fill_info: aosdk.psf_fill_info,
  },
  ps2: {
    start: aosdk.psf2_start,
    sample: aosdk.psf2_sample,
    stop: aosdk.psf2_stop,
    fill_info: aosdk.psf2_fill_info,
  },
};

export function supportsFile(filename) {
  return getCategory(filename) !== null;
}

export function getCategoryInfo(category) {
  const info = CATEGORIES[category];
  if (info) {
    return Object.assign({
      sort: ['filename', 'name'],
      searchFields: ['name', 'filename'],
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
  const tags = await readPsfTags(filename);
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
    this.driver = aosdkDrivers[entry.get('category')];
    this.promiseLoaded = new Promise(resolve => {
      this.fileBuffer = fs.readFileSync(entry.get('filename'));
      // Change current directory during load so that psflib files are resolved
      // correctly.
      process.chdir(path.dirname(entry.get('filename')));
      this.driver.start(this.fileBuffer, this.fileBuffer.length);
      resolve();
    });

    this.sourceNode = ctx.createGain();
    this.sourceNode.gain.value = 0.0001;
    this.scriptNode = ctx.createScriptProcessor(8192, 1, 2);
    this.scriptNode.onaudioprocess = this.handleAudioProcess.bind(this);
    if (ctx.sampleRate === 44100) {
      this.scriptNode.connect(this.sourceNode);
      this.sampleCount = 8192;
    } else {
      this.resamplerNode = createResamplerNode(ctx, 44100, ctx.sampleRate, 8192);
      this.sampleCount = this.resamplerNode.resampleCount;
      this.scriptNode.connect(this.resamplerNode);
      this.resamplerNode.connect(this.sourceNode);
    }

    this.playing = false;
    this.supportsTime = false;
  }

  handleAudioProcess(event) {
    const left = event.outputBuffer.getChannelData(0);
    const right = event.outputBuffer.getChannelData(1);
    if (this.playing) {
      for (let k = 0; k < this.sampleCount; k++) {
        this.driver.sample(sample.ref());
        left[k] = sample.l;
        right[k] = sample.r;
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
