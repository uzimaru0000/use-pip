import { describe, it, expect } from 'vitest';
import { computeMinimalVideoSize } from './utils';

describe('computeMinimalVideoSize', () => {
  describe('standard integer inputs', () => {
    it('reduces 640x480 (4:3) to 4x3', () => {
      expect(computeMinimalVideoSize(640, 480)).toEqual({
        width: 4,
        height: 3,
      });
    });

    it('reduces 1920x1080 (16:9) to 16x9', () => {
      expect(computeMinimalVideoSize(1920, 1080)).toEqual({
        width: 16,
        height: 9,
      });
    });

    it('returns 1x1 for equal width and height', () => {
      expect(computeMinimalVideoSize(500, 500)).toEqual({
        width: 1,
        height: 1,
      });
    });

    it('returns the same values when width and height are coprime', () => {
      expect(computeMinimalVideoSize(7, 13)).toEqual({
        width: 7,
        height: 13,
      });
    });
  });

  describe('decimal inputs', () => {
    it('handles simple decimals like 1.5 x 1.0', () => {
      expect(computeMinimalVideoSize(1.5, 1.0)).toEqual({
        width: 3,
        height: 2,
      });
    });

    it('handles decimals that reduce (6.4 x 4.8 = 4:3)', () => {
      expect(computeMinimalVideoSize(6.4, 4.8)).toEqual({
        width: 4,
        height: 3,
      });
    });
  });

  describe('edge cases', () => {
    it('returns 1x1 for zero width', () => {
      expect(computeMinimalVideoSize(0, 480)).toEqual({
        width: 1,
        height: 1,
      });
    });

    it('returns 1x1 for zero height', () => {
      expect(computeMinimalVideoSize(640, 0)).toEqual({
        width: 1,
        height: 1,
      });
    });

    it('returns 1x1 for negative width', () => {
      expect(computeMinimalVideoSize(-640, 480)).toEqual({
        width: 1,
        height: 1,
      });
    });

    it('returns 1x1 for Infinity', () => {
      expect(computeMinimalVideoSize(Infinity, 480)).toEqual({
        width: 1,
        height: 1,
      });
    });

    it('returns 1x1 for NaN', () => {
      expect(computeMinimalVideoSize(NaN, 480)).toEqual({
        width: 1,
        height: 1,
      });
    });

    it('returns 1x1 for both zero', () => {
      expect(computeMinimalVideoSize(0, 0)).toEqual({
        width: 1,
        height: 1,
      });
    });
  });
});
