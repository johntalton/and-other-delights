import { I2CAddress, I2CBufferSource, I2CBus, I2CWriteResult } from './i2c.js'

const BASE_16 = 16

declare global {
  interface ArrayBuffer {
    detached: boolean
  }
	interface SharedArrayBuffer {
    detached: boolean
  }
}

export interface _I2CAddressedBus {
	close(): void

	readI2cBlock(cmd: number, length: number, readBufferSource?: I2CBufferSource): Promise<I2CBufferSource>
	writeI2cBlock(cmd: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult>

	sendByte(value: number): Promise<void>

	i2cRead(length: number, readBufferSource?: I2CBufferSource): Promise<I2CBufferSource>
	i2cWrite(bufferSource: I2CBufferSource): Promise<I2CWriteResult>
}

function assertBufferSource(buffer: unknown): asserts buffer is I2CBufferSource {
	if(ArrayBuffer.isView(buffer)) { return }
	if(buffer instanceof ArrayBuffer) { return }
	// if(buffer instanceof SharedArrayBuffer) { return }

	throw new Error('invalid buffer source')
}

const DEFAULT_READ_BUFFER_SIZE = 128

/**
 * I2CBus layer providing address encapsulation.
 **/
export class I2CAddressedBus implements _I2CAddressedBus {
	readonly #address: I2CAddress
	readonly #bus: I2CBus
	#commonReadBuffer: ArrayBufferLike|undefined = new ArrayBuffer(DEFAULT_READ_BUFFER_SIZE)

	static from(bus: I2CBus, address: I2CAddress): I2CAddressedBus {
		return new I2CAddressedBus(bus, address)
	}

	constructor(bus: I2CBus, address: I2CAddress) {
		this.#address = address
		this.#bus = bus
	}

	get name(): string {
		return this.#bus.name + ':0x' + this.#address.toString(BASE_16)
	}

	close(): void { return this.#bus.close() }

	defaultReadBuffer(length: number) {
		// return undefined
		// return new ArrayBuffer(length)
		if(length > DEFAULT_READ_BUFFER_SIZE) { throw new Error('read outside allocated buffer size') }
		const offer =  this.#commonReadBuffer
		this.#commonReadBuffer = undefined
		return offer
	}

	salvageReadBuffer(buffer: I2CBufferSource) {
		if(ArrayBuffer.isView(buffer) ? buffer.buffer.detached : buffer.detached) { throw new Error('salvage attempt on detached buffer') }
		this.#commonReadBuffer = ArrayBuffer.isView(buffer) ? buffer.buffer : buffer
	}

	async readI2cBlock(cmd: number, length: number, readBufferSource?: I2CBufferSource): Promise<I2CBufferSource> {
		const readBuffer = readBufferSource ?? this.defaultReadBuffer(length)
		const { bytesRead, buffer } = await this.#bus.readI2cBlock(this.#address, cmd, length, readBuffer)
		if(bytesRead !== length) { throw new Error('invalid length read') }
		if(readBufferSource === undefined) { this.salvageReadBuffer(buffer) }
		return buffer
	}

	async writeI2cBlock(cmd: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		assertBufferSource(bufferSource)
		return this.#bus.writeI2cBlock(this.#address, cmd, bufferSource.byteLength, bufferSource)
	}

	async sendByte(value: number): Promise<void> {
		return this.#bus.sendByte(this.#address, value)
	}

	async i2cRead(length: number, readBufferSource?: I2CBufferSource): Promise<I2CBufferSource> {
		const readBuffer = readBufferSource ?? this.defaultReadBuffer(length)
		const { bytesRead, buffer } = await this.#bus.i2cRead(this.#address, length, readBuffer)
		if(bytesRead !== length) { throw new Error('invalid length read') }
		if(readBufferSource === undefined) { this.salvageReadBuffer(buffer) }
		return buffer
	}

	async i2cWrite(bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		assertBufferSource(bufferSource)
		return this.#bus.i2cWrite(this.#address, bufferSource.byteLength, bufferSource)
	}
}
