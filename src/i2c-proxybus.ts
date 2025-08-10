import { I2CBufferSource, I2CBus, I2CReadResult, I2CScannableBus, I2CWriteResult } from './i2c.js'

export class I2CProxyBus implements I2CScannableBus {
	#bus

	constructor(bus: I2CBus|I2CScannableBus) { this.#bus = bus }
	get bus() { return this.#bus }
	get name() { return `#${this.#bus.name}` }

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
		return this.bus.close()
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
