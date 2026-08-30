import { describe, expect, it } from 'vitest';
import { PROGRESSION, WORLD_CONCEPTS } from '../content/worlds';
import {
  XP_PER_LEVEL,
  isUnlocked,
  levelFrac,
  nextConcept,
  playerLevel,
  starCount,
} from './progression';
import { blank } from './save';

describe('playerLevel / levelFrac', () => {
  it('starts at level 1 and ticks over at each XP_PER_LEVEL', () => {
    expect(playerLevel(0)).toBe(1);
    expect(playerLevel(XP_PER_LEVEL - 1)).toBe(1);
    expect(playerLevel(XP_PER_LEVEL)).toBe(2);
    expect(playerLevel(XP_PER_LEVEL * 3 + 5)).toBe(4);
  });

  it('reports a 0..1 fraction through the current level', () => {
    expect(levelFrac(0)).toBe(0);
    expect(levelFrac(XP_PER_LEVEL / 2)).toBeCloseTo(0.5);
    expect(levelFrac(XP_PER_LEVEL * 2)).toBe(0);
  });
});

describe('isUnlocked', () => {
  it('always unlocks the first concept of a world', () => {
    expect(isUnlocked(blank(), WORLD_CONCEPTS.compute[0])).toBe(true);
    expect(isUnlocked(blank(), WORLD_CONCEPTS.security[0])).toBe(true);
  });

  it('gates a later concept behind the previous one being cleared', () => {
    const save = blank();
    const [first, second] = WORLD_CONCEPTS.compute;
    expect(isUnlocked(save, second)).toBe(false);
    save.completed[first] = { stars: 2, best: 1 };
    expect(isUnlocked(save, second)).toBe(true);
  });
});

describe('nextConcept', () => {
  it('walks forward within a world', () => {
    const [a, b] = WORLD_CONCEPTS.compute;
    expect(nextConcept(a)).toBe(b);
  });

  it('crosses into the next world at a world boundary', () => {
    const lastCompute = WORLD_CONCEPTS.compute[WORLD_CONCEPTS.compute.length - 1];
    expect(nextConcept(lastCompute)).toBe(WORLD_CONCEPTS.storage[0]);
  });

  it('returns null at the end of the game', () => {
    expect(nextConcept(PROGRESSION[PROGRESSION.length - 1])).toBeNull();
  });
});

describe('starCount', () => {
  it('sums stars across every completed level', () => {
    const save = blank();
    save.completed.a = { stars: 3, best: 0 };
    save.completed.b = { stars: 2, best: 1 };
    expect(starCount(save)).toBe(5);
  });
});
