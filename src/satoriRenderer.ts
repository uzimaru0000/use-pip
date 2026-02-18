import satori, { type SatoriOptions } from 'satori';

export interface SatoriRendererOptions {
  width: number;
  height: number;
  fonts: SatoriOptions['fonts'];
}

export interface RenderToCanvasOptions extends SatoriRendererOptions {
  element: React.ReactNode;
  canvas: HTMLCanvasElement;
  devicePixelRatio?: number;
}

/**
 * Convert JSX element to SVG using Satori
 */
export const renderToSVG = async (
  element: React.ReactNode,
  options: SatoriRendererOptions,
): Promise<string> => {
  const { width, height, fonts } = options;

  const svg = await satori(element, {
    width,
    height,
    fonts,
  });

  return svg;
};

/**
 * Convert SVG string to Image element
 */
export const svgToImage = async (svg: string): Promise<HTMLImageElement> => {
  const img = new Image();
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);

  try {
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Draw image to canvas
 */
export const drawImageToCanvas = (
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas');
  }

  // Draw image
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
};

/**
 * Scale SVG width/height attributes by a given factor while preserving viewBox.
 * This causes the browser to rasterize the SVG at a higher resolution for HiDPI displays.
 */
export const scaleSvgDimensions = (svg: string, scale: number): string => {
  if (scale === 1) return svg;
  return svg
    .replace(
      /(<svg\b[^>]*\b)width="(\d+(?:\.\d+)?)"/,
      (_, prefix, w) => `${prefix}width="${Math.round(Number(w) * scale)}"`,
    )
    .replace(
      /(<svg\b[^>]*\b)height="(\d+(?:\.\d+)?)"/,
      (_, prefix, h) => `${prefix}height="${Math.round(Number(h) * scale)}"`,
    );
};

/**
 * Render JSX element to canvas using Satori
 */
export const renderToCanvas = async (
  options: RenderToCanvasOptions,
): Promise<void> => {
  const {
    element,
    canvas,
    devicePixelRatio: dprOption,
    ...satoriOptions
  } = options;
  const dpr =
    dprOption ??
    (typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1);

  // Set canvas dimensions to physical pixel size
  canvas.width = Math.round(satoriOptions.width * dpr);
  canvas.height = Math.round(satoriOptions.height * dpr);

  // Convert JSX to SVG at logical dimensions (preserves layout)
  const svg = await renderToSVG(element, satoriOptions);

  // Scale SVG viewport for high-resolution rasterization
  const scaledSvg = scaleSvgDimensions(svg, dpr);

  // Convert SVG to Image (decoded at physical resolution)
  const image = await svgToImage(scaledSvg);

  // Draw to canvas
  drawImageToCanvas(image, canvas);
};
