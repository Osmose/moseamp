import path from 'path';
import bindings from 'bindings';
import tmp from 'tmp';
import fs from 'fs';
import wav from 'wav';

import { asyncExec } from 'moseamp/utils';

const { loadPlugins, MusicPlayer } = bindings('musicplayer_node');
loadPlugins(path.resolve(__dirname, 'musicplayer_data'));

const NES_SLICE_UNITS = 200;
const LOG2_440 = 8.7813597135246596040696824762152;
const LOG_2 = 0.69314718055994530941723212145818;
const NOTE_440HZ = 0x69;
const CPU_CLOCK = 1789773;

class NesOsc {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }

  hasFinePitch() {
    return true;
  }

  period(analysis) {
    return analysis.nes[`${this.name}Period`];
  }

  fractionalNote(analysis) {
    const period = this.period(analysis);
    const freq = CPU_CLOCK / (16 * (period + 1));
    let fractionalNote = 0.0;
    if (freq > 1.0) {
      fractionalNote = 12 * (Math.log(freq) / LOG_2 - LOG2_440) + NOTE_440HZ + 0.5;
    }

    // Fractional note 69 == A0 in Famitracker, so we subtract 69 to make it 0
    // and then add 9 so that 0 is equal to C0
    return fractionalNote - 69 + 9;
  }

  volume(analysis) {
    return analysis.nes[`${this.name}Volume`];
  }
}

class NesTriangle extends NesOsc {
  volume(analysis) {
    return analysis.nes['triangleCounter'] !== 0 ? 16 : 0;
  }
}

class NesNoise extends NesOsc {
  hasFinePitch() {
    return false;
  }

  fractionalNote(analysis) {
    return 12 + (16 - analysis.nes[`${this.name}Rate`]);
  }
}

class NesDPCM extends NesOsc {
  hasFinePitch() {
    return false;
  }

  fractionalNote() {
    return 8;
  }

  volume(analysis) {
    return analysis.nes[`${this.name}Playing`] ? 8 : 0;
  }
}

const keyPositions = [
  4, 6, 8, 10, 12, 16, 18, 20, 22, 24, 26, 28, 32, 34, 36, 38, 40, 44, 46, 48, 50, 52, 54, 56, 60, 62, 64, 66, 68, 72,
  74, 76, 78, 80, 82, 84, 88, 90, 92, 94, 96, 100, 102, 104, 106, 108, 110, 112, 116, 118, 120, 122, 124, 128, 130, 132,
  134, 136, 138, 140, 144, 146, 148, 150, 152, 156, 158, 160, 162, 164, 166, 168, 172, 174, 176, 178, 180, 184, 186,
  188, 190, 192, 194, 196, 200, 202, 204, 206, 208, 212, 214, 216, 218, 220, 222, 224,
];

