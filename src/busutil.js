
const BASE_10 = 10;

/**
 *
 **/
class BusUtil {
  static normalizeBlock(blk) {
    // normalize block from shorthand (aka [[37, 1], [37], 37] are all the same)
    const block = blk.map(item => {
      if(Array.isArray(item)) {
        if(item.length !== 2) {
          const first = item[0];
          if(first === undefined) { throw Error('unexpected format: ' + JSON.stringify(blk)); }
          console.log('sloppy format', item);
          return [item[0], 1];
        }
        return item;
      }
      return [item, 1];
    })
    // make it all inty
    .map(([reg, len]) => [parseInt(reg, BASE_10), parseInt(len, BASE_10)]);

    // TODO what about NaN
    const notinvalid = block.reduce((acc, [reg, len]) => !Number.isNaN(reg) && !Number.isNaN(len));

    // and the total...
    const totalLength = block.reduce((out, [ , len]) => out + len, 0);
    // console.log(block, totalLength);

    const max = block.reduce((out, [reg, len]) => Math.max(out, reg + len), 0);

    return [block, totalLength, max];
  }

  /**
   * magic read method that take in an array of address/lengh pairs
   **/
  static readblock(bus, blk) {
    // normalize the bocks
    const [block, totalLength, ] = BusUtil.normalizeBlock(blk);

    // now lets make all those bus calls
    return Promise.all(block.map(([reg, len]) => {
      return bus.read(reg, len);
    }))
    .then(all => {
      //console.log(all);
      return Buffer.concat(all, totalLength);
    });
  }

  /**
   *
   **/
  static writeblock(bus, blks, buffer) {
    console.log('writeblock', blks, buffer)
    const [block, totalLength, max] = BusUtil.normalizeBlock(blks);
    if(max > buffer.length) { throw Error('max address is outside buffer length'); }
    if(totalLength === buffer.length) { throw Error('totalLength not equal buffer length'); } // todo redundent

    return Promise.all(block.map(([reg, len]) => {
      return bus.write(reg, Buffer.from(buffer.buffer, reg, len));
    }));
  }
}

module.exports = { BusUtil };
