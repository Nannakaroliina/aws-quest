// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { esc } from './helpers';

export const storageTiers = {
  controls: '↑ ↓ pick class  ·  ENTER assign',
  mount(root, ctx) {
    const CLASSES = [
      { k: 'STANDARD', store: 2.3, retr: false, ms: true },
      { k: 'STANDARD-IA', store: 1.25, retr: true, ms: true },
      { k: 'GLACIER INSTANT', store: 0.4, retr: true, ms: true },
      { k: 'GLACIER DEEP', store: 0.1, retr: true, ms: false },
    ];
    const OBJS = [
      { n: 'live product images', gb: 40, access: 'daily', fast: true },
      { n: 'this quarter’s invoices', gb: 8, access: 'monthly', fast: true },
      { n: 'last year’s application logs', gb: 120, access: 'yearly', fast: false },
      { n: 'raw camera footage (7-yr compliance hold)', gb: 400, access: 'never', fast: false },
      { n: 'ML training set (occasional re-runs)', gb: 200, access: 'monthly', fast: false },
      { n: 'nightly DB backups (restore = emergency)', gb: 60, access: 'never', fast: true },
    ];
    const bestFor = (o) => {
      const allowed = CLASSES.filter((c) => !o.fast || c.ms);
      if (o.access === 'daily') return CLASSES[0];
      if (o.access === 'monthly') return allowed.find((c) => c.k === 'STANDARD-IA') || allowed[0];
      return allowed[allowed.length - 1];
    };
    let ideal = 0;
    OBJS.forEach((o) => {
      ideal += (bestFor(o).store * o.gb) / 100;
    });

    let i = 0,
      cur = 0,
      bill = 0,
      violations = 0,
      answered = false;

    function draw() {
      const o = OBJS[i];
      root.innerHTML =
        `<div class="sim-hud"><span>OBJECT <b>${i + 1}</b>/${OBJS.length}</span>` +
        `<span>BILL ~$<b>${bill.toFixed(2)}</b>/mo</span><span>SLA MISSES <b>${violations}</b></span></div>` +
        `<div class="sim-prompt">${esc(o.n)}<br><span class="small">${o.gb} GB · accessed ${o.access} · ` +
        `${o.fast ? 'must retrieve in milliseconds' : 'slow retrieval acceptable'}</span></div>` +
        `<div class="choices" id="st-ch">` +
        CLASSES.map(
          (c, n) =>
            `<button class="btn" data-n="${n}">${c.k} <span class="small">~$${c.store.toFixed(2)}/100GB-mo storage` +
            `${c.retr ? ' · retrieval fee' : ''}${c.ms ? '' : ' · hours to restore'}</span></button>`,
        ).join('') +
        `</div><div class="small c-dim">Illustrative us-east-1 storage rates; request and retrieval charges excluded.</div>` +
        `<div id="st-fb"></div>`;
      root.querySelectorAll('#st-ch .btn').forEach((b) => {
        b.addEventListener('mousemove', () => {
          if (!answered) {
            cur = +b.dataset.n;
            paint();
          }
        });
        b.addEventListener('click', () => {
          if (!answered) {
            cur = +b.dataset.n;
            assign();
          }
        });
      });
      paint();
    }
    function paint() {
      root
        .querySelectorAll('#st-ch .btn')
        .forEach((b, n) => b.classList.toggle('sel', n === cur && !answered));
    }
    function assign() {
      const o = OBJS[i],
        c = CLASSES[cur];
      answered = true;
      bill += (c.store * o.gb) / 100;
      const notes = [];
      let bad = false;
      if (o.fast && !c.ms) {
        violations++;
        bad = true;
        notes.push('✘ Needs millisecond retrieval — ' + c.k + ' takes minutes to hours.');
      }
      if (o.access === 'daily' && c.retr > 0) {
        bad = true;
        notes.push(
          '⚠ Read daily, but this class charges per-GB retrieval — it will cost MORE than STANDARD in practice.',
        );
      }
      if (o.access === 'never' && cur === 0) {
        bad = true;
        notes.push('⚠ Never read, parked in the priciest class — money left on the table.');
      }
      if (!bad) notes.push('✔ Good fit for this access pattern.');
      ctx.sound[bad ? 'wrong' : 'correct']();
      root.querySelectorAll('#st-ch .btn').forEach((b, n) => {
        b.disabled = true;
        if (n === cur) b.classList.add(bad ? 'bad' : 'good', 'sel');
      });
      root.querySelector('#st-fb').innerHTML =
        `<div class="explain ${bad ? 'bad' : ''}">${notes.map(esc).join('<br>')}</div>` +
        `<div class="choices"><button class="btn sel" id="st-next">` +
        (i < OBJS.length - 1 ? 'NEXT ▶' : 'RESULTS ▶') +
        `</button></div>`;
      root.querySelector('#st-next').onclick = next;
    }
    function next() {
      if (i < OBJS.length - 1) {
        i++;
        cur = 0;
        answered = false;
        ctx.sound.move();
        draw();
      } else end();
    }
    function end() {
      const win = violations === 0 && bill / ideal <= 1.6;
      root.innerHTML =
        `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
        `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
        `<div>~$${bill.toFixed(2)}/mo · best case ~$${ideal.toFixed(2)}/mo</div>` +
        `<div class="small">${violations} retrieval-SLA miss${violations === 1 ? '' : 'es'}</div>` +
        `<div class="small">${esc(
          win
            ? 'Match the class to the ACCESS PATTERN: hot → Standard, warm → IA, cold → Glacier. Never drop below millisecond retrieval for data you might need during an incident (that is what Glacier Instant is for).'
            : 'Cost or an SLA slipped. Daily reads belong in Standard; “restore = emergency” data must stay millisecond-retrievable even when archived.',
        )}</div>` +
        `<div class="choices"><button class="btn sel" id="st-done">DONE ▶</button></div></div>`;
      root.querySelector('#st-done').onclick = () => ctx.end({ win });
    }

    draw();
    return {
      onKey(e) {
        const k = e.key;
        const nx = root.querySelector('#st-next'),
          dn = root.querySelector('#st-done');
        if (dn) {
          if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            dn.click();
          }
          return;
        }
        if (nx) {
          if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            nx.click();
          }
          return;
        }
        const n = CLASSES.length;
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
        if (/^[1-4]$/.test(k)) {
          cur = +k - 1;
          paint();
        }
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          assign();
        }
      },
      destroy() {},
    };
  },
};
