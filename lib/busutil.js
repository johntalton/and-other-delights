/**
 *
 **/
export class BusUtil {
    static assertNormalBlock(blocks) {
        if (blocks.length < 0) {
            throw new Error('blocks must be zero or greater in length');
        }
        // eslint-disable-next-line fp/no-unused-expression
        blocks.forEach((item, index) => {
            const [reg, len] = item;
            if (!Number.isInteger(reg)) {
                throw new Error('block item ' + index + ': invalid register value');
            }
            if (!Number.isInteger(len)) {
                throw new Error('block item ' + index + ': invalid length value');
            }
        });
        return true;
    }
    static sourceDataLength(blocks) {
        BusUtil.assertNormalBlock(blocks);
        // calculate the required source data length, the packed version of the data
        return blocks.reduce((out, [, len]) => out + len, 0);
    }
    static blockLength(blocks) {
        BusUtil.assertNormalBlock(blocks);
        // calculate the total unpacked length defined by the block
        return blocks.reduce((out, [reg, len]) => Math.max(out, reg + len), 0);
    }
    // return [normalizedBlock, sourceDataLength, blockLength]
    /**
     * Read from a bus given the block definition.
     *
     * @param bus The addressed bus to read from.
     * @param block A register Block template used to read.
     * @returns A Promise the resolves to the read Buffer.
     *
     **/
    static async readI2cBlocks(abus, blocks, sourceBufferOrNull = undefined) {
        BusUtil.assertNormalBlock(blocks);
        const totalLength = BusUtil.sourceDataLength(blocks);
        const sourceBuffer = sourceBufferOrNull ?? new ArrayBuffer(totalLength);
        const buffer = ArrayBuffer.isView(sourceBuffer) ?
            new Uint8Array(sourceBuffer.buffer, sourceBuffer.byteOffset, sourceBuffer.byteLength) :
            new Uint8Array(sourceBuffer);
        let cursor = 0;
        for (const block of blocks) {
            const [reg, len] = block;
            try {
                const abuffer = await abus.readI2cBlock(reg, len);
                buffer.set(new Uint8Array(abuffer), cursor);
                cursor += len;
            }
            catch (e) {
                console.warn({ e });
                throw e;
            }
        }
        return buffer.buffer;
    }
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
    static writeI2cBlocks(abus, blocks, sourceBuffer) {
        BusUtil.assertNormalBlock(blocks);
        const buffer = ArrayBuffer.isView(sourceBuffer) ?
            new Uint8Array(sourceBuffer.buffer, sourceBuffer.byteOffset, sourceBuffer.byteLength) :
            new Uint8Array(sourceBuffer);
        const totalLength = BusUtil.sourceDataLength(blocks);
        const max = BusUtil.blockLength(blocks);
        if (max > buffer.byteLength) {
            throw new Error('max address is outside buffer length');
        }
        return Promise.all(blocks.map(([reg, len]) => {
            return abus.writeI2cBlock(reg, buffer.subarray(reg, reg + len))
                .then(() => len);
        }))
            .then(lengths => lengths.reduce((acc, item) => acc + item, 0))
            .then(bytesWritten => {
            if (bytesWritten !== totalLength) {
                throw new Error('bytes written mismatch');
            }
            return; // eslint-disable-line no-useless-return
        });
    }
}
//# sourceMappingURL=busutil.js.map