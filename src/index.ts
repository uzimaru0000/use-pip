// Apply polyfills for browser environments
import './polyfill';

export { usePinP } from './hooks';
export type { UsePinPOptions, UsePinPReturn } from './hooks';

export { clearFontCache, type Font, type UnresolvedFont } from './fonts';
export type { FontResolver } from './fonts';
