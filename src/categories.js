export const CATEGORY_AUDIO = 'audio';
export const CATEGORY_SPECTRUM_ZX = 'spectrum_zx';
export const CATEGORY_GB = 'gb';
export const CATEGORY_GENESIS = 'genesis';
export const CATEGORY_NEC_PC_ENGINE = 'nec_pc_engine';
export const CATEGORY_TURBOGRAFX_16 = 'turbografx_16';
export const CATEGORY_MSX = 'msx';
export const CATEGORY_NES = 'nes';
export const CATEGORY_SNES = 'snes';
export const CATEGORY_MASTER_SYSTEM = 'master_system';
export const CATEGORY_GAMEGEAR = 'gamegear';
export const CATEGORY_PS1 = 'ps1';
export const CATEGORY_PS2 = 'ps2';

const DISPLAY_NAMES = {
  [CATEGORY_AUDIO]: 'Audio',
  [CATEGORY_SPECTRUM_ZX]: 'Spectrum ZX',
  [CATEGORY_GB]: 'Gameboy',
  [CATEGORY_GENESIS]: 'Sega Genesis',
  [CATEGORY_NEC_PC_ENGINE]: 'NEC PC Engine',
  [CATEGORY_TURBOGRAFX_16]: 'Turbografx 16',
  [CATEGORY_NES]: 'Nintendo (NES)',
  [CATEGORY_SNES]: 'Super Nintendo',
  [CATEGORY_MASTER_SYSTEM]: 'Sega Master System',
  [CATEGORY_PS1]: 'Playstation',
  [CATEGORY_PS2]: 'Playstation 2',
};

export function getCategoryDisplayName(category) {
  return DISPLAY_NAMES[category];
}
