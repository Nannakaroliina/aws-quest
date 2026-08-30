# AWS QUEST

A gamified way to learn AWS with an authentic 8-bit arcade feel — CRT scanlines,
chiptune blips, a `Press Start 2P` overworld, and an RPG mentor who introduces
every concept before you prove you understood it.

## Play

No build step, no dependencies. Just open the file:

```bash
open index.html
```

Or serve it (needed only if your browser blocks `file://` audio/fonts):

```bash
python3 -m http.server 8777
# then visit http://localhost:8777
```

Progress (XP, stars, badges, which deep dives you've read) is saved to
`localStorage`, so you can close the tab and come back.

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
   Playing it once grants a small XP bonus.
5. **Deep dive** _(optional)_ — how it actually works in practice: mechanism,
   an ASCII architecture sketch, real-world tips, gotchas, the pricing model,
   and a CLI snippet to try. Reading it once grants a small XP bonus.
6. **Challenge** — 3 multiple-choice questions. All correct on the first try =
   3 stars. Clearing a level unlocks the next one in that world and awards a
   badge.

### Build tasks

Every concept has a hands-on setup task in
[`src/builds.js`](src/builds.js) (`window.AWSQUEST_BUILDS`, keyed by concept
id), rendered by `makeBuild()` in [`src/minigames.js`](src/minigames.js).
Each is 6 configuration decisions on one resource — instance type, network
placement, credentials, encryption, backups, scaling policy, and so on — where
one option per slot is the production-correct choice. Options are shuffled per
play; DEPLOY validates every slot and explains the right answer.

### Mini-games

Ten "inside the topic" sims live in [`src/minigames.js`](src/minigames.js),
each registered on `window.AWSQUEST_MINIGAMES`:

| Concept                | Sim                     | Teaches                                     |
| ---------------------- | ----------------------- | ------------------------------------------- |
| EC2 Auto Scaling       | Run the Scaler          | target tracking, headroom, scaling lag      |
| Amazon VPC             | Route the Packets       | IGW vs NAT vs endpoint vs local route       |
| Elastic Load Balancing | Man the Front Door      | ALB/NLB/GWLB, health checks, slow start     |
| Amazon DynamoDB        | Pick the Partition Key  | key cardinality and hot partitions          |
| S3 Storage Classes     | Tier the Bucket         | cost vs retrieval-time trade-off            |
| AWS IAM                | Be the Policy Engine    | explicit deny, boundary ∩ SCP ∩ identity    |
| AWS KMS                | Seal the Envelope       | ordering of envelope encryption             |
| Amazon SQS             | Work the Queue          | visibility timeout, delete-or-reappear, DLQ |
| Amazon EventBridge     | Match the Pattern       | event-pattern matching rules                |
| AWS Step Functions     | Build the State Machine | Task / Choice / Parallel ordering           |

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

## Music

The background loop is an 8-bit chiptune track generated with **ElevenLabs Music**
(`eleven_music_v2`, 50s instrumental). It starts on the first key/tap, loops on
the title and map screens, and ducks to a lower volume inside a level so the
briefing text reads clearly.

Four variations were generated — `assets/bgm-1.mp3` … `assets/bgm-4.mp3`.
`assets/bgm.mp3` is the one the game actually plays. To switch tracks:

```bash
cp assets/bgm-3.mp3 assets/bgm.mp3
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

## Project layout

```
index.html            markup + screen shells
styles.css            retro palette, pixel borders, CRT overlay, mini-game UI
src/content.js        all learning content (worlds, concepts, deep dives, quizzes, sim refs)
src/audio.js          WebAudio chiptune SFX engine + looping-music controller
src/minigames.js      "inside the topic" sims + the makeBuild() engine
src/builds.js         per-concept "provision it yourself" tasks (window.AWSQUEST_BUILDS)
src/game.js           engine: state, screens, save system, input router
scripts/check-syntax  node --check gate for every JS file
assets/bgm*.mp3       ElevenLabs Music chiptune loop (bgm.mp3 = active track)
```

### Adding a concept

Add a record to `CONCEPTS` in [`src/content.js`](src/content.js) following the
schema documented at the top of that file, then list its id in
`WORLD_CONCEPTS` for the world it belongs to. No other file needs to change.

To give it a **build task**, add an entry to `window.AWSQUEST_BUILDS` in
[`src/builds.js`](src/builds.js) keyed by the concept id:
`{ label, blurb, resource, success, steps: [ { prompt, options[], correct,
explain } ] }`. The card picks it up automatically.

To give it a **mini-game**, add an optional `sim: { game, label, blurb }` to the
record and register `game` in [`src/minigames.js`](src/minigames.js). The two
builders there — `makeQuiz` (pick-the-answer rounds, with an optional
`afterPick` visualisation) and `makeOrder` (put N steps in order) — cover most
cases; bespoke sims implement `mount(root, ctx) -> { onKey, destroy }` directly.

## Development

The game ships zero runtime dependencies. The only `node_modules` are dev
tooling — [ESLint](https://eslint.org) and [Prettier](https://prettier.io):

```bash
npm install        # one-time: install the dev toolchain
npm run check      # syntax (node --check) + prettier --check + eslint
npm run fix        # prettier --write + eslint --fix
```

| Script                 | What it does                                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check:syntax` | `node --check` every file in `src/` and `scripts/`                                                                                                                                      |
| `npm run lint`         | ESLint (flat config, `eslint.config.mjs`)                                                                                                                                               |
| `npm run format:check` | Prettier — **config, docs and `index.html` only**; `src/**` and `styles.css` are `.prettierignore`d and kept in their compact hand-authored style (ESLint + `.editorconfig` guard them) |
| `npm run check`        | all three, in order — the same gate CI runs                                                                                                                                             |
| `npm test`             | alias for `npm run check`                                                                                                                                                               |

**Pre-commit hook** (opt-in): `git config core.hooksPath .githooks` runs
`npm run check` before each commit that touches code. Bypass once with
`git commit --no-verify`.

### CI & security

GitHub Actions in [`.github/workflows/`](.github/workflows/):

- **`ci.yml`** — syntax + `prettier --check` + `eslint --max-warnings=0` on
  every push and PR.
- **`codeql.yml`** — CodeQL `security-and-quality` analysis (PR, push, weekly).
- **`gitleaks.yml`** — secret scan over the full history and every diff.
- **`dependency-review.yml`** — flags risky dependency changes on PRs;
  [`dependabot.yml`](.github/dependabot.yml) opens weekly update PRs for npm and
  Actions.

[`.github/copilot-instructions.md`](.github/copilot-instructions.md) primes
GitHub Copilot code review and the coding agent with the project's conventions.
Turn on the Copilot PR auto-review toggle in the repo settings once the remote
exists.
