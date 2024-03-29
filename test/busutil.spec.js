/* eslint-disable fp/no-unused-expression */
/* eslint-disable no-magic-numbers */
import { describe, it } from 'mocha'
import { expect } from 'chai'

// eslint-disable-next-line sort-imports
import { BusUtil, EOS_SCRIPT, I2CTransactionBus, I2CAddressedTransactionBus, I2CScriptBus } from './aod.js'

const READ_SINGLE_SCRIPT = [
	{ method: 'readI2cBlock', parameters: [0x37], result: { bytesRead: 2, buffer: new Uint8Array([3, 5]) } },
	...EOS_SCRIPT
]

const READ_MULTI_SCRIPT = [
	{ method: 'readI2cBlock', parameters: [0x37], result: { bytesRead: 2, buffer: new Uint8Array([3, 5]) } },
	{ method: 'readI2cBlock', parameters: [0x42], result: { bytesRead: 4, buffer: new Uint8Array([7, 9, 11, 13]) } },
	...EOS_SCRIPT
]

const WRITE_SINGLE_SCRIPT = [
	{ method: 'writeI2cBlock', parameters: [0, 1, 2], result: { bytesWritten: 2, buffer: new Uint8Array([]) } },
	...EOS_SCRIPT
]

const WRITE_MULTI_SCRIPT = [
	{ method: 'writeI2cBlock', parameters: [0, 1, 2], result: { bytesWritten: 2, buffer: new ArrayBuffer(2) } },
	{ method: 'writeI2cBlock', parameters: [0, 4, 4], result: { bytesWritten: 4, buffer: new ArrayBuffer(4) } },
	...EOS_SCRIPT
]

