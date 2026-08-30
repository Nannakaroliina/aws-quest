// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { esc } from './helpers';
import type { MinigameFactory } from './types';

export function makeQuiz(opts): MinigameFactory {
  return {
    controls: opts.controls || '↑ ↓ pick  ·  ENTER lock in',
    mount(root, ctx) {
      let i = 0,
        correct = 0,
        locked = false,
        cur = 0;

      function draw() {
        const r = opts.rounds[i];
        root.innerHTML =
          `<div class="sim-hud"><span>ROUND <b>${i + 1}</b>/${opts.rounds.length}</span>` +
          `<span>SCORE <b>${correct}</b></span></div>` +
          `<div class="sim-prompt">${esc(r.prompt)}</div>` +
          (r.extra ? `<div class="sim-extra">${esc(r.extra)}</div>` : '') +
          `<div class="choices" id="q-ch">` +
          r.choices.map((c, n) => `<button class="btn" data-n="${n}">${esc(c)}</button>`).join('') +
          `</div><div id="q-fb"></div>`;
        root.querySelectorAll('#q-ch .btn').forEach((b) => {
          b.addEventListener('mousemove', () => {
            if (!locked) {
              cur = +b.dataset.n;
              paint();
            }
          });
          b.addEventListener('click', () => {
            if (!locked) {
              cur = +b.dataset.n;
              lock();
            }
          });
        });
        paint();
      }
      function paint() {
        root
          .querySelectorAll('#q-ch .btn')
          .forEach((b, n) => b.classList.toggle('sel', n === cur && !locked));
      }
      function lock() {
        const r = opts.rounds[i];
        locked = true;
        const ok = cur === r.answer;
        if (ok) {
          correct++;
          ctx.sound.correct();
        } else ctx.sound.wrong();
        root.querySelectorAll('#q-ch .btn').forEach((b, n) => {
          b.disabled = true;
          if (n === r.answer) b.classList.add('good', 'sel');
          if (n === cur && !ok) b.classList.add('bad', 'sel');
        });
        const fb = root.querySelector('#q-fb');
        fb.innerHTML =
          `<div class="explain ${ok ? '' : 'bad'}">` +
          (ok ? '<b class="c-green">CORRECT</b><br>' : '<b class="c-red">NOT QUITE</b><br>') +
          esc(r.why) +
          '</div>' +
          `<div class="choices"><button class="btn sel" id="q-next">` +
          (i < opts.rounds.length - 1 ? 'NEXT ▶' : 'RESULTS ▶') +
          '</button></div>';
        if (opts.afterPick) opts.afterPick(r, cur, fb);
        root.querySelector('#q-next').addEventListener('click', next);
      }
      function next() {
        if (i < opts.rounds.length - 1) {
          i++;
          locked = false;
          cur = 0;
          ctx.sound.move();
          draw();
        } else finish();
      }
      function finish() {
        const win = correct >= opts.winAt;
        root.innerHTML =
          `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
          `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
          `<div>${correct} / ${opts.rounds.length} correct</div>` +
          `<div class="small">${esc(
            win
              ? opts.winLine || 'You have the mechanic down.'
              : opts.loseLine || 'Revisit the deep dive and run it again.',
          )}</div>` +
          `<div class="choices"><button class="btn sel" id="q-done">DONE ▶</button></div></div>`;
        root
          .querySelector('#q-done')
          .addEventListener('click', () => ctx.end({ win, score: correct }));
      }

      draw();
      return {
        onKey(e) {
          const k = e.key;
          if (locked) {
            if (k === 'Enter' || k === ' ') {
              e.preventDefault();
              const n = root.querySelector('#q-next') || root.querySelector('#q-done');
              if (n) n.click();
            }
            return;
          }
          const n = opts.rounds[i].choices.length;
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
          if (/^[1-9]$/.test(k) && +k <= n) {
            cur = +k - 1;
            paint();
          }
          if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            lock();
          }
        },
        destroy() {},
      };
    },
  };
}
