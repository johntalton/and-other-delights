import { expect } from 'chai';
import { ClassSelector } from './aod';

class A { public readonly name = 'A' }
class B { public readonly name = 'B' }
class Z { public readonly name = 'Z' }

describe('ClassSelector', () => {
    it('selects a class based on basic selector function', () => {
        expect(ClassSelector.from(1)
            .on(val => val === 1, A)
            .on(val => val === 2, B)
            .catch(Z)).to.equal(A)
    });

    it('should return the catch if no selector match', () => {
        expect(ClassSelector.from(3)
            .on(val => val === 1, A)
            .on(val => val === 2, B)
            .catch(Z)).to.equal(Z)
    });
});