describe('BusUtil', () => {
	describe('#readI2cBlocks', () => {
		it('should return empty on empty block read', async () => {
			const ab = new I2CAddressedTransactionBus(I2CTransactionBus.from(await I2CScriptBus.openPromisified(EOS_SCRIPT), 0x00))
			const result = await BusUtil.readI2cBlocks(ab, [])
			expect(result).to.deep.equal(new ArrayBuffer(0))
		})

		it('should read a simple block', async () => {
			const ab = new I2CAddressedTransactionBus(I2CTransactionBus.from(await I2CScriptBus.openPromisified(READ_SINGLE_SCRIPT), 0x00))
			const result = await BusUtil.readI2cBlocks(ab, [[0, 2]])
			expect(new Uint8Array(result)).to.deep.equal(new Uint8Array([3, 5]))
		})

		it('should read a multi block', async () => {
			const ab = new I2CAddressedTransactionBus(I2CTransactionBus.from(await I2CScriptBus.openPromisified(READ_MULTI_SCRIPT), 0x00))
			const result = await BusUtil.readI2cBlocks(ab, [[0x37, 2], [0x42, 4]])
			expect(new Uint8Array(result)).to.deep.equal(new Uint8Array([3, 5, 7, 9, 11, 13]))
		})

		it('should error when bus layer errors', async () => {
			const ab = new I2CAddressedTransactionBus(I2CTransactionBus.from(await I2CScriptBus.openPromisified(READ_MULTI_SCRIPT), 0x00))
			await expect(async () => { await BusUtil.readBlock(ab, [[0x37, 2], [0x42, 4], [0x77, 0]]) })
		})
	})

	describe('#writeI2cBlocks', () => {
		it('should write empty on empty block', async () => {
			const ab = new I2CAddressedTransactionBus(I2CTransactionBus.from(await I2CScriptBus.openPromisified(EOS_SCRIPT), 0x00))
			await BusUtil.writeI2cBlocks(ab, [], new Uint8Array([]))
		})

		it('should write simple byte single block', async () => {
			const ab = new I2CAddressedTransactionBus(I2CTransactionBus.from(await I2CScriptBus.openPromisified(WRITE_SINGLE_SCRIPT), 0x00))
			await BusUtil.writeI2cBlocks(ab, [[0x01, 2]], new Uint8Array([0, 3, 5]))
		})

		it('should write simple block', async () => {
			const ab = new I2CAddressedTransactionBus(I2CTransactionBus.from(await I2CScriptBus.openPromisified(WRITE_SINGLE_SCRIPT), 0x00))
			await BusUtil.writeI2cBlocks(ab, [[0x01, 2]], new Uint8Array([0, 3, 5]))
		})

		it('should write multi block', async () => {
			const ab = new I2CAddressedTransactionBus(I2CTransactionBus.from(await I2CScriptBus.openPromisified(WRITE_MULTI_SCRIPT), 0x00))
			await BusUtil.writeI2cBlocks(ab, [[0x01, 2], [0x4, 4]], new Uint8Array([0, 3, 5, 0, 7, 9, 11, 13]))
		})
	})

	/*
	describe('#expandBlock', () => {
		it('should pass most basic 1:1 test', () => {
			expect(BusUtil.expandBlock([0], Buffer.from([3]), 0xFE, false)).to.deep.equal(Buffer.from([3]))
		})

		it('should pass most basic 1:1 test (offset)', () => {
			expect(BusUtil.expandBlock([3], Buffer.from([3]), 0xFE, false)).to.deep.equal(Buffer.from([0xFE, 0xFE, 0xFE, 3]))
		})

		it('should pass basic example', () => {
			const fill = -1
			const firstPad = Buffer.alloc(10, fill)
			const pre20Pad = Buffer.alloc(8, fill)
			const pre30Pad = Buffer.alloc(9, fill)
			const expected = Buffer.concat([firstPad, Buffer.from([3, 5]), pre20Pad, Buffer.from([7]), pre30Pad, Buffer.from([9, 11, 13])], 33)
			expect(BusUtil.expandBlock([[10, 2], [20, 1], [30, 3]], Buffer.from([3, 5, 7, 9, 11, 13]), fill)).to.deep.equal(expected)
		})

		it('should pass basic example (collapsed)', () => {
			const fill = -1
			const firstPad = Buffer.alloc(10, fill)
			const pre30Pad = Buffer.alloc(17, fill)
			const expected = Buffer.concat([firstPad, Buffer.from([3, 5, 7]), pre30Pad, Buffer.from([9, 11, 13])], 33)
			expect(BusUtil.expandBlock([[10, 2], [12, 1], [30, 3]], Buffer.from([3, 5, 7, 9, 11, 13]), fill)).to.deep.equal(expected)
		})

		it('should fill in the middle', () => {
			expect(BusUtil.expandBlock([0, 2], Buffer.from([3, 5]), 0xFE, false)).to.deep.equal(Buffer.from([3, 0xFE, 5]))
		})

		it('should fill in front', () => {
			expect(BusUtil.expandBlock([2], Buffer.from([3]), 0xFE, false)).to.deep.equal(Buffer.from([0xFE, 0xFE, 3]))
		})

		it('should fill in both', () => {
			expect(BusUtil.expandBlock([1, 4], Buffer.from([3, 5]), 0xFE, false)).to.deep.equal(Buffer.from([0xFE, 3, 0xFE, 0xFE, 5]))
		})

		it('should handle multi-byte', () => {
			expect(BusUtil.expandBlock([[0, 4], 4], Buffer.from([3, 5, 7, 9, 11]), 0xFE, false)).to.deep.equal(Buffer.from([3, 5, 7, 9, 11]))
		})

		it('should handle multi-byte padded', () => {
			expect(BusUtil.expandBlock([[2, 4], 8], Buffer.from([3, 5, 7, 9, 11]), 0xFE, false)).to.deep.equal(Buffer.from([0xFE, 0xFE, 3, 5, 7, 9, 0xFE, 0xFE, 11]))
		})

		it('should error if input buffer length does not match BlockDefinition', () => {
			expect(() => BusUtil.expandBlock([1, 2, 3], Buffer.alloc(5, 0), 0xFE, false)).to.throw(Error)
		})

		it('should match example used in hand coded test', () => {
			expect(BusUtil.expandBlock([[0x01, 2], [0x4, 4]], Buffer.from([3, 5, 7, 9, 11, 13]))).to.deep.equal(Buffer.from([0, 3, 5, 0, 7, 9, 11, 13]))
		})
	})
	*/
})
