import { I2CAddressedBus } from './aod';

const BASE_10 = 10;

export type BlockDefinition = ([number, number] | [number] | number) []
export type NormalizedBlockDefinition = [number, number][];


/**
 *
 **/
export class BusUtil {
  /**
   * Normalizes a Block Definitions into it strict form.
   *
   * todo: enable compact runs flag
   * todo: validate accending address order
   * todo: validate non-overlapping runs
   *
   * Disabling strict warnings will supress the console output if you
   * wish to allow for shorthand definitions.
   * @param blk
   */
  static normalizeBlock(blk: BlockDefinition, warnStrict: boolean = true): [NormalizedBlockDefinition, number, number] {
    // normalize block from shorthand (aka [[37, 1], [37], 37] are all the same)
    const block: NormalizedBlockDefinition = blk.map(item => {
      if(Array.isArray(item)) {
        if(item.length !== 2) {
          const [first] = item;
          if(first === undefined) { throw new Error('unexpected format: ' + JSON.stringify(blk)); }
          if(warnStrict) { console.log('normalizeBlock: sloppy format', item); }
          return [item[0], 1];
        }
        return item;
      }

      if(warnStrict) { console.log('normalizeBlock: sloppy format', item); }
      return [item, 1];
    })
    // make it all int-like - todo is this overkill, yes
    // is this even needed with type checking
    .map(([reg, len]) => [parseInt(reg.toString(), BASE_10), parseInt(len.toString(), BASE_10)]);

    // TODO what about NaN ... this code may be wrong
    // const notinvalid = block.reduce((acc, [reg, len]) => !Number.isNaN(reg) && !Number.isNaN(len), true);

    // and the totals...
    // caclulate the required source data length, the packed version of the data
    const sourceDataLength = block.reduce((out, [ , len]) => out + len, 0);
    // calculate the total unpacked lenght defined by the block
    const blockLength = block.reduce((out, [reg, len]) => Math.max(out, reg + len), 0);

    return [block, sourceDataLength, blockLength];
  }

  /**
   * Read from a bus given the block definition.
   *
   * @param bus The addressed bus to read from.
   * @param block A register Block template used to read.
   * @param warnNotNormal If true, emit console warnnings about short hand usage.
   *
   **/
  static readblock(bus: I2CAddressedBus, block: BlockDefinition, warnNotNormal: boolean = true): Promise<Buffer> {
    const [normalBlock, totalLength] = BusUtil.normalizeBlock(block, warnNotNormal);

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
  static writeblock(bus: I2CAddressedBus, block: BlockDefinition, buffer: Buffer, warnNotNormal: boolean = true): Promise<void> {
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
  static fillmapBlock(block: BlockDefinition, buffer: Buffer, fillzero: number = 0, warnNotNormal: boolean = true): Buffer {
    const [normalBlock, totalLength, max] = BusUtil.normalizeBlock(block, warnNotNormal);
    if(buffer.length !== totalLength) { throw new Error('buffer length mismatch'); }

    const sourceDataIndexs = normalBlock.reduce((acc, item) => {
      const [ , length] = item;
      const [last] = acc.slice(-1);
      // console.log(length, last, item, acc)
      return [...acc, last + length];
    }, [0]);

    const ends = [0].concat(normalBlock.map(([address, length]) => address + length));

    // console.log(sourceDataIndexs, ends)
    return Buffer.concat([...normalBlock].map((item, index) => {
      const [address, length] = item;

      const previousEnd = ends[index];
      const padLength = address - previousEnd;
      const dataIndex = sourceDataIndexs[index];
      const data = buffer.slice(dataIndex, dataIndex + length);

      // console.log(index, 'PE', previousEnd, 'pL', padLength, 'dI', dataIndex, item, data)
      if(padLength < 0) { return data; }

      const pad = Buffer.alloc(padLength, fillzero);

      const result = Buffer.concat([pad, data]);
      // console.log('->',result)
      return result;
    }), max);
  }
}
