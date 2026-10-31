import type { I2CAddress, I2CBufferSource, I2CBus, I2CCommand, I2CReadResult, I2CWriteResult } from './i2c.ts'

export class I2CBusSoft16 implements I2CBus {
	readonly #bus: I2CBus
	readonly #nativeSupport

	static from(bus: I2CBus): I2CBusSoft16 {
		return new I2CBusSoft16(bus)
	}

	constructor(bus: I2CBus) {
		this.#bus = bus
		this.#nativeSupport = bus.supportsMultiByteDataAddress ?? false
	}

	// biome-ignore lint/style/useThisInClassMethods: Support is Explicity
	get supportsMultiByteDataAddress(): boolean { return true }
	get supportsScan(): boolean { return this.#bus.supportsScan }

	get name(): string {
		return `Soft16(${this.#bus.name})`
	}

	close(): void {
		this.#bus.close()
	}

	async scan(): Promise<I2CAddress[]> {
		return this.#bus.scan()
	}

	async sendByte(address: I2CAddress, byteValue: number): Promise<void> {
		return this.#bus.sendByte(address, byteValue)
	}

	async readI2cBlock(address: I2CAddress, cmd: I2CCommand, length: number, targetBuffer?: I2CBufferSource): Promise<I2CReadResult> {
		if(!Array.isArray(cmd) || this.#nativeSupport) { return this.#bus.readI2cBlock(address, cmd, length, targetBuffer) }

		await this.#bus.i2cWrite(address, cmd.length, Uint8Array.from(cmd))
		return this.#bus.i2cRead(address, length, targetBuffer)
	}

	async writeI2cBlock(address: I2CAddress, cmd: I2CCommand, length: number, buffer: I2CBufferSource): Promise<I2CWriteResult> {
		if(!Array.isArray(cmd) || this.#nativeSupport) { return this.#bus.writeI2cBlock(address, cmd, length, buffer ) }

		const bufferU8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer, 0, buffer.byteLength)

		const blob = new Blob([ Uint8Array.from(cmd), bufferU8 as BlobPart ])
		const ab = await blob.arrayBuffer()

		return this.#bus.i2cWrite(address, ab.byteLength, ab)
	}

	async i2cRead(address: I2CAddress, length: number, targetBuffer?: I2CBufferSource): Promise<I2CReadResult> {
		return this.#bus.i2cRead(address, length, targetBuffer)
	}

	async i2cWrite(address: I2CAddress, length: number, buffer: I2CBufferSource): Promise<I2CWriteResult> {
		return this.#bus.i2cWrite(address, length, buffer)
	}

}
