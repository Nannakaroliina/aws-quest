/* =========================================================================
   AWS QUEST -- content types
   -------------------------------------------------------------------------
   The shape every concept record must satisfy. Authoring a concept is
   filling one `Concept` object (see src/lib/content/concepts/<world>/<id>.ts)
   and listing its id in WORLD_CONCEPTS (src/lib/content/worlds.ts).
   `validateContent()` in ./schema.ts enforces the cross-references TypeScript
   can't (quiz answer in range, sim.game registered, every id has a build).
   ========================================================================= */

export type WorldId = 'compute' | 'storage' | 'network' | 'data' | 'security' | 'ops';

export interface World {
  id: WorldId;
  /** display name on the overworld map */
  name: string;
  /** accent colour for this region */
  tint: string;
  blurb: string;
}

/** "How it works in practice" — the optional deep-dive stage. */
export interface DeepDive {
  works: string[];
  /** ASCII architecture sketch, rendered in a <pre> */
  diagram: string;
  practice: string[];
  gotchas: string[];
  pricing: string;
  /** a CLI snippet to try */
  cli: string;
}

/** Points a concept card at a registered mini-game (see src/lib/minigames). */
export interface Sim {
  /** key in MINIGAMES (src/lib/minigames/registry.ts) */
  game: string;
  label: string;
  blurb: string;
}

export interface QuizQuestion {
  q: string;
  choices: string[];
  /** index into `choices` */
  answer: number;
  why: string;
}

export interface Badge {
  name: string;
  emoji: string;
}

/** One configuration decision in a build task. */
export interface BuildStep {
  prompt: string;
  options: string[];
  /** index into the authored `options` order (shuffled at play time) */
  correct: number;
  explain: string;
}

/** A "provision it yourself" task. Shared specs live in src/lib/builds; a
    concept may also carry one inline (which then wins). */
export interface BuildSpec {
  label: string;
  blurb: string;
  /** the thing being assembled (panel title) */
  resource: string;
  /** shown when every setting is correct */
  success: string;
  steps: BuildStep[];
}

export interface Concept {
  /** short slug, matches the record key and the filename */
  id: string;
  world: WorldId;
  name: string;
  /** expansion / tagline */
  sub: string;
  /** emoji used as the map sprite */
  icon: string;
  /** mentor dialogue lines shown in the RPG text box */
  briefing: string[];
  /** one-line "think of it like..." hook */
  metaphor: string;
  /** the core facts (the concept card) */
  points: string[];
  deep: DeepDive;
  sim?: Sim;
  /** overrides the shared build for this id when present */
  build?: BuildSpec;
  quiz: QuizQuestion[];
  badge: Badge;
}
