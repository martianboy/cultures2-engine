import { read_palette } from './pcx.js';
import { read_cif } from './cif.js';

class CulturesRegistry {
  /**
   * @param {import('./fs').CulturesFS} fs
   */
  constructor(fs) {
    this.fs = fs;

    this.palettes = new Map();
    this.landscapes = new Map();
    this.landscape_types = new Map();
  }

  async load_palettes() {
    const PATH = 'data\\engine2d\\inis\\palettes\\palettes.cif';
    const cif = await read_cif(this.fs.open(PATH));

    for (const section of cif) {
      if (section.name === 'GfxPalette256') {
        this.palettes.set(section.def?.editname, section);
      }
    }
  }

  async load_landscapes() {
    const PATH = 'data\\engine2d\\inis\\landscapes\\landscapes.cif';
    const cif = await read_cif(this.fs.open(PATH));

    for (const section of cif) {
      if (section.name === 'GfxLandscape') {
        this.landscapes.set(section.def.EditName, section);
      }
    }
  }
}

/**
 * @param {import('./fs').CulturesFS} fs 
 */
export async function load_registry(fs) {
  const registry = new CulturesRegistry(fs);

  await registry.load_palettes();
  await registry.load_landscapes();

  return registry;
}
