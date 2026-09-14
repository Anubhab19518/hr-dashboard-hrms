import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock server-only so server services can run within test runners
vi.mock('server-only', () => ({}));

// Automatically clean up React DOM after each test
afterEach(() => {
  cleanup();
});
