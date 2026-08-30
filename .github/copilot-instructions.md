# Copilot instructions — AWS QUEST

Context for Copilot code review, Copilot Chat, and the Copilot coding agent.

## What this project is

A single-page, retro 8-bit arcade game that teaches AWS concepts. It runs by
opening `index.html` directly — **no build step, no bundler, no framework, and
no runtime dependencies**. The only `node_modules` are dev tooling (ESLint,
Prettier). Do not introduce a build system or a runtime dependency; if a change
seems to need one, flag it instead.

## Layout

| Path                       | Role                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `index.html`               | screen shells, loads the scripts in order                                                              |
| `styles.css`               | retro palette, pixel borders, CRT overlay, all component CSS                                           |
| `src/content.js`           | learning content — worlds, concepts, deep dives, quizzes. Schema is documented at the top of the file. |
| `src/builds.js`            | per-concept "provision it yourself" tasks (`window.AWSQUEST_BUILDS`)                                   |
| `src/minigames.js`         | "inside the topic" sims + the `makeBuild()` engine                                                     |
| `src/audio.js`             | WebAudio chiptune SFX + looping-music controller                                                       |
| `src/game.js`              | engine: state machine, screens, save system, input router                                              |
| `scripts/check-syntax.mjs` | `node --check` gate                                                                                    |

Scripts load as plain classic `<script>`s and communicate through globals on
`window` (`AWSQUEST_CONTENT`, `AWSQUEST_SOUND`, `AWSQUEST_MINIGAMES`,
`AWSQUEST_BUILD`, `AWSQUEST_BUILDS`). Each file is an IIFE or a top-level script,
**not** an ES module. Keep it that way.

## Conventions

- Vanilla ES2022. 2-space indent, single quotes, semicolons, `const`/`let` (never
  `var`). Prettier + ESLint are the source of truth: `npm run check` must pass,
  and `npm run fix` auto-applies both.
- Escape any user-or-content string interpolated into `innerHTML` with the local
  `esc()` helper. No exceptions — that is the app's XSS boundary.
- Every interaction must work with **both keyboard and pointer**. New sims/stages
  return `{ onKey, destroy }` and clean up their own timers in `destroy()`.
- Respect `prefers-reduced-motion` (already honored in CSS for CRT/blink).
- Keep the aesthetic: `Press Start 2P`, the existing CSS variables, chiptune
  SFX via `AWSQUEST_SOUND`. No new fonts or asset hosts.

## Adding content

- **Concept:** add a record to `CONCEPTS` in `src/content.js` per the header
  schema, then list its id in `WORLD_CONCEPTS`.
- **Build task:** add an entry to `AWSQUEST_BUILDS` in `src/builds.js` keyed by
  concept id: `{ label, blurb, resource, success, steps: [{ prompt, options[],
correct, explain }] }`. Options are shuffled at runtime, so `correct` is an
  index into the authored order.
- **Mini-game:** add `sim: { game, label, blurb }` to the concept and register
  `game` in `src/minigames.js` (prefer the `makeQuiz` / `makeOrder` builders).

## Review focus

- Correctness of the state machine in `src/game.js` (stage transitions, input
  routing, `save` shape and persistence).
- No unescaped interpolation into `innerHTML`.
- Timers/intervals always cleared on `destroy()` / `leaveLevel()`.
- Technical accuracy of AWS statements in content and `explain` strings.
- Diffs stay scoped — don't reformat untouched code.
