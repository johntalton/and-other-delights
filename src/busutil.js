
const BASE_10 = 10;

/**
 *
 **/
class BusUtil {
  // magic read method that take in an array of address/lengh pairs
  static readblock(bus, blocks) {
    // normalize block from shorthand (aka [[37, 1], [37], 37] are all the same)
    const blk = blocks.map(item => {
      if(Array.isArray(item)) {
        if(item.length !== 2) { console.log('sloppy format', item); return [item[0], 1]; }
        return item;
      }
      return [item, 1];
    })
    // make it all inty
    .map(([reg, len]) => [parseInt(reg, BASE_10), parseInt(len, BASE_10)]);

    // TODO what about NaN

    // and the total...
    const totalLength = blk.reduce((out, [ , len]) => out + len, 0);
    // console.log(block, totalLength);

    // now lets make all those bus calls
    return Promise.all(blk.map(([reg, len]) => {
      return bus.read(reg, len);
    }))
    .then(all => {
      //console.log(all);
      return Buffer.concat(all, totalLength);
    });
  }
}

module.exports = { BusUtil };
