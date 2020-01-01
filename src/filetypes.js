export default {
  n64: {
    name: 'Nintendo64',
    extensions: ['.usf', '.miniusf'],
  },
  ps1: {
    name: 'Playstation',
    extensions: ['.psf', '.minipsf'],
  },
  ps2: {
    name: 'Playstation 2',
    extensions: ['.psf2', '.minipsf2'],
  },
  spectrum_zx: {
    name: 'Spectrum ZX',
    extensions: ['.ay'],
  },
  gb: {
    name: 'Gameboy',
    extensions: ['.gbs'],
  },
  genesis: {
    name: 'Genesis',
    extensions: ['.gym'],
  },
  nec_pc_engine: {
    name: 'NEC PC Engine',
    extensions: ['.hes'],
  },
  turbografx_16: {
    name: 'TurboGrafx-16',
    extensions: ['.kss'], // TODO: kss is used by other sega stuff
  },
  nes: {
    name: 'Nintendo (NES)',
    extensions: ['.nsf', '.nsfe'],
  },
  snes: {
    name: 'Super Nintendo',
    extensions: ['.spc'],
  },
  master_system: {
    name: 'Sega Master System',
    extensions: ['.vgm'], // TODO: vgm is three consoles in one
  },
  gba: {
    name: 'Gameboy Advance',
    extensions: ['.gsf', '.minigsf'],
  },
  audio: {
    name: 'Audio',
    extensions: ['.mp3', '.ogg', '.wav'],
  },
};
