import { I2CAddress, I2CBufferSource, I2CReadResult, I2CScannableBus, I2CWriteResult } from './i2c'

export class ThrowBus implements I2CScannableBus {
	private _name: string
	private err: Error

	static openPromisified(name: string): Promise<I2CScannableBus> {
		return Promise.resolve(new ThrowBus(name))
	}

	constructor(name: string) {
		this._name = name
		this.err = new Error('throw bus ' + name)
	}

	get name(): string { return this._name }

	scan(): Promise<number[]> { throw this.err }

	close(): void { throw this.err }
	async sendByte(_address: I2CAddress, _byte: number): Promise<void> { throw this.err }
	async readI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult> { throw this.err }
	async writeI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult> { throw this.err }
	async i2cRead(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult> { throw this.err }
	async i2cWrite(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult> { throw this.err }
}
