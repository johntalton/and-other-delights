// pack map and its reverse
export const TRUE_8_PACKMAP = [7, 6, 5, 4, 3, 2, 1, 0];
export const REVERSE_TRUE_8_PACKMAP = [0, 1, 2, 3, 4, 5, 6, 7];

// A Template type for the Packing and Unpacking of bit(s) into and
// out of a n-byte data value.
// It is an Array of a tuple array that contains the offset and length.
export type PackMap = Array<[number, number]|[number]|number>;
export type NormalizedPackMap = Array<[number, number]>;

const BIT_SIZE = 8;
const NEGATIVE_ONE = -1;
const ZERO = 0;
const ONE = 1;
const TWO = 2;

const TEN = 10;
const TWELVE = 12;
const TWENTY = 20;

/**
 *
 **/
export class BitUtil {
  /**
   * A utility to pack multiple byte-parts into a single value.
   *
   * @param packMap The pack template to parse params by.
   * @param params The parameters to the packMap.
   * @param warnNotNormal If true will log out when non-normal packMap exists.
   * @returns Parameter bits packed into single byte.
   */
  static packBits(packMap: PackMap, params: Array<number>, warnNotNormal = true): number {
    return BitUtil._normalizePackMap(packMap, warnNotNormal)
      .reduce((accum, [position, length], idx) => {
        const mask = Math.pow(TWO, length) - ONE;
        const value = params[idx] & mask;
        const shift = position + ONE - length;
        return (accum & ~(mask << shift)) | (value << shift);
      }, ZERO);
  }

  /**
   *  A utility to split a value into its corresponding template parts.
   *
   * @param packMap A template by with to parse bits.
   * @param bits A value to be used to extract the template parts.
   * @param warnNotNormal If true will log out when non-normal format exists.
   * @returns An array of bytes extracted from the bits parameter defined
   *  by the packMap.
   **/
  static unpackBits(packMap: PackMap, bits: number, warnNotNormal = true): Array<number> {
    return BitUtil._normalizePackMap(packMap, warnNotNormal)
      .map(([position, length]) => {
        // console.log('unpacking', bits.toString(2), position, length);
        return BitUtil._readBits(bits, position, length);
      });
  }

  // position if from left->right with zero index
  static mapBits(bits: number, position: number, length: number): number {
    return BitUtil._readBits(bits, position, length);
  }

  static _readBits(bits: number, position: number, length: number): number {
    const shift = position - length + 1;
    const mask = Math.pow(2, length) - 1;
    // console.log('_readBits', bits.toString(2), position, length, shift, mask);
    return (bits >> shift) & mask;
  }

  static _normalizePackMap(packMap: PackMap, warnStrict = true): NormalizedPackMap {
    return packMap.map(item => {
      if(Array.isArray(item)) {
        if(item.length !== 2) {
          if(warnStrict) { console.log('sloppy packMap format', item); }
          return [item[0], 1];
        }
        return item;
      }
      if(warnStrict) { console.log('sloppy packMap format', item); }
      return [item, 1];
    });
  }

  // --------------

  static decodeTwos(twos: number, length: number): number {
    const smask = ONE << (length - ONE);
    if((twos & smask) !== smask) { return twos; }
    // this is a subtle way to coerce truncated twos
    // into sign extends js integer (without parseInt)
    return NEGATIVE_ONE << length - ONE | twos;
  }

  static reconstructNBit(nbit: number, parts: Array<number>): number {
    // 20-bit does not follow the pattern of the above
    // shift up and use the low bit of the part as the remaining
    // bits.  Instead it uses the parts high order bits as the
    // remaining bits that need to be shifted down.  however, this
    // comes from a single implementation caller that may have its
    // byte read incorrect, or may have been calculated inaccurately
    if(nbit === 20) {
      const [msb, lsb, xlsb] = parts;
      return ((msb << 8 | lsb) << 8 | xlsb) >> 4;
    }

    // generic algorithm for N-Bit reconstruction
    return parts.map((part, index) => {
      const shift = nbit - (BIT_SIZE * (index + ONE));
      if(shift < 0) {
        const size = BIT_SIZE + shift; // not addition is negative subtraction
        const mask = Math.pow(2, size) - ONE;
        // console.log('last part #', index, shift, size, mask, part);
        return part & mask;
      }

      const mask = Math.pow(2, BIT_SIZE) - ONE;
      // console.log('part #', index, shift, mask, part);
      return (part & mask) << shift;
    })
    .reduce((acc, part) => acc | part, ZERO);
  }

  static reconstruct10bit(msb: number, lsb_2bit: number): number { return BitUtil.reconstructNBit(TEN, [msb, lsb_2bit]); }
  static reconstruct12bit(msb: number, lsb_4bit: number): number { return BitUtil.reconstructNBit(TWELVE, [msb, lsb_4bit]); }
  static reconstruct20bit(msb: number, lsb: number, xlsb: number): number { return BitUtil.reconstructNBit(TWENTY, [msb, lsb, xlsb]); }
}
