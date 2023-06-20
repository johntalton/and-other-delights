import { I2CBufferSource, I2CBus, I2CReadResult, I2CWriteResult } from './i2c.js'

export class I2CProxyBus implements I2CBus {
	#bus

	constructor(bus: I2CBus) { this.#bus = bus }
	get bus() { return this.#bus }
	get name() { return `#${this.#bus.name}` }

	i2cRead(address: number, length: number, bufferSource: I2CBufferSource): Promise<I2CReadResult> {
		return this.bus.i2cRead(address, length, bufferSource)
	}
	i2cWrite(address: number, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		return this.bus.i2cWrite(address, length, bufferSource)
	}
	close(): void {
		return this.bus.close()
	}
	sendByte(address: number, byteValue: number): Promise<void> {
		return this.bus.sendByte(address, byteValue)
	}
	readI2cBlock(address: number, cmd: number, length: number, bufferSource: I2CBufferSource): Promise<I2CReadResult> {
		return this.bus.readI2cBlock(address, cmd, length, bufferSource)
	}
	writeI2cBlock(address: number, cmd: number, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		return this.bus.writeI2cBlock(address, cmd, length, bufferSource)
	}
}
