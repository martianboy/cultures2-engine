export interface RGBColor {
  red: number;
  green: number;
  blue: number;
}

export function pcx_read_palette(buf: Blob): Promise<RGBColor[]>;
export function pcx_read(blob: Blob): Promise<ImageData>;