import path from 'path';
import { Map } from 'immutable';
import bindings from 'bindings';

const {loadPlugins, MusicPlayer} = bindings('musicplayer_node');
loadPlugins(path.resolve(__dirname, 'musicplayer_data'));

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
    name: 'TurboGrafx-16',
    extensions: ['kss'], // TODO: kss is used by other sega stuff
    columns: [
      { attr: 'track', name: 'Name', flex: 1, align: 'right' },
      { attr: 'name', name: 'Name', flex: 4 },
      { attr: 'game', name: 'Game', flex: 3 },
    ],
  },
  nes: {
    name: 'Nintendo (NES)',
    extensions: ['nsf', 'nsfe'],
  },
  snes: {
    name: 'Super Nintendo',
    extensions: ['spc'],
    columns: [
      { attr: 'name', name: 'Name', flex: 4 },
      { attr: 'game', name: 'Game', flex: 3 },
    ],
  },
  master_system: {
    name: 'Sega Master System',
    extensions: ['vgm'], // TODO: vgm is three consoles in one
  },
  gba: {
    name: 'Gameboy Advance',
    extensions: ['gsf', 'minigsf'],
  },
  audio: {
    name: 'Audio',
    sort: ['artist', 'album', 'track', 'name'],
    searchFields: ['name', 'filename', 'artist', 'album'],
    columns: [
      { attr: 'name', name: 'Name', flex: 4 },
      { attr: 'artist', name: 'Artist', flex: 3 },
      { attr: 'track', name: 'Track', flex: 1 },
      { attr: 'album', name: 'Album', flex: 2 },
    ],
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
    return {
      sort: ['filename', 'name'],
      searchFields: ['name', 'artist', 'game', 'filename'],
      columns: [
        { attr: 'game', name: 'Game', flex: 1 },
        { attr: 'name', name: 'Name', flex: 2 },
      ],
      ...info,
    };
  }

  return undefined;
}

export async function createEntries(filename) {
  const category = getCategory(filename);

  let title = path.basename(filename, path.extname(filename));
  let game = path.basename(path.dirname(filename));

  try {
    const player = new MusicPlayer(filename);
    title = player.getMeta('sub_title');
    game = player.getMeta('game');
    player.freePlayer();
  } catch (err) {}

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
    this.promiseLoaded = new Promise((resolve, reject) => {
      try {
        this.player = new MusicPlayer(entry.get('filename'));
        console.log(`Title: ${this.player.getMeta('title')}`);
        console.log(`SubTitle: ${this.player.getMeta('sub_title')}`);
        console.log(`Length: ${this.player.getMeta('length')}`);
        console.log(`Game: ${this.player.getMeta('game')}`);
        console.log(`Composer: ${this.player.getMeta('composer')}`);
        console.log(`Format: ${this.player.getMeta('format')}`);
        console.log(`Songs: ${this.player.getMeta('songs')}`);
      } catch (err) {
        reject(err);
      }

      console.log(entry);
      if (entry.get('track')) {
        this.player.seek(entry.get('track'));
      }
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
    if (this.playing && this.player) {
      const samples = this.player.play(8192 * 2);

      for (let k = 0; k < 8192; k++) {
        left[k] = samples[k * 2];
        right[k] = samples[(k * 2) + 1];
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
      this.player.freePlayer();
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
