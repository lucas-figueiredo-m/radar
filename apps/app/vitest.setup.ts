import '@testing-library/jest-dom/vitest';

const noopUnsubscribe = () => {};
const noopBridge = {
  invoke: () => Promise.resolve(undefined),
  send: () => undefined,
  on: () => noopUnsubscribe,
};

Object.defineProperty(window, 'radar', {
  value: noopBridge,
  writable: true,
  configurable: true,
});
