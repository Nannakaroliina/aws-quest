import { describe, expect, it } from 'vitest';
import { CONCEPTS } from './concepts';
import { validateContent } from './schema';
import { PROGRESSION, WORLD_CONCEPTS } from './worlds';

describe('content', () => {
  it('passes schema validation with no problems', () => {
    expect(validateContent()).toEqual([]);
  });

  it('has a concept module for every id in PROGRESSION', () => {
    for (const id of PROGRESSION) expect(CONCEPTS[id], id).toBeTruthy();
  });

  it("each concept's id matches its key and world membership", () => {
    for (const [key, c] of Object.entries(CONCEPTS)) {
      expect(c.id).toBe(key);
      expect(WORLD_CONCEPTS[c.world]).toContain(key);
    }
  });
});
