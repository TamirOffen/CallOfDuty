import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
      // Enable coverage collection
      coverage: {
        provider: 'v8', 
        reporter: ['text'] 
      },
    },
  });
