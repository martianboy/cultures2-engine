import { read_palette } from './pcx.js';
import { read_cif } from './cif.js';

class CulturesRegistry {
  /**
   * @param {import('./fs').CulturesFS} fs
   */
  constructor(fs) {
    this.fs = fs;
    this.load_promise = load();

    this.palettes = new Map();
    this.landscapes = new Map();
    this.landscape_types = new Map();
  }

  async load() {

  }

  async load_palettes() {
    const PATH = 'data\\engine2d\\inis\\palettes\\palettes.cif';
    const cif = await read_cif(this.fs.open(PATH));

    for (const section of cif) {
      if (section.name === 'GfxPalette256') {
        
      }
    }
  }
}