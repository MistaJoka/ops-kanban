import path from 'node:path';

import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    setupFiles: ['tests/helpers/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
