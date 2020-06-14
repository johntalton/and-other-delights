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
   * Feature: enable compact runs flag.
   * Feature: validate ascending address order.
   * Feature: validate non-overlapping runs.
   *
   * Disabling strict warnings will suppress the console output if you
   * wish to allow for shorthand definitions.
   *
   * @param block Input template for normalization.
   * @param warnStrict If true, output to console about non-normal format.
   * @returns Array containing the Normalized Block, the source Data length
   *  associated with it and the total block length defined by the template.
   */
  static normalizeBlock(block: BlockDefinition, warnStrict = true): [NormalizedBlockDefinition, number, number] {
    // normalize block from shorthand (aka [[37, 1], [37], 37] are all the same)
    const normalizedBlock: NormalizedBlockDefinition = block.map(item => {
      if(Array.isArray(item)) {
        if(item.length !== 2) {
          const [first] = item;
          if(first === undefined) { throw new Error('unexpected format: ' + JSON.stringify(block)); }
          if(warnStrict) { console.log('normalizeBlock: sloppy format', item); }
          return [item[0], 1];
        }
        return item;
      }

      if(warnStrict) { console.log('normalizeBlock: sloppy format', item); }
      return [item, 1];
    })
    // make it all int-like - is this overkill, yes
    // is this even needed with type checking
    // note that this does not account for NaN
    .map(([reg, len]) => [parseInt(reg.toString(), BASE_10), parseInt(len.toString(), BASE_10)]);

    // and the totals...
    // calculate the required source data length, the packed version of the data
    const sourceDataLength = normalizedBlock.reduce((out, [ , len]) => out + len, 0);
    // calculate the total unpacked length defined by the block
    const blockLength = normalizedBlock.reduce((out, [reg, len]) => Math.max(out, reg + len), 0);

    return [normalizedBlock, sourceDataLength, blockLength];
  }

  /**
   * Read from a bus given the block definition.
   *
   * @param bus The addressed bus to read from.
   * @param block A register Block template used to read.
   * @param warnNotNormal If true, emit console warnings about short hand usage.
   * @returns A Promise the resolves to the read Buffer.
   *
   **/
  static readBlock(bus: I2CAddressedBus, block: BlockDefinition, warnNotNormal = true): Promise<Buffer> {
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
   * @param warnNotNormal If true, enabled warnings about non-normal format.
   * @returns Promise resolving once data is written.
   *
   * Note: When using multi block interactions, each block is async
   * by nature and is not guaranteed by this call to not be
   * interrupted or delayed by other bus activity.
   **/
  static writeBlock(bus: I2CAddressedBus, block: BlockDefinition, buffer: Buffer, warnNotNormal = true): Promise<void> {
    const [normalBlock, totalLength, max] = BusUtil.normalizeBlock(block);
    // console.log('writeBlock', block, buffer, totalLength, max)
    if(max > buffer.length) { throw new Error('max address is outside buffer length'); }

    return Promise.all(normalBlock.map(([reg, len]) => {
      return bus.write(reg, Buffer.from(buffer.buffer, reg, len))
        .then(() => len);
    }))
    .then(lengths => lengths.reduce((acc, item) => acc + item, 0))
    .then(bytesWritten => {
      if(bytesWritten !== totalLength) { throw new Error('bytes written mismatch'); }
      return; // eslint-disable-line no-useless-return
    });
  }

  /**
   * Expands/Fills the gasp between block templates to form contiguous buffer.
   *
   * @param block A block template used to map data into output.
   * @param buffer A buffer from which data is drawn from.
   * @param fill A value to use to fill the Zero space.
   * @param warnNotNormal If true, enabled warnings about non-normal format.
   * @returns A Buffer filled and extended given the template.
   **/
  static expandBlock(block: BlockDefinition, buffer: Buffer, fill = 0, warnNotNormal = true): Buffer {
    const [normalBlock, totalLength, max] = BusUtil.normalizeBlock(block, warnNotNormal);
    if(buffer.length !== totalLength) { throw new Error('buffer length mismatch'); }

    const sourceDataIndexs = normalBlock.reduce((acc, item) => {
      const [ , length] = item;
      const [last] = acc.slice(-1);
      return [...acc, last + length];
    }, [0]);

    const ends = [0].concat(normalBlock.map(([address, length]) => address + length));

    return Buffer.concat([...normalBlock].map((item, index) => {
      const [address, length] = item;

      const previousEnd = ends[index];
      const padLength = address - previousEnd;
      const dataIndex = sourceDataIndexs[index];
      const data = buffer.slice(dataIndex, dataIndex + length);

      // console.log(index, 'PE', previousEnd, 'pL', padLength, 'dI', dataIndex, item, data)
      if(padLength < 0) { return data; }

      const pad = Buffer.alloc(padLength, fill);

      const result = Buffer.concat([pad, data]);
      // console.log('->',result)
      return result;
    }), max);
  }
}
