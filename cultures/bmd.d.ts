import { RGBColor } from "./pcx";

export interface BmdHeader {
  magic: number;
  zero_0: number;
  zero_1: number;
  num_frames: number;
  num_pixels: number;
  num_rows: number;
  unknown_1: number;
  unknown_2: number;
  zero_2: number;
}

export interface BmdFrameInfo {
  type: number;
  meta_1: number;
  meta_2: number;
  width: number;
  len: number;
  off: number;
}

export interface BmdRowInfo {
  indent: number;
  offset: number;
}

export interface BmdFile {
  header: BmdHeader;
  frames: BmdFrameInfo[];
  pixels: ArrayBuffer;
  rows: BmdRowInfo[];
}

export function read_bmd(blob: Blob): Promise<BmdFile>;
export function bmd_to_bmp(bmd_file: BmdFile, palette: RGBColor[], frame: number, ctx: CanvasRenderingContext2D): ImageData;