import { SequentialDataView } from '../../utils/dataview.js';
import { read_file } from '../../utils/file_reader.js';


/**
 * @param {Blob} blob 
 */
export async function hoixzisl(blob) {
  const buf = await read_file(blob);

  const view = new SequentialDataView(buf);

  const content = {
    width: view.getUint32(),
    height: view.getUint32()
  };

  return content;
}