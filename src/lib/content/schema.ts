/* =========================================================================
   AWS QUEST -- content validation
   -------------------------------------------------------------------------
   The cross-references TypeScript can't check on its own: every id lives in
   exactly one world, quiz answers point at a real choice, a sim names a
   registered mini-game, every concept has a build task.

   validateContent() returns a list of human-readable problems (empty = OK).
   It runs as a Vitest suite (src/lib/content/schema.test.ts) and again in
   dev from src/routes/+layout.ts, so an authoring mistake shows up the
   moment you save.
   ========================================================================= */

import { BUILDS } from '../builds';
import { MINIGAMES } from '../minigames/registry';
import { CONCEPTS } from './concepts';
import { WORLDS, WORLD_CONCEPTS, PROGRESSION } from './worlds';
import type { BuildSpec, Concept } from './types';

function checkBuild(id: string, spec: BuildSpec, errs: string[]): void {
  if (!Array.isArray(spec.steps) || spec.steps.length === 0) {
    errs.push(`build "${id}": no steps`);
    return;
  }
  spec.steps.forEach((st, i) => {
    if (!Array.isArray(st.options) || st.options.length < 2) {
      errs.push(`build "${id}" step ${i}: needs at least two options`);
    }
    if (typeof st.correct !== 'number' || st.correct < 0 || st.correct >= st.options.length) {
      errs.push(`build "${id}" step ${i}: correct index ${st.correct} out of range`);
    }
  });
}

function checkConcept(concept: Concept, errs: string[]): void {
  const { id } = concept;

  if (!WORLDS.some((w) => w.id === concept.world)) {
    errs.push(`concept "${id}": unknown world "${concept.world}"`);
  }
  if (
    concept.world &&
    WORLD_CONCEPTS[concept.world] &&
    !WORLD_CONCEPTS[concept.world].includes(id)
  ) {
    errs.push(
      `concept "${id}": world "${concept.world}" but not listed in WORLD_CONCEPTS.${concept.world}`,
    );
  }

  for (const field of ['briefing', 'points', 'quiz'] as const) {
    if (!Array.isArray(concept[field]) || concept[field].length === 0) {
      errs.push(`concept "${id}": empty ${field}`);
    }
  }

  concept.quiz.forEach((q, i) => {
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      errs.push(`concept "${id}" quiz ${i}: needs at least two choices`);
    }
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.choices.length) {
      errs.push(`concept "${id}" quiz ${i}: answer index ${q.answer} out of range`);
    }
  });

  if (concept.sim && !MINIGAMES[concept.sim.game]) {
    errs.push(`concept "${id}": sim.game "${concept.sim.game}" is not registered in MINIGAMES`);
  }

  const build = concept.build ?? BUILDS[id];
  if (!build) {
    errs.push(`concept "${id}": no build task (add BUILDS["${id}"] or an inline build)`);
  } else {
    checkBuild(id, build, errs);
  }
}

/** @returns a list of content problems; empty means everything lines up. */
export function validateContent(): string[] {
  const errs: string[] = [];

  // every id referenced by a world has a concept, and vice-versa
  const referenced = new Set<string>();
  for (const world of WORLDS) {
    for (const id of WORLD_CONCEPTS[world.id] ?? []) {
      referenced.add(id);
      if (!CONCEPTS[id])
        errs.push(`WORLD_CONCEPTS.${world.id} lists "${id}" but no concept module exports it`);
    }
  }
  for (const id of Object.keys(CONCEPTS)) {
    if (!referenced.has(id))
      errs.push(`concept "${id}" is not listed in any world's WORLD_CONCEPTS`);
  }

  if (PROGRESSION.length !== referenced.size) {
    errs.push(
      `PROGRESSION has ${PROGRESSION.length} ids but WORLD_CONCEPTS references ${referenced.size}`,
    );
  }

  for (const concept of Object.values(CONCEPTS)) checkConcept(concept, errs);

  return errs;
}
