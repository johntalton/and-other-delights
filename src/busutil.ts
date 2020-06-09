import { I2CAddressedBus } from './aod';

const BASE_10 = 10;

export type BlockDefinition = ([number, number] | [number] | number) []
export type NormalizedBlockDefinition = [number, number][];

/**
 *
 **/
export class BusUtil {
  static normalizeBlock(blk: BlockDefinition): [NormalizedBlockDefinition, number, number] {
    // normalize block from shorthand (aka [[37, 1], [37], 37] are all the same)
    const block: NormalizedBlockDefinition = blk.map(item => {
      if(Array.isArray(item)) {
        if(item.length !== 2) {
          const [first] = item;
          if(first === undefined) { throw new Error('unexpected format: ' + JSON.stringify(blk)); }
          console.log('sloppy format', item);
          return [item[0], 1];
        }
        return item;
      }
      return [item, 1];
    })
    // make it all int-like - todo is this overkill, yes
    .map(([reg, len]) => [parseInt(reg.toString(), BASE_10), parseInt(len.toString(), BASE_10)]);

    // TODO what about NaN ... this code may be wrong
    // const notinvalid = block.reduce((acc, [reg, len]) => !Number.isNaN(reg) && !Number.isNaN(len), true);

    // and the total...
    const totalLength = block.reduce((out, [ , len]) => out + len, 0);
    // console.log(block, totalLength);

    const max = block.reduce((out, [reg, len]) => Math.max(out, reg + len), 0);

    return [block, totalLength, max];
  }

  /**
   * Read from a bus given the block definition.
   *
   * @param bus The addressed bus to read from.
   * @param block A register Block template used to read.
   *
   **/
  static readblock(bus: I2CAddressedBus, block: BlockDefinition) {
    const [normalBlock, totalLength] = BusUtil.normalizeBlock(block);

    // now lets make all those bus calls
    return Promise.all(normalBlock.map(([reg, len]) => {
      return bus.read(reg, len);
    }))
    .then(all => Buffer.concat(all, totalLength));
  }

  /**
   * Writes to the bus given the block definitions and buffer.
   *
   * @param bus The addressed bus to write to.
   * @param block A register Block template used to write.
   * @param buffer A buffer of the bytes of data to be written.
   *
   * Note: When using multi block interactions, each block is async
   * by nature and is not guaranteed by this call to not be
   * interrupted or delayed by other bus activity.
   **/
  static writeblock(bus: I2CAddressedBus, block: BlockDefinition, buffer: Buffer) {
    const [normalBlock, totalLength, max] = BusUtil.normalizeBlock(block);
    //console.log('writeblock', blks, buffer, totalLength, max)
    if(max > buffer.length) { throw new Error('max address is outside buffer length'); }
    // if(totalLength !== buffer.length) { throw new Error('totalLength not equal buffer length'); } // todo redundent

    return Promise.all(normalBlock.map(([reg, len]) => {
        return bus.write(reg, Buffer.from(buffer.buffer, reg, len))
          .then(() => len);
      }))
      .then(lengths => lengths.reduce((acc, item) => acc + item, 0))
      .then(bytesWritten => {
        if(bytesWritten !== totalLength) { throw new Error('bytes written missmatch'); }
      });
  }

  /**
   * Fills the gasp between block templates to form contiguous buffer.
   *
   * @param block A block template used to map data into output.
   * @param buffer A buffer from which data is drawn from.
   * @param fillzero A value to use to fill the Zero space.
   **/
  static fillmapBlock(block: BlockDefinition, buffer: Buffer, fillzero: number = 0) {
    const [normalBlock, totalLength, max] = BusUtil.normalizeBlock(block);
    if(buffer.length !== totalLength) { throw new Error('buffer length mismatch'); }
    // compactRuns(block); // todo

    //console.log('fillmapBlock', block, totalLength, max);
    //console.log(buffer);

    const parts = normalBlock.reduce((acc, [reg, len], index, source) => {
      const [ lastReg, lastLen ] = index !== 0 ? source[index - 1] : [0, 0];
      const lastPos = lastReg + lastLen;

      const prefixLen = reg - lastPos;
      if(prefixLen > 0) { acc.push(Buffer.alloc(prefixLen).fill(fillzero)); }

      const existingLen = source.reduce((racc, [ , rlen], idx) => {
        //console.log('red', idx < index, idx, index, racc, rlen)
        return (idx < index) ? racc + rlen : racc;
      }, 0);

      const pos = existingLen === 0 ? 0 : existingLen;
      //console.log(prefixLen, reg, existingLen, pos, len);

      const part = buffer.slice(pos, pos + len);
      acc.push(part);

      return acc;
    }, []);

    //console.log(parts);

    return Buffer.concat(parts, max);
  }
}
