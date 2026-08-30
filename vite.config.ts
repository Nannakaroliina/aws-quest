import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    // Pure-logic suites (schema, progression) need no DOM; the mini-game
    // builder suites drive a detached element, so default everything to jsdom.
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});
