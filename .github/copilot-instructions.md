# Copilot instructions — AWS QUEST

Context for Copilot code review, Copilot Chat, and the Copilot coding agent.

## What this project is

A retro 8-bit arcade game that teaches AWS concepts, built with **SvelteKit +
TypeScript** and prerendered to a **static site** (`@sveltejs/adapter-static`).
No backend, no runtime data — progress is saved to `localStorage`. `npm run
build` emits `./build` as plain static files.

The migration from the old zero-build `<script>` version is a **strangler**:
`src/lib/game/engine.ts` and `src/lib/minigames/*` are imperative DOM code
lifted verbatim and carried behind `// @ts-nocheck`; they are being rewritten as
Svelte components screen by screen, and their CSS moves into scoped `<style>`
blocks as that happens. New code is ordinary strict TypeScript / Svelte 5.

## Layout

| Path                             | Role                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| `src/app.html` / `src/app.css`   | SvelteKit shell; global retro CSS (palette, CRT, screens)          |
| `src/routes/+layout.svelte/.ts`  | CRT overlay + `<audio id="bgm">`; `prerender`, `ssr=false`         |
| `src/lib/components/Game.svelte` | screen-shell markup; mounts the engine in `onMount`                |
| `src/lib/game/engine.ts`         | state machine, screens, save, input router (`createGame`)          |
| `src/lib/game/save.ts`           | `SaveState` + localStorage load/persist                            |
| `src/lib/game/progression.ts`    | XP maths, unlock rules, `nextConcept` (pure)                       |
| `src/lib/content/`               | typed content: `types.ts`, `worlds.ts`, `concepts/**`, `schema.ts` |
| `src/lib/builds/index.ts`        | per-concept "provision it yourself" tasks (`BUILDS`)               |
| `src/lib/minigames/`             | sims + `make-quiz/order/build` builders + `registry.ts`            |

Modules communicate through ES imports (`$lib/...`), not `window` globals.
Import content from `$lib/content`, sims from `$lib/minigames`.

## Conventions

- TypeScript strict. 2-space indent, single quotes, semicolons. Prettier +
  ESLint are the source of truth: `npm run check` must pass, `npm run fix`
  auto-applies both.
- `@ts-nocheck` is allowed **only** in `src/lib/game/engine.ts` and
  `src/lib/minigames/**` (the transitional imperative code). Do not add it
  elsewhere.
- Escape any content string interpolated into `innerHTML` with the local `esc()`
  helper (`src/lib/minigames/helpers.ts` / the engine's own). That is the app's
  XSS boundary.
- Every interaction works with **both keyboard and pointer**. Sims/stages return
  `{ onKey, destroy }` and clear their own timers in `destroy()`.
- Respect `prefers-reduced-motion` (already honored in `app.css`).
- Keep the aesthetic: `Press Start 2P`, the existing CSS variables, chiptune SFX
  via `$lib/audio/sound`. No new fonts or asset hosts.

## Adding content

- **Concept:** new `src/lib/content/concepts/<world>/<id>.ts` exporting a
  `Concept`; import it in `concepts/index.ts`; add its id to `WORLD_CONCEPTS` in
  `worlds.ts`.
- **Build task:** add `BUILDS['<id>']` in `src/lib/builds/index.ts`
  (`{ label, blurb, resource, success, steps: [{ prompt, options[], correct,
explain }] }`; `correct` indexes the authored order — options shuffle at play
  time).
- **Mini-game:** add `sim: { game, label, blurb }` to the concept, create
  `src/lib/minigames/<game>.ts`, register it in `registry.ts` (prefer `makeQuiz`
  / `makeOrder`).
- `validateContent()` (`src/lib/content/schema.ts`) enforces the cross-links; it
  runs in `npm test` and in `npm run dev`.

## Review focus

- Correctness of the `engine.ts` state machine (stage transitions, input
  routing, `SaveState` shape and persistence — the `SAVE_KEY` must not change).
- No unescaped interpolation into `innerHTML`.
- Timers/intervals always cleared on `destroy()` / `leaveLevel()`.
- Content passes `validateContent()`; technical accuracy of AWS statements in
  concept text and `explain` strings.
- New/converted Svelte components use scoped `<style>`, not additions to
  `app.css`.
- Diffs stay scoped — don't reformat untouched code.
