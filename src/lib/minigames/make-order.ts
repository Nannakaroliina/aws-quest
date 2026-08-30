// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { esc, shuffle } from './helpers';
import type { MinigameFactory } from './types';

export function makeOrder(opts): MinigameFactory {
  return {
    controls: opts.controls || '↑ ↓ pick step  ·  ENTER place',
    mount(root, ctx) {
      const correct = opts.steps.map((s, idx) => ({ t: s.t, tip: s.tip, idx }));
      const pool = shuffle(correct.slice());
      const placed = [];
      let cur = 0,
        misses = 0;

      function draw() {
        root.innerHTML =
          `<div class="sim-hud"><span>PLACED <b>${placed.length}</b>/${correct.length}</span>` +
          `<span>MISSTEPS <b>${misses}</b></span></div>` +
          `<div class="sim-placed">` +
          (placed.length
            ? placed.map((p, n) => `<div class="ostep done">${n + 1}. ${esc(p.t)}</div>`).join('')
            : '<div class="small">nothing placed yet — pick the FIRST step</div>') +
          `</div>` +
          `<div class="sim-readout">which step happens next?</div>` +
          `<div class="choices" id="o-ch">` +
          pool.map((p, n) => `<button class="btn" data-n="${n}">${esc(p.t)}</button>`).join('') +
          `</div><div id="o-fb"></div>`;
        root.querySelectorAll('#o-ch .btn').forEach((b) => {
          b.addEventListener('mousemove', () => {
            cur = +b.dataset.n;
            paint();
          });
          b.addEventListener('click', () => {
            cur = +b.dataset.n;
            pick();
          });
        });
        paint();
      }
      function paint() {
        root.querySelectorAll('#o-ch .btn').forEach((b, n) => b.classList.toggle('sel', n === cur));
      }
      function pick() {
        const chosen = pool[cur];
        if (!chosen) return;
        if (chosen.idx === placed.length) {
          placed.push(chosen);
          pool.splice(cur, 1);
          cur = 0;
          ctx.sound.correct();
          if (placed.length === correct.length) return finish();
          draw();
          const fb = root.querySelector('#o-fb');
          if (fb) fb.innerHTML = `<div class="explain">${esc(chosen.tip)}</div>`;
        } else {
          misses++;
          ctx.sound.wrong();
          const fb = root.querySelector('#o-fb');
          if (fb)
            fb.innerHTML = `<div class="explain bad">Not yet — that step depends on something that hasn't happened.</div>`;
        }
      }
      function finish() {
        const win = misses <= 2;
        root.innerHTML =
          `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
          `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
          `<div>ordered with ${misses} misstep${misses === 1 ? '' : 's'}</div>` +
          `<div class="small">${esc(win ? opts.winLine : 'The order is the lesson — read the flow again and retry.')}</div>` +
          `<div class="choices"><button class="btn sel" id="o-done">DONE ▶</button></div></div>`;
        root.querySelector('#o-done').addEventListener('click', () => ctx.end({ win }));
      }

      draw();
      return {
        onKey(e) {
          const k = e.key;
          const n = pool.length;
          if (!n) {
            if (k === 'Enter' || k === ' ') {
              e.preventDefault();
              const d = root.querySelector('#o-done');
              if (d) d.click();
            }
            return;
          }
          if (k === 'ArrowUp') {
            e.preventDefault();
            cur = (cur + n - 1) % n;
            ctx.sound.cursor();
            paint();
          }
          if (k === 'ArrowDown') {
            e.preventDefault();
            cur = (cur + 1) % n;
            ctx.sound.cursor();
            paint();
          }
          if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            pick();
          }
        },
        destroy() {},
      };
    },
  };
}
