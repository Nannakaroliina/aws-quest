import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

/**
 * AWS QUEST ships as a pile of static files — no server, no runtime data.
 * adapter-static prerenders every route to HTML/JS/CSS you can serve from any
 * bucket or `python3 -m http.server`. The game itself is client-only
 * (localStorage, WebAudio), so SSR is disabled in src/routes/+layout.ts.
 */
export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({
        pages: 'build',
        assets: 'build',
        fallback: undefined,
        precompress: false,
        strict: true,
      }),
    }),
  ],
  test: {
    // Pure-logic suites (schema, progression) need no DOM; the mini-game
    // builder suites drive a detached element, so default everything to jsdom.
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});
