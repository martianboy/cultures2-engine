export interface FSHeader {
  version: number;
  num_dirs: number;
  num_files: number;
}

export interface DirInfo {
  path: string;
  depth: number;
}

export interface FileInfo {
  path: string;
  offset: number;
  length: number;
}

export class CulturesFS {
  constructor(datafile: File, files: IterableIterator<FileInfo>);
  ls(): IterableIterator<FileInfo>;
  open(path: string): Blob;
}

export function load_fs(datafile: File): Promise<CulturesFS>;