/* eslint-disable no-magic-numbers */

import { describe, it } from 'mocha';
import { expect } from 'chai';

// eslint-disable-next-line sort-imports
import { BitUtil, PackMap } from './aod';

describe('BitUtil', () => {
  describe('#packBits', () => {
    //
    it('should run README example', () => {
      const source = [1, 3, 2];
      const template: PackMap = [ [6, 1], [5, 3], [1, 2] ];
      const expected = 0b0_1_011_0_10;
      const outRegister = BitUtil.packBits(template, source);
      expect(outRegister).to.equal(expected);
    });

    it('should run README example second half', () => {
      const inRegister = 0x5A;
      const template: PackMap = [ [6, 1], [5, 3], [1, 2] ];
      const [one, three, two] = BitUtil.unpackBits(template, inRegister);
      expect(one).to.equal(1);
      expect(two).to.equal(2);
      expect(three).to.equal(3);
    });

    it('should throw error if template (type violation zero) @typeViolation', () => {
      const pm: unknown = [[]];
      expect(() => BitUtil.packBits(pm as PackMap, null)).to.throw('zero');
    });

    it('should throw error if template (type violation gt 2) @typeViolation', () => {
      const pm: unknown = [[1, 2, 3]];
      expect(() => BitUtil.packBits(pm as PackMap, null)).to.throw('gt 2');
    });

    it('should throw error if template (type violation offset) @typeViolation', () => {
      const pm: unknown = [['offset', 1]];
      expect(() => BitUtil.packBits(pm as PackMap, null)).to.throw('offset');
    });

    it('should throw error if template (type violation length) @typeViolation', () => {
      const pm: unknown = [[0, 'length']];
      expect(() => BitUtil.packBits(pm as PackMap, null)).to.throw('length');
    });

    it('should throw error if template (type violation type) @typeViolation', () => {
      const pm: unknown = [false];
      expect(() => BitUtil.packBits(pm as PackMap, null)).to.throw('type');
    });

    it.skip('should throw error if template (overlap) @broken', () => {
      expect(() => BitUtil.packBits([[3, 2], [2, 3]], [])).to.throw('overlapping');
    });

    it.skip('should throw error if template (overlap ends) @broken', () => {
      expect(() => BitUtil.packBits([[3, 2], [2, 2]], [])).to.throw('overlapping');
    });

    it('should truncate values to template lengths', () => {
      expect(BitUtil.packBits([[1, 2]], [0b101])).to.equal(1);
    });

    it('should normalize pack example (single number array) @slow', () => {
      expect(BitUtil.packBits([3], [1], false)).to.equal(8);
    });

    it('should normalize pack example (array of arrays of single number)', () => {
      expect(BitUtil.packBits([[3]], [1], false)).to.equal(8);
    });

    it('should normalize pack example (already normal array of arrays of two numbers)', () => {
      expect(BitUtil.packBits([[3, 1]], [1], false)).to.equal(8);
    });

    it('should pack multiple bits', () => {
      expect(BitUtil.packBits([[3, 1], [7, 2]], [1, 3])).to.equal(0b11001000);
    });

    it('should pack multiple bits (extra)', () => {
      expect(BitUtil.packBits([[3, 3], [7, 2]], [5, 3])).to.equal(0b11001010);
    });

    it('should pack multiple bits (first bit)', () => {
      expect(BitUtil.packBits([[7, 1]], [1])).to.equal(0b10000000);
    });

    it('should pack multiple bits (last bit)', () => {
      expect(BitUtil.packBits([[0, 1]], [1])).to.equal(0b00000001);
    });

    it('should pack multiple bits (last bit zero)', () => {
      expect(BitUtil.packBits([[0, 1]], [0])).to.equal(0b00000000);
    });

    it('should pack multiple bits (support overlap)', () => {
      expect(BitUtil.packBits([[3, 4], [0, 1]], [9, 0])).to.equal(0b00001000);
    });
  });

  describe('#unpackBits', () => {
    it('should normalize pack example (single number array)', () => {
      expect(BitUtil.unpackBits([3], 0b1000, false)).to.deep.equal([1]);
    });

    it('should unpack multi byte handcrafted example', () => {
      const sourceData = 0b00_101_110;
      expect(BitUtil.unpackBits([[7, 2], [5, 3], [2, 3]], sourceData)).to.deep.equal([0, 5, 6]);
    });

    // todo many more tests here
  });

  describe('#decodeTwos', () => {
    it('should decode simple bytes', () => {
      expect(BitUtil.decodeTwos(0b1001, 4)).to.equal(-7);
      expect(BitUtil.decodeTwos(0b010, 3)).to.equal(2);
      expect(BitUtil.decodeTwos(0b100, 3)).to.equal(-4);
      expect(BitUtil.decodeTwos(0b111, 3)).to.equal(-1);
      expect(BitUtil.decodeTwos(0b00000000, 8)).to.equal(0);
      expect(BitUtil.decodeTwos(0b01111110, 8)).to.equal(126);
      expect(BitUtil.decodeTwos(0b10000001, 8)).to.equal(-127);
      expect(BitUtil.decodeTwos(0b11111111, 8)).to.equal(-1);
      expect(BitUtil.decodeTwos(0xFFFFFFFF, 32)).to.equal(-1);
    });

    it.skip('should decode simple bytes (from internet) @broken', () => {
      expect(BitUtil.decodeTwos(0x0111, 4)).to.equal(7);
      expect(BitUtil.decodeTwos(0x0110, 4)).to.equal(6);
      expect(BitUtil.decodeTwos(0x0101, 4)).to.equal(5);
      expect(BitUtil.decodeTwos(0x0100, 4)).to.equal(4);
      expect(BitUtil.decodeTwos(0x0011, 4)).to.equal(3);
      expect(BitUtil.decodeTwos(0x0010, 4)).to.equal(2);
      expect(BitUtil.decodeTwos(0x0001, 4)).to.equal(1);
      expect(BitUtil.decodeTwos(0x0000, 4)).to.equal(0);
      expect(BitUtil.decodeTwos(0x1111, 4)).to.equal(-1);
      expect(BitUtil.decodeTwos(0x1110, 4)).to.equal(-2);
      expect(BitUtil.decodeTwos(0x1101, 4)).to.equal(-3);
      expect(BitUtil.decodeTwos(0x1100, 4)).to.equal(-4);
      expect(BitUtil.decodeTwos(0x1011, 4)).to.equal(-5);
      expect(BitUtil.decodeTwos(0x1010, 4)).to.equal(-6);
      expect(BitUtil.decodeTwos(0x1001, 4)).to.equal(-7);
    });
  });

  describe('#reconstructNBit', () => {
    it('should reconstruct N bits', () => {
      expect(BitUtil.reconstructNBit(10, [0x00, 0x00])).to.equal(0);

      expect(BitUtil.reconstructNBit(12, [0x34, 0x0E])).to.equal(846);
      expect(BitUtil.reconstructNBit(12, [0x3E, 0x05])).to.equal(997);

      expect(BitUtil.reconstructNBit(20, [0x55, 0x47, 0x00])).to.equal(349296);
      expect(BitUtil.reconstructNBit(20, [0x7E, 0x8B, 0x80])).to.equal(518328);
    });
  });

  describe('#reconstruct10bit', () => {
    it('should reconstruct bits (shift)', () => {
      expect(BitUtil.reconstruct10bit(0xFF, 0b00)).to.equal(0x03FC);
    });

    it('should reconstruct bits (boundary)', () => {
      expect(BitUtil.reconstruct10bit(0b00000001, 0b10)).to.equal(0b0110);
    });

    it('should reconstruct bits (ignore existing high bits)', () => {
      expect(BitUtil.reconstruct10bit(0b1100000001, 0b11)).to.equal(0b0111);
    });

    it('should reconstruct bits (mask low bits)', () => {
      expect(BitUtil.reconstruct10bit(0b00000010, 0b11111111)).to.equal(0b1011);
    });
  });
});
