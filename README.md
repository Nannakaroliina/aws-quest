# AWS QUEST

A gamified way to learn AWS with an authentic 8-bit arcade feel — CRT scanlines,
chiptune blips, a `Press Start 2P` overworld, and an RPG mentor who introduces
every concept before you prove you understood it.

Built with **SvelteKit + TypeScript** and prerendered to a **static site**
(`@sveltejs/adapter-static`): no server, no runtime data. Progress (XP, stars,
badges, which deep dives you've read) is saved to `localStorage`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Build the static site and preview it:

```bash
npm run build      # -> ./build  (plain HTML/JS/CSS/assets)
npm run preview
```

`./build` is fully static — serve it from any bucket, CDN, or
`python3 -m http.server` inside the directory.

## How a level works

Each AWS concept is one "level" on the overworld map, played in a few beats:

1. **Briefing** — CIRRUS, your cloud guide, explains the concept in plain
   language with a metaphor (RPG text box, typewriter effect).
2. **Concept card** — the core facts: what it is, why it exists, key terms.
3. **Build task** _(every concept)_ — provision the resource yourself. A rack
   of empty slots (bucket name, Block Public Access, versioning, encryption…);
   fill each one from its options, then **DEPLOY**. Every choice is checked and
   explained; all-correct = the resource goes live and grants an XP bonus.
4. **Mini-game** _(some concepts)_ — an "inside the topic" sim where you _do_
   the mechanic: route packets out of a VPC, ride a demand curve with an Auto
   Scaling group, pick a DynamoDB partition key and watch it melt a partition,
   be the IAM policy engine, work an SQS queue with a poison message, and more.
5. **Deep dive** _(optional)_ — how it actually works: mechanism, an ASCII
   architecture sketch, real-world tips, gotchas, the pricing model, and a CLI
   snippet to try.
6. **Challenge** — 3 multiple-choice questions. All correct on the first try =
   3 stars. Clearing a level unlocks the next one in that world and awards a
   badge.

## Controls

| Key               | Action                             |
| ----------------- | ---------------------------------- |
| `← → ↑ ↓`         | Move on the map / choose an option |
| `Enter` / `Space` | Select · advance dialogue · answer |
| `Esc`             | Back / leave a level               |
| `B`               | Badge vault                        |
| `M`               | Mute / unmute                      |

Everything is clickable too. `M` mutes both the chiptune sound effects and the
looping background music.

## Project layout

```
src/
  app.html                     SvelteKit shell (fonts, favicon)
  app.css                      retro palette, pixel borders, CRT overlay, screen + sim CSS
  routes/
    +layout.svelte             CRT overlay + <audio id="bgm">, imports app.css
    +layout.ts                 prerender = true, ssr = false; dev-time content validation
    +page.svelte               mounts <Game />
  lib/
    components/Game.svelte      screen-shell markup; mounts the engine on load
    game/
      engine.ts                state machine, screens, input router  (createGame(root))
      save.ts                   SaveState + localStorage load/persist
      progression.ts            XP maths, unlock rules, nextConcept
    content/
      types.ts                 Concept / World / BuildSpec / … TypeScript types
      worlds.ts                WORLDS, WORLD_CONCEPTS, PROGRESSION
      concepts/<world>/<id>.ts  one file per concept
      concepts/index.ts        assembles CONCEPTS
      schema.ts                validateContent() — cross-checks TS can't
      index.ts                 barrel: import from '$lib/content'
    builds/index.ts            per-concept "provision it yourself" tasks (BUILDS)
    minigames/
      types.ts                 MinigameFactory / MinigameCtx / MinigameApi
      make-quiz.ts, make-order.ts, make-build.ts   reusable builders
      <game>.ts                one file per sim
      registry.ts              MINIGAMES, keyed by the id a concept's sim.game names
static/assets/bgm*.mp3         ElevenLabs Music chiptune loop (bgm.mp3 = active track)
```

> The `game/engine.ts` and `minigames/*` modules are imperative DOM code lifted
> verbatim from the pre-SvelteKit build and carry `// @ts-nocheck`. They are
> being rewritten as Svelte components screen by screen; their CSS moves into
> each component's scoped `<style>` as that happens.

## Adding content

### A concept

1. Create `src/lib/content/concepts/<world>/<id>.ts`:

   ```ts
   import type { Concept } from "../../types";

   export const myservice: Concept = {
     id: "myservice",
     world: "compute",
     name: "MY SERVICE",
     sub: "…",
     icon: "🛠️",
     briefing: ["…"],
     metaphor: "…",
     points: ["…"],
     deep: { works: ["…"], diagram: "…", practice: ["…"], gotchas: ["…"], pricing: "…", cli: "…" },
     quiz: [{ q: "…", choices: ["…", "…"], answer: 0, why: "…" }],
     badge: { name: "NAME", emoji: "🏅" },
   };
   ```

2. Import and list it in `src/lib/content/concepts/index.ts`.
3. Add its id to the right world in `src/lib/content/worlds.ts` (`WORLD_CONCEPTS`).
4. Give it a build task — add `BUILDS['myservice']` in
   `src/lib/builds/index.ts` (`{ label, blurb, resource, success, steps: [{ prompt,
options[], correct, explain }] }`; options are shuffled at play time so
   `correct` is an index into the authored order).

`validateContent()` (run by `npm test` and again in `npm run dev`) will tell you
if anything doesn't line up.

### A mini-game

Add `sim: { game, label, blurb }` to the concept, create
`src/lib/minigames/<game>.ts`, and register it in
`src/lib/minigames/registry.ts`. The `makeQuiz` (pick-the-answer rounds) and
`makeOrder` (order N steps) builders cover most cases; bespoke sims implement
`mount(root, ctx) -> { onKey, destroy }` directly.

## Music

The background loop is an 8-bit chiptune track generated with **ElevenLabs
Music**. Four variations live in `static/assets/bgm-1.mp3` … `bgm-4.mp3`;
`static/assets/bgm.mp3` is the one the game plays. To switch:

```bash
cp static/assets/bgm-3.mp3 static/assets/bgm.mp3
```

## Worlds (28 concepts)

| World              | Concepts                                                                            |
| ------------------ | ----------------------------------------------------------------------------------- |
| **Compute Cove**   | EC2 · Lambda · EC2 Auto Scaling · ECS + Fargate                                     |
| **Storage Shores** | S3 · EBS · S3 storage classes · EFS                                                 |
| **Network Nexus**  | VPC · Elastic Load Balancing · Route 53 · CloudFront · API Gateway                  |
| **Data Dungeon**   | RDS · DynamoDB · Aurora · ElastiCache                                               |
| **Sentinel Keep**  | IAM · KMS · Secrets Manager · Cognito                                               |
| **Oracle Tower**   | CloudWatch · CloudTrail · SQS · SNS · CloudFormation · EventBridge · Step Functions |

Worlds are all open from the start; concepts within a world unlock in order.

## Development

```bash
npm run dev          # dev server
npm run check        # svelte-check + prettier --check + eslint + vitest  (the CI gate)
npm run fix          # prettier --write + eslint --fix
npm test             # vitest run
```

| Script                 | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `npm run check:types`  | `svelte-kit sync` + `svelte-check`                      |
| `npm run lint`         | ESLint (flat config, `eslint.config.mjs`)               |
| `npm run format:check` | Prettier — everything except build output               |
| `npm test`             | Vitest: content schema, progression maths, quiz builder |
| `npm run check`        | all of the above, in order — the same gate CI runs      |

**Pre-commit hook** (opt-in): `git config core.hooksPath .githooks` runs
`npm run check` before each commit that touches code. Bypass once with
`git commit --no-verify`.

### CI & security

GitHub Actions in [`.github/workflows/`](.github/workflows/):

- **`ci.yml`** — `svelte-check` + `prettier --check` + `eslint` + `vitest` on
  every push and PR.
- **`codeql.yml`** — CodeQL `security-and-quality` analysis (PR, push, weekly).
- **`gitleaks.yml`** — secret scan over the full history and every diff.
- **`dependency-review.yml`** — flags risky dependency changes on PRs;
  [`dependabot.yml`](.github/dependabot.yml) opens weekly update PRs for npm and
  Actions.
