/* eslint-disable fp/no-unused-expression */
import { describe, it } from 'mocha'
import { expect } from 'chai'

// eslint-disable-next-line sort-imports
import {
  EOS_SCRIPT,
  I2CAddressedBus,
  I2CScriptBus,
  ThrowBus
} from './aod.js'

const SCRIPT_BUS_ADDRESS = 0x00

const SCRIPT = [
  ...EOS_SCRIPT
]

const CLOSE_SCRIPT = [
  { method: 'close' },
  ...EOS_SCRIPT
]

const READ_SCRIPT = [
  { method: 'readI2cBlock', result: { bytesRead: 2, buffer: Uint8Array.from([3, 5]).buffer } },
  ...CLOSE_SCRIPT
]

const WRITE_SCRIPT = [
  { method: 'writeI2cBlock', result: { bytesWritten: 2, buffer: Uint8Array.from([3, 5]).buffer } },
  ...CLOSE_SCRIPT
]

const SPECIAL_SCRIPT = [
  { method: 'sendByte' },
  ...CLOSE_SCRIPT
]

const BUFFER_READ_SCRIPT = [
  { method: 'i2cRead', result: { bytesRead: 7, buffer: new ArrayBuffer() } },
  ...CLOSE_SCRIPT
]

const BUFFER_WRITE_SCRIPT = [
  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: new ArrayBuffer() } },
  ...CLOSE_SCRIPT
]

describe('I2CAddressedBus', () => {
  describe('#constructor', () => {
    it('should construct', () => {
      expect(async () => new I2CAddressedBus(await ThrowBus.openPromisified('do nothing'), 0x00)).to.not.throw()
    })
  })

  describe('#openPromisified', () => {
    it('should generate', () => {
      expect(async () => I2CAddressedBus.from(await ThrowBus.openPromisified('go throw'), 0x00)).to.not.throw()
    })

    it('should be frozen', async () => {
      const tb = await ThrowBus.openPromisified('frozen throw')
      const ab = await I2CAddressedBus.from(tb, 0x00)

      expect(ab).to.be.frozen // eslint-disable-line no-unused-expressions
    })
  })

  describe('#name', () => {
    it('should support oo construction', async () => {
      const sb = await I2CScriptBus.openPromisified(SCRIPT)
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS)
      expect(ab.name).to.equal('__unnamed__:0x0')
    })
  })

  // describe('#bus', () => {
  //   it('should return the bus', () => {
  //     const sb = I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, SCRIPT);
  //     const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS);
  //     expect(ab.bus).to.equal(sb);
  //   });
  // });

  // describe('#address', () => {
  //   it('should return address', () => {
  //     const ab = new I2CAddressedBus(I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, SCRIPT), 0x37);
  //     expect(ab.address).to.equal(0x37);
  //   });
  // });

  describe('#close', () => {
    it('should close gracefully', async () => {
      const sb = await I2CScriptBus.openPromisified(CLOSE_SCRIPT)
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS)
      expect(() => ab.close()).to.not.throw()
    })
  })

  describe('#read', () => {
    it('should read bytes', async () => {
      const sb = await I2CScriptBus.openPromisified(READ_SCRIPT)
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS)
      expect(await ab.readI2cBlock(0x02, 2)).to.deep.equal(Uint8Array.from([3, 5]).buffer)
    })
  })

  describe('#write', () => {
    it('should write bytes', async () => {
      const sb = await I2CScriptBus.openPromisified(WRITE_SCRIPT)
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS)
      expect(() => ab.writeI2cBlock(0x01, Buffer.from([3, 5, 7]))).to.not.throw()
    })
  })

  describe('#writeSpecial', () => {
    it('should', async () => {
      const sb = await I2CScriptBus.openPromisified(SPECIAL_SCRIPT)
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS)
      expect(() => ab.sendByte(42)).to.not.throw()
    })
  })

  describe('#readBuffer', () => {
    it('should', async () => {
      const sb = await I2CScriptBus.openPromisified(BUFFER_READ_SCRIPT)
      const ab = new I2CAddressedBus(sb, 0x00)
      const buffer = await ab.i2cRead(7)
      expect(buffer).to.deep.equal(new ArrayBuffer())
    })
  })

  describe('#writeBuffer', () => {
    it('should', async () => {
      const sb = await I2CScriptBus.openPromisified(BUFFER_WRITE_SCRIPT)
      const ab = new I2CAddressedBus(sb, 0x00)
      expect(() => ab.i2cWrite(Buffer.from([]))).to.not.throw()
    })
  })
})
