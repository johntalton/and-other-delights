/* eslint-disable max-classes-per-file */
import type { I2CAddress } from './i2c.ts'
import { I2CAddressedBus, } from './i2c-addressed.ts'
import type {
	I2CTransactionBus,
	TransactionBusProxy
} from './i2c-transactionbus.ts'

export type AddressedTransactionCallback<T> = (bus: I2CAddressedBus) => Promise<T>

export class I2CAddressedTransactionBus extends I2CAddressedBus {
	readonly #bus: I2CTransactionBus
	readonly #address: I2CAddress

	constructor(bus: I2CTransactionBus, address: I2CAddress) {
		super(bus, address)

		this.#address = address
		this.#bus = bus
	}

	override get name(): string { return super.name }

	async transaction<T>(cb: AddressedTransactionCallback<T>): Promise<T> {
		return this.#bus.transaction(async (tBus: TransactionBusProxy) => cb(new I2CAddressedBus(tBus, this.#address)))
	}
}
