export interface RGBColor {
  red: number;
  green: number;
  blue: number;
}

export function read_palette(buf: Blob): Promise<RGBColor[]>;