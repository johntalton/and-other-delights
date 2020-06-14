/* eslint-disable no-magic-numbers */

import { describe, it } from 'mocha';
import { expect } from 'chai';

// eslint-disable-next-line sort-imports
import { BitUtil } from './aod';

describe('BitUtil', () => {
  describe('#packBits', () => {
    //
    it('should normalize pack example (single number array)', () => {
      expect(BitUtil.packBits([3], [1])).to.equal(8);
    });

    it('should normalize pack example (array of arrays of single number)', () => {
      expect(BitUtil.packBits([[3]], [1])).to.equal(8);
    });

    it('should normalize pack example (already normal array of arrays of two numbers)', () => {
      expect(BitUtil.packBits([[3, 1]], [1])).to.equal(8);
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
      expect(BitUtil.unpackBits([3], 0b1000)).to.deep.equal([1]);
    });
  });

  describe('#mapBits', () => {
    it('should map simple bits to number', () => {
      expect(BitUtil.mapBits(2, 2, 2)).to.equal(1);
    });
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

    it('should decode simple bytes (from internet)', () => {
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
