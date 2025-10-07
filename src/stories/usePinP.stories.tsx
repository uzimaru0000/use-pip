import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';
import { type Font, type UnresolvedFont, usePinP } from '..';

// Font resolver that loads Google Fonts from fontsource CDN (TTF format)
// Google Fonts API only returns WOFF2 which Satori doesn't support,
// so we use fontsource which provides TTF files
const loadGoogleFont = async (opts: UnresolvedFont): Promise<Font> => {
  const { name, weight } = opts;
  // Convert font family name to fontsource package name
  // e.g., "Noto Sans JP" -> "noto-sans-jp"
  const packageName = name.toLowerCase().replace(/\s+/g, '-');

  // Determine subset and weight string
  const subset = packageName.includes('jp') ? 'japanese' : 'latin';
  const weightStr = weight || 400;

  // Construct fontsource CDN URL for TTF file
  const fontUrl = `https://cdn.jsdelivr.net/fontsource/fonts/${packageName}@latest/${subset}-${weightStr}-normal.ttf`;

  const fontResponse = await fetch(fontUrl);

  if (!fontResponse.ok) {
    throw new Error(
      `Failed to fetch font: ${fontResponse.statusText}. URL: ${fontUrl}`,
    );
  }

  const data = await fontResponse.arrayBuffer();

  console.log('Loaded font:', fontUrl);

  return {
    ...opts,
    data,
  };
};

// Component wrapper for the hook
const PiPExample = ({ debug }: { debug: boolean }) => {
  const [timer, setTimer] = useState(0);

  const { toggle, active, isSupported } = usePinP({
    element: (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: 'white',
          fontSize: '24px',
          fontFamily: 'sans-serif',
        }}
      >
        Picture-in-Picture Demo {timer}
      </div>
    ),
    width: 947,
    height: 521,
    fonts: [
      {
        name: 'Noto Sans JP',
        weight: 400,
      },
    ],
    fontResolver: loadGoogleFont,
    debug,
  });

  useEffect(() => {
    let frameId: number | null = null;
    const loop = () => {
      setTimer((prev) => prev + 1);
      frameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>usePinP Hook Demo</h1>
      <p>
        {isSupported
          ? 'Picture-in-Picture is supported in your browser'
          : 'Picture-in-Picture is not supported in your browser'}
      </p>
      <button
        type="button"
        onClick={toggle}
        disabled={!isSupported}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: isSupported ? 'pointer' : 'not-allowed',
          backgroundColor: active ? '#dc2626' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {active ? 'Close PiP' : 'Open PiP'}
      </button>
      <p style={{ marginTop: '10px', color: '#666' }}>
        Status: {active ? 'Active' : 'Inactive'}
      </p>
    </div>
  );
};

const meta = {
  title: 'Hooks/usePinP',
  component: PiPExample,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PiPExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    debug: false,
  },
};

// Component with audio support
const PiPWithAudio = ({ debug }: { debug: boolean }) => {
  const [timer, setTimer] = useState(0);
  const [audioDestination, setAudioDestination] =
    useState<MediaStreamAudioDestinationNode>();
  const [audioContext, setAudioContext] = useState<AudioContext>();

  const { toggle, active, isSupported } = usePinP({
    element: (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: 'white',
          fontSize: '24px',
          fontFamily: 'sans-serif',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex' }}>Picture-in-Picture with Audio</div>
        <div style={{ display: 'flex', fontSize: '48px', fontWeight: 'bold' }}>
          {timer}
        </div>
      </div>
    ),
    width: 947,
    height: 521,
    fonts: [
      {
        name: 'Noto Sans JP',
        weight: 400,
      },
    ],
    fontResolver: loadGoogleFont,
    audioDestination,
    debug,
  });

  useEffect(() => {
    let frameId: number | null = null;
    const loop = () => {
      setTimer((prev) => prev + 1);
      frameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const handleToggleWithAudio = async () => {
    // Create audio context and oscillator on user action
    if (!audioContext) {
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();

      // Create a simple beep sound (440Hz A note)
      const oscillator = ctx.createOscillator();
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';

      // Add gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.1; // Low volume

      oscillator.connect(gainNode);
      gainNode.connect(dest);

      oscillator.start();

      setAudioContext(ctx);
      setAudioDestination(dest);
    }

    await toggle();
  };

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>usePinP Hook Demo with Audio</h1>
      <p>
        {isSupported
          ? 'Picture-in-Picture is supported in your browser'
          : 'Picture-in-Picture is not supported in your browser'}
      </p>
      <button
        type="button"
        onClick={handleToggleWithAudio}
        disabled={!isSupported}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: isSupported ? 'pointer' : 'not-allowed',
          backgroundColor: active ? '#dc2626' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {active ? 'Close PiP' : 'Open PiP with Audio'}
      </button>
      <p style={{ marginTop: '10px', color: '#666' }}>
        Status: {active ? 'Active' : 'Inactive'} | Audio:{' '}
        {audioContext ? 'Enabled (440Hz beep)' : 'Not initialized'}
      </p>
    </div>
  );
};

export const WithAudio: Story = {
  render: (args) => <PiPWithAudio debug={args.debug} />,
  args: {
    debug: false,
  },
};
