import { SequentialDataView } from '../utils/dataview.js';
import { read_file } from '../utils/file_reader.js';

import * as parsers from './map_sections/index.js';

/**
 * @param {SequentialDataView} view 
 */
function read_header(view) {
  return {
    tag: view.sliceAsString(8),
    unk1: view.getUint32(),
    section_length: view.getUint32(),
    unk2: view.getUint32(),
    unk3: view.getUint32(),
    unk4: view.getUint32(),
    unk5: view.getUint32(),
  };
}

/**
 * @param {Blob} blob 
 */
export async function read_map_data(blob) {
  let pointer = 0;
  let sections = {};

  do {
    // debugger;
    const buf = await read_file(blob.slice(pointer, pointer + 0x20));
    const view = new SequentialDataView(buf);
    const header = read_header(view);

    sections[header.tag] = header;
    if (parsers[header.tag]) {
      const section_blob = blob.slice(pointer + 0x20, pointer + 0x20 + header.section_length);
      sections[header.tag].content = await parsers[header.tag](section_blob);
    }

    pointer += header.section_length + 0x20;
  } while(pointer < blob.size);

  // console.table(sections);
  // debugger;
  return sections;
}