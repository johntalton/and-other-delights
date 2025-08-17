import { I2CAddress, I2CBufferSource, I2CBus, I2CCommand } from './i2c.js'

export class I2CBusSoft16 implements I2CBus {
	#bus: I2CBus
	#nativeSupport

	static from(bus: I2CBus) {
		return new I2CBusSoft16(bus)
	}

	constructor(bus: I2CBus) {
		this.#bus = bus
		this.#nativeSupport = bus.supportsMultiByteDataAddress ?? false
	}

	get supportsMultiByteDataAddress() { return true }
	get supportsScan() { return this.#bus.supportsScan }

	get name() {
		return `Soft16(${this.#bus.name})`
	}

	close() {
		return this.#bus.close()
	}

	async scan(): Promise<Array<I2CAddress>> {
		return this.#bus.scan()
	}

	async sendByte(address: I2CAddress, byteValue: number) {
		return this.#bus.sendByte(address, byteValue)
	}

	async readI2cBlock(address: I2CAddress, cmd: I2CCommand, length: number, targetBuffer?: I2CBufferSource) {
		if(!Array.isArray(cmd) || this.#nativeSupport) { return this.#bus.readI2cBlock(address, cmd, length, targetBuffer) }

		await this.#bus.i2cWrite(address, cmd.length, Uint8Array.from(cmd))
		return this.#bus.i2cRead(address, length, targetBuffer)
	}

	async writeI2cBlock(address: I2CAddress, cmd: I2CCommand, length: number, buffer: I2CBufferSource) {
		if(!Array.isArray(cmd) || this.#nativeSupport) { return this.#bus.writeI2cBlock(address, cmd, length, buffer ) }

		const bufferU8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer, 0, buffer.byteLength)

		const blob = new Blob([ Uint8Array.from(cmd), bufferU8 as BlobPart ])
		const ab = await blob.arrayBuffer()

		return this.#bus.i2cWrite(address, ab.byteLength, ab)
	}

	async i2cRead(address: I2CAddress, length: number, targetBuffer?: I2CBufferSource) {
		return this.#bus.i2cRead(address, length, targetBuffer)
	}

	async i2cWrite(address: I2CAddress, length: number, buffer: I2CBufferSource) {
		return this.#bus.i2cWrite(address, length, buffer)
	}

}
