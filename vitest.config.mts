import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/core/**/*.test.ts', 'src/i18n/**/*.test.ts', 'src/lib/**/*.test.ts', 'src/features/**/*.test.ts'],
    environment: 'node',
  },
});
