import { read_file } from '../utils/file_reader.js';
import { SequentialDataView } from '../utils/dataview.js';

/**
 * @param {SequentialDataView} view 
 */
function read_palette(view) {
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

/**
 * @param {SequentialDataView} view 
 */
function read_header(view) {
  return {
    magic: view.getUint8(),
    version: view.getUint8(),
    encoding_method: view.getUint8(),
    bits_per_pixel: view.getUint8(),
    x0: view.getUint16(),
    y0: view.getUint16(),
    x1: view.getUint16(),
    y1: view.getUint16(),
    h_dpi: view.getUint16(),
    v_dpi: view.getUint16(),
    palette: view.slice(48),
    reserved: view.getUint8(),
    color_planes: view.getUint8(),
    bytes_per_color_plane: view.getUint16(),
    palette_type: view.getUint16(),
    h_res: view.getUint16(),
    v_res: view.getUint16(),
    reserved_block: view.slice(54),
  }
}

/**
 * @param {SequentialDataView} view 
 * @param {number} width
 * @param {number} height
 */
function read_pixels(view, width, height) {
  let pixels = new Uint8Array(new ArrayBuffer(width * height));
  let i = 0;

  while (i < width * height) {
    let val = view.getUint8();
    let len = 1;

    if (val > 192) {
      len = val - 192;
      val = view.getUint8();
    }

    for (; len > 0; len--) {
      pixels[i++] = val;
    }
  }

  return pixels;
}

/**
 * @param {Blob} blob 
 */
export async function pcx_read_palette(blob) {
  const buf = await read_file(blob.slice(blob.size - 768));
  const view = new SequentialDataView(buf);

  return read_palette(view);
}

/**
 * @param {Blob} blob 
 * @returns {Promise<ImageData>}
 */
export async function pcx_read(blob) {
  const buf = await read_file(blob);
  const view = new SequentialDataView(buf);
  const header = read_header(view);
  const width = header.x1 - header.x0 + 1;
  const height = header.y1 - header.y0 + 1;

  const pixels = read_pixels(view, width, height);
  let palette = undefined;

  const extended_palette_indicator = view.getUint8();
  if (extended_palette_indicator === 0x0C) {
    palette = read_palette(view);
  } else {
    throw new Error('Palette could not be found.');
  }

  const img = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    img.data[4 * i + 0] = palette[pixels[i]].red;
    img.data[4 * i + 1] = palette[pixels[i]].green;
    img.data[4 * i + 2] = palette[pixels[i]].blue;
    img.data[4 * i + 3] = 0xFF;
  }

  return img;
}
