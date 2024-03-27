/* eslint-disable fp/no-let */
/* eslint-disable no-await-in-loop */
/* eslint-disable fp/no-mutation */
/* eslint-disable no-loops/no-loops */
/* eslint-disable fp/no-loops */
/* eslint-disable immutable/no-let */
import { I2CAddressedTransactionBus } from './i2c-addressedtransaction.js'

export type Block = [number, number]
export type BlockList = Array<Block>

export type UtilBufferSource = ArrayBuffer | ArrayBufferView | SharedArrayBuffer

/**
 *
 **/
export class BusUtil {
	private static assertNormalBlock(blocks: BlockList) {
		if (blocks.length < 0) { throw new Error('blocks must be zero or greater in length') }

		// eslint-disable-next-line fp/no-unused-expression
		blocks.forEach((item, index) => {
			const [reg, len] = item
			if (!Number.isInteger(reg)) { throw new Error('block item ' + index + ': invalid register value') }
			if (!Number.isInteger(len)) { throw new Error('block item ' + index + ': invalid length value') }
		})
		return true
	}

	private static sourceDataLength(blocks: BlockList) {
		BusUtil.assertNormalBlock(blocks)

		// calculate the required source data length, the packed version of the data
		return blocks.reduce((out, [, len]) => out + len, 0)
	}

	private static blockLength(blocks: BlockList) {
		BusUtil.assertNormalBlock(blocks)

		// calculate the total unpacked length defined by the block
		return blocks.reduce((out, [reg, len]) => Math.max(out, reg + len), 0)
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
	static async readI2cBlocks(
		atBus: I2CAddressedTransactionBus,
		blocks: BlockList, sourceBufferOrNull: UtilBufferSource | undefined = undefined
	): Promise<ArrayBuffer> {

		BusUtil.assertNormalBlock(blocks)

		const totalLength = BusUtil.sourceDataLength(blocks)
		const sourceBuffer = sourceBufferOrNull ?? new ArrayBuffer(totalLength)

		const buffer = ArrayBuffer.isView(sourceBuffer) ?
			new Uint8Array(sourceBuffer.buffer, sourceBuffer.byteOffset, sourceBuffer.byteLength) :
			new Uint8Array(sourceBuffer)

		return atBus.transaction(async aBus => {
			let cursor = 0
			for (const block of blocks) {
				const [reg, len] = block
				try {
					const aBuffer = await aBus.readI2cBlock(reg, len)
					buffer.set(new Uint8Array(aBuffer), cursor)
					cursor += len
				} catch (e) { console.warn({ e }); throw e }
			}
			return buffer.buffer
		})
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
	static writeI2cBlocks(
		atbus: I2CAddressedTransactionBus,
		blocks: BlockList,
		sourceBuffer: UtilBufferSource): Promise<void> {

		BusUtil.assertNormalBlock(blocks)


		const buffer = ArrayBuffer.isView(sourceBuffer) ?
			new Uint8Array(sourceBuffer.buffer, sourceBuffer.byteOffset, sourceBuffer.byteLength) :
			new Uint8Array(sourceBuffer)

		const totalLength = BusUtil.sourceDataLength(blocks)
		const max = BusUtil.blockLength(blocks)

		if (max > buffer.byteLength) {
			throw new Error('max address is outside buffer length')
		}

		return atbus.transaction(async abus => {
			return Promise.all(blocks.map(([reg, len]) => {
				return abus.writeI2cBlock(reg, buffer.subarray(reg, reg + len))
					.then(() => len)
			}))
				.then(lengths => lengths.reduce((acc, item) => acc + item, 0))
				.then(bytesWritten => {
					if (bytesWritten !== totalLength) {
						throw new Error('bytes written mismatch')
					}

					return // eslint-disable-line no-useless-return
				})
		})
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
	/*
	static expandBlock(block: BlockDefinition, sourceBuffer: UtilBufferSource, fill = 0, warnNotNormal = true): ArrayBuffer {
		const [normalBlock, totalLength, max] = BusUtil.normalizeBlock(block, warnNotNormal)
		if(buffer.length !== totalLength) { throw new Error('buffer length mismatch') }

		const sourceDataIndexes = normalBlock.reduce((acc, item) => {
			const [ , length] = item
			const [last] = acc.slice(-1)
			return [...acc, last + length]
		}, [0])

		const ends = [0].concat(normalBlock.map(([address, length]) => address + length))

		return Buffer.concat([...normalBlock].map((item, index) => {
			const [address, length] = item

			const previousEnd = ends[index]
			const padLength = address - previousEnd
			const dataIndex = sourceDataIndexes[index]
			const data = buffer.slice(dataIndex, dataIndex + length)

			if(padLength < 0) { return data }

			const pad = Buffer.alloc(padLength, fill)

			const result = Buffer.concat([pad, data])
			return result
		}), max)
	}
	*/
}
