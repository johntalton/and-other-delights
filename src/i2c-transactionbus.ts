/* eslint-disable max-classes-per-file */
import { I2CAddress, I2CBufferSource, I2CBus, I2CReadResult, I2CWriteResult } from './i2c.js'
import { I2CProxyBus } from './i2c-proxybus.js'

export class TransactionBusProxy extends I2CProxyBus implements I2CBus {
	#id: number

	constructor(bus: I2CBus, id: number) {
		super(bus)

		this.#id = id
	}

	override get name() {
		return `TransactionBusProxy(${super.name}, ${this.#id})`
	}
}

export type TransactionCallback<T> = (bus: TransactionBusProxy) => Promise<T>

export class I2CTransactionBus extends I2CProxyBus implements I2CBus {
	#queue: Promise<unknown>
	#nextTransactionID

	static from(bus: I2CBus) { return new I2CTransactionBus(bus) }

	constructor(bus: I2CBus) {
		super(bus)
		this.#nextTransactionID = 0
		this.#queue = Promise.resolve()
	}

	override get name() { return `TransactionBus(${this.bus.name})` }

	async transaction<T>(cb: TransactionCallback<T>): Promise<T> {
		// console.log('*** transaction created')
		const id = this.#nextTransactionID += 1
		const proxyBus = new TransactionBusProxy(this.bus, id)
		const nextQ = this.#queue
			// .then(() => console.log('*** transaction start', id))
			// eslint-disable-next-line promise/prefer-await-to-callbacks, promise/no-callback-in-promise
			.then(async () => cb(proxyBus))
			// .then(result => { console.log('*** transaction end', id); return result })

		this.#queue = nextQ.catch(e => console.warn('exception in transaction queue', e))

		return nextQ
	}

	override async scan(): Promise<number[]> {
		return this.transaction(async bus => bus.scan())
	}

	override async i2cRead(address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CReadResult> {
		return this.transaction(async bus => bus.i2cRead(address, length, bufferSource))
	}

	override async i2cWrite(address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		return this.transaction(async bus => bus.i2cWrite(address, length, bufferSource))
	}

	override async sendByte(address: I2CAddress, byteValue: number): Promise<void> {
		return this.transaction(async bus => bus.sendByte(address, byteValue))
	}

	override async readI2cBlock(
		address: I2CAddress,
		cmd: number|[number, number],
		length: number,
		bufferSource: I2CBufferSource): Promise<I2CReadResult> {
		return this.transaction(async bus => bus.readI2cBlock(address, cmd, length, bufferSource))
	}

	override async writeI2cBlock(
		address: I2CAddress,
		cmd: number|[number, number],
		length: number,
		bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
		return this.transaction(async bus => bus.writeI2cBlock(address, cmd, length, bufferSource))
	}
}
