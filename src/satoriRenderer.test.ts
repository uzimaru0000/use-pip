// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('satori', () => ({
  default: vi.fn(),
}));

import satori from 'satori';
import {
  drawImageToCanvas,
  renderToCanvas,
  renderToSVG,
  scaleSvgDimensions,
  svgToImage,
} from './satoriRenderer';

const mockedSatori = vi.mocked(satori);

const STUB_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg"><text>hello</text></svg>';

const SATORI_STYLE_SVG =
  '<svg width="640" height="480" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg"><text>hello</text></svg>';

const makeFonts = () => [
  {
    name: 'TestFont',
    data: new ArrayBuffer(8),
    weight: 400 as const,
    style: 'normal' as const,
  },
];

describe('satoriRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    mockedSatori.mockResolvedValue(STUB_SVG);
  });

  describe('renderToSVG', () => {
    it('calls satori with the provided element and options', async () => {
      const element = null;
      const fonts = makeFonts();
      const result = await renderToSVG(element, {
        width: 100,
        height: 50,
        fonts,
      });

      expect(mockedSatori).toHaveBeenCalledOnce();
      expect(mockedSatori).toHaveBeenCalledWith(null, {
        width: 100,
        height: 50,
        fonts,
      });
      expect(result).toBe(STUB_SVG);
    });

    it('propagates errors from satori', async () => {
      mockedSatori.mockRejectedValueOnce(new Error('satori failed'));
      await expect(
        renderToSVG('el', { width: 1, height: 1, fonts: makeFonts() }),
      ).rejects.toThrow('satori failed');
    });
  });

  describe('svgToImage', () => {
    it('creates an Image, sets blob URL, decodes, and revokes URL', async () => {
      const fakeUrl = 'blob:fake-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(fakeUrl);
      const revokeObjectURLSpy = vi
        .spyOn(URL, 'revokeObjectURL')
        .mockReturnValue(undefined);
      vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(
        undefined,
      );

      const img = await svgToImage(STUB_SVG);

      expect(img.src).toBe(fakeUrl);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(fakeUrl);
    });

    it('revokes the URL even when decode() rejects', async () => {
      const fakeUrl = 'blob:fake-url-2';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(fakeUrl);
      const revokeObjectURLSpy = vi
        .spyOn(URL, 'revokeObjectURL')
        .mockReturnValue(undefined);
      vi.spyOn(HTMLImageElement.prototype, 'decode').mockRejectedValue(
        new Error('decode failed'),
      );

      await expect(svgToImage(STUB_SVG)).rejects.toThrow('decode failed');
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(fakeUrl);
    });
  });

  describe('drawImageToCanvas', () => {
    it('draws the image onto the canvas 2D context', () => {
      const drawImageFn = vi.fn();
      const fakeCtx = { drawImage: drawImageFn };
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      vi.spyOn(canvas, 'getContext').mockReturnValue(
        fakeCtx as unknown as CanvasRenderingContext2D,
      );

      const img = new Image();
      drawImageToCanvas(img, canvas);

      expect(drawImageFn).toHaveBeenCalledWith(img, 0, 0, 200, 100);
    });

    it('throws when getContext returns null', () => {
      const canvas = document.createElement('canvas');
      vi.spyOn(canvas, 'getContext').mockReturnValue(null);

      expect(() => drawImageToCanvas(new Image(), canvas)).toThrow(
        'Failed to get 2D context from canvas',
      );
    });
  });

  describe('scaleSvgDimensions', () => {
    it('returns svg unchanged when scale is 1', () => {
      expect(scaleSvgDimensions(SATORI_STYLE_SVG, 1)).toBe(SATORI_STYLE_SVG);
    });

    it('scales width and height attributes by the given factor', () => {
      const result = scaleSvgDimensions(SATORI_STYLE_SVG, 2);
      expect(result).toContain('width="1280"');
      expect(result).toContain('height="960"');
      expect(result).toContain('viewBox="0 0 640 480"');
    });

    it('handles non-integer scale factors with rounding', () => {
      const result = scaleSvgDimensions(SATORI_STYLE_SVG, 1.5);
      expect(result).toContain('width="960"');
      expect(result).toContain('height="720"');
      expect(result).toContain('viewBox="0 0 640 480"');
    });

    it('returns svg unchanged when no width/height attributes exist', () => {
      expect(scaleSvgDimensions(STUB_SVG, 2)).toBe(STUB_SVG);
    });
  });

  describe('renderToCanvas', () => {
    it('orchestrates the full pipeline at dpr=1', async () => {
      const fakeUrl = 'blob:pipeline-test';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(fakeUrl);
      vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
      vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(
        undefined,
      );

      const drawImageFn = vi.fn();
      const canvas = document.createElement('canvas');
      vi.spyOn(canvas, 'getContext').mockReturnValue({
        drawImage: drawImageFn,
      } as unknown as CanvasRenderingContext2D);

      await renderToCanvas({
        element: null,
        canvas,
        width: 300,
        height: 150,
        fonts: makeFonts(),
        devicePixelRatio: 1,
      });

      expect(mockedSatori).toHaveBeenCalledOnce();
      expect(canvas.width).toBe(300);
      expect(canvas.height).toBe(150);
      expect(drawImageFn).toHaveBeenCalledOnce();
    });

    it('scales canvas dimensions by dpr=2', async () => {
      mockedSatori.mockResolvedValue(SATORI_STYLE_SVG);
      const fakeUrl = 'blob:dpr-test';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(fakeUrl);
      vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
      vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(
        undefined,
      );

      const drawImageFn = vi.fn();
      const canvas = document.createElement('canvas');
      vi.spyOn(canvas, 'getContext').mockReturnValue({
        drawImage: drawImageFn,
      } as unknown as CanvasRenderingContext2D);

      await renderToCanvas({
        element: null,
        canvas,
        width: 300,
        height: 150,
        fonts: makeFonts(),
        devicePixelRatio: 2,
      });

      expect(mockedSatori).toHaveBeenCalledWith(null, {
        width: 300,
        height: 150,
        fonts: makeFonts(),
      });
      expect(canvas.width).toBe(600);
      expect(canvas.height).toBe(300);
      expect(drawImageFn).toHaveBeenCalledOnce();
    });
  });
});
