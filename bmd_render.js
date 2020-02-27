/**
 * @param {import('./cultures/bmd').BmdFile} bmd_file
 * @param {import('./cultures/pcx').RGBColor[]} palette
 * @param {number} frame
 * @param {CanvasRenderingContext2D} ctx
 */
export function render(bmd_file, palette, frame, ctx) {
  if (!palette || !bmd_file) return;
  const frame_type = bmd_file.frames[frame].type;
  if (frame_type !== 1 && frame_type !== 4) {
    console.warn("Unsupported frame type", bmd_file.frames[frame].type);
    return;
  }

  const frame_start = bmd_file.frames[frame].off;
  const frame_count = bmd_file.frames[frame].len;
  const width = bmd_file.frames[frame].width;

  const pixels = new DataView(
    bmd_file.pixels,
    bmd_file.rows[frame_start].offset
  );
  let pixels_ptr = 0;

  const bmp = ctx.createImageData(width, frame_count + 1);

  /**
   * @param {number} x
   * @param {number} y
   * @param {import('./cultures/pcx').RGBColor} color
   */
  function set_pixel(x, y, color, alpha = 0xff) {
    let idx = y * width * 4 + x * 4;
    bmp.data[idx + 0] = color.red;
    bmp.data[idx + 1] = color.green;
    bmp.data[idx + 2] = color.blue;
    bmp.data[idx + 3] = alpha;
  }

  /**
   * @param {number} x 
   * @param {number} y 
   */
  function set_transparent_pixel(x, y) {
    let idx = y * width * 4 + x * 4;
    bmp.data[idx + 0] = 0;
    bmp.data[idx + 1] = 0;
    bmp.data[idx + 2] = 0;
    bmp.data[idx + 3] = 0;
  }

  for (let row = 0; row < frame_count; row++) {
    const indent = bmd_file.rows[row + frame_start].indent;
    let i = 0;

    while (i < indent) {
      set_transparent_pixel(i++, row);
    }

    let pixel_block_length = pixels.getUint8(pixels_ptr++);

    while (pixel_block_length !== 0) {
      if (pixel_block_length < 0x80) {
        for (let j = 0; j < pixel_block_length; j++) {
          let color, alpha;

          if (frame_type === 4) {
            color = palette[pixels.getUint8(pixels_ptr++)];
            alpha = pixels.getUint8(pixels_ptr++);
          } else {
            alpha = 0xff;
            color = palette[pixels.getUint8(pixels_ptr++)];
          }

          set_pixel(i++, row, color, 0xff);
        }
      } else {
        for (let j = 0; j < pixel_block_length - 0x80; j++) {
          set_transparent_pixel(i++, row);
        }
      }
      pixel_block_length = pixels.getUint8(pixels_ptr++);
    }

    while (i < width) {
      set_transparent_pixel(i++, row);
    }
  }

  ctx.clearRect(0, 0, 800, 600);
  ctx.putImageData(bmp, 0, 0);
}
