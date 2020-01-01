export default {
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
