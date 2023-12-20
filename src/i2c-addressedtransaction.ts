/* eslint-disable max-classes-per-file */
import { ABOptions, DEFAULT_AB, I2CAddressedBus, _I2CAddressedBus } from './i2c-addressed.js'
import { I2CAddress, I2CBufferSource } from './i2c.js'
import { I2CTransactionBus, TransactionBusProxy } from './i2c-transactionbus.js'

export class AddressedTransactionBusProxy implements _I2CAddressedBus {
	#bus: TransactionBusProxy
	#address: number

	// eslint-disable-next-line no-useless-constructor
	constructor(bus: TransactionBusProxy, address: number) {
		this.#bus = bus
		this.#address = address
	}

	get name(): string {
		throw new Error('Method not implemented.')
	}
	close(): void {
		throw new Error('Method not implemented.')
	}

	async readI2cBlock(cmd: number, length: number, _readBufferSource?: I2CBufferSource | undefined): Promise<ArrayBuffer> {
		const { bytesRead, buffer } =  await this.#bus.readI2cBlock(this.#address, cmd, length)
		return buffer.slice(0, bytesRead)
	}

	async writeI2cBlock(cmd: number, bufferSource: I2CBufferSource): Promise<void> {
		const { bytesWritten } = await this.#bus.writeI2cBlock(this.#address, cmd, bufferSource.byteLength, bufferSource)
		if (bytesWritten !== bufferSource.byteLength) {
			throw new Error('write mismatch')
		}
	}
	sendByte(_value: number): Promise<void> {
		throw new Error('Method not implemented.')
	}
	i2cRead(_length: number, _readBufferSource?: I2CBufferSource | undefined): Promise<ArrayBuffer> {
		throw new Error('Method not implemented.')
	}
	i2cWrite(_bufferSource: I2CBufferSource): Promise<void> {
		throw new Error('Method not implemented.')
	}
}

export type AddressedTransactionCallback<T> = (bus: AddressedTransactionBusProxy) => Promise<T>

export class I2CAddressedTransactionBus extends I2CAddressedBus {
	#bus: I2CTransactionBus

	constructor(bus: I2CTransactionBus, address: I2CAddress, options: Partial<ABOptions> = DEFAULT_AB) {
		super(bus, address, options)
		this.#bus = bus
	}

	get name() { return super.name }

	async transaction<T>(cb: AddressedTransactionCallback<T>): Promise<T> {
		// eslint-disable-next-line promise/prefer-await-to-callbacks
		return this.#bus.transaction((tbus: TransactionBusProxy) => cb(new AddressedTransactionBusProxy(tbus, this.address)))
	}
}
