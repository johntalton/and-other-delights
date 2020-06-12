// pack map and its reverse
export const TRUE_8_PACKMAP = [7, 6, 5, 4, 3, 2, 1, 0];
export const REVERSE_TRUE_8_PACKMAP = [0, 1, 2, 3, 4, 5, 6, 7];

// A Template type for the Packing and Unpacking of bit(s) into and
// out of a n-byte data value.
// It is an Array of a tuple array that contains the offset and length.
export type PackMap = Array<[number, number]|[number]|number>;
export type NormalizedPackMap = Array<[number, number]>;

/**
 *
 **/
export class BitUtil {
  /**
   * A utility to pack mulitple byte-parts into a single value.
   *
   * @param packmap The pack template to parse params by.
   * @param params The parameters to the pack map.
   **/
  static packbits(packmap: PackMap, ...params: Array<number>) {
    return BitUtil._normalizePackmap(packmap)
      .reduce((accum, [position, length], idx) => {
        const mask = Math.pow(2, length) - 1;
        const value = params[idx] & mask;
        const shift = position + 1 - length;
        return (accum & ~(mask << shift)) | (value << shift);
      }, 0);
  }

  /**
   *  A utility to split a value into its corisponding template parts.
   *
   * @param packmap A template by with to parse bits.
   * @param bits A value to be used to extract the template parts.
   **/
  static unpackbits(packmap: PackMap, bits: number) {
    return BitUtil._normalizePackmap(packmap)
      .map(([position, length]) => {
        // console.log('unpacking', bits.toString(2), position, length);
        return BitUtil._readBits(bits, position, length);
      });
  }

  // position if from left->right with zero index
  static mapbits(bits: number, position: number, length: number): number { return BitUtil._readBits(bits, position, length); }
  static _readBits(bits: number, position: number, length: number): number {
    const shift = position - length + 1;
    const mask = Math.pow(2, length) - 1;
    // console.log('_readBits', bits.toString(2), position, length, shift, mask);
    return (bits >> shift) & mask;
  }

  static _normalizePackmap(packmap: PackMap): NormalizedPackMap {
    return packmap.map(item => {
      if(Array.isArray(item)) {
        if(item.length !== 2) { console.log('sloppy packmap fomrat', item); return [item[0], 1]; }
        return item;
      }
      console.log('sloppy packmap fomrat', item);
      return [item, 1];
    });
  }

  // --------------

  static decodeTwos(twos: number, length: number) {
    const smask = 1 << (length - 1);
    if((twos & smask) !== smask) { return twos; }
    // this is a subtle way to coerce trunceated twos
    // into sign extented js integer (without parseInt)
    return -1 << length - 1 | twos;
  }

  static reconstructNbit(nbit: number, ...parts: number[]) {
    //console.log('nbit', nbit, parts);

    // the 10 and 12 bit cases are primary use cases
    // where the last parts passed
    //if(nbit === 10) { return (msb << 2) | lsb; }
    //if(nbit === 12) { return (msb << 4) | lsb; }

    // todo, this does not follow the pattern of the above
    // shift up and use the low bit of the xlsb as the remaining
    // bits.  Instead it uses the xlsb high order bits as the
    // remaing bits that need to be shifted down.  however, this
    // comes from a single implementation caller that may have its
    // byte read incorrect, or may have been calculated inaccuratly
    if(nbit === 20) {
      const [msb, lsb, xlsb] = parts;
      return ((msb << 8 | lsb) << 8 | xlsb) >> 4;
    }

    const BIT_SIZE = 8;
    return parts.map((part, index) => {
       const shift = nbit - (BIT_SIZE * (index + 1));
       if(shift < 0) {
         const size = BIT_SIZE + shift; // not addition is negative subtraction
         const mask = Math.pow(2, size) - 1;
         //console.log('last part #', index, shift, size, mask, part);
         return part & mask;
       }

       const mask = Math.pow(2, BIT_SIZE) - 1;
       //console.log('part #', index, shift, mask, part);
       return (part & mask) << shift;
    })
    .reduce((acc, part) => acc | part, 0);
  }

  static reconstruct10bit(msb: number, lsb_2bit: number) { return BitUtil.reconstructNbit(10, msb, lsb_2bit); }
  static reconstruct12bit(msb: number, lsb_4bit: number) { return BitUtil.reconstructNbit(12, msb, lsb_4bit); }
  static reconstruct20bit(msb: number, lsb: number, xlsb: number) { return BitUtil.reconstructNbit(20, msb, lsb, xlsb); }
}
