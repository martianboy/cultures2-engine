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