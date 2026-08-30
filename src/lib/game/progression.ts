/* =========================================================================
   AWS QUEST -- progression maths
   Pure helpers over a SaveState + the content graph. No DOM, no sound.
   ========================================================================= */

import { CONCEPTS } from '../content/concepts';
import { WORLDS, WORLD_CONCEPTS } from '../content/worlds';
import type { SaveState } from './save';

export const XP_PER_LEVEL = 120;

/** XP awards by action. */
export const XP = {
  correct: 20,
  perfect: 30,
  firstClear: 25,
  deepDive: 15,
  sim: 20,
  build: 25,
} as const;

export const playerLevel = (xp: number): number => Math.floor(xp / XP_PER_LEVEL) + 1;

export const levelFrac = (xp: number): number => (xp % XP_PER_LEVEL) / XP_PER_LEVEL;

export const starCount = (save: SaveState): number =>
  Object.values(save.completed).reduce((a, c) => a + (c.stars || 0), 0);

/**
 * A concept is playable if it's the first in its world, or the previous
 * concept in that world is cleared. Worlds themselves are open from the start
 * so players can dive into whichever AWS domain they care about.
 */
export function isUnlocked(save: SaveState, id: string): boolean {
  const arr = WORLD_CONCEPTS[CONCEPTS[id].world];
  const i = arr.indexOf(id);
  if (i === 0) return true;
  return !!save.completed[arr[i - 1]];
}

/** "What comes next": next concept in the same world, else first of next world. */
export function nextConcept(id: string): string | null {
  const c = CONCEPTS[id];
  const arr = WORLD_CONCEPTS[c.world];
  const i = arr.indexOf(id);
  if (i < arr.length - 1) return arr[i + 1];
  const wi = WORLDS.findIndex((w) => w.id === c.world);
  if (wi < WORLDS.length - 1) return WORLD_CONCEPTS[WORLDS[wi + 1].id][0];
  return null;
}
