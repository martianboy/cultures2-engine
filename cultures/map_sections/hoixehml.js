import { SequentialDataView } from '../../utils/dataview.js';
import { read_file } from '../../utils/file_reader.js';

/**
 * @param {Blob} blob 
 */
export async function hoixehml(blob) {
  const buf = await read_file(blob);

  const view = new SequentialDataView(buf);

  const content = {
    unk1: view.getUint8(),
    unk_len: view.getUint32(), // = header.section_length - 5
    unk_magic: view.sliceAsString(8),
    length: view.getUint32(), // width * height
    unk_len_dup: view.getUint32(), // = header.section_length - 5
    elevation: /** @type {number[]} */([])
  };

  let count = 0;
  let elevation = Array(content.length);

  while (!view.eof) {
    let head = view.getUint8();

    if (head > 0x80) {
      const height = view.getUint8();
      for (let i = 0; i < head - 0x80; i++) {
        elevation[count++] = height;
      }
    } else {
      for (let i = 0; i < head; i++) {
        elevation[count++] = view.getUint8();
      }
    }
  }

  content.elevation = elevation;

  return content;
}
