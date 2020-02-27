import { read_file } from '../utils/file_reader.js';
import { SequentialDataView } from '../utils/dataview.js';

/**
 * @param {Blob} blob 
 */
export async function read_palette(blob) {
  const buf = await read_file(blob.slice(blob.size - 768));
  const view = new SequentialDataView(buf);

  /** @type {import('./pcx').RGBColor[]} */
  let palette = []

  for (let i = 0; i < 256; i++) {
    palette.push({
      red: view.getUint8(),
      green: view.getUint8(),
      blue: view.getUint8(),
    });
  }

  return palette;
}