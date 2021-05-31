const FILE_TYPES = [
  {
    id: 'n64',
    name: 'Nintendo 64',
    playerId: 'musicplayer',
    extensions: ['.usf', '.miniusf'],
    iconType: 'image',
  },
  {
    id: 'ds',
    name: 'Nintendo DS',
    playerId: 'musicplayer',
    extensions: ['.2sf', '.mini2sf'],
    iconType: 'image',
  },
  {
    id: 'ps1',
    name: 'Playstation',
    playerId: 'musicplayer',
    extensions: ['.psf', '.minipsf'],
    iconType: 'image',
  },
  {
    id: 'ps2',
    name: 'Playstation 2',
    playerId: 'musicplayer',
    extensions: ['.psf2', '.minipsf2'],
    iconType: 'image',
  },
  {
    id: 'gb',
    name: 'Gameboy',
    playerId: 'musicplayer',
    extensions: ['.gbs'],
    iconType: 'image',
  },
  {
    id: 'genesis',
    name: 'Genesis',
    playerId: 'musicplayer',
    extensions: ['.gym', '.vgz'],
    iconType: 'image',
  },
  {
    id: 'gamegear',
    name: 'Game Gear',
    playerId: 'musicplayer',
    extensions: ['.kss'],
    iconType: 'image',
  },
  {
    id: 'nes',
    name: 'Nintendo (NES)',
    playerId: 'musicplayer',
    extensions: ['.nsf', '.nsfe'],
    iconType: 'image',
  },
  {
    id: 'snes',
    name: 'Super Nintendo',
    playerId: 'musicplayer',
    extensions: ['.spc'],
    iconType: 'image',
  },
  {
    id: 'gba',
    name: 'Gameboy Advance',
    playerId: 'musicplayer',
    extensions: ['.gsf', '.minigsf'],
    iconType: 'image',
  },
  {
    id: 'audio',
    name: 'Audio',
    playerId: 'webaudioplayer',
    extensions: ['.mp3', '.ogg', '.wav', '.flac'],
    iconType: 'fa',
    iconCode: 'compact-disc',
  },
];

export function getTypeForExt(ext) {
  return FILE_TYPES.find((fileType) => fileType.extensions.includes(ext));
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
