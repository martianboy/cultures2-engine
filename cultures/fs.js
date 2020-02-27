import { read_file } from '../utils/file_reader.js';
import { SequentialDataView } from '../utils/dataview.js';

class CulturesFS {
  /**
   * @param {File} datafile 
   * @param {import('./fs').FileInfo[]} files
   */
  constructor(datafile, files) {
    this.datafile = datafile;

    /** @type {Map<string, import('./fs').FileInfo>} */
    this.files = new Map();
    for (let fi of files) {
      this.files.set(fi.path, fi);
    }
  }

  /**
   * @returns {IterableIterator<import('./fs').FileInfo>}
   */
  ls() {
    return this.files.values();
  }

  /**
   * @param {string} path 
   * @returns {Blob}
   */
  open(path) {
    const fi = this.files.get(path);
    if (!fi) throw new Error(`File not found: ${path}`);

    return this.datafile.slice(fi.offset, fi.offset + fi.length);
  }
}

/**
 * @param {SequentialDataView} view 
 * @returns {import('./fs').FSHeader}
 */
function getHeader(view) {
  view.seek(0);

  return {
    version: view.getUint32(),
    num_dirs: view.getUint32(),
    num_files: view.getUint32(),
  };
}

/**
 * @param {number} n
 * @param {SequentialDataView} view 
 * @returns {import('./fs').DirInfo[]}
 */
function getDirs(n, view) {
  /** @type {import('./fs').DirInfo[]} */
  let dirs = [];

  for (let i = 0; i < n; i++) {
    dirs.push({
      path: view.getString(),
      depth: view.getUint32()
    });
  }

  return dirs;
}

/**
 * @param {number} n
 * @param {SequentialDataView} view 
 * @returns {import('./fs').FileInfo[]}
 */
function getFiles(n, view) {
  /** @type {import('./fs').FileInfo[]} */
  let files = [];

  for (let i = 0; i < n; i++) {
    files.push({
      path: view.getString(),
      offset: view.getUint32(),
      length: view.getUint32()
    });
  }

  return files;
}

/**
 * @param {File} datafile 
 * @returns {Promise<CulturesFS>}
 */
export async function load_fs(datafile) {
  const buffer = await read_file(datafile.slice(0, 200 * 1024));
  const view = new SequentialDataView(buffer);

  const header = getHeader(view);
  const dirs = getDirs(header.num_dirs, view);
  const files = getFiles(header.num_files, view);

  return new CulturesFS(datafile, files);
}