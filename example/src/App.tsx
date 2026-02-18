import { type Font, type UnresolvedFont, usePinP } from '@uzimaru0000/use-pip';
import { useEffect, useState } from 'react';

const loadGoogleFont = async (opts: UnresolvedFont): Promise<Font> => {
  const { name, weight } = opts;
  const packageName = name.toLowerCase().replace(/\s+/g, '-');
  const subset = packageName.includes('jp') ? 'japanese' : 'latin';
  const weightStr = weight || 400;
  const fontUrl = `https://cdn.jsdelivr.net/fontsource/fonts/${packageName}@latest/${subset}-${weightStr}-normal.ttf`;

  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(`Failed to fetch font: ${fontResponse.statusText}`);
  }

  return { ...opts, data: await fontResponse.arrayBuffer() };
};

function BasicDemo() {
  const [count, setCount] = useState(0);

  const { toggle, active, isSupported } = usePinP({
    element: (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: 'white',
          fontFamily: 'Noto Sans JP',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '20px', color: '#94a3b8' }}>
          Picture-in-Picture Demo
        </div>
        <div style={{ fontSize: '64px', fontWeight: 'bold' }}>{count}</div>
      </div>
    ),
    width: 640,
    height: 360,
    fonts: [{ name: 'Noto Sans JP', weight: 400 }],
    fontResolver: loadGoogleFont,
  });

  useEffect(() => {
    let id: number;
    const loop = () => {
      setCount((c) => c + 1);
      id = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      style={{
        padding: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
      }}
    >
      <h2 style={{ margin: '0 0 8px' }}>Basic</h2>
      <p style={{ margin: '0 0 16px', color: '#64748b' }}>
        JSX to PiP rendering with a live counter.
      </p>
      {!isSupported && (
        <p style={{ color: '#ef4444' }}>
          Picture-in-Picture is not supported in your browser.
        </p>
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={!isSupported}
        style={{
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isSupported ? 'pointer' : 'not-allowed',
          backgroundColor: active ? '#dc2626' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
        }}
      >
        {active ? 'Close PiP' : 'Open PiP'}
      </button>
    </div>
  );
}

const BAR_COUNT = 32;

function AudioDemo() {
  const [audioDestination, setAudioDestination] =
    useState<MediaStreamAudioDestinationNode>();
  const [audioContext, setAudioContext] = useState<AudioContext>();
  const [analyser, setAnalyser] = useState<AnalyserNode>();
  const [waveform, setWaveform] = useState<number[]>(
    new Array(BAR_COUNT).fill(0),
  );

  useEffect(() => {
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.fftSize);
    let id: ReturnType<typeof setTimeout>;
    const update = () => {
      analyser.getByteTimeDomainData(dataArray);
      const step = Math.floor(dataArray.length / BAR_COUNT);
      const bars = Array.from({ length: BAR_COUNT }, (_, i) =>
        Math.min(1, (Math.abs(dataArray[i * step] - 128) / 128) * 4),
      );
      setWaveform(bars);
      id = setTimeout(update, 100);
    };
    update();
    return () => clearTimeout(id);
  }, [analyser]);

  const { toggle, active, isSupported } = usePinP({
    element: (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e1b4b',
          color: 'white',
          fontFamily: 'Noto Sans JP',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div style={{ fontSize: '20px', color: '#a5b4fc' }}>PiP with Audio</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            height: '120px',
          }}
        >
          {waveform.map((v, i) => (
            <div
              key={i}
              style={{
                width: '14px',
                height: `${Math.max(4, v * 120)}px`,
                backgroundColor: '#818cf8',
                borderRadius: '4px',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '14px', color: '#6366f1' }}>
          {analyser ? '440Hz sine wave' : 'Click to start'}
        </div>
      </div>
    ),
    width: 640,
    height: 360,
    fonts: [{ name: 'Noto Sans JP', weight: 400 }],
    fontResolver: loadGoogleFont,
    audioDestination,
  });

  useEffect(() => {
    return () => {
      audioContext?.close();
    };
  }, [audioContext]);

  const handleToggle = async () => {
    if (!audioContext) {
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      const oscillator = ctx.createOscillator();
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      const gain = ctx.createGain();
      gain.gain.value = 0.1;
      oscillator.connect(gain);
      gain.connect(analyserNode);
      analyserNode.connect(dest);
      oscillator.start();
      setAudioContext(ctx);
      setAudioDestination(dest);
      setAnalyser(analyserNode);
    }
    await toggle();
  };

  return (
    <div
      style={{
        padding: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
      }}
    >
      <h2 style={{ margin: '0 0 8px' }}>With Audio</h2>
      <p style={{ margin: '0 0 16px', color: '#64748b' }}>
        PiP window with audio output (440Hz sine wave).
      </p>
      {!isSupported && (
        <p style={{ color: '#ef4444' }}>
          Picture-in-Picture is not supported in your browser.
        </p>
      )}
      <button
        type="button"
        onClick={handleToggle}
        disabled={!isSupported}
        style={{
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isSupported ? 'pointer' : 'not-allowed',
          backgroundColor: active ? '#dc2626' : '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
        }}
      >
        {active ? 'Close PiP' : 'Open PiP with Audio'}
      </button>
    </div>
  );
}

export function App() {
  return (
    <div
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h1 style={{ margin: '0 0 8px', fontSize: '28px' }}>
        @uzimaru0000/use-pip
      </h1>
      <p style={{ margin: '0 0 32px', color: '#64748b' }}>
        React Hook for Picture-in-Picture with JSX rendering via Satori
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <BasicDemo />
        <AudioDemo />
      </div>
      <p
        style={{
          marginTop: '48px',
          fontSize: '14px',
          color: '#94a3b8',
          textAlign: 'center',
        }}
      >
        <a
          href="https://github.com/uzimaru0000/use-pip"
          style={{ color: '#2563eb' }}
        >
          GitHub
        </a>
        {' · '}
        <a
          href="https://www.npmjs.com/package/@uzimaru0000/use-pip"
          style={{ color: '#2563eb' }}
        >
          npm
        </a>
      </p>
    </div>
  );
}