export default {
  SLICE_UNITS: NES_SLICE_UNITS,
  MS_PER_SLICE: 16,
  WHITE_WIDTH: 70,
  BLACK_WIDTH: 40,

  id: 'nes',
  name: 'NES',
  icon: { iconId: 'nes' },
  canRender: true,

  lastDrawTime: 0,
  analysisInterval: null,
  oscs: {
    square1: new NesOsc('square1', 'hsl(217, 64%, 60%)'),
    square2: new NesOsc('square2', 'hsl(167, 64%, 60%)'),
    triangle: new NesTriangle('triangle', 'hsl(27, 48%, 60%)'),
    noise: new NesNoise('noise', 'hsl(230, 0%, 90%)'),
    dpcm: new NesDPCM('dpcm', 'hsl(230, 0%, 60%)'),

    vrc6Square1: new NesOsc('vrc6Square1', 'hsl(247, 64%, 60%)'),
    vrc6Square2: new NesOsc('vrc6Square2', 'hsl(197, 64%, 60%)'),
    vrc6Saw: new NesOsc('vrc6Saw', 'hsl(117, 64%, 60%)'),
  },
  pianoCanvas: null,

  onMount(canvas) {
    this.pianoCanvas = this.makePianoCanvas(canvas);
    this.clearCanvas(canvas);
    this.lastDrawTime = performance.now();
  },

  clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'hsl(0, 0%, 15%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  },

  makePianoCanvas(canvas) {
    const pianoCanvas = document.createElement('canvas');
    pianoCanvas.width = this.WHITE_WIDTH;
    pianoCanvas.height = canvas.height;
    this.drawKeys(pianoCanvas);
    return pianoCanvas;
  },

  onResize(canvas) {
    this.pianoCanvas.height = canvas.height;
    this.drawKeys(this.pianoCanvas);
  },

  draw(canvas, analysis, ts) {
    // If it's been more than 5 seconds, don't even bother
    if (ts - this.lastDrawTime > 5000) {
      this.lastDrawTime = ts;
    }

    while (ts - this.lastDrawTime > this.MS_PER_SLICE) {
      this.lastDrawTime += this.MS_PER_SLICE;
      this.drawFrame(canvas, analysis, this.pianoCanvas);
    }
  },

  drawFrame(canvas, analysis, pianoCanvas) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const { playing, nes } = analysis;

    if (!playing || !nes) {
      return;
    }

    const sliceWidth = Math.ceil((canvas.width - this.WHITE_WIDTH) / this.SLICE_UNITS);
    ctx.globalCompositeOperation = 'copy';
    // ctx.drawImage(
    //   canvas,
    //   this.WHITE_WIDTH,
    //   0,
    //   canvas.width - sliceWidth - this.WHITE_WIDTH,
    //   canvas.height,
    //   this.WHITE_WIDTH + sliceWidth,
    //   0,
    //   canvas.width - sliceWidth - this.WHITE_WIDTH,
    //   canvas.height
    // );
    ctx.drawImage(canvas, sliceWidth, 0);
    ctx.globalCompositeOperation = 'source-over';

    // Fill in gap for new notes
    ctx.fillStyle = 'hsl(0, 0%, 15%)';
    ctx.fillRect(this.WHITE_WIDTH, 0, sliceWidth, canvas.height);

    // Draw keys
    ctx.drawImage(pianoCanvas, 0, 0);

    for (const oscName of [
      'dpcm',
      'noise',
      'triangle',
      'square1',
      'square2',
      'vrc6Square1',
      'vrc6Square2',
      'vrc6Saw',
    ]) {
      const osc = this.oscs[oscName];
      this.drawOsc(canvas, ctx, analysis, osc);
    }
  },

  drawOsc(canvas, ctx, analysis, osc) {
    const volume = osc.volume(analysis);
    if (!volume || volume <= 0) {
      return;
    }

    const fractionalNote = osc.fractionalNote(analysis);
    const pianoNote = Math.floor(fractionalNote);
    const { midPointY, y, keyColor } = this.keyInfo(canvas, pianoNote);
    const keyHeight = this.keyHeight(canvas);
    const sliceWidth = Math.ceil((canvas.width - this.WHITE_WIDTH) / this.SLICE_UNITS);

    // Roll bar
    const height = Math.ceil((volume / 16) * keyHeight);
    const yMod = osc.hasFinePitch() ? Math.floor((fractionalNote - pianoNote - 0.5) * keyHeight) : 0;
    ctx.fillStyle = osc.color;
    ctx.fillRect(this.WHITE_WIDTH, Math.ceil(midPointY + yMod - height / 2), sliceWidth, height);

    // Key fill
    const keyWidth = keyColor === 'black' ? this.BLACK_WIDTH : this.WHITE_WIDTH;
    const fillWidth = 16;
    ctx.fillRect(keyWidth - (fillWidth + 1), y + 1, fillWidth, keyHeight - 2);
  },

  keyHeight(canvas) {
    return Math.ceil(canvas.height / 56);
  },

  keyInfo(canvas, note) {
    const octaveNote = note % 12;
    const isBlackNote = [1, 3, 6, 8, 10].includes(octaveNote);

    const heightUnit = Math.ceil(this.keyHeight(canvas) / 4);
    const y = canvas.height - keyPositions[note] * heightUnit;
    return {
      y,
      midPointY: y + Math.floor(heightUnit * 2),
      keyColor: isBlackNote ? 'black' : 'white',
    };
  },

  drawKeys(canvas) {
    const ctx = canvas.getContext('2d');
    const keyHeight = this.keyHeight(canvas);

    for (let octave = 0; octave < 8; octave++) {
      // White notes first so they don't cover the black ones
      for (const octaveNote of [0, 2, 4, 5, 7, 9, 11]) {
        const note = octaveNote + octave * 12;
        const { y } = this.keyInfo(canvas, note);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, y, this.WHITE_WIDTH, keyHeight);

        if (octaveNote === 0) {
          ctx.font = '8px sans-serif';
          ctx.fillStyle = '#000';
          ctx.fillText(`C${Math.floor(note / 12)}`, this.WHITE_WIDTH - 12, y + 12, 12);
        }
      }

      // Black notes
      for (const octaveNote of [1, 3, 6, 8, 10]) {
        const note = octaveNote + octave * 12;
        const { y } = this.keyInfo(canvas, note);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, y, this.BLACK_WIDTH, keyHeight);
      }
    }
  },

  async render({ filePath, song, outputPath, fps, duration, width, height, ffmpegPath, onRenderFrame }) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const sampleRate = 44100;
    const samplesPerFrame = sampleRate / fps;

    const pianoCanvas = this.makePianoCanvas(canvas);
    this.clearCanvas(canvas);

    const musicPlayer = new MusicPlayer(filePath);
    musicPlayer.seek(song);

    const directory = tmp.dirSync({ unsafeCleanup: true });
    const audioPath = path.join(directory.name, 'sound.wav');
    const audioOutputStream = new wav.FileWriter(audioPath, {
      sampleRate,
      channels: 2,
      bitDepth: 16,
    });

    for (let frameIndex = 0; frameIndex < fps * duration; frameIndex++) {
      const samples = musicPlayer.play(samplesPerFrame * 2);
      audioOutputStream.write(Buffer.from(samples.buffer));
      const analysis = { nes: musicPlayer.nesAnalysis(), playing: true };
      console.log(analysis.vrc6Square1Volume);
      this.drawFrame(canvas, analysis, pianoCanvas);
      const canvasBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const buffer = Buffer.from(await canvasBlob.arrayBuffer());
      await new Promise((resolve) =>
        fs.writeFile(path.join(directory.name, `${frameIndex}.png`), buffer, { encoding: 'binary' }, resolve)
      );
      onRenderFrame({ frameIndex });
    }
    audioOutputStream.end();

    const imagePattern = path.join(directory.name, '%d.png');
    await asyncExec(
      [
        `${ffmpegPath} -y`,
        `-framerate ${fps} -r ${fps}`,
        `-i "${imagePattern}"`,
        `-i ${audioPath}`,
        '-c:v h264 -c:a aac',
        outputPath,
      ].join(' ')
    );
    directory.removeCallback();
    musicPlayer.freePlayer();
  },
};
