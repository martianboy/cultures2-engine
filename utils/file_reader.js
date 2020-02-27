/**
 * @param {Blob} blob 
 * @returns {Promise<ArrayBuffer>}
 */
export function read_file(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    reader.addEventListener("abort", rej);
    reader.addEventListener("error", rej);
    reader.addEventListener("loadend", () =>
      res(/** @type {ArrayBuffer} */ (reader.result))
    );
  });
}