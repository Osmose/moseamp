const FILE_TYPES = {
  n64: {
    name: 'Nintendo64',
    playerId: 'musicplayer',
    extensions: ['.usf', '.miniusf'],
  },
  ps1: {
    name: 'Playstation',
    playerId: 'musicplayer',
    extensions: ['.psf', '.minipsf'],
  },
  ps2: {
    name: 'Playstation 2',
    playerId: 'musicplayer',
    extensions: ['.psf2', '.minipsf2'],
  },
  spectrum_zx: {
    name: 'Spectrum ZX',
    playerId: 'musicplayer',
    extensions: ['.ay'],
  },
  gb: {
    name: 'Gameboy',
    playerId: 'musicplayer',
    extensions: ['.gbs'],
  },
  genesis: {
    name: 'Genesis',
    playerId: 'musicplayer',
    extensions: ['.gym', '.vgz'],
  },
  nec_pc_engine: {
    name: 'NEC PC Engine',
    playerId: 'musicplayer',
    extensions: ['.hes'],
  },
  turbografx_16: {
    name: 'TurboGrafx-16',
    playerId: 'musicplayer',
    extensions: ['.kss'], // TODO: kss is used by other sega stuff
  },
  nes: {
    name: 'Nintendo (NES)',
    playerId: 'musicplayer',
    extensions: ['.nsf', '.nsfe'],
  },
  snes: {
    name: 'Super Nintendo',
    playerId: 'musicplayer',
    extensions: ['.spc'],
  },
  master_system: {
    name: 'Sega Master System',
    playerId: 'musicplayer',
    extensions: ['.vgm'], // TODO: vgm is three consoles in one
  },
  gba: {
    name: 'Gameboy Advance',
    playerId: 'musicplayer',
    extensions: ['.gsf', '.minigsf'],
  },
  audio: {
    name: 'Audio',
    playerId: 'webaudioplayer',
    extensions: ['.mp3', '.ogg', '.wav'],
  },
};

export const SUPPORTED_EXTENSIONS = [];
export const EXTENSIONS_ICONS = {};
for (const [code, type] of Object.entries(FILE_TYPES)) {
  for (const extension of type.extensions) {
    SUPPORTED_EXTENSIONS.push(extension);
    EXTENSIONS_ICONS[extension] = `img/${code}.png`;
  }
}

export default FILE_TYPES;
