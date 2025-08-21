import { I2CAddress, I2CBufferSource, I2CBus, I2CWriteResult, I2CCommand } from './i2c.js'

const BASE_16 = 16

export interface I2CAddressBusOptions {
	readonly reuse: boolean
}

export const DEFAULT_OPTIONS: I2CAddressBusOptions = { reuse: false }

export interface _I2CAddressedBus {
	close(): void

	readI2cBlock(cmd: I2CCommand, length: number, readBufferSource?: I2CBufferSource): Promise<I2CBufferSource>
	writeI2cBlock(cmd: I2CCommand, bufferSource: I2CBufferSource): Promise<I2CWriteResult>

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
	readonly #options: I2CAddressBusOptions
	#commonReadBuffer: ArrayBuffer|undefined

	static from(bus: I2CBus, address: I2CAddress, options: I2CAddressBusOptions  = DEFAULT_OPTIONS): I2CAddressedBus {
		return new I2CAddressedBus(bus, address, options)
	}

	constructor(bus: I2CBus, address: I2CAddress, options: I2CAddressBusOptions = DEFAULT_OPTIONS) {
		this.#address = address
		this.#bus = bus
		this.#options = options

		if(options.reuse) {
			 this.#commonReadBuffer = new ArrayBuffer(DEFAULT_READ_BUFFER_SIZE)
		}
	}

	get name(): string {
		return this.#bus.name + ':0x' + this.#address.toString(BASE_16).toUpperCase().padStart(2, '0')
	}

	close(): void { return this.#bus.close() }

	defaultReadBuffer(length: number) {
		if(!this.#options.reuse) { return new ArrayBuffer(length) }
		// return undefined
		// return new ArrayBuffer(length)
		if(length > DEFAULT_READ_BUFFER_SIZE) { throw new Error('read outside allocated buffer size') }
		const offer =  this.#commonReadBuffer
		this.#commonReadBuffer = undefined
		return offer
	}

	salvageReadBuffer(buffer: I2CBufferSource) {
		if(!this.#options.reuse) { return }

		if(ArrayBuffer.isView(buffer)) {
			if(!(buffer.buffer instanceof ArrayBuffer)) { throw new Error('unable to salvage non-ArrayBuffer view') }
			if(buffer.buffer.detached) { throw new Error('salvage attempt on detached buffer view')}
			this.#commonReadBuffer = buffer.buffer
			return
		}

		if(!(buffer instanceof ArrayBuffer)) { throw new Error('unable to salvage non-ArrayBuffer') }
		if(buffer.detached) { throw new Error('salvage attempt on detached buffer')}
		this.#commonReadBuffer = buffer
	}

	async readI2cBlock(cmd: I2CCommand, length: number, readBufferSource?: I2CBufferSource): Promise<I2CBufferSource> {
		const readBuffer = readBufferSource ?? this.defaultReadBuffer(length)
		const { bytesRead, buffer } = await this.#bus.readI2cBlock(this.#address, cmd, length, readBuffer)
		if(bytesRead !== length) { throw new Error('invalid length read') }
		if(readBufferSource === undefined) { this.salvageReadBuffer(buffer) }
		return buffer
	}

	async writeI2cBlock(cmd: I2CCommand, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
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
