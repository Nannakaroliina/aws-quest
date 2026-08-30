import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * AWS QUEST ships as a pile of static files — no server, no runtime data.
 * adapter-static prerenders every route to HTML/JS/CSS you can serve from any
 * bucket or `python3 -m http.server`. The game itself is client-only
 * (localStorage, WebAudio), so SSR is disabled in src/routes/+layout.ts.
 *
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
  },
};

export default config;
