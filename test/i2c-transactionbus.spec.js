import { describe, it } from 'mocha'
import { expect } from 'chai'

import { I2CTransactionBus } from '@johntalton/and-other-delights'

describe('I2CTransactionBus', () => {
	it('should return name after construction', () => {
		const proxy = { name: 'foo' }
		const bus = new I2CTransactionBus(proxy)
		expect(bus.name).to.equal('TransactionBus(foo)')
	})

	it('should return a transaction with name', async () => {
		const proxy = { name: 'foo' }
		const tbus = new I2CTransactionBus(proxy)
		await tbus.transaction(bus => {
			expect(bus.name).to.equal('TransactionBusProxy(#foo, 1)')
		})
	})
})
