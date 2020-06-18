import { describe, it } from 'mocha';
import { expect } from 'chai';

// eslint-disable-next-line sort-imports
import { BusUtil, EOS_SCRIPT, I2CAddressedBus, Script, I2CScriptBus } from './aod';

const SCRIPT_BUS_NUMBER = 1;

const READ_SINGLE_SCRIPT: Script = [
  { method: 'readI2cBlock', parameters: [0x37], result: { bytesRead: 2, buffer: Buffer.from([3, 5]) } },
  ...EOS_SCRIPT
];

const READ_MULTI_SCRIPT: Script = [
  { method: 'readI2cBlock', parameters: [0x37], result: { bytesRead: 2, buffer: Buffer.from([3, 5]) } },
  { method: 'readI2cBlock', parameters: [0x42], result: { bytesRead: 4, buffer: Buffer.from([7, 9, 11, 13]) } },
  ...EOS_SCRIPT
];

const WRITE_SINGLE_SCRIPT: Script = [
  { method: 'writeI2cBlock', parameters: [0, 1, 2], result: { bytesWritten: 2, buffer: Buffer.from([]) } },
  ...EOS_SCRIPT
];

const WRITE_MULTI_SCRIPT: Script = [
  { method: 'writeI2cBlock', parameters: [0, 1, 2], result: { bytesWritten: 2, buffer: Buffer.from([]) } },
  { method: 'writeI2cBlock', parameters: [0, 4, 4], result: { bytesWritten: 4, buffer: Buffer.from([]) } },
  ...EOS_SCRIPT
];

describe('BusUtil', () => {
  describe('#normalizeBlock', () => {
    it('should normalize', () => {
      expect(BusUtil.normalizeBlock([[37], [42, 2], 77], false)).to.deep.equal([[[37, 1], [42, 2], [77, 1]], 4, 78]);
    });
  });

  describe('#readBlock', () => {
    it('should return empty on empty block read', async () => {
      const result = await BusUtil.readBlock(new I2CAddressedBus(I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, EOS_SCRIPT), 0x00), []);
      expect(result).to.deep.equal(Buffer.from([]));
    });

    it('should read a simple block', async () => {
      const result = await BusUtil.readBlock(new I2CAddressedBus(I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, READ_SINGLE_SCRIPT), 0x00), [[0, 2]]);
      expect(result).to.deep.equal(Buffer.from([3, 5]));
    });

    it('should read a multi block', async () => {
      const result = await BusUtil.readBlock(new I2CAddressedBus(I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, READ_MULTI_SCRIPT), 0x00), [[0x37, 2], [0x42, 4]]);
      expect(result).to.deep.equal(Buffer.from([3, 5, 7, 9, 11, 13]));
    });

    it('should error when bus layer errors', () => {
      expect(() => BusUtil.readBlock(new I2CAddressedBus(I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, READ_MULTI_SCRIPT), 0x00), [[0x37, 2], [0x42, 4], [0x77, 2]])).to.throw();
    });
  });

  describe('#writeBlock', () => {
    it('should write empty on empty block', async () => {
      await BusUtil.writeBlock(new I2CAddressedBus(I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, EOS_SCRIPT), 0x00), [], Buffer.from([]));
    });

    it('should write simple byte single block', async () => {
      await BusUtil.writeBlock(new I2CAddressedBus(I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, WRITE_SINGLE_SCRIPT), 0x00), [[0x01, 1]], Buffer.from([0, 3]));
    });

    it('should write simple block', async () => {
      await BusUtil.writeBlock(new I2CAddressedBus(I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, WRITE_SINGLE_SCRIPT), 0x00), [[0x01, 2]], Buffer.from([0, 3, 5]));
    });

    it('should write multi block', async () => {
      await BusUtil.writeBlock(new I2CAddressedBus(I2CScriptBus.openPromisified(SCRIPT_BUS_NUMBER, WRITE_MULTI_SCRIPT), 0x00), [[0x01, 2], [0x4, 4]], Buffer.from([0, 3, 5, 0, 7, 9, 11, 13]));
    });
  });

  describe('#expandBlock', () => {
    it('should pass most basic 1:1 test', () => {
      expect(BusUtil.expandBlock([0], Buffer.from([3]), 0xFE, false)).to.deep.equal(Buffer.from([3]));
    });

    it('should pass most basic 1:1 test (offset)', () => {
      expect(BusUtil.expandBlock([3], Buffer.from([3]), 0xFE, false)).to.deep.equal(Buffer.from([0xFE, 0xFE, 0xFE, 3]));
    });

    it('should pass basic example', () => {
      const fill = -1;
      const firstPad = Buffer.alloc(10, fill);
      const pre20Pad = Buffer.alloc(8, fill);
      const pre30Pad = Buffer.alloc(9, fill);
      const expected = Buffer.concat([firstPad, Buffer.from([3, 5]), pre20Pad, Buffer.from([7]), pre30Pad, Buffer.from([9, 11, 13])], 33);
      expect(BusUtil.expandBlock([[10, 2], [20, 1], [30, 3]], Buffer.from([3, 5, 7, 9, 11, 13]), fill)).to.deep.equal(expected);
    });

    it('should pass basic example (collapsed)', () => {
      const fill = -1;
      const firstPad = Buffer.alloc(10, fill);
      const pre30Pad = Buffer.alloc(17, fill);
      const expected = Buffer.concat([firstPad, Buffer.from([3, 5, 7]), pre30Pad, Buffer.from([9, 11, 13])], 33);
      expect(BusUtil.expandBlock([[10, 2], [12, 1], [30, 3]], Buffer.from([3, 5, 7, 9, 11, 13]), fill)).to.deep.equal(expected);
    });

    it('should fill in the middle', () => {
      expect(BusUtil.expandBlock([0, 2], Buffer.from([3, 5]), 0xFE, false)).to.deep.equal(Buffer.from([3, 0xFE, 5]));
    });

    it('should fill in front', () => {
      expect(BusUtil.expandBlock([2], Buffer.from([3]), 0xFE, false)).to.deep.equal(Buffer.from([0xFE, 0xFE, 3]));
    });

    it('should fill in both', () => {
      expect(BusUtil.expandBlock([1, 4], Buffer.from([3, 5]), 0xFE, false)).to.deep.equal(Buffer.from([0xFE, 3, 0xFE, 0xFE, 5]));
    });

    it('should handle multi-byte', () => {
      expect(BusUtil.expandBlock([[0, 4], 4], Buffer.from([3, 5, 7, 9, 11]), 0xFE, false)).to.deep.equal(Buffer.from([3, 5, 7, 9, 11]));
    });

    it('should handle multi-byte padded', () => {
      expect(BusUtil.expandBlock([[2, 4], 8], Buffer.from([3, 5, 7, 9, 11]), 0xFE, false)).to.deep.equal(Buffer.from([0xFE, 0xFE, 3, 5, 7, 9, 0xFE, 0xFE, 11]));
    });

    it('should error if input buffer length does not match BlockDefinition', () => {
      expect(() => BusUtil.expandBlock([1, 2, 3], Buffer.alloc(5, 0), 0xFE, false)).to.throw(Error);
    });

    it('should match example used in hand coded test', () => {
      expect(BusUtil.expandBlock([[0x01, 2], [0x4, 4]], Buffer.from([3, 5, 7, 9, 11, 13]))).to.deep.equal(Buffer.from([0, 3, 5, 0, 7, 9, 11, 13]));

    });
  });
});
