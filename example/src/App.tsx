import { type Font, type UnresolvedFont, usePinP } from '@uzimaru0000/use-pip';
import { useCallback, useEffect, useRef, useState } from 'react';

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

function Preview({
  active,
  width,
  height,
  children,
}: {
  active: boolean;
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: `${width}px`,
        aspectRatio: `${width} / ${height}`,
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px',
        position: 'relative',
      }}
    >
      {active ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e293b',
            color: '#64748b',
            fontSize: '14px',
            border: '2px dashed #334155',
            borderRadius: '8px',
            boxSizing: 'border-box',
          }}
        >
          Showing in PiP
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function BasicDemo() {
  const [count, setCount] = useState(0);

  const pipContent = (
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
      <div style={{ display: 'flex', fontSize: '20px', color: '#94a3b8' }}>
        Picture-in-Picture Demo
      </div>
      <div style={{ display: 'flex', fontSize: '64px', fontWeight: 'bold' }}>
        {count}
      </div>
    </div>
  );

  const { toggle, active, isSupported } = usePinP({
    element: pipContent,
    width: 640,
    height: 360,
    fonts: [{ name: 'Noto Sans JP', weight: 400 }],
    fontResolver: loadGoogleFont,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(id);
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
      <Preview active={active} width={640} height={360}>
        {pipContent}
      </Preview>
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

  const pipContent = (
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
  );

  const { toggle, active, isSupported } = usePinP({
    element: pipContent,
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
      <Preview active={active} width={640} height={360}>
        {pipContent}
      </Preview>
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

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

function PomodoroDemo() {
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'focus' | 'break'>('focus');

  const totalSeconds = phase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
  const elapsed = totalSeconds - remainingSeconds;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const phaseColor = phase === 'focus' ? '#f97316' : '#14b8a6';
  const phaseLabel = phase === 'focus' ? 'FOCUS' : 'BREAK';

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const pipContent = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: 'white',
        fontFamily: 'Noto Sans JP',
        gap: '12px',
      }}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: phaseColor,
          letterSpacing: '4px',
        }}
      >
        {phaseLabel}
      </div>
      <div style={{ fontSize: '72px', fontWeight: 700 }}>{display}</div>
      <div
        style={{
          width: '320px',
          height: '8px',
          backgroundColor: '#1e293b',
          borderRadius: '4px',
          display: 'flex',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: phaseColor,
            borderRadius: '4px',
          }}
        />
      </div>
    </div>
  );

  const { toggle, active, isSupported } = usePinP({
    element: pipContent,
    width: 400,
    height: 240,
    fonts: [{ name: 'Noto Sans JP', weight: 700 }],
    fontResolver: loadGoogleFont,
    onLeave: handlePause,
  });

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const switchPhase = (newPhase: 'focus' | 'break') => {
    setPhase(newPhase);
    setIsRunning(false);
    setRemainingSeconds(newPhase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  return (
    <div
      style={{
        padding: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
      }}
    >
      <h2 style={{ margin: '0 0 8px' }}>Pomodoro Timer</h2>
      <p style={{ margin: '0 0 16px', color: '#64748b' }}>
        A focus timer that keeps running in a PiP window.
      </p>
      <Preview active={active} width={400} height={240}>
        {pipContent}
      </Preview>
      {!isSupported && (
        <p style={{ color: '#ef4444' }}>
          Picture-in-Picture is not supported in your browser.
        </p>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => (isRunning ? setIsRunning(false) : setIsRunning(true))}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: isRunning ? '#d97706' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => switchPhase('focus')}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: phase === 'focus' ? '#f97316' : '#334155',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          Focus
        </button>
        <button
          type="button"
          onClick={() => switchPhase('break')}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: phase === 'break' ? '#14b8a6' : '#334155',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          Break
        </button>
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
    </div>
  );
}

const LIFE_COLS = 30;
const LIFE_ROWS = 18;
const CELL_SIZE = 14;

function createRandomGrid(): boolean[][] {
  return Array.from({ length: LIFE_ROWS }, () =>
    Array.from({ length: LIFE_COLS }, () => Math.random() > 0.7),
  );
}

function nextGeneration(grid: boolean[][]): boolean[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const next = grid.map((row) => [...row]);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let neighbors = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = (r + dr + rows) % rows;
          const nc = (c + dc + cols) % cols;
          if (grid[nr][nc]) neighbors++;
        }
      }
      if (grid[r][c]) {
        next[r][c] = neighbors === 2 || neighbors === 3;
      } else {
        next[r][c] = neighbors === 3;
      }
    }
  }
  return next;
}

