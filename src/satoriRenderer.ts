import satori, { type SatoriOptions } from 'satori';

export interface SatoriRendererOptions {
  width: number;
  height: number;
  fonts: SatoriOptions['fonts'];
}

export interface RenderToCanvasOptions extends SatoriRendererOptions {
  element: React.ReactNode;
  canvas: HTMLCanvasElement;
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
 * Render JSX element to canvas using Satori
 */
export const renderToCanvas = async (
  options: RenderToCanvasOptions,
): Promise<void> => {
  const { element, canvas, ...satoriOptions } = options;

  // Set canvas dimensions
  canvas.width = satoriOptions.width;
  canvas.height = satoriOptions.height;

  // Convert JSX to SVG
  const svg = await renderToSVG(element, satoriOptions);

  // Convert SVG to Image
  const image = await svgToImage(svg);

  // Draw to canvas
  drawImageToCanvas(image, canvas);
};
