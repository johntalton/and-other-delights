import { NameValueUtil } from './aod';
import { expect } from 'chai';

const example = [
  { name: 'foo', value: 1 },
  { name: 'bar', value: 2 }
];


describe('NameValueUtil', () => {
  describe('#toValue', () => {
    it('converts a value', () => {
      expect(NameValueUtil.toValue('foo', example)).to.equal(1);
    });

    it('throws error on undefined name', () => {
      expect(() => NameValueUtil.toValue('ABC', example)).to.throw();
    });
  });

  describe('#toName', () => {
    it('converts a name', () => {
      expect(NameValueUtil.toName(1, example)).to.equal('foo');
    });

    it('throws error on undefined value', () => {
      expect(() => NameValueUtil.toName(0, example)).to.throw();
    });
  });
});