/* Shared helpers for the mini-game builders and sims. */

const ENT: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

/** Escape a string for interpolation into innerHTML — the sims' XSS boundary. */
export const esc = (s: unknown): string => String(s).replace(/[&<>]/g, (c) => ENT[c]);

/** In-place Fisher-Yates shuffle; returns the same array for chaining. */
export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A row of vertical bars (0-100); bars over 90 get the `hot` class. */
export const barChart = (vals: number[]): string =>
  '<div class="sim-bars">' +
  vals
    .map((v) => `<i class="${v > 90 ? 'hot' : ''}" style="height:${Math.max(4, v)}%"></i>`)
    .join('') +
  '</div>';
