import { bmd_to_bmp } from './cultures/bmd.js';

/**
 * @param {import('./cultures/bmd').BmdFile} bmd_file
 * @param {import('./cultures/bmd').BmdFile=} bmd_s_file
 * @param {import('./cultures/pcx').RGBColor[]} palette
 * @param {number} frame
 * @param {CanvasRenderingContext2D} ctx
 */
export function render(bmd_file, bmd_s_file, palette, frame, ctx) {
  if (!palette || !bmd_file || !bmd_s_file) return;

  const dw = bmd_file.frames[frame].width - bmd_s_file.frames[frame].width;
  const dh = bmd_file.frames[frame].len - bmd_s_file.frames[frame].len;

  ctx.clearRect(0, 0, 800, 600);

  if (bmd_s_file) {
    const shadowed = bmd_to_bmp(bmd_s_file, palette, frame, ctx);
    ctx.putImageData(shadowed, Math.max(dw, 0), Math.max(dh, 0));
  }
  
  const object = bmd_to_bmp(bmd_file, palette, frame, ctx);  
  ctx.putImageData(object, 0, 0);
}
