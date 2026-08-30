// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { esc, shuffle } from './helpers';
import type { BuildSpec } from '../content/types';
import type { MinigameFactory } from './types';

export function makeBuild(spec: BuildSpec): MinigameFactory {
  return {
    controls: '← → slot  ·  ↑ ↓ option  ·  ENTER set  ·  D deploy',
    mount(root, ctx) {
      const steps = spec.steps.map((st) => {
        const order = shuffle(st.options.map((_, i) => i));
        return {
          prompt: st.prompt,
          explain: st.explain,
          options: order.map((i) => st.options[i]),
          correct: order.indexOf(st.correct),
        };
      });
      const picks = steps.map(() => -1);
      let slot = 0,
        opt = 0,
        deployed = false;
      const filled = () => picks.every((p) => p >= 0);

      function draw() {
        const s = steps[slot];
        if (opt > s.options.length - 1) opt = s.options.length - 1;
        root.innerHTML =
          `<div class="bld-rack"><div class="bld-title">${esc(spec.resource)}</div>` +
          steps
            .map(
              (st, i) =>
                `<div class="bld-slot${i === slot ? ' sel' : ''}${picks[i] >= 0 ? ' set' : ''}" data-i="${i}">` +
                `<span class="bld-k">${esc(st.prompt)}</span>` +
                `<span class="bld-v">${picks[i] >= 0 ? esc(st.options[picks[i]]) : '· · ·'}</span></div>`,
            )
            .join('') +
          `</div>` +
          `<div class="bld-pick">set <b>${esc(s.prompt)}</b></div>` +
          `<div class="choices" id="bld-opts">` +
          s.options
            .map(
              (o, i) =>
                `<button class="btn${i === opt ? ' sel' : ''}${picks[slot] === i ? ' good' : ''}" data-o="${i}">${esc(o)}</button>`,
            )
            .join('') +
          `</div>` +
          `<div class="sim-btnrow"><button class="btn" id="bld-deploy"${filled() ? '' : ' disabled'}>` +
          `▶ DEPLOY (${picks.filter((p) => p >= 0).length}/${steps.length})</button></div>` +
          `<div class="sim-readout">${esc(spec.blurb || 'Fill every slot, then deploy.')}</div>`;
        root.querySelectorAll('.bld-slot').forEach((el) =>
          el.addEventListener('click', () => {
            slot = +el.dataset.i;
            opt = picks[slot] >= 0 ? picks[slot] : 0;
            draw();
          }),
        );
        root.querySelectorAll('#bld-opts .btn').forEach((el) =>
          el.addEventListener('click', () => {
            opt = +el.dataset.o;
            commit();
          }),
        );
        const d = root.querySelector('#bld-deploy');
        if (d) d.addEventListener('click', deploy);
      }
      function commit() {
        picks[slot] = opt;
        ctx.sound.select();
        const nextEmpty = picks.findIndex((p) => p < 0);
        if (nextEmpty >= 0) {
          slot = nextEmpty;
          opt = 0;
        }
        draw();
      }
      function deploy() {
        if (!filled()) return;
        deployed = true;
        let right = 0;
        const rows = steps
          .map((st, i) => {
            const ok = picks[i] === st.correct;
            if (ok) right++;
            return (
              `<div class="bld-check ${ok ? 'ok' : 'bad'}"><b>${ok ? '✔' : '✘'} ${esc(st.prompt)}</b><br>` +
              `<span class="small">you set: ${esc(st.options[picks[i]])}` +
              (ok ? '' : `<br>correct: ${esc(st.options[st.correct])}`) +
              `</span><br>` +
              `<span class="small">${esc(st.explain)}</span></div>`
            );
          })
          .join('');
        const win = right === steps.length;
        ctx.sound[win ? 'fanfare' : 'wrong']();
        root.innerHTML =
          `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
          `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
          `<div>${esc(spec.resource)} · ${right}/${steps.length} settings right</div></div>` +
          `<div class="bld-report">${rows}</div>` +
          `<div class="sim-readout ${win ? 'good' : 'bad'}">${esc(
            win
              ? spec.success || 'Provisioned to best practice.'
              : 'Adjust the settings marked ✘ and redeploy.',
          )}</div>` +
          `<div class="sim-btnrow">` +
          (win ? '' : `<button class="btn" id="bld-adj">↻ ADJUST</button>`) +
          `<button class="btn sel" id="bld-done">DONE ▶</button></div>`;
        root
          .querySelector('#bld-done')
          .addEventListener('click', () => ctx.end({ win, score: right }));
        const a = root.querySelector('#bld-adj');
        if (a)
          a.addEventListener('click', () => {
            deployed = false;
            const wrong = steps.findIndex((st, i) => picks[i] !== st.correct);
            slot = wrong < 0 ? 0 : wrong;
            opt = picks[slot] >= 0 ? picks[slot] : 0;
            draw();
          });
      }

      draw();
      return {
        onKey(e) {
          const k = e.key;
          if (deployed) {
            if (k === 'Enter' || k === ' ') {
              e.preventDefault();
              const d = root.querySelector('#bld-done');
              if (d) d.click();
            }
            if (k === 'r' || k === 'R') {
              const a = root.querySelector('#bld-adj');
              if (a) a.click();
            }
            return;
          }
          const n = steps[slot].options.length;
          if (k === 'ArrowLeft') {
            e.preventDefault();
            slot = (slot + steps.length - 1) % steps.length;
            opt = picks[slot] >= 0 ? picks[slot] : 0;
            ctx.sound.cursor();
            draw();
          } else if (k === 'ArrowRight') {
            e.preventDefault();
            slot = (slot + 1) % steps.length;
            opt = picks[slot] >= 0 ? picks[slot] : 0;
            ctx.sound.cursor();
            draw();
          } else if (k === 'ArrowUp') {
            e.preventDefault();
            opt = (opt + n - 1) % n;
            ctx.sound.cursor();
            draw();
          } else if (k === 'ArrowDown') {
            e.preventDefault();
            opt = (opt + 1) % n;
            ctx.sound.cursor();
            draw();
          } else if (/^[1-9]$/.test(k) && +k <= n) {
            opt = +k - 1;
            draw();
          } else if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            commit();
          } else if (k === 'd' || k === 'D') {
            deploy();
          }
        },
        destroy() {},
      };
    },
  };
}
