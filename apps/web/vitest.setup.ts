import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// next/navigation no existe fuera de Next: lo simulamos para los componentes cliente.
export const routerPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush, replace: routerPush, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
