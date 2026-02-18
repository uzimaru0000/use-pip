import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type Font,
  type FontResolver,
  getCachedFonts,
  setCachedFonts,
  type UnresolvedFont,
} from './fonts';
import { renderToCanvas } from './satoriRenderer';
import { computeMinimalVideoSize } from './utils';

export type UsePinPOptions = {
  element: ReactNode;
  width?: number;
  height?: number;
  onEnter?: () => void;
  onLeave?: () => void;
  debug?: boolean;
  audioDestination?: MediaStreamAudioDestinationNode;
} & (
  | {
      fonts: Font[];
      fontResolver?: never;
    }
  | {
      fontResolver: FontResolver;
      fonts: (Font | UnresolvedFont)[];
    }
);

export interface UsePinPReturn {
  isSupported: boolean;
  active: boolean;
  toggle: () => Promise<void>;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
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
  onEnter,
  onLeave,
  debug = false,
  audioDestination,
  ...fontOptions
}: UsePinPOptions): UsePinPReturn => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isSupported] = useState(
    () =>
      'pictureInPictureEnabled' in document && document.pictureInPictureEnabled,
  );

  // Initialize video and canvas elements
  useEffect(() => {
    if (!videoRef.current) {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.autoplay = false;
      video.style.position = 'fixed';
      video.style.left = '0';
      video.style.top = '0';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      video.style.aspectRatio = `${width} / ${height}`;

      const { width: minimalVideoWidth, height: minimalVideoHeight } =
        computeMinimalVideoSize(width, height);
      video.style.width = `${minimalVideoWidth}px`;
      video.style.height = `${minimalVideoHeight}px`;

      // Pre-load to ensure video is ready
      video.preload = 'auto';
      document.body.appendChild(video);
      videoRef.current = video;
    }

    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.style.display = 'none';
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      document.body.appendChild(canvas);
      canvasRef.current = canvas;

      if (debug) {
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.bottom = '0';
        canvas.style.zIndex = '1000';
        canvas.style.border = '1px solid red';
      }
    }

    // Initialize stream early
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && !streamRef.current) {
      const stream = canvas.captureStream(0);

      streamRef.current = stream;
      video.srcObject = stream;
      video.load();
    }

    return () => {
      if (videoRef.current) {
        document.body.removeChild(videoRef.current);
        videoRef.current = null;
      }
      if (canvasRef.current) {
        document.body.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
    };
  }, [width, height, debug]);

  // Handle dynamic audio destination changes
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) {
      return;
    }

    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
    }

    // Remove all existing audio tracks
    const existingAudioTracks = stream.getAudioTracks();
    for (const track of existingAudioTracks) {
      stream.removeTrack(track);
    }

    // Add new audio tracks if audioDestination is provided
    if (audioDestination) {
      const audioTracks = audioDestination.stream.getAudioTracks();
      for (const track of audioTracks) {
        stream.addTrack(track);
      }
    }
  }, [audioDestination]);

  // Render canvas when element changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;

    const render = async () => {
      if (cancelled) {
        return;
      }

      let resolvedFonts: Font[];
      if (fontOptions.fontResolver) {
        resolvedFonts = await Promise.all(
          fontOptions.fonts.map(async (font) => {
            if ('data' in font) {
              return font;
            }

            const cachedFonts = getCachedFonts(font.name);
            if (cachedFonts) {
              return cachedFonts;
            }

            const resolvedFont = await fontOptions.fontResolver(font);
            setCachedFonts(font.name, resolvedFont);

            return resolvedFont;
          }),
        );
      } else {
        resolvedFonts = fontOptions.fonts;
      }

      try {
        await renderToCanvas({
          element,
          canvas,
          width,
          height,
          fonts: resolvedFonts,
        });

        if (streamRef.current) {
          const track = streamRef.current?.getVideoTracks()[0];
          if (track && track instanceof CanvasCaptureMediaStreamTrack) {
            track.requestFrame();
          }
        }
      } catch (error) {
        console.error('Failed to render to canvas:', error);
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [element, width, height, fontOptions.fontResolver, fontOptions.fonts]);

  // Setup PiP event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handleEnterPiP = () => {
      setIsPiPActive(true);
      onEnter?.();
    };

    const handleLeavePiP = () => {
      setIsPiPActive(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      onLeave?.();
    };

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [onEnter, onLeave]);

  const enter = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Picture-in-Picture is not supported');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      throw new Error('Video or canvas element not initialized');
    }

    // For iOS: Call play() and requestPictureInPicture() synchronously
    // Don't use async/await as it loses the user gesture context
    video.play().catch((error) => {
      console.error('Failed to play video:', error);
    });

    video.requestPictureInPicture().catch((error) => {
      console.error('Failed to enter PiP:', error);
      throw error;
    });
  }, [isSupported]);

  const exit = useCallback(async () => {
    const video = videoRef.current;

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }

    // Stop the video to reset state for next PiP request
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }, []);

  const toggle = useCallback(async () => {
    if (isPiPActive) {
      exit();
    }
    enter();
  }, [isPiPActive, enter, exit]);

  return {
    isSupported,
    active: isPiPActive,
    toggle,
    enter,
    exit,
  };
};
