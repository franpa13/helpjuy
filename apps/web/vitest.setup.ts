import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// jsdom no trae IntersectionObserver ni matchMedia (los usa Motion para whileInView y reduced motion).
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??= IO as unknown as typeof IntersectionObserver;
// Radix lo usa para medir los controles dentro de formularios (casillas, radios).
globalThis.ResizeObserver ??= IO as unknown as typeof ResizeObserver;
window.matchMedia ??= ((q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

// next/navigation no existe fuera de Next: lo simulamos para los componentes cliente.
export const routerPush = vi.fn();
export const navState = { pathname: '/' };
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush, replace: routerPush, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => navState.pathname,
}));
