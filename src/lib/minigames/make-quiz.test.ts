import { describe, expect, it, vi } from 'vitest';
import { makeOrder } from './make-order';
import { makeQuiz } from './make-quiz';
import type { MinigameCtx } from './types';

/** Every sound method is a no-op; concept is unused by these builders. */
function fakeCtx(end: MinigameCtx['end']): MinigameCtx {
  const sound = new Proxy({}, { get: () => () => {} }) as MinigameCtx['sound'];
  return { concept: {} as MinigameCtx['concept'], sound, toast: () => {}, end };
}

const ROUNDS = [
  { prompt: 'one', choices: ['a', 'b'], answer: 0, why: '' },
  { prompt: 'two', choices: ['a', 'b', 'c'], answer: 2, why: '' },
  { prompt: 'three', choices: ['a', 'b'], answer: 1, why: '' },
];

/** Play a makeQuiz factory to the end, picking `pick(roundIndex)` each round. */
function playQuiz(rounds: typeof ROUNDS, pick: (i: number) => number) {
  const end = vi.fn();
  const root = document.createElement('div');
  const factory = makeQuiz({ controls: '', winAt: 2, rounds });
  factory.mount(root, fakeCtx(end));

  let round = 0;
  for (let guard = 0; guard < 100; guard++) {
    const done = root.querySelector<HTMLButtonElement>('#q-done');
    if (done) {
      done.click();
      break;
    }
    const next = root.querySelector<HTMLButtonElement>('#q-next');
    if (next) {
      next.click();
      continue;
    }
    const choices = root.querySelectorAll<HTMLButtonElement>('#q-ch .btn');
    expect(choices.length).toBeGreaterThan(0);
    choices[pick(round)].click(); // selecting locks the answer in
    round++;
  }
  return end;
}

describe('makeQuiz', () => {
  it('exposes the { controls, mount } factory shape', () => {
    const f = makeQuiz({ controls: 'x', winAt: 1, rounds: ROUNDS });
    expect(typeof f.controls).toBe('string');
    expect(typeof f.mount).toBe('function');
  });

  it('ends with win=true and full score when every answer is correct', () => {
    const end = playQuiz(ROUNDS, (i) => ROUNDS[i].answer);
    expect(end).toHaveBeenCalledTimes(1);
    expect(end.mock.calls[0][0]).toEqual({ win: true, score: 3 });
  });

  it('ends with win=false when the score is below winAt', () => {
    // miss every round -> score 0, winAt 2
    const end = playQuiz(ROUNDS, (i) => (ROUNDS[i].answer === 0 ? 1 : 0));
    expect(end).toHaveBeenCalledTimes(1);
    expect(end.mock.calls[0][0]).toEqual({ win: false, score: 0 });
  });
});

describe('makeOrder', () => {
  it('exposes the { controls, mount } factory shape and mounts cleanly', () => {
    const f = makeOrder({
      controls: '',
      winLine: 'ok',
      steps: [
        { t: 'first', tip: '' },
        { t: 'second', tip: '' },
      ],
    });
    expect(typeof f.mount).toBe('function');
    const root = document.createElement('div');
    expect(() => f.mount(root, fakeCtx(vi.fn()))).not.toThrow();
    expect(root.querySelectorAll('#o-ch .btn').length).toBe(2);
  });
});
