import { read_file } from '../utils/file_reader.js';
import { SequentialDataView } from '../utils/dataview.js';

/**
 * @param {SequentialDataView} view 
 */
function decode_cif(view) {
  let B = 0;
  let C = 71, D = 126;

  view.transform(byte => {
    B = byte - 1;
    B = B ^ C;
    C += D;
    D += 33;

    return B;
  });
}

/**
 * @param {SequentialDataView} view 
 */
function read_3fd_cif(view) {
  view.seek(12);
  const header = {
    NrOfEntries: view.getUint32(),
    NrOfEntries_dup1: view.getUint32(),
    NrOfEntries_dup2: view.getUint32(),
    SizeOfTextTable: view.getUint32(),
    Unk2: view.getUint32(),
    Unk3: view.getUint32(),
    SizeOfIndexTable: view.getUint32(),
  };

  decode_cif(view.sliceView(header.SizeOfIndexTable));
  const index_table = Array(header.NrOfEntries).fill(0).map(_ => view.getUint32());
  view.skip(1 + 4 + 4 + 4);

  decode_cif(view.sliceView(header.SizeOfTextTable));
  let text_table = [];

  let section;
  let sections = [];

  for (let i = 0; i < header.NrOfEntries; i++) {
    const level = view.getUint8();
    if (level === 1) {
      section = {
        name: view.getZeroTerminatedString(),
        items: /** @type {({ key: string; value: number | string; })[]} */([])
      };
      sections.push(section);
    } else {
      const line = parse(view.getZeroTerminatedString());
      if (line) section.items.push(line);
    }
  }

  return sections;
}

/**
 * @param {SequentialDataView} view 
 */
function read_041_cif(view) {

}

/**
 * @param {string} line
 */
function parse(line) {
  const regex = /^([a-zA-Z0-9]+) (?:([0-9]+)|"([^"]+)")$/g;
  const result = regex.exec(line);

  if (!result) return null;

  const key = result[1];
  if (result[2] !== undefined) {
    return { key, value: parseInt(result[2]) };
  }
  if (result[3] !== undefined) {
    return { key, value: result[3] };
  }

  return null;
}

/**
 * @param {Blob} blob 
 */
export async function read_cif(blob) {
  const buf = await read_file(blob);
  const view = new SequentialDataView(buf);

  const magic = view.getUint16();

  switch (magic) {
    case 0x03FD:
      return read_3fd_cif(view);
    // case 0x0041:
    //   break;
    default:
      throw new Error(`Unknown CIF magic number 0x${magic.toString(16)}`);
  }
}