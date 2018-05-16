
const TRUE_8_BITMAP = [7, 6, 5, 4, 3, 2, 1, 0];
const REVERSE_TRUE_8_BITMAP = [0, 1, 2, 3, 4, 5, 6, 7];

/**
 *
 **/
class BitUtil {
  /**
   *  packbits([2, [3, 2]], onoff, quad)
   **/
  static packbits(packmap, ...params) {
    return BitUtil._normalizePackmap(packmap)
      .reduce((accum, [position, length], idx) => {
        const mask = Math.pow(2, length) - 1;
        const value = params[idx] & mask;
        const shift = position + 1 - length;
        return accum | (value << shift);
      }, 0);
  }

  /**
   *  const [onoff, quad] = unpackbits([2, [3, 2]])
   **/
  static unpackbits(packmap, bits) {
    return BitUtil._normalizePackmap(packmap)
      .map(([position, length]) => {
        // console.log('unpacking', bits.toString(2), position, length);
        return BitUtil._readBits(bits, position, length);
      });
  }

  // position if from left->right with zero index
  static _readBits(bits, position, length) {
    const shift = position - length + 1;
    const mask = Math.pow(2, length) - 1;
    // console.log('_readBits', bits.toString(2), position, length, shift, mask);
    return (bits >> shift) & mask;
  }

  static _normalizePackmap(packmap) {
    return packmap.map(item => {
      if(Array.isArray(item)) {
        if(item.length !== 2) { console.log('sloppy packmap fomrat', item); return [item[0], 1]; }
        return item;
      }
      return [item, 1];
    });
  }

  // --------------

  static decodeTwos(twos, length) {
    const smask = 1 << (length - 1);
    if((twos & smask) !== smask) { return twos; }
    // this is a subtle way to coerce trunceated twos
    // into sign extented js integer (without parseInt)
    return -1 << length - 1 | twos;
  }

  static reconstructNbit(nbit, ...parts) {
    if(nbit < 8) { throw Error('what?'); }
    //console.log('nbit', nbit, parts);

    const [msb, lsb, xlsb] = parts;
    if(nbit === 10) { return (msb << 2) | lsb; }
    if(nbit === 12) { return (msb << 4) | lsb; }
    if(nbit === 20) { return ((msb << 8 | lsb) << 8 | xlsb) >> 4; }

    throw Error('nbit not supported');
  }

  static reconstruct10bit(msb, lsb_2bit) { return BitUtil.reconstructNbit(10, msb, lsb_2bit); }
  static reconstruct12bit(msb, lsb_4bit) { return BitUtil.reconstructNbit(12, msb, lsb_4bit); }
  static reconstruct20bit(msb, lsb, xlsb) { return BitUtil.reconstructNbit(20, msb, lsb, xlsb); }


}

BitUtil.TRUE_8_BITMAP = TRUE_8_BITMAP;
BitUtil.REVERSE_TRUE_8_BITMAP = REVERSE_TRUE_8_BITMAP;

module.exports = { BitUtil };





if(module.parent === null) {
  function foo (success) { if(!success) { throw Error('nope'); } }

  function test_decodeTwos() {
    foo(BitUtil.decodeTwos(0b1001, 4) === -7);

    foo(BitUtil.decodeTwos(0b010, 3) === 2);
    foo(BitUtil.decodeTwos(0b100, 3) === -4);
    foo(BitUtil.decodeTwos(0b111, 3) === -1);

    foo(BitUtil.decodeTwos(0b00000000, 8) === 0);
    foo(BitUtil.decodeTwos(0b01111110, 8) === 126);
    foo(BitUtil.decodeTwos(0b10000001, 8) === -127);
    foo(BitUtil.decodeTwos(0b11111111, 8) === -1);
  }

  function test_reconstruct() {
    //foo(Util.reconstructNbit(10, 0x00, 0x00) === 0);

    foo(BitUtil.reconstructNbit(12, 0x34, 0x0E) === 846);
    foo(BitUtil.reconstructNbit(12, 0x3E, 0x05) === 997);

    foo(BitUtil.reconstructNbit(20, 0x55, 0x47, 0x00) === 349296);
    foo(BitUtil.reconstructNbit(20, 0x7E, 0x8B, 0x80) === 518328);
  }

  test_decodeTwos();
  test_reconstruct();

  console.log('util self-test looks good.');
}

