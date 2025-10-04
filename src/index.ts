// Apply polyfills for browser environments
import './polyfill'

export { usePinP } from './hooks'
export type {
  UsePinPOptions,
  UsePinPReturn,
  UsePictureInPictureOptions,
  UsePictureInPictureReturn,
} from './hooks'

export {
  setCachedFonts,
  getCachedFonts,
  clearFontCache,
} from './fonts'
export type { FontResolver } from './fonts'
