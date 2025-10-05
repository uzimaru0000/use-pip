# @uzimaru0000/use-pip

React Hook for Picture-in-Picture with JSX rendering via [Satori](https://github.com/vercel/satori).

## Features

- 🎨 Render React components in Picture-in-Picture window
- 🔤 Font caching mechanism for better performance
- 📦 TypeScript support
- 🎯 Simple and intuitive API

## Installation

```bash
npm install @uzimaru0000/use-pip
```

## Usage

### Basic Example

```tsx
import { usePinP } from '@uzimaru0000/use-pip';
import type { SatoriOptions } from 'satori';

// Define a font resolver
const fontResolver = async (): Promise<SatoriOptions['fonts']> => {
  const response = await fetch('path/to/font.ttf');
  const data = await response.arrayBuffer();

  return [
    {
      name: 'Arial',
      data,
      weight: 400,
      style: 'normal',
    },
  ];
};

function App() {
  const { toggle, active, isSupported } = usePinP({
    element: (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          color: '#fff',
          fontSize: '24px',
        }}
      >
        Hello Picture-in-Picture!
      </div>
    ),
    width: 640,
    height: 480,
    fontResolver,
    fontCacheKey: 'default',
  });

  if (!isSupported) {
    return <div>Picture-in-Picture is not supported</div>;
  }

  return (
    <button onClick={toggle}>
      {active ? 'Close PiP' : 'Open PiP'}
    </button>
  );
}
```

## API Reference

### `usePinP(options)`

#### Options

- `element` (required): `ReactNode` - The React element to render in Picture-in-Picture
- `width`: `number` - Width of the PiP window (default: `640`)
- `height`: `number` - Height of the PiP window (default: `480`)
- `fonts`: `SatoriOptions['fonts']` - Fonts to use for rendering (optional if using `fontResolver`)
- `fontResolver`: `FontResolver` - Function to load fonts asynchronously
- `fontCacheKey`: `string` - Cache key for fonts (used with `fontResolver`)
- `onEnter`: `() => void` - Callback when entering PiP mode
- `onLeave`: `() => void` - Callback when leaving PiP mode

#### Return Value

- `isSupported`: `boolean` - Whether Picture-in-Picture is supported
- `active`: `boolean` - Whether PiP is currently active
- `toggle`: `() => Promise<void>` - Toggle PiP mode
- `enter`: `() => Promise<void>` - Enter PiP mode
- `exit`: `() => Promise<void>` - Exit PiP mode

## Font Management

### Using Font Cache

```tsx
import { setCachedFonts, getCachedFonts, clearFontCache } from '@uzimaru0000/use-pip';

// Set fonts to cache
setCachedFonts('my-fonts', fonts);

// Get fonts from cache
const cachedFonts = getCachedFonts('my-fonts');

// Clear specific cache
clearFontCache('my-fonts');

// Clear all caches
clearFontCache();
```

### Font Resolver Example

```tsx
import type { SatoriOptions } from 'satori';

const loadGoogleFont = async ({
  family,
  weight = 400,
}: {
  family: string;
  weight?: number;
}): Promise<SatoriOptions['fonts']> => {
  // Load font from CDN (must be TTF/OTF format, WOFF2 is not supported)
  const packageName = family.toLowerCase().replace(/\s+/g, '-');
  const fontUrl = `https://cdn.jsdelivr.net/fontsource/fonts/${packageName}@latest/latin-${weight}-normal.ttf`;

  const response = await fetch(fontUrl);
  const data = await response.arrayBuffer();

  return [
    {
      name: family,
      data,
      weight,
      style: 'normal',
    },
  ];
};

const { toggle, active } = usePinP({
  element: <div>Hello</div>,
  fontResolver: () => loadGoogleFont({ family: 'Noto Sans' }),
  fontCacheKey: 'noto-sans',
});
```

## Important Notes

- **Font Format**: Satori only supports TTF and OTF font formats. WOFF2 is not supported.
- **Browser Support**: Picture-in-Picture API is required. Check `isSupported` before using.
- **Polyfill**: This library automatically applies a `process` polyfill for browser environments (required by Satori).

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run type-check

# Storybook
npm run storybook
```

## License

MIT
