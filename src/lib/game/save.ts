/* =========================================================================
   AWS QUEST -- save state
   Progress lives in localStorage under a stable key so a tab can be closed
   and resumed. Keep SAVE_KEY unchanged: pre-SvelteKit saves must still load.
   ========================================================================= */

export const SAVE_KEY = 'aws-quest-save-v1';

export interface CompletedLevel {
  stars: number;
  best: number;
}

export interface SaveState {
  xp: number;
  completed: Record<string, CompletedLevel>;
  badges: string[];
  readDeep: Record<string, boolean>;
  playedSim: Record<string, boolean>;
  builtIt: Record<string, boolean>;
  muted: boolean;
}

export const blank = (): SaveState => ({
  xp: 0,
  completed: {},
  badges: [],
  readDeep: {},
  playedSim: {},
  builtIt: {},
  muted: false,
});

export function load(): SaveState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return blank();
    return Object.assign(blank(), JSON.parse(raw) as Partial<SaveState>);
  } catch {
    return blank();
  }
}

export function persist(save: SaveState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* storage full or disabled — progress just won't survive a reload */
  }
}
