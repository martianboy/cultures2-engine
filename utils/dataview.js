export class SequentialDataView {
  /**
   * @param {ArrayBuffer} buf
   * @param {number=} byteOffset
   * @param {number=} byteLength
   */
  constructor(buf, byteOffset, byteLength) {
    this.view = new DataView(buf, byteOffset, byteLength);
    this.position = 0;
    this.decoder = new TextDecoder('ascii');
  }

  get buffer() {
    return this.view.buffer;
  }

  /**
   * @param {number} position
   */
  seek(position) {
    this.position = position;
  }

  /**
   * @param {number} offset 
   */
  skip(offset) {
    this.position += offset;
  }

  /**
   * @param {number=} length
   */
  slice(length) {
    if (length) {
      const val = this.view.buffer.slice(this.position, this.position + length);
      this.seek(Math.min(this.position + length, this.view.byteLength));
      return val;
    } else {
      const val = this.view.buffer.slice(this.position);
      this.seek(this.view.byteLength);
      return val;
    }
  }

  /**
   * @param {number=} length 
   */
  sliceView(length) {
    return new SequentialDataView(this.buffer, this.position, length);
  }

  getUint8() {
    const val = this.view.getUint8(this.position);
    this.position += 1;
    return val;
  }

  getUint16() {
    const val = this.view.getUint16(this.position, true);
    this.position += 2;
    return val;
  }

  getUint32() {
    const val = this.view.getUint32(this.position, true);
    this.position += 4;
    return val;
  }

  /**
   * @param {number} length 
   */
  sliceAsString(length) {
    const bytes = this.view.buffer.slice(this.position, this.position + length);
    this.position += length;
    return this.decoder.decode(bytes);
  }

  getString() {
    let length = this.getUint32();
    return this.sliceAsString(length);
  }

  getZeroTerminatedString() {
    const pos = this.position;
    let i = 0;
    for (let b = this.view.getUint8(pos); b !== 0; b = this.view.getUint8(pos + i), i++);

    const string = this.sliceAsString(i - 1);
    this.skip(1);
    return string;
  }

  /**
   * @param {(b: number) => number} fn 
   */
  transform(fn) {
    for (let i = 0; i < this.view.byteLength; i++) {
      const val = fn(this.view.getUint8(this.position + i));
      this.view.setUint8(this.position + i, val);
    }
  }
}