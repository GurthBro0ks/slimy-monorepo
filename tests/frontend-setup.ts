/**
 * Frontend test setup file
 * Loaded before frontend component tests
 */

import '@testing-library/jest-dom';

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Suppress console errors in tests (optional)
// global.console.error = (...args: any[]) => {
//   // Filter out known React errors if needed
//   if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
//     return;
//   }
//   console.warn(...args);
// };
