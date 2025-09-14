// Ensure deterministic dates across environments
process.env.TZ = 'UTC';

import '@testing-library/jest-dom';

// matchMedia polyfill for components/hooks that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
}); 