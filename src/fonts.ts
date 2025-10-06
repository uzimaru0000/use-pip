import type { SatoriOptions } from 'satori';

export type Font = SatoriOptions['fonts'][number];

export type UnresolvedFont = Omit<Font, 'data'>;

/**
 * Font resolver function type
 * Users can implement custom font loading logic
 */
export type FontResolver = (opts: UnresolvedFont) => Promise<Font>;

const fontCache = new Map<string, Font>();

/**
 * Set cached fonts with a key
 * @param key - Cache key to identify the fonts
 * @param fonts - Fonts to cache
 */
export const setCachedFonts = (key: string, fonts: Font) => {
  fontCache.set(key, fonts);
};

/**
 * Get cached fonts by key
 * @param key - Cache key
 * @returns Cached fonts or null
 */
export const getCachedFonts = (key: string) => {
  return fontCache.get(key) ?? null;
};

/**
 * Clear cached fonts
 * @param key - Optional cache key. If not provided, clears all cached fonts
 */
export const clearFontCache = (key?: string) => {
  if (key) {
    fontCache.delete(key);
  } else {
    fontCache.clear();
  }
};
