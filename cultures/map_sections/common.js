import { SequentialDataView } from '../../utils/dataview.js';
import { read_file } from '../../utils/file_reader.js';

/**
 * @param {Blob} blob 
 */
export async function common_decoding(blob) {
  const buf = await read_file(blob);

  const view = new SequentialDataView(buf);

  const content = {
    unk1: view.getUint8(),
    unk_len: view.getUint32(), // = header.section_length - 5
    unk_magic: view.sliceAsString(8),
    length: view.getUint32(), // width * height
    unk_len_dup: view.getUint32(), // = header.section_length - 5
    /** @type {Uint8Array=} */
    data: undefined,
    /** @type {string[]} */
    blocks: [],
    range: new Set()
  };

  let count = 0;
  let data = new Uint8Array(content.length);

  while (!view.eof) {
    let head = view.getUint8();

    if (head > 0x80) {
      const value = view.getUint8();
      content.blocks.push(`${head - 128} x ${value}`);
      for (let i = 0; i < head - 0x80; i++) {
        data[count++] = value;
      }
    } else {
      let str = `${head}:`;
      for (let i = 0; i < head; i++) {
        data[count++] = view.getUint8();
        str += ` ${data[count - 1]}`;
      }
      content.blocks.push(str);
    }
  }

  content.data = data;

  return content;
}
