import { I2CAddressedBus } from './i2c-addressed';
export declare type Block = [number, number];
export declare type BlockList = Array<Block>;
export declare type UtilBufferSource = ArrayBuffer | ArrayBufferView | SharedArrayBuffer;
/**
 *
 **/
export declare class BusUtil {
    private static assertNormalBlock;
    private static sourceDataLength;
    private static blockLength;
    /**
     * Read from a bus given the block definition.
     *
     * @param bus The addressed bus to read from.
     * @param block A register Block template used to read.
     * @returns A Promise the resolves to the read Buffer.
     *
     **/
    static readI2cBlocks(abus: I2CAddressedBus, blocks: BlockList, sourceBufferOrNull?: UtilBufferSource | undefined): Promise<ArrayBuffer>;
    /**
     * Writes to the bus given the block definitions and buffer.
     *
     * @param bus The addressed bus to write to.
     * @param block A register Block template used to write.
     * @param buffer A buffer of the bytes of data to be written.
     * @returns Promise resolving once data is written.
     *
     * Note: When using multi block interactions, each block is async
     * by nature and is not guaranteed by this call to not be
     * interrupted or delayed by other bus activity.
     * As such, it is suggested that the bus be a concrete instance,
     * and thus run withing a single event loop. Attempting to abstract
     * this call over async interfaces will not always result as expected.
     **/
    static writeI2cBlocks(abus: I2CAddressedBus, blocks: BlockList, sourceBuffer: UtilBufferSource): Promise<void>;
}
//# sourceMappingURL=busutil.d.ts.map