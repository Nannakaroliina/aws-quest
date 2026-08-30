/* =========================================================================
   AWS QUEST -- mini-game contract
   -------------------------------------------------------------------------
   A concept card can offer a playable sim that makes you *do* the mechanic,
   not just read it. Every sim is a `MinigameFactory` registered in
   ./registry.ts under the id a concept's `sim.game` names.

   Two reusable builders cover most sims:
     makeQuiz  -- pick-the-right-answer rounds, optional afterPick() viz
     makeOrder -- put N steps in the order they really happen
   Bespoke sims (autoscale, visibilityQueue, storageTiers) implement mount()
   directly.
   ========================================================================= */

import type { Concept } from '../content/types';
import type { Sound } from '../audio/sound';

export interface MinigameCtx {
  /** the concept record this sim was launched from */
  concept: Concept;
  sound: Sound;
  /** transient banner */
  toast: (msg: string) => void;
  /** hand control back to the level */
  end: (res?: { win: boolean; score?: number }) => void;
}

export interface MinigameApi {
  onKey: (e: KeyboardEvent) => void;
  destroy: () => void;
}

export interface MinigameFactory {
  /** footer hint shown by the engine */
  controls: string;
  mount: (root: HTMLElement, ctx: MinigameCtx) => MinigameApi;
}
