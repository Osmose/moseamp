import ffi from 'ffi';
import ref from 'ref';
import StructType from 'ref-struct';
import ArrayType from 'ref-array';
import path from 'path';

const MusicEmu = ref.types.void;
const MusicEmuPtr = ref.refType(MusicEmu);
const MusicEmuPtrPtr = ref.refType(MusicEmuPtr);
const ShortPtr = ref.refType(ref.types.short);
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
});

const infoEmu = ref.alloc(MusicEmuPtrPtr);
const infoType = ref.alloc(InfoTypePtr);
const musicEmu = ref.alloc(MusicEmuPtrPtr);
const audioBuffer = new AudioBufferArray(8192 * 2);

export function gmeEntry(filename) {
  gme.gme_open_file(filename, infoEmu, -1);
  const trackCount = gme.gme_track_count(infoEmu.deref());
  const trackEntries = [];
  for (let k = 0; k < trackCount; k++) {
    gme.gme_track_info(infoEmu.deref(), infoType, k);
    const info = new InfoType(ref.reinterpret(infoType.deref(), 192, 0));

    const game = info.game || path.basename(filename, path.extname(filename));
    const song = info.song || `Track ${k}`;
    const author = info.author || info.dumper;

    trackEntries.push({
      id: `${filename}:${k}`,
      track: k,
      name: song,
      filename,
      artist: author ? `${author} - ${game}` : game,
    });

    gme.gme_free_info(infoType.deref());
  }

  return trackEntries;
}

export class GMESound {
  constructor(entry, ctx) {
    this.entry = entry;
    this.promiseLoaded = new Promise(resolve => {
      gme.gme_open_file(entry.filename, musicEmu, ctx.sampleRate);
      gme.gme_start_track(musicEmu.deref(), entry.track);
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
