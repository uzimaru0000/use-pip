import { describe, it, expect, beforeEach } from 'vitest';
import { setCachedFonts, getCachedFonts, clearFontCache } from './fonts';
import type { Font } from './fonts';

const makeFont = (name: string): Font => ({
  name,
  data: new ArrayBuffer(8),
  weight: 400,
  style: 'normal',
});

describe('fonts cache', () => {
  beforeEach(() => {
    clearFontCache();
  });

  describe('setCachedFonts / getCachedFonts', () => {
    it('returns null for a key that has not been set', () => {
      expect(getCachedFonts('missing')).toBeNull();
    });

    it('stores and retrieves a font by key', () => {
      const font = makeFont('Roboto');
      setCachedFonts('roboto-400', font);
      expect(getCachedFonts('roboto-400')).toBe(font);
    });

    it('overwrites an existing entry when the same key is set again', () => {
      const first = makeFont('First');
      const second = makeFont('Second');
      setCachedFonts('key', first);
      setCachedFonts('key', second);
      expect(getCachedFonts('key')).toBe(second);
    });

    it('supports multiple independent keys', () => {
      const a = makeFont('A');
      const b = makeFont('B');
      setCachedFonts('a', a);
      setCachedFonts('b', b);
      expect(getCachedFonts('a')).toBe(a);
      expect(getCachedFonts('b')).toBe(b);
    });
  });

  describe('clearFontCache', () => {
    it('clears a specific key when key is provided', () => {
      setCachedFonts('a', makeFont('A'));
      setCachedFonts('b', makeFont('B'));
      clearFontCache('a');
      expect(getCachedFonts('a')).toBeNull();
      expect(getCachedFonts('b')).not.toBeNull();
    });

    it('clears all entries when no key is provided', () => {
      setCachedFonts('a', makeFont('A'));
      setCachedFonts('b', makeFont('B'));
      clearFontCache();
      expect(getCachedFonts('a')).toBeNull();
      expect(getCachedFonts('b')).toBeNull();
    });

    it('does not throw when clearing a key that does not exist', () => {
      expect(() => clearFontCache('nonexistent')).not.toThrow();
    });

    it('does not throw when clearing an already-empty cache', () => {
      expect(() => clearFontCache()).not.toThrow();
    });
  });
});
