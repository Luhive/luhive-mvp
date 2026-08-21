import { defineConfig } from 'vitest/config';

// Plain Node environment: the current unit tests (DTO mapping, cursor) are pure
// and need no Workers runtime. A Workers-pool config can be added later for
// runtime/DB-backed integration tests.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
});
