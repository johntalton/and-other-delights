import type {
	I2CBufferSource,
	I2CBus,
	I2CReadResult,
	I2CWriteResult
} from './i2c.ts'

export class I2CProxyBus implements I2CBus {
	readonly #bus

	constructor(bus: I2CBus) { this.#bus = bus }
	get bus(): I2CBus { return this.#bus }
	get name(): string { return `#${this.#bus.name}` }

	get supportsScan(): boolean {
		if('scan' in this.#bus) { return this.#bus.supportsScan }
		return false
	}
	get supportsMultiByteDataAddress(): boolean {
		if('supportsMultiByteDataAddress' in this.#bus) { return this.#bus.supportsMultiByteDataAddress }
		return false
	}

	scan(): Promise<number[]> {
		if(!('scan' in this.bus)) { throw new Error('bus does not implement scan method') }
		return this.bus.scan()
	}

	i2cRead(address: number, length: number, bufferSource: I2CBufferSource): Promise<I2CReadResult> {
		return this.bus.i2cRead(address, length, bufferSource)
	}
	i2cWrite(address: number, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		return this.bus.i2cWrite(address, length, bufferSource)
	}
	close(): void {
		this.bus.close()
	}
	sendByte(address: number, byteValue: number): Promise<void> {
		return this.bus.sendByte(address, byteValue)
	}
	readI2cBlock(address: number, cmd: number|[number, number], length: number, bufferSource?: I2CBufferSource): Promise<I2CReadResult> {
		return this.bus.readI2cBlock(address, cmd, length, bufferSource)
	}
	writeI2cBlock(address: number, cmd: number|[number, number], length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		return this.bus.writeI2cBlock(address, cmd, length, bufferSource)
	}
}
