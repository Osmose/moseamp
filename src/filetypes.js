const FILE_TYPES = [
  {
    id: 'n64',
    name: 'Nintendo64',
    playerId: 'musicplayer',
    extensions: ['.usf', '.miniusf'],
  },
  {
    id: 'ps1',
    name: 'Playstation',
    playerId: 'musicplayer',
    extensions: ['.psf', '.minipsf'],
  },
  {
    id: 'ps2',
    name: 'Playstation 2',
    playerId: 'musicplayer',
    extensions: ['.psf2', '.minipsf2'],
  },
  {
    id: 'spectrum_zx',
    name: 'Spectrum ZX',
    playerId: 'musicplayer',
    extensions: ['.ay'],
  },
  {
    id: 'gb',
    name: 'Gameboy',
    playerId: 'musicplayer',
    extensions: ['.gbs'],
  },
  {
    id: 'genesis',
    name: 'Genesis',
    playerId: 'musicplayer',
    extensions: ['.gym', '.vgz'],
  },
  {
    id: 'nec_pc_engine',
    name: 'NEC PC Engine',
    playerId: 'musicplayer',
    extensions: ['.hes'],
  },
  {
    id: 'turbografx_16',
    name: 'TurboGrafx-16',
    playerId: 'musicplayer',
    extensions: ['.kss'], // TODO: kss is used by other sega stuff
  },
  {
    id: 'nes',
    name: 'Nintendo (NES)',
    playerId: 'musicplayer',
    extensions: ['.nsf', '.nsfe'],
  },
  {
    id: 'snes',
    name: 'Super Nintendo',
    playerId: 'musicplayer',
    extensions: ['.spc'],
  },
  {
    id: 'master_system',
    name: 'Sega Master System',
    playerId: 'musicplayer',
    extensions: ['.vgm'], // TODO: vgm is three consoles in one
  },
  {
    id: 'gba',
    name: 'Gameboy Advance',
    playerId: 'musicplayer',
    extensions: ['.gsf', '.minigsf'],
  },
  {
    id: 'audio',
    name: 'Audio',
    playerId: 'webaudioplayer',
    extensions: ['.mp3', '.ogg', '.wav'],
  },
];

export function getTypeForExt(ext) {
  return FILE_TYPES.find(fileType => fileType.extensions.includes(ext));
}

export const SUPPORTED_EXTENSIONS = [];
export const EXTENSIONS_ICONS = {};
for (const [code, type] of Object.entries(FILE_TYPES)) {
  for (const extension of type.extensions) {
    SUPPORTED_EXTENSIONS.push(extension);
    EXTENSIONS_ICONS[extension] = `img/${code}.png`;
  }
}

export default FILE_TYPES;
