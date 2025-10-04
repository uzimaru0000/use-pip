import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import type { SatoriOptions } from 'satori'
import { renderToCanvas } from './satoriRenderer'
import {
  type FontResolver,
  getCachedFonts,
  setCachedFonts,
} from './fonts'

export interface UsePictureInPictureOptions {
  width?: number
  height?: number
  onEnter?: () => void
  onLeave?: () => void
}

export interface UsePictureInPictureReturn {
  isSupported: boolean
  isPiPActive: boolean
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  enter: () => Promise<void>
  exit: () => Promise<void>
  toggle: () => Promise<void>
  updateCanvas: (updateFn: (ctx: CanvasRenderingContext2D) => void) => void
}

export interface UsePinPOptions {
  element: ReactNode
  width?: number
  height?: number
  fonts?: SatoriOptions['fonts']
  fontResolver?: FontResolver
  fontCacheKey?: string
  onEnter?: () => void
  onLeave?: () => void
}

export interface UsePinPReturn {
  isSupported: boolean
  active: boolean
  toggle: () => Promise<void>
  enter: () => Promise<void>
  exit: () => Promise<void>
}

/**
 * Hook for Picture-in-Picture with JSX rendering via Satori
 *
 * @example
 * ```tsx
 * const { toggle, active, isSupported } = usePinP({
 *   element: <div style={{ color: 'white' }}>Hello PiP</div>,
 *   width: 640,
 *   height: 480,
 * });
 *
 * <button onClick={toggle} disabled={!isSupported}>
 *   {active ? 'Close PiP' : 'Open PiP'}
 * </button>
 * ```
 */
export const usePinP = ({
  element,
  width = 640,
  height = 480,
  fonts,
  fontResolver,
  fontCacheKey,
  onEnter,
  onLeave,
}: UsePinPOptions): UsePinPReturn => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isPiPActive, setIsPiPActive] = useState(false)
  const [isSupported] = useState(
    () =>
      'pictureInPictureEnabled' in document && document.pictureInPictureEnabled,
  )

  // Initialize video and canvas elements
  useEffect(() => {
    if (!videoRef.current) {
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.autoplay = false
      video.style.position = 'absolute'
      video.style.left = '0'
      video.style.top = '0'
      video.style.width = '1px'
      video.style.height = '1px'
      video.style.opacity = '0'
      video.style.pointerEvents = 'none'
      // Pre-load to ensure video is ready
      video.preload = 'auto'
      document.body.appendChild(video)
      videoRef.current = video
    }

    if (!canvasRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.style.display = 'none'
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      document.body.appendChild(canvas)
      canvasRef.current = canvas
    }

    // Initialize stream early
    const canvas = canvasRef.current
    const video = videoRef.current
    if (canvas && video && !streamRef.current) {
      const stream = canvas.captureStream()
      streamRef.current = stream
      video.srcObject = stream
      video.load()
    }

    return () => {
      if (videoRef.current) {
        document.body.removeChild(videoRef.current)
        videoRef.current = null
      }
      if (canvasRef.current) {
        document.body.removeChild(canvasRef.current)
        canvasRef.current = null
      }
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop()
        }
        streamRef.current = null
      }
    }
  }, [width, height])

  // Render canvas when element changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    let cancelled = false

    const render = async () => {
      if (cancelled) {
        return
      }

      try {
        // Resolve fonts
        let resolvedFonts: SatoriOptions['fonts']

        if (fonts) {
          // Use provided fonts directly
          resolvedFonts = fonts
        } else if (fontCacheKey) {
          // Try to get from cache
          const cachedFonts = getCachedFonts(fontCacheKey)
          if (cachedFonts) {
            resolvedFonts = cachedFonts
          } else if (fontResolver) {
            // Load from resolver and cache
            resolvedFonts = await fontResolver()
            setCachedFonts(fontCacheKey, resolvedFonts)
          } else {
            throw new Error(
              'Font resolver is required when fonts are not cached',
            )
          }
        } else if (fontResolver) {
          // Use resolver without caching
          resolvedFonts = await fontResolver()
        } else {
          throw new Error(
            'Either fonts, fontResolver, or fontCacheKey must be provided',
          )
        }

        await renderToCanvas({
          element,
          canvas,
          width,
          height,
          fonts: resolvedFonts,
        })
      } catch (error) {
        console.error('Failed to render to canvas:', error)
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [element, width, height, fonts, fontResolver, fontCacheKey])

  // Setup PiP event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const handleEnterPiP = () => {
      setIsPiPActive(true)
      onEnter?.()
    }

    const handleLeavePiP = () => {
      setIsPiPActive(false)
      onLeave?.()
    }

    video.addEventListener('enterpictureinpicture', handleEnterPiP)
    video.addEventListener('leavepictureinpicture', handleLeavePiP)

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP)
      video.removeEventListener('leavepictureinpicture', handleLeavePiP)
    }
  }, [onEnter, onLeave])

  const enter = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Picture-in-Picture is not supported')
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) {
      throw new Error('Video or canvas element not initialized')
    }

    // For iOS: Call play() and requestPictureInPicture() synchronously
    // Don't use async/await as it loses the user gesture context
    video.play().catch((error) => {
      console.error('Failed to play video:', error)
    })

    video.requestPictureInPicture().catch((error) => {
      console.error('Failed to enter PiP:', error)
      throw error
    })
  }, [isSupported])

  const exit = useCallback(async () => {
    const video = videoRef.current

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    }

    // Stop the video to reset state for next PiP request
    if (video) {
      video.pause()
      video.currentTime = 0
    }
  }, [])

  const toggle = useCallback(async () => {
    if (isPiPActive) {
      exit()
    }
    enter()
  }, [isPiPActive, enter, exit])

  return {
    isSupported,
    active: isPiPActive,
    toggle,
    enter,
    exit,
  }
}
