/* eslint-disable max-classes-per-file */
import { I2CAddressedBus, _I2CAddressedBus } from './i2c-addressed.js'
import { I2CAddress } from './i2c.js'
import { I2CTransactionBus, TransactionBusProxy } from './i2c-transactionbus.js'

export type AddressedTransactionCallback<T> = (bus: I2CAddressedBus) => Promise<T>

export class I2CAddressedTransactionBus extends I2CAddressedBus {
	#bus: I2CTransactionBus
	#address: I2CAddress

	constructor(bus: I2CTransactionBus, address: I2CAddress) {
		super(bus, address)

		this.#address = address
		this.#bus = bus
	}

	override get name() { return super.name }

	async transaction<T>(cb: AddressedTransactionCallback<T>): Promise<T> {
		return this.#bus.transaction(async (tbus: TransactionBusProxy) => cb(new I2CAddressedBus(tbus, this.#address)))
	}
}
