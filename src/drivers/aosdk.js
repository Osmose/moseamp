import ffi from 'ffi';
import ref from 'ref';
import StructType from 'ref-struct';
import path from 'path';
import fs from 'fs';
import { Map } from 'immutable';

import { createResamplerNode } from 'moseamp/vendor/resampler';

import {
  CATEGORY_PS1,
  CATEGORY_PS2,
} from 'moseamp/categories';

export const driverId = 'aosdk';

const EXT_CATEGORIES = {
  psf: CATEGORY_PS1,
  minipsf: CATEGORY_PS1,
  psf2: CATEGORY_PS2,
};

const AODisplayInfo = StructType({
  title: 'string',
  info: 'string',
});
const AODisplayInfoPtr = ref.refType(AODisplayInfo);
const StereoSample = StructType({
  l: ref.types.int16,
  r: ref.types.int16,
});
const StereoSamplePtr = ref.refType(StereoSample);

const aosdk = ffi.Library(path.resolve(__dirname, 'libaosdk.dylib'), {
  psf_start: [ref.types.int32, ['pointer', ref.types.uint32]],
  psf_sample: [ref.types.int32, [StereoSamplePtr]],
  psf_stop: [ref.types.int32, []],
  psf_fill_info: [ref.types.int32, [AODisplayInfoPtr]],

  psf2_start: [ref.types.int32, ['pointer', ref.types.uint32]],
  psf2_sample: [ref.types.int32, [StereoSamplePtr]],
  psf2_stop: [ref.types.int32, []],
  psf2_fill_info: [ref.types.int32, [AODisplayInfoPtr]],
});

const sample = new StereoSample();

function getCategory(filename) {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return EXT_CATEGORIES[ext] || null;
}

const aosdkDrivers = {
  [CATEGORY_PS1]: {
    start: aosdk.psf_start,
    sample: aosdk.psf_sample,
    stop: aosdk.psf_stop,
    fill_info: aosdk.psf_fill_info,
  },
  [CATEGORY_PS2]: {
    start: aosdk.psf2_start,
    sample: aosdk.psf2_sample,
    stop: aosdk.psf2_stop,
    fill_info: aosdk.psf2_fill_info,
  },
};

export function supports(filename) {
  return getCategory(filename) !== null;
}

export function createEntries(filename) {
  const category = getCategory(filename);
  const game = path.basename(filename, path.extname(filename));
  return [
    new Map({
      id: filename,
      name: game,
      filename,
      category,
      driverId,
      artist: game,
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
