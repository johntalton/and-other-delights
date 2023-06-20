import { ABOptions, DEFAULT_AB, I2CAddressedBus } from './i2c-addressed.js'
import { I2CAddress, I2CBus } from './i2c.js'
import { I2CTransactionBus } from './i2c-transactionbus.js'

export class I2CAddressedTransactionBus extends I2CAddressedBus {
	constructor(bus: I2CBus, address: I2CAddress, options: Partial<ABOptions> = DEFAULT_AB) {
		super(new I2CTransactionBus(bus), address, options)
	}

	get name() { return super.name }
}
