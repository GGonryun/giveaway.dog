import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, vi } from 'vitest';
import { expectNoPendingTransition } from './transitions';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

globalThis.ResizeObserver = ResizeObserverStub;
globalThis.IntersectionObserver =
  IntersectionObserverStub as unknown as typeof IntersectionObserver;

Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn(() => false);
Element.prototype.releasePointerCapture = vi.fn();

afterEach(() => {
  cleanup();
});

afterAll(expectNoPendingTransition);
