import { isEqual } from 'libs/utils/src/lib/guards';

describe('Guards', () => {
  describe('isEqual', () => {
    describe('Primitives', () => {
      it('should return true if the values are equal', () => {
        // * Numbers
        expect(isEqual(1, 1)).toBe(true);
        // * Strings
        expect(isEqual('aaa', 'aaa')).toBe(true);
        // * Booleans
        expect(isEqual(true, true)).toBe(true);
        // * Null
        expect(isEqual(null, null)).toBe(true);
        // * Undefined
        expect(isEqual(undefined, undefined)).toBe(true);
      });

      it('should return false if the values are not equal', () => {
        // * Numbers
        expect(isEqual(1, 2)).toBe(false);
        // * Strings
        expect(isEqual('aaa', 'bbb')).toBe(false);
        // * Booleans
        expect(isEqual(true, false)).toBe(false);
        // * Null
        expect(isEqual(null, undefined)).toBe(false);
        // * Undefined
        expect(isEqual(undefined, null)).toBe(false);
      });
    });

    describe('Arrays', () => {
      it('should return true if the values are equal', () => {
        // * Shallow equality
        expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(isEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
        expect(isEqual([true, false], [true, false])).toBe(true);
        expect(isEqual([null, undefined], [null, undefined])).toBe(true);

        // * Deep equality
        expect(isEqual([1, 2, [3, 4]], [1, 2, [3, 4]])).toBe(true);
        expect(isEqual([1, 2, { first: 3, second: 4 }], [1, 2, { first: 3, second: 4 }])).toBe(true);

        // * Empty arrays
        expect(isEqual([], [])).toBe(true);
      });

      it('should return false if the values are not equal', () => {
        // * Shallow equality
        expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false);
        expect(isEqual(['a', 'b', 'c'], ['a', 'b', 'd'])).toBe(false);
        expect(isEqual([true, false], [true, true])).toBe(false);
        expect(isEqual([null, undefined], [null, null])).toBe(false);

        // * Deep equality
        expect(isEqual([1, 2, [3, 4]], [1, 2, [3, 5]])).toBe(false);
        expect(isEqual([1, 2, { first: 3, second: 4 }], [1, 2, { first: 3, second: 5 }])).toBe(false);

        // * Empty arrays
        expect(isEqual([], [1])).toBe(false);
      });
    });

    describe('Objects', () => {
      it('should return true if the values are equal', () => {
        // * Shallow equality
        expect(isEqual({ first: 1, second: 2 }, { first: 1, second: 2 })).toBe(true);
        expect(isEqual({ first: 'a', second: 'b' }, { first: 'a', second: 'b' })).toBe(true);
        expect(isEqual({ first: true, second: false }, { first: true, second: false })).toBe(true);
        expect(isEqual({ first: null, second: undefined }, { first: null, second: undefined })).toBe(true);

        // * Deep equality
        expect(isEqual({ first: 1, second: [2, 3] }, { first: 1, second: [2, 3] })).toBe(true);
        expect(
          isEqual({ first: 1, second: { third: 2, fourth: 3 } }, { first: 1, second: { third: 2, fourth: 3 } }),
        ).toBe(true);

        // * Empty objects
        expect(isEqual({}, {})).toBe(true);
      });

      it('should return false if the values are not equal', () => {
        // * Shallow equality
        expect(isEqual({ first: 1, second: 2 }, { first: 1, second: 3 })).toBe(false);
        expect(isEqual({ first: 'a', second: 'b' }, { first: 'a', second: 'c' })).toBe(false);
        expect(isEqual({ first: true, second: false }, { first: true, second: true })).toBe(false);
        expect(isEqual({ first: null, second: undefined }, { first: null, second: null })).toBe(false);

        // * Deep equality
        expect(isEqual({ first: 1, second: [2, 3] }, { first: 1, second: [2, 4] })).toBe(false);
        expect(
          isEqual({ first: 1, second: { third: 2, fourth: 3 } }, { first: 1, second: { third: 2, fourth: 4 } }),
        ).toBe(false);

        // * Empty objects
        expect(isEqual({}, { first: 1 })).toBe(false);
      });
    });
  });
});
