import { read_file } from '../utils/file_reader.js';
import { SequentialDataView } from '../utils/dataview.js';

/**
 * @param {SequentialDataView} view 
 */
function read_bmd_header(view) {
  view.seek(0);

  return {
    magic: view.getUint32(),
    zero_0: view.getUint32(),
    zero_1: view.getUint32(),
    num_frames: view.getUint32(),
    num_pixels: view.getUint32(),
    num_rows: view.getUint32(),
    unknown_1: view.getUint32(),
    unknown_2: view.getUint32(),
    zero_2: view.getUint32(),
  };
}

/**
 * @param {SequentialDataView} view 
 */
function read_frames(view) {
  let magic = view.getUint16();
  if (magic !== 0x03E9) throw new Error('read_frame_info: starting point is incorrect.');

  view.skip(6);

  let section_length = view.getUint32();
  let frames = [];
  for (let i = 0; i < section_length / 24; i++) {
    frames.push({
      type: view.getUint32(),
      meta_1: view.getUint32(),
      meta_2: view.getUint32(),
      width: view.getUint32(),
      len: view.getUint32(),
      off: view.getUint32(),
    });
  }

  return frames;
}

/**
 * @param {SequentialDataView} view 
 * @returns {{ indent: number; offset: number; }[]}
 */
function read_rows(view) {
  let magic = view.getUint16();
  if (magic !== 0x03E9) throw new Error('read_rows_section: starting point is incorrect.');

  view.skip(6);
  let section_length = view.getUint32();
  let rows = [];

  for (let i = 0; i < section_length; i += 4) {
    const raw = view.getUint32();
    rows.push({
      indent: raw >> 22,
      offset: raw & ((1 << 22) - 1)
    });
  }

  return rows;
}

/**
 * @param {SequentialDataView} view 
 * @returns {ArrayBuffer}
 */
function read_pixels(view) {
  let magic = view.getUint16();
  if (magic !== 0x03E9) throw new Error('read_pixels: starting point is incorrect.');

  view.skip(6);

  let section_length = view.getUint32();
  return view.slice(section_length);
}

/**
 * @param {Blob} blob 
 */
export async function read_bmd(blob) {
  const buf = await read_file(blob);
  const view = new SequentialDataView(buf);

  let header, frames, pixels, rows;

  header = read_bmd_header(view);
  frames = read_frames(view);
  pixels = read_pixels(view);
  rows = read_rows(view);

  return {
    header,
    frames,
    pixels,
    rows
  };
}

/**
 * @param {import('./bmd').BmdFile} bmd_file 
 * @param {import('./pcx').RGBColor[]} palette
 * @param {number} frame
 * @param {CanvasRenderingContext2D} ctx
 */
export function bmd_to_bmp(bmd_file, palette, frame, ctx, pixel_level = 0) {
  if (!palette || !bmd_file) return;
  const frame_type = bmd_file.frames[frame].type;
  if (frame_type !== 1 && frame_type !== 4 && frame_type !== 2) {
    console.warn("Unsupported frame type", bmd_file.frames[frame].type);
    return;
  }

  const frame_start = bmd_file.frames[frame].off;
  const frame_count = bmd_file.frames[frame].len;
  const width = bmd_file.frames[frame].width;

  const pixels = new DataView(
    bmd_file.pixels,
    bmd_file.rows[frame_start].offset
  );
  let pixels_ptr = 0;

  const bmp = ctx.getImageData(0, 0, width, frame_count + 1);

  /**
   * @param {number} x
   * @param {number} y
   * @param {import('./pcx').RGBColor} color
   */
  function set_pixel(x, y, color, alpha = 0xff) {
    let idx = y * width * 4 + x * 4;
    bmp.data[idx + 0] = color.red;
    bmp.data[idx + 1] = color.green;
    bmp.data[idx + 2] = color.blue;
    bmp.data[idx + 3] = alpha;
  }

  for (let row = 0; row < frame_count; row++) {
    const indent = bmd_file.rows[row + frame_start].indent;
    let i = indent;

    let pixel_block_length = pixels.getUint8(pixels_ptr++);

    while (pixel_block_length !== 0) {
      if (pixel_block_length === 0x80) {
        console.log('0x' + pixels_ptr.toString(16));
      }

      if (pixel_block_length < 0x80) {
        for (let j = 0; j < pixel_block_length; j++) {
          let color, alpha;

          if (frame_type === 4) {
            color = palette[pixels.getUint8(pixels_ptr++)];
            alpha = 0xff;
            pixels.getUint8(pixels_ptr++);
          } else if (frame_type === 1) {
            alpha = 0xff;
            color = palette[pixels.getUint8(pixels_ptr++)];
          } else { // if (frame_type === 2) {
            alpha = 0x80;
            color = { red: 0, green: 0, blue: 0 };
          }

          set_pixel(i++, row, color, alpha);
        }
      } else {
        for (let j = 0; j < pixel_block_length - 0x80; j++) {
          i++;
        }
      }
      pixel_block_length = pixels.getUint8(pixels_ptr++);
    }
  }

  return bmp;
}