function GameOfLifeDemo() {
  const [grid, setGrid] = useState(createRandomGrid);
  const [running, setRunning] = useState(true);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setGrid((prev) => nextGeneration(prev));
      setGeneration((g) => g + 1);
    }, 300);
    return () => clearInterval(id);
  }, [running]);

  const pipContent = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a1a',
        fontFamily: 'Noto Sans JP',
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '12px',
          color: '#4ade80',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex' }}>Game of Life</div>
        <div style={{ display: 'flex', color: '#334155' }}>
          Gen {generation}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {grid.map((row, r) => (
          <div key={`r${r}`} style={{ display: 'flex', gap: '1px' }}>
            {row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  backgroundColor: cell ? '#22c55e' : '#1a1a2e',
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const { toggle, active, isSupported } = usePinP({
    element: pipContent,
    width: 480,
    height: 320,
    fonts: [{ name: 'Noto Sans JP', weight: 400 }],
    fontResolver: loadGoogleFont,
  });

  return (
    <div
      style={{
        padding: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
      }}
    >
      <h2 style={{ margin: '0 0 8px' }}>Game of Life</h2>
      <p style={{ margin: '0 0 16px', color: '#64748b' }}>
        Conway's Game of Life running in a PiP window.
      </p>
      <Preview active={active} width={480} height={320}>
        {pipContent}
      </Preview>
      {!isSupported && (
        <p style={{ color: '#ef4444' }}>
          Picture-in-Picture is not supported in your browser.
        </p>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: running ? '#d97706' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          {running ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={() => {
            setGrid(createRandomGrid());
            setGeneration(0);
          }}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          Randomize
        </button>
        <button
          type="button"
          onClick={() => {
            if (!running) {
              setGrid((prev) => nextGeneration(prev));
              setGeneration((g) => g + 1);
            }
          }}
          disabled={running}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
            backgroundColor: running ? '#334155' : '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          Step
        </button>
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
    </div>
  );
}

interface Fish {
  id: number;
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  color: string;
  size: number;
}

const AQUARIUM_W = 480;
const AQUARIUM_H = 300;
const FISH_COLORS = [
  '#f97316',
  '#3b82f6',
  '#ec4899',
  '#22c55e',
  '#a855f7',
  '#eab308',
];

function createFish(id: number): Fish {
  return {
    id,
    x: Math.random() * (AQUARIUM_W - 80) + 20,
    y: Math.random() * (AQUARIUM_H - 60) + 30,
    speed: 1 + Math.random() * 2,
    direction: Math.random() > 0.5 ? 1 : -1,
    color: FISH_COLORS[id % FISH_COLORS.length],
    size: 18 + Math.floor(Math.random() * 14),
  };
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
}

function AquariumDemo() {
  const [fishes, setFishes] = useState<Fish[]>(() =>
    Array.from({ length: 7 }, (_, i) => createFish(i)),
  );
  const nextId = useRef(7);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleId = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFishes((prev) =>
        prev.map((fish) => {
          let dir = fish.direction;
          let nx = fish.x + fish.speed * dir;
          if (nx > AQUARIUM_W - 50) dir = -1;
          if (nx < 10) dir = 1;
          nx = fish.x + fish.speed * dir;
          const ny = Math.min(
            AQUARIUM_H - 40,
            Math.max(25, fish.y + (Math.random() - 0.5) * 3),
          );
          return { ...fish, x: nx, y: ny, direction: dir };
        }),
      );
      setBubbles((prev) => {
        const updated = prev
          .map((b) => ({ ...b, y: b.y - 1.5 - Math.random() }))
          .filter((b) => b.y > -10);
        if (Math.random() > 0.5) {
          updated.push({
            id: bubbleId.current++,
            x: 20 + Math.random() * (AQUARIUM_W - 40),
            y: AQUARIUM_H - 20,
            size: 4 + Math.random() * 6,
          });
        }
        return updated.slice(-15);
      });
    }, 150);
    return () => clearInterval(id);
  }, []);

  const pipContent = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#0c4a6e',
      }}
    >
      {/* Sandy bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          height: '30px',
          backgroundColor: '#92704f',
          display: 'flex',
        }}
      />
      {/* Seaweed */}
      {[60, 180, 350].map((sx) => (
        <div
          key={sx}
          style={{
            position: 'absolute',
            bottom: '30px',
            left: `${sx}px`,
            width: '8px',
            height: '50px',
            backgroundColor: '#16a34a',
            borderRadius: '4px 4px 0 0',
            display: 'flex',
          }}
        />
      ))}
      {[90, 210, 380].map((sx) => (
        <div
          key={sx}
          style={{
            position: 'absolute',
            bottom: '30px',
            left: `${sx}px`,
            width: '6px',
            height: '35px',
            backgroundColor: '#15803d',
            borderRadius: '3px 3px 0 0',
            display: 'flex',
          }}
        />
      ))}
      {/* Fish */}
      {fishes.map((fish) => (
        <div
          key={fish.id}
          style={{
            position: 'absolute',
            left: `${Math.round(fish.x)}px`,
            top: `${Math.round(fish.y)}px`,
            fontSize: `${fish.size}px`,
            color: fish.color,
            fontFamily: 'Noto Sans JP',
            fontWeight: 700,
            display: 'flex',
          }}
        >
          {fish.direction === 1 ? '><>' : '<><'}
        </div>
      ))}
      {/* Bubbles */}
      {bubbles.map((b) => (
        <div
          key={b.id}
          style={{
            position: 'absolute',
            left: `${Math.round(b.x)}px`,
            top: `${Math.round(b.y)}px`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.4)',
            display: 'flex',
          }}
        />
      ))}
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          left: '12px',
          fontSize: '12px',
          color: '#7dd3fc',
          fontFamily: 'Noto Sans JP',
          display: 'flex',
        }}
      >
        Aquarium ({fishes.length} fish)
      </div>
    </div>
  );

  const { toggle, active, isSupported } = usePinP({
    element: pipContent,
    width: AQUARIUM_W,
    height: AQUARIUM_H,
    fonts: [{ name: 'Noto Sans JP', weight: 700 }],
    fontResolver: loadGoogleFont,
  });

  return (
    <div
      style={{
        padding: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
      }}
    >
      <h2 style={{ margin: '0 0 8px' }}>Aquarium</h2>
      <p style={{ margin: '0 0 16px', color: '#64748b' }}>
        Virtual fish swimming in a PiP window.
      </p>
      <Preview active={active} width={AQUARIUM_W} height={AQUARIUM_H}>
        {pipContent}
      </Preview>
      {!isSupported && (
        <p style={{ color: '#ef4444' }}>
          Picture-in-Picture is not supported in your browser.
        </p>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => {
            setFishes((prev) => [...prev, createFish(nextId.current++)]);
          }}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          Add Fish
        </button>
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
        <PomodoroDemo />
        <GameOfLifeDemo />
        <AquariumDemo />
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
