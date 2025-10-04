// Polyfill for browser environments where process is not defined
// This is needed because satori uses process internally
if (typeof (globalThis as any).process === 'undefined') {
  (globalThis as any).process = {
    env: {},
  };
}
