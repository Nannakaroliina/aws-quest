// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { esc } from './helpers';

export const autoscale = {
  controls: '▲ +1 instance  ·  ▼ -1  ·  A target-tracking',
  mount(root, ctx) {
    const TICKS = 42,
      MS = 360,
      UNIT = 100; // one instance serves ~100 req/s
    const demand = [];
    for (let t = 0; t < TICKS; t++) {
      let d = 250 + Math.sin(t / 5) * 70 + Math.sin(t / 2.3) * 24;
      if (t >= 13 && t < 19) d += 280; // flash crowd
      if (t >= 29) d += (t - 29) * 20; // sustained ramp
      demand.push(Math.max(80, Math.round(d)));
    }
    let tick = 0,
      cap = 3,
      auto = false,
      healthy = 0,
      dropped = 0,
      waste = 0,
      running = true;
    const hist = [];

    root.innerHTML =
      `<div class="sim-hud">` +
      `<span>t <b id="as-t">0</b>/${TICKS}</span>` +
      `<span>DEMAND <b id="as-d">–</b> r/s</span>` +
      `<span>CAPACITY <b id="as-c">–</b> r/s</span>` +
      `<span id="as-mode">MANUAL</span></div>` +
      `<canvas id="as-cv" width="560" height="168"></canvas>` +
      `<div class="sim-readout" id="as-read">Keep the green CAPACITY line just above the orange DEMAND line.</div>` +
      `<div class="sim-btnrow">` +
      `<button class="btn" id="as-up">▲ +1 INSTANCE</button>` +
      `<button class="btn" id="as-dn">▼ -1 INSTANCE</button>` +
      `<button class="btn" id="as-auto">⚙ TARGET TRACKING: OFF</button></div>`;

    const cv = root.querySelector('#as-cv');
    const g = cv.getContext('2d');
    const addCap = (n) => {
      cap = Math.max(1, Math.min(20, cap + n));
    };
    const toggleAuto = () => {
      auto = !auto;
      ctx.sound.select();
      root.querySelector('#as-auto').textContent = '⚙ TARGET TRACKING: ' + (auto ? 'ON' : 'OFF');
      root.querySelector('#as-mode').textContent = auto ? 'AUTO' : 'MANUAL';
    };
    root.querySelector('#as-up').onclick = () => {
      if (running) {
        addCap(1);
        ctx.sound.cursor();
      }
    };
    root.querySelector('#as-dn').onclick = () => {
      if (running) {
        addCap(-1);
        ctx.sound.cursor();
      }
    };
    root.querySelector('#as-auto').onclick = () => {
      if (running) toggleAuto();
    };

    function draw() {
      const W = cv.width,
        H = cv.height,
        max = 780,
        span = W / TICKS;
      const y = (v) => H - (Math.min(v, max) / max) * H;
      g.fillStyle = '#0b1021';
      g.fillRect(0, 0, W, H);
      g.strokeStyle = '#1b2350';
      g.lineWidth = 1;
      for (let k = 1; k < 4; k++) {
        g.beginPath();
        g.moveTo(0, (H / 4) * k);
        g.lineTo(W, (H / 4) * k);
        g.stroke();
      }
      const line = (key, col) => {
        g.strokeStyle = col;
        g.lineWidth = 2;
        g.beginPath();
        hist.forEach((p, n) => {
          const px = n * span,
            py = y(p[key]);
          n ? g.lineTo(px, py) : g.moveTo(px, py);
        });
        g.stroke();
      };
      line('d', '#ff9900');
      line('c', '#37e660');
    }
    function step() {
      if (!running) return;
      const d = demand[tick];
      if (auto) {
        const want = Math.ceil((d * 1.2) / UNIT);
        if (cap < want) addCap(1);
        else if (cap > want + 1) addCap(-1);
      }
      const c = cap * UNIT;
      if (c < d) dropped += d - c;
      else if (c > d * 1.8) waste += c - d * 1.8;
      else healthy++;
      hist.push({ d, c });
      draw();
      root.querySelector('#as-t').textContent = tick + 1;
      root.querySelector('#as-d').textContent = d;
      root.querySelector('#as-c').textContent = c;
      const rd = root.querySelector('#as-read');
      if (c < d) {
        rd.textContent = '⚠ UNDER-PROVISIONED — requests are being dropped';
        rd.className = 'sim-readout bad';
      } else if (c > d * 1.8) {
        rd.textContent = '$ OVER-PROVISIONED — paying for a large idle fleet';
        rd.className = 'sim-readout warn';
      } else {
        rd.textContent = '✔ healthy headroom';
        rd.className = 'sim-readout good';
      }
      tick++;
      if (tick >= TICKS) {
        running = false;
        clearInterval(iv);
        setTimeout(end, 450);
      }
    }
    function end() {
      const pct = Math.round((healthy / TICKS) * 100);
      const win = pct >= 60 && dropped < 1600;
      root.innerHTML =
        `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
        `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
        `<div>${pct}% of the run at healthy headroom</div>` +
        `<div class="small">~${Math.round(dropped)} requests dropped · ~${Math.round(waste)} r/s of idle capacity paid for</div>` +
        `<div class="small">${esc(
          win
            ? 'That is target tracking: capacity trails demand with a small buffer — never the floor, never a giant idle fleet. Scaling also lags a boot cycle, so the buffer matters.'
            : 'Under-provisioning drops users; big over-provisioning burns money. Target tracking holds the buffer automatically — turn it on and let min/max bound it.',
        )}</div>` +
        `<div class="choices"><button class="btn sel" id="as-done">DONE ▶</button></div></div>`;
      root.querySelector('#as-done').onclick = () => ctx.end({ win, score: pct });
    }

    draw();
    const iv = setInterval(step, MS);
    return {
      onKey(e) {
        const k = e.key;
        if (running) {
          if (k === 'ArrowUp') {
            e.preventDefault();
            addCap(1);
            ctx.sound.cursor();
          }
          if (k === 'ArrowDown') {
            e.preventDefault();
            addCap(-1);
            ctx.sound.cursor();
          }
          if (k === 'a' || k === 'A') toggleAuto();
        } else if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          const d = root.querySelector('#as-done');
          if (d) d.click();
        }
      },
      destroy() {
        clearInterval(iv);
      },
    };
  },
};
