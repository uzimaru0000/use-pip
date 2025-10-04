// Apply polyfills for browser environments
import './polyfill'

export { usePinP } from './hooks'
export type {
  UsePinPOptions,
  UsePinPReturn,
} from './hooks'

export {
  setCachedFonts,
  getCachedFonts,
  clearFontCache,
} from './fonts'
export type { FontResolver } from './fonts'
