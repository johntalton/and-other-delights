// pack map and its reverse
export const TRUE_8_PACKMAP = [7, 6, 5, 4, 3, 2, 1, 0]
export const REVERSE_TRUE_8_PACKMAP = [0, 1, 2, 3, 4, 5, 6, 7]

// A Template type for the Packing and Unpacking of bit(s) into and
// out of a n-byte data value.
// It is an Array of a tuple array that contains the offset and length.
export type NormalizedPacMapItem = [number, number]
export type SloppyPackMapItem = NormalizedPacMapItem | [number] | number
export type PackMap = Array<SloppyPackMapItem>
export type NormalizedPackMap = Array<NormalizedPacMapItem>

const BIT_SIZE = 8
const NEGATIVE_ONE = -1
const ZERO = 0
const ONE = 1
const TWO = 2

const TEN = 10
const TWELVE = 12
const TWENTY = 20

const DEFAULT_LENGTH = ONE

/**
 *
 **/
export class BitUtil {
  /**
   * Creates a bit-mask of the given length.
   *
   * @param length The masks length in bits.
   * @returns A mask of the specified length.
   */

  private static mask(length: number) {
    // if(length === 0) { return 0 }
    // if(length === 8) { return 0 }
    return Math.pow(TWO, length) - ONE
  }

  /**
   * A utility to pack multiple byte-parts into a single value.
   *
   * @param packMap The pack template to parse params by.
   * @param sourceData The parameters to the packMap.
   * @param warnNotNormal If true will log out when non-normal packMap exists.
   * @returns Parameter bits packed into single byte.
   */
  static packBits(packMap: PackMap, sourceData: Array<number>, warnNotNormal = true): number {
    return BitUtil.normalizePackMap(packMap, warnNotNormal)
      .reduce((accum, [position, length], idx) => {
        const mask = BitUtil.mask(length)
        const value = sourceData[idx] & mask
        const shift = position + ONE - length
        return (accum & ~(mask << shift)) | (value << shift)
      }, ZERO)
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
    return BitUtil.normalizePackMap(packMap, warnNotNormal)
      .map(([position, length]) => {
        return BitUtil.mapBits(bits, position, length)
      })
  }

  // position if from left->right with zero index
  private static mapBits(bits: number, position: number, length: number): number {
    const shift = position - length + ONE
    const mask = BitUtil.mask(length)
    return (bits >> shift) & mask
  }

  private static isNonOverlapping(_normalPackMap: NormalizedPackMap): boolean {
    return true
  }

  private static isOrdered(_normalPackMap: NormalizedPackMap): boolean {
    return true
  }

  /**
   * Validates and returns explicitly array of two number arrays.
   *
   * All user facing methods should call this before working with
   * user supplied packMap templates.
   *
   * @param packMap A template to process.
   * @param warnStrict If true will log out when non-normal format exists.
   * @returns A packMap with explicitly defined values.
   */
  private static normalizePackMap(packMap: PackMap, warnStrict = true): NormalizedPackMap {
    function formatE(kind: string, item?: SloppyPackMapItem) {
      return `invalid packMap format (${kind}): ${JSON.stringify(item)}`
    }

    const normalPackMap: NormalizedPackMap = packMap.map(item => {
      if(Array.isArray(item)) {
        // array must have at least one item
        if(item.length <= 0) {
          throw new Error(formatE('zero', item))
        }

        // if it only has on item, then its assumed length is one
        if(item.length === 1) {
          if(warnStrict) { console.warn('sloppy packMap format', item) }
          const [first] = item
          return [first, DEFAULT_LENGTH]
        }

        //
        if(item.length > 2) {
          throw new Error(formatE('gt 2', item))
        }

        // otherwise, its already normal
        const [offset, length] = item
        if(!Number.isInteger(offset)) {
          throw new Error(formatE('offset', offset))
        }
        if(!Number.isInteger(length)) {
          throw new Error(formatE('length', length))
        }
        return [offset, length]

      }

      if(Number.isInteger(item)) {
        if(warnStrict) { console.warn('sloppy packMap format', item) }
        return [item, DEFAULT_LENGTH]
      }

      throw new Error(formatE('type', item))
    })

    if(!BitUtil.isOrdered(normalPackMap)) {
      if(warnStrict) { console.warn('sloppy packMap format (order)') }
    }

    if(!BitUtil.isNonOverlapping(normalPackMap)) {
      throw new Error(formatE('overlapping'))
    }

    return normalPackMap
  }

  // --------------

  static decodeTwos(twos: number, length: number): number {
    const smask = ONE << (length - ONE)
    if((twos & smask) !== smask) { return twos }
    // this is a subtle way to coerce truncated twos
    // into sign extends js integer (without parseInt)
    return NEGATIVE_ONE << length - ONE | twos
  }

  static reconstructNBit(nbit: number, parts: Array<number>): number {
    // 20-bit does not follow the pattern of the above
    // shift up and use the low bit of the part as the remaining
    // bits.  Instead it uses the parts high order bits as the
    // remaining bits that need to be shifted down.  however, this
    // comes from a single implementation caller that may have its
    // byte read incorrect, or may have been calculated inaccurately
    if(nbit === 20) {
      const [msb, lsb, xlsb] = parts
      return ((msb << 8 | lsb) << 8 | xlsb) >> 4
    }

    // generic algorithm for N-Bit reconstruction
    return parts.map((part, index) => {
      const shift = nbit - (BIT_SIZE * (index + ONE))
      if(shift < 0) {
        const size = BIT_SIZE + shift // not addition is negative subtraction
        const mask = BitUtil.mask(size)
        return part & mask
      }

      const mask = BitUtil.mask(BIT_SIZE)
      return (part & mask) << shift
    })
    .reduce((acc, part) => acc | part, ZERO)
  }

  static reconstruct10bit(msb: number, lsb_2bit: number): number { return BitUtil.reconstructNBit(TEN, [msb, lsb_2bit]) }
  static reconstruct12bit(msb: number, lsb_4bit: number): number { return BitUtil.reconstructNBit(TWELVE, [msb, lsb_4bit]) }
  static reconstruct20bit(msb: number, lsb: number, xlsb: number): number { return BitUtil.reconstructNBit(TWENTY, [msb, lsb, xlsb]) }
}
