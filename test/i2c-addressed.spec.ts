import 'mocha';
import { expect } from 'chai';

import { I2CAddressedBus } from './aod';
import { ScriptBus, Script, EOS_SCRIPT } from './helper.scriptbus';

const SCRIPT: Script = [
  ...EOS_SCRIPT
];

const CLOSE_SCRIPT: Script = [
  { method: 'close' },
  ...EOS_SCRIPT
];

const READ_SCRIPT: Script = [
  { method: 'readI2cBlock', result: { bytesRead: 2, buffer: Buffer.from([3,5]) } },
  ...CLOSE_SCRIPT
];

const WRITE_SCRIPT: Script = [
  { method: 'writeI2cBlock', result: { bytesWritten: 2, buffer: Buffer.from([3,5]) } },
  ...CLOSE_SCRIPT
];

const SPECIAL_SCRIPT: Script = [
  { method: 'sendByte' },
  ...CLOSE_SCRIPT
];

describe('I2CAddressedBus', () => {
  describe('#name', () => {
    it('should return name', () => {
      expect(new I2CAddressedBus(ScriptBus.from(SCRIPT), 0x00).name).to.equal('i2c:/dev/i2c--1/0x0');
    });
  });

  describe('#bus', () => {
    it('should return the bus', () => {
      const sb = ScriptBus.from(SCRIPT);
      const ab = new I2CAddressedBus(sb, 0x00);
      expect(ab.bus).to.equal(sb);
    });
  });

  describe('#address', () => {
    it('should return address', () => {
      const ab = new I2CAddressedBus(ScriptBus.from(SCRIPT), 0x37);
      expect(ab.address).to.equal(0x37);
    });
  });

  describe('#close', () => {
    it('should close gracefully', () => {
      const ab = new I2CAddressedBus(ScriptBus.from(CLOSE_SCRIPT), 0x00);
      expect(() => ab.close()).to.not.throw();
    });
  });

  describe('#read', () => {
    it('should read bytes', async () => {
      const ab = new I2CAddressedBus(ScriptBus.from(READ_SCRIPT), 0x00);
      expect(await ab.read(0x02, 2)).to.deep.equal(Buffer.from([3,5]))
    });
  });

  describe('#write', () => {
    it('should write bytes', async () => {
      const ab = new I2CAddressedBus(ScriptBus.from(WRITE_SCRIPT), 0x00);
      expect(() => ab.write(0x01, Buffer.from([3,5,7]))).to.not.throw();
    });
  });

  describe('#writeSpecial', async () => {
    it('should', () => {
      const ab = new I2CAddressedBus(ScriptBus.from(SPECIAL_SCRIPT), 0x00);
      expect(() => ab.writeSpecial(42)).to.not.throw();
    });
  });

  describe('#readBuffer', () => {
    it('should', () => {
      new I2CAddressedBus(ScriptBus.from(SCRIPT), 0x00)
    });
  });

  describe('#writeBuffer', () => {
    it('should', () => {
      new I2CAddressedBus(ScriptBus.from(SCRIPT), 0x00)
    });
  });
});