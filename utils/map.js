/**
 * @param {number} x
 * @param {number} y
 */
export function triA(x, y) {
  const off = (y % 2 === 1) ? -1 : 0;

  return [
    2 * x + 0 + off, y - 1, 1.0,
    2 * x + 1 + off, y, 1.0,
    2 * x - 1 + off, y, 1.0
  ];
}

/**
 * @param {number} x
 * @param {number} y
 */
export function triB(x, y) {
  const off = (y % 2 === 1) ? 1 : 0;

  return [
    2 * (x - 1) + off, y - 1, 1.0,
    2 * x + off,       y - 1, 1.0,
    2 * x - 1 + off,   y - 0, 1.0
  ];
}

/**
 * @param {number} width
 * @param {number} height
 */
export function triangulate_map(width, height) {
  let map = Array(width * height * 4 * 2);

  for (let i = 0; i < 2 * width; i++) {
    for (let j = 0; j < 2 * height; j++) {
      map[2 * i * 2 * width + 2 * j] = triA(j, i);
      map[2 * i * 2 * width + 2 * j + 1] = triB(j, i);
    }
  }

  return map.flat();
}