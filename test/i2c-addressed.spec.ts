import { describe, it } from 'mocha';
import { expect } from 'chai';

// eslint-disable-next-line sort-imports
import { EOS_SCRIPT, I2CAddressedBus, Script, ScriptBus } from './aod';

const SCRIPT_BUS_NUMBER = 1;
const SCRIPT_BUS_ADDRESS = 0x00;

const SCRIPT: Script = [
  ...EOS_SCRIPT
];

const CLOSE_SCRIPT: Script = [
  { method: 'close' },
  ...EOS_SCRIPT
];

const READ_SCRIPT: Script = [
  { method: 'readI2cBlock', result: { bytesRead: 2, buffer: Buffer.from([3, 5]) } },
  ...CLOSE_SCRIPT
];

const WRITE_SCRIPT: Script = [
  { method: 'writeI2cBlock', result: { bytesWritten: 2, buffer: Buffer.from([3, 5]) } },
  ...CLOSE_SCRIPT
];

const SPECIAL_SCRIPT: Script = [
  { method: 'sendByte' },
  ...CLOSE_SCRIPT
];

const BUFFER_READ_SCRIPT: Script = [
  { method: 'i2cRead', result: { bytesRead: 7, buffer: Buffer.from([]) } },
  ...CLOSE_SCRIPT
];

const BUFFER_WRITE_SCRIPT: Script = [
  { method: 'i2cWrite', result: { bytesWritten: 0, buffer: Buffer.from([]) } },
  ...CLOSE_SCRIPT
];

describe('I2CAddressedBus', () => {
  describe('#name', () => {
    it('should return name', () => {
      const sb = ScriptBus.openPromisified(SCRIPT_BUS_NUMBER, SCRIPT);
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS);
      expect(ab.name).to.equal('i2c:/dev/i2c-1/0x0');
    });
  });

  // describe('#bus', () => {
  //   it('should return the bus', () => {
  //     const sb = ScriptBus.openPromisified(SCRIPT_BUS_NUMBER, SCRIPT);
  //     const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS);
  //     expect(ab.bus).to.equal(sb);
  //   });
  // });

  // describe('#address', () => {
  //   it('should return address', () => {
  //     const ab = new I2CAddressedBus(ScriptBus.openPromisified(SCRIPT_BUS_NUMBER, SCRIPT), 0x37);
  //     expect(ab.address).to.equal(0x37);
  //   });
  // });

  describe('#close', () => {
    it('should close gracefully', () => {
      const sb = ScriptBus.openPromisified(SCRIPT_BUS_NUMBER, CLOSE_SCRIPT);
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS);
      expect(() => ab.close()).to.not.throw();
    });
  });

  describe('#read', () => {
    it('should read bytes', async () => {
      const sb = ScriptBus.openPromisified(SCRIPT_BUS_NUMBER, READ_SCRIPT);
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS);
      expect(await ab.read(0x02, 2)).to.deep.equal(Buffer.from([3, 5]));
    });
  });

  describe('#write', () => {
    it('should write bytes', () => {
      const sb = ScriptBus.openPromisified(SCRIPT_BUS_NUMBER, WRITE_SCRIPT);
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS);
      expect(() => ab.write(0x01, Buffer.from([3, 5, 7]))).to.not.throw();
    });
  });

  describe('#writeSpecial', () => {
    it('should', () => {
      const sb = ScriptBus.openPromisified(SCRIPT_BUS_NUMBER, SPECIAL_SCRIPT);
      const ab = new I2CAddressedBus(sb, SCRIPT_BUS_ADDRESS);
      expect(() => ab.writeSpecial(42)).to.not.throw();
    });
  });

  describe('#readBuffer', () => {
    it('should', async () => {
      const sb = ScriptBus.openPromisified(SCRIPT_BUS_NUMBER, BUFFER_READ_SCRIPT);
      const ab = new I2CAddressedBus(sb, 0x00);
      const buffer = await ab.readBuffer(7);
      expect(buffer).to.deep.equal(Buffer.from([]));
    });
  });

  describe('#writeBuffer', () => {
    it('should', () => {
      const sb = ScriptBus.openPromisified(SCRIPT_BUS_NUMBER, BUFFER_WRITE_SCRIPT);
      const ab = new I2CAddressedBus(sb, 0x00);
      expect(() => ab.writeBuffer(Buffer.from([]))).to.not.throw();
    });
  });
});
