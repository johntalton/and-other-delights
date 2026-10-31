/** biome-ignore-all lint/style/useThisInClassMethods: for debug */
import type {
	I2CAddress,
	I2CBufferSource,
	I2CBus,
	I2CReadResult,
	I2CWriteResult
} from './i2c.ts'

export class ThrowBus implements I2CBus {
	readonly #name: string
	readonly #err: Error

	get supportsScan(): boolean { return true }
	get supportsMultiByteDataAddress(): boolean { return true }

	constructor(name: string) {
		this.#name = name
		this.#err = new Error(`throw bus: ${name}`)
	}

	get name(): string { return `Throw(${this.#name})` }

	scan(): Promise<number[]> { throw this.#err }

	close(): void { throw this.#err }
	async sendByte(_address: I2CAddress, _byte: number): Promise<void> { throw this.#err }
	async readI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult> { throw this.#err }
	async writeI2cBlock(_address: I2CAddress, _cmd: number, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult> { throw this.#err }
	async i2cRead(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CReadResult> { throw this.#err }
	async i2cWrite(_address: I2CAddress, _length: number, _bufferSource: I2CBufferSource): Promise<I2CWriteResult> { throw this.#err }
}
