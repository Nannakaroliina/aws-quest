import { dev } from '$app/environment';
import { validateContent } from '$lib/content';

// AWS QUEST is a client-only game (localStorage, WebAudio). Prerender the
// shell to static HTML; do not SSR.
export const prerender = true;
export const ssr = false;

// Surface content-authoring mistakes immediately during `npm run dev`.
if (dev) {
  const problems = validateContent();
  if (problems.length) {
    console.error(
      `[content] ${problems.length} problem(s):\n` + problems.map((p) => `  - ${p}`).join('\n'),
    );
  }
}
