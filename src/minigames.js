/* =========================================================================
   AWS QUEST -- MINI-GAMES  ("inside the topic" interactive teachers)
   -------------------------------------------------------------------------
   A concept card can offer a playable sim that makes you *do* the mechanic,
   not just read it. Each game is registered on window.AWSQUEST_MINIGAMES.

   Registry entry (a "factory"):
     {
       controls : string  -- footer hint shown by the engine
       mount(root, ctx) -> { onKey(e), destroy() }
     }
   ctx = {
     concept   : the CONCEPTS[...] record
     sound     : window.AWSQUEST_SOUND
     toast(msg): transient banner
     end(res)  : hand control back to the level ( res = { win:bool, ... } )
   }

   Two reusable builders cover most games:
     makeQuiz(opts)  -- pick-the-right-answer rounds, optional afterPick() viz
     makeOrder(opts) -- put N steps in the order they really happen
   Bespoke games (autoscale, visibilityQueue, storageTiers) run their own loop.
   ========================================================================= */

(() => {
  'use strict';

  const GAMES = {};
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const barChart = (vals) =>
    '<div class="sim-bars">' +
    vals.map((v) => `<i class="${v > 90 ? 'hot' : ''}" style="height:${Math.max(4, v)}%"></i>`).join('') +
    '</div>';

  /* =====================================================================
     BUILDER: makeQuiz
     opts = {
       controls, winAt, winLine, loseLine,
       rounds: [ { prompt, extra?, choices:[str], answer:idx, why } , ... ],
       afterPick?(round, pickedIdx, feedbackEl)   -- optional extra viz
     }
     ===================================================================== */
  function makeQuiz(opts) {
    return {
      controls: opts.controls || '↑ ↓ pick  ·  ENTER lock in',
      mount(root, ctx) {
        let i = 0, correct = 0, locked = false, cur = 0;

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
            b.addEventListener('mousemove', () => { if (!locked) { cur = +b.dataset.n; paint(); } });
            b.addEventListener('click', () => { if (!locked) { cur = +b.dataset.n; lock(); } });
          });
          paint();
        }
        function paint() {
          root.querySelectorAll('#q-ch .btn').forEach((b, n) => b.classList.toggle('sel', n === cur && !locked));
        }
        function lock() {
          const r = opts.rounds[i];
          locked = true;
          const ok = cur === r.answer;
          if (ok) { correct++; ctx.sound.correct(); } else ctx.sound.wrong();
          root.querySelectorAll('#q-ch .btn').forEach((b, n) => {
            b.disabled = true;
            if (n === r.answer) b.classList.add('good', 'sel');
            if (n === cur && !ok) b.classList.add('bad', 'sel');
          });
          const fb = root.querySelector('#q-fb');
          fb.innerHTML =
            `<div class="explain ${ok ? '' : 'bad'}">` +
            (ok ? '<b class="c-green">CORRECT</b><br>' : '<b class="c-red">NOT QUITE</b><br>') +
            esc(r.why) + '</div>' +
            `<div class="choices"><button class="btn sel" id="q-next">` +
            (i < opts.rounds.length - 1 ? 'NEXT ▶' : 'RESULTS ▶') + '</button></div>';
          if (opts.afterPick) opts.afterPick(r, cur, fb);
          root.querySelector('#q-next').addEventListener('click', next);
        }
        function next() {
          if (i < opts.rounds.length - 1) { i++; locked = false; cur = 0; ctx.sound.move(); draw(); }
          else finish();
        }
        function finish() {
          const win = correct >= opts.winAt;
          root.innerHTML =
            `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
            `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
            `<div>${correct} / ${opts.rounds.length} correct</div>` +
            `<div class="small">${esc(win ? (opts.winLine || 'You have the mechanic down.')
              : (opts.loseLine || 'Revisit the deep dive and run it again.'))}</div>` +
            `<div class="choices"><button class="btn sel" id="q-done">DONE ▶</button></div></div>`;
          root.querySelector('#q-done').addEventListener('click', () => ctx.end({ win, score: correct }));
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
            if (k === 'ArrowUp') { e.preventDefault(); cur = (cur + n - 1) % n; ctx.sound.cursor(); paint(); }
            if (k === 'ArrowDown') { e.preventDefault(); cur = (cur + 1) % n; ctx.sound.cursor(); paint(); }
            if (/^[1-9]$/.test(k) && +k <= n) { cur = +k - 1; paint(); }
            if (k === 'Enter' || k === ' ') { e.preventDefault(); lock(); }
          },
          destroy() {},
        };
      },
    };
  }

  /* =====================================================================
     BUILDER: makeOrder
     opts = { controls, winLine, steps:[ { t, tip } , ... ] (correct order) }
     ===================================================================== */
  function makeOrder(opts) {
    return {
      controls: opts.controls || '↑ ↓ pick step  ·  ENTER place',
      mount(root, ctx) {
        const correct = opts.steps.map((s, idx) => ({ t: s.t, tip: s.tip, idx }));
        const pool = shuffle(correct.slice());
        const placed = [];
        let cur = 0, misses = 0;

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
            b.addEventListener('mousemove', () => { cur = +b.dataset.n; paint(); });
            b.addEventListener('click', () => { cur = +b.dataset.n; pick(); });
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
            if (fb) fb.innerHTML = `<div class="explain bad">Not yet — that step depends on something that hasn't happened.</div>`;
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
              if (k === 'Enter' || k === ' ') { e.preventDefault(); const d = root.querySelector('#o-done'); if (d) d.click(); }
              return;
            }
            if (k === 'ArrowUp') { e.preventDefault(); cur = (cur + n - 1) % n; ctx.sound.cursor(); paint(); }
            if (k === 'ArrowDown') { e.preventDefault(); cur = (cur + 1) % n; ctx.sound.cursor(); paint(); }
            if (k === 'Enter' || k === ' ') { e.preventDefault(); pick(); }
          },
          destroy() {},
        };
      },
    };
  }

  /* =====================================================================
     GAME: autoscale  (EC2 Auto Scaling) -- real-time thermostat
     ===================================================================== */
  GAMES.autoscale = {
    controls: '▲ +1 instance  ·  ▼ -1  ·  A target-tracking',
    mount(root, ctx) {
      const TICKS = 42, MS = 360, UNIT = 100; // one instance serves ~100 req/s
      const demand = [];
      for (let t = 0; t < TICKS; t++) {
        let d = 250 + Math.sin(t / 5) * 70 + Math.sin(t / 2.3) * 24;
        if (t >= 13 && t < 19) d += 280;      // flash crowd
        if (t >= 29) d += (t - 29) * 20;      // sustained ramp
        demand.push(Math.max(80, Math.round(d)));
      }
      let tick = 0, cap = 3, auto = false, healthy = 0, dropped = 0, waste = 0, running = true;
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
      const addCap = (n) => { cap = Math.max(1, Math.min(20, cap + n)); };
      const toggleAuto = () => {
        auto = !auto; ctx.sound.select();
        root.querySelector('#as-auto').textContent = '⚙ TARGET TRACKING: ' + (auto ? 'ON' : 'OFF');
        root.querySelector('#as-mode').textContent = auto ? 'AUTO' : 'MANUAL';
      };
      root.querySelector('#as-up').onclick = () => { if (running) { addCap(1); ctx.sound.cursor(); } };
      root.querySelector('#as-dn').onclick = () => { if (running) { addCap(-1); ctx.sound.cursor(); } };
      root.querySelector('#as-auto').onclick = () => { if (running) toggleAuto(); };

      function draw() {
        const W = cv.width, H = cv.height, max = 780, span = W / TICKS;
        const y = (v) => H - (Math.min(v, max) / max) * H;
        g.fillStyle = '#0b1021'; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#1b2350'; g.lineWidth = 1;
        for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, (H / 4) * k); g.lineTo(W, (H / 4) * k); g.stroke(); }
        const line = (key, col) => {
          g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
          hist.forEach((p, n) => { const px = n * span, py = y(p[key]); n ? g.lineTo(px, py) : g.moveTo(px, py); });
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
        if (c < d) { rd.textContent = '⚠ UNDER-PROVISIONED — requests are being dropped'; rd.className = 'sim-readout bad'; }
        else if (c > d * 1.8) { rd.textContent = '$ OVER-PROVISIONED — paying for a large idle fleet'; rd.className = 'sim-readout warn'; }
        else { rd.textContent = '✔ healthy headroom'; rd.className = 'sim-readout good'; }
        tick++;
        if (tick >= TICKS) { running = false; clearInterval(iv); setTimeout(end, 450); }
      }
      function end() {
        const pct = Math.round((healthy / TICKS) * 100);
        const win = pct >= 60 && dropped < 1600;
        root.innerHTML =
          `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
          `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
          `<div>${pct}% of the run at healthy headroom</div>` +
          `<div class="small">~${Math.round(dropped)} requests dropped · ~${Math.round(waste)} r/s of idle capacity paid for</div>` +
          `<div class="small">${esc(win
            ? 'That is target tracking: capacity trails demand with a small buffer — never the floor, never a giant idle fleet. Scaling also lags a boot cycle, so the buffer matters.'
            : 'Under-provisioning drops users; big over-provisioning burns money. Target tracking holds the buffer automatically — turn it on and let min/max bound it.')}</div>` +
          `<div class="choices"><button class="btn sel" id="as-done">DONE ▶</button></div></div>`;
        root.querySelector('#as-done').onclick = () => ctx.end({ win, score: pct });
      }

      draw();
      const iv = setInterval(step, MS);
      return {
        onKey(e) {
          const k = e.key;
          if (running) {
            if (k === 'ArrowUp') { e.preventDefault(); addCap(1); ctx.sound.cursor(); }
            if (k === 'ArrowDown') { e.preventDefault(); addCap(-1); ctx.sound.cursor(); }
            if (k === 'a' || k === 'A') toggleAuto();
          } else if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            const d = root.querySelector('#as-done'); if (d) d.click();
          }
        },
        destroy() { clearInterval(iv); },
      };
    },
  };

  /* =====================================================================
     GAME: visibilityQueue  (Amazon SQS) -- receive / process / delete / DLQ
     ===================================================================== */
  GAMES.visibilityQueue = {
    controls: 'R receive  ·  P process  ·  D delete  ·  Q → DLQ',
    mount(root, ctx) {
      const VIS = 6000, LIMIT = 58000;
      function mk(id, label, poison) { return { id, label, poison: !!poison, state: 'queued', recv: 0, until: 0, ok: false }; }
      const msgs = [
        mk('m1', 'resize-image #1'), mk('m2', 'resize-image #2'), mk('m3', 'send-welcome-email'),
        mk('m4', 'charge-card (bad token)', true), mk('m5', 'resize-image #3'), mk('m6', 'build-report'),
      ];
      let done = 0, dlq = 0, running = true, note = '';
      const deadline = Date.now() + LIMIT;
      const inflight = () => msgs.find((m) => m.state === 'inflight');
      const nextQueued = () => msgs.find((m) => m.state === 'queued');

      function say(s) { note = s; render(); }
      function receive() {
        if (inflight()) return say('A message is already in flight — process or delete it first.');
        const m = nextQueued();
        if (!m) return say('Queue is empty.');
        m.state = 'inflight'; m.recv++; m.until = Date.now() + VIS; m.ok = false;
        ctx.sound.select();
        say('Received "' + m.label + '". It is INVISIBLE to other consumers until the timeout expires.');
      }
      function process() {
        const m = inflight();
        if (!m) return say('Receive a message before processing.');
        if (m.poison) { ctx.sound.wrong(); say('✘ "' + m.label + '" threw on attempt ' + m.recv + '. Do NOT delete it — let it time out or send it to the DLQ.'); }
        else { m.ok = true; ctx.sound.correct(); say('✔ Processed "' + m.label + '". Now DELETE it or it reappears after the timeout.'); }
      }
      function del() {
        const m = inflight();
        if (!m) return say('Nothing in flight to delete.');
        if (!m.ok) return say('Process the work first (a real consumer would do the job, then delete).');
        m.state = 'done'; done++; ctx.sound.coin(); say('Deleted "' + m.label + '" — gone for good.');
        check();
      }
      function toDlq() {
        const m = inflight();
        if (!m) return say('Nothing in flight.');
        if (m.recv < 3) return say('The DLQ is for messages past maxReceiveCount (3). This one is at ' + m.recv + '.');
        m.state = 'dlq'; dlq++; ctx.sound.unlock(); say('Moved "' + m.label + '" to the dead-letter queue. The main queue is unblocked.');
        check();
      }
      function check() { if (done + dlq >= msgs.length) { running = false; clearInterval(iv); setTimeout(() => end(true), 350); } }

      function tickLoop() {
        if (!running) return;
        const m = inflight();
        if (m && Date.now() > m.until) {
          m.state = 'queued'; m.ok = false;
          say('⏰ Visibility timeout expired — "' + m.label + '" is back in the queue (recv ' + m.recv + ').');
        }
        if (Date.now() > deadline) { running = false; clearInterval(iv); return end(false); }
        render();
      }
      function render() {
        const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000));
        root.innerHTML =
          `<div class="sim-hud"><span>CLEARED <b>${done}</b></span><span>DLQ <b>${dlq}</b></span>` +
          `<span>time <b>${secs}s</b></span></div>` +
          `<div class="sim-queue">` +
          msgs.map((m) => {
            const left = m.state === 'inflight' ? Math.max(0, Math.round((m.until - Date.now()) / 1000)) + 's' : '';
            return `<div class="qmsg q-${m.state}"><b>${esc(m.label)}</b>` +
              `<span class="small">${m.state}${left ? ' ' + left : ''} · recv ${m.recv}${m.poison ? ' · ☠' : ''}</span></div>`;
          }).join('') +
          `</div>` +
          `<div class="sim-readout" id="vq-note">${esc(note || 'RECEIVE a message, PROCESS it, then DELETE it. One job never succeeds — get it to the DLQ.')}</div>` +
          `<div class="sim-btnrow">` +
          `<button class="btn" id="vq-r">RECEIVE</button><button class="btn" id="vq-p">PROCESS</button>` +
          `<button class="btn" id="vq-d">DELETE</button><button class="btn" id="vq-q">→ DLQ</button></div>`;
        if (!running) return;
        root.querySelector('#vq-r').onclick = receive;
        root.querySelector('#vq-p').onclick = process;
        root.querySelector('#vq-d').onclick = del;
        root.querySelector('#vq-q').onclick = toDlq;
      }
      function end(win) {
        running = false;
        root.innerHTML =
          `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
          `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
          `<div>${done} cleared · ${dlq} to DLQ</div>` +
          `<div class="small">${esc(win
            ? 'A received message is hidden, not gone. Delete on success; after 3 failed receives the poison job goes to the DLQ so it stops blocking everything behind it.'
            : 'Time ran out. Receive → process → DELETE fast, and send the repeat-failing job to the DLQ once recv hits 3.')}</div>` +
          `<div class="choices"><button class="btn sel" id="vq-done">DONE ▶</button></div></div>`;
        root.querySelector('#vq-done').onclick = () => ctx.end({ win });
      }

      render();
      const iv = setInterval(tickLoop, 250);
      return {
        onKey(e) {
          const k = e.key.toLowerCase();
          if (!running) {
            if (k === 'enter' || k === ' ') { e.preventDefault(); const d = root.querySelector('#vq-done'); if (d) d.click(); }
            return;
          }
          if (k === 'r') receive();
          if (k === 'p') process();
          if (k === 'd') del();
          if (k === 'q') toDlq();
        },
        destroy() { clearInterval(iv); },
      };
    },
  };

  /* =====================================================================
     GAME: storageTiers  (S3 Storage Classes) -- assign a class, chase the bill
     ===================================================================== */
  GAMES.storageTiers = {
    controls: '↑ ↓ pick class  ·  ENTER assign',
    mount(root, ctx) {
      const CLASSES = [
        { k: 'STANDARD', store: 2.30, retr: false, ms: true },
        { k: 'STANDARD-IA', store: 1.25, retr: true, ms: true },
        { k: 'GLACIER INSTANT', store: 0.40, retr: true, ms: true },
        { k: 'GLACIER DEEP', store: 0.10, retr: true, ms: false },
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
      OBJS.forEach((o) => { ideal += (bestFor(o).store * o.gb) / 100; });

      let i = 0, cur = 0, bill = 0, violations = 0, answered = false;

      function draw() {
        const o = OBJS[i];
        root.innerHTML =
          `<div class="sim-hud"><span>OBJECT <b>${i + 1}</b>/${OBJS.length}</span>` +
          `<span>BILL ~$<b>${bill.toFixed(2)}</b>/mo</span><span>SLA MISSES <b>${violations}</b></span></div>` +
          `<div class="sim-prompt">${esc(o.n)}<br><span class="small">${o.gb} GB · accessed ${o.access} · ` +
          `${o.fast ? 'must retrieve in milliseconds' : 'slow retrieval acceptable'}</span></div>` +
          `<div class="choices" id="st-ch">` +
          CLASSES.map((c, n) =>
            `<button class="btn" data-n="${n}">${c.k} <span class="small">~$${c.store.toFixed(2)}/100GB-mo storage` +
            `${c.retr ? ' · retrieval fee' : ''}${c.ms ? '' : ' · hours to restore'}</span></button>`).join('') +
          `</div><div class="small c-dim">Illustrative us-east-1 storage rates; request and retrieval charges excluded.</div>` +
          `<div id="st-fb"></div>`;
        root.querySelectorAll('#st-ch .btn').forEach((b) => {
          b.addEventListener('mousemove', () => { if (!answered) { cur = +b.dataset.n; paint(); } });
          b.addEventListener('click', () => { if (!answered) { cur = +b.dataset.n; assign(); } });
        });
        paint();
      }
      function paint() {
        root.querySelectorAll('#st-ch .btn').forEach((b, n) => b.classList.toggle('sel', n === cur && !answered));
      }
      function assign() {
        const o = OBJS[i], c = CLASSES[cur];
        answered = true;
        bill += (c.store * o.gb) / 100;
        const notes = [];
        let bad = false;
        if (o.fast && !c.ms) { violations++; bad = true; notes.push('✘ Needs millisecond retrieval — ' + c.k + ' takes minutes to hours.'); }
        if (o.access === 'daily' && c.retr > 0) { bad = true; notes.push('⚠ Read daily, but this class charges per-GB retrieval — it will cost MORE than STANDARD in practice.'); }
        if (o.access === 'never' && cur === 0) { bad = true; notes.push('⚠ Never read, parked in the priciest class — money left on the table.'); }
        if (!bad) notes.push('✔ Good fit for this access pattern.');
        ctx.sound[bad ? 'wrong' : 'correct']();
        root.querySelectorAll('#st-ch .btn').forEach((b, n) => {
          b.disabled = true;
          if (n === cur) b.classList.add(bad ? 'bad' : 'good', 'sel');
        });
        root.querySelector('#st-fb').innerHTML =
          `<div class="explain ${bad ? 'bad' : ''}">${notes.map(esc).join('<br>')}</div>` +
          `<div class="choices"><button class="btn sel" id="st-next">` +
          (i < OBJS.length - 1 ? 'NEXT ▶' : 'RESULTS ▶') + `</button></div>`;
        root.querySelector('#st-next').onclick = next;
      }
      function next() {
        if (i < OBJS.length - 1) { i++; cur = 0; answered = false; ctx.sound.move(); draw(); }
        else end();
      }
      function end() {
        const win = violations === 0 && bill / ideal <= 1.6;
        root.innerHTML =
          `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
          `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
          `<div>~$${bill.toFixed(2)}/mo · best case ~$${ideal.toFixed(2)}/mo</div>` +
          `<div class="small">${violations} retrieval-SLA miss${violations === 1 ? '' : 'es'}</div>` +
          `<div class="small">${esc(win
            ? 'Match the class to the ACCESS PATTERN: hot → Standard, warm → IA, cold → Glacier. Never drop below millisecond retrieval for data you might need during an incident (that is what Glacier Instant is for).'
            : 'Cost or an SLA slipped. Daily reads belong in Standard; “restore = emergency” data must stay millisecond-retrievable even when archived.')}</div>` +
          `<div class="choices"><button class="btn sel" id="st-done">DONE ▶</button></div></div>`;
        root.querySelector('#st-done').onclick = () => ctx.end({ win });
      }

      draw();
      return {
        onKey(e) {
          const k = e.key;
          const nx = root.querySelector('#st-next'), dn = root.querySelector('#st-done');
          if (dn) { if (k === 'Enter' || k === ' ') { e.preventDefault(); dn.click(); } return; }
          if (nx) { if (k === 'Enter' || k === ' ') { e.preventDefault(); nx.click(); } return; }
          const n = CLASSES.length;
          if (k === 'ArrowUp') { e.preventDefault(); cur = (cur + n - 1) % n; ctx.sound.cursor(); paint(); }
          if (k === 'ArrowDown') { e.preventDefault(); cur = (cur + 1) % n; ctx.sound.cursor(); paint(); }
          if (/^[1-4]$/.test(k)) { cur = +k - 1; paint(); }
          if (k === 'Enter' || k === ' ') { e.preventDefault(); assign(); }
        },
        destroy() {},
      };
    },
  };

  /* =====================================================================
     GAME: subnetRouter  (Amazon VPC) -- send each packet out the right door
     ===================================================================== */
  GAMES.subnetRouter = makeQuiz({
    controls: '↑ ↓ pick a route  ·  ENTER send',
    winAt: 6,
    winLine: 'A subnet is “public” only because its route table points 0.0.0.0/0 at an Internet Gateway. Private subnets reach out via NAT, reach AWS services via endpoints, and reach each other via the local route.',
    loseLine: 'Re-read the routing section: IGW = in/out to the internet for public subnets, NAT = outbound-only for private, endpoints = private path to S3/DynamoDB, local = inside the VPC.',
    rounds: [
      {
        prompt: 'An app server in a PRIVATE subnet needs to download an OS security patch from the public internet.',
        choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
        answer: 1,
        why: 'Private subnets have no route to the IGW. Outbound-only internet access goes through a NAT Gateway sitting in a public subnet.',
      },
      {
        prompt: 'That same private app server needs to PUT backup files into an S3 bucket in the same region.',
        choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint (S3/DynamoDB)', 'Local route'],
        answer: 2,
        why: 'A gateway endpoint keeps S3 traffic on the AWS network — no NAT data-processing charges, nothing traverses the internet.',
      },
      {
        prompt: 'The app server needs to reach the database in a different private subnet of the SAME VPC.',
        choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
        answer: 3,
        why: 'Every subnet in a VPC can reach every other subnet through the implicit local route. No gateway is involved.',
      },
      {
        prompt: 'A public Application Load Balancer must accept HTTPS from users on the internet.',
        choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
        answer: 0,
        why: 'The ALB lives in a public subnet whose route table sends 0.0.0.0/0 to the Internet Gateway — that is what makes it reachable.',
      },
      {
        prompt: 'A Lambda function attached to the VPC needs to call the DynamoDB API.',
        choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint (S3/DynamoDB)', 'Local route'],
        answer: 2,
        why: 'DynamoDB, like S3, is reached through a gateway VPC endpoint — no NAT required and traffic stays private.',
      },
      {
        prompt: 'A private worker calls a third-party payment API at api.example-payments.com.',
        choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
        answer: 1,
        why: 'An arbitrary internet endpoint has no VPC endpoint, so outbound traffic must go through NAT.',
      },
      {
        prompt: 'An instance in AZ-a talks to an instance in AZ-b — both private, same VPC.',
        choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
        answer: 3,
        why: 'The local route spans every AZ of the VPC; that traffic never leaves the AWS network.',
      },
      {
        prompt: 'A bastion host in a PUBLIC subnet receives an inbound SSH connection from an admin laptop on the internet.',
        choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
        answer: 0,
        why: 'Inbound from the internet to a public subnet arrives via the IGW. (Better still: skip the bastion and use SSM Session Manager.)',
      },
    ],
  });

  /* =====================================================================
     GAME: loadBalancer  (Elastic Load Balancing) -- pick the right front door
     ===================================================================== */
  GAMES.loadBalancer = makeQuiz({
    controls: '↑ ↓ pick  ·  ENTER lock in',
    winAt: 4,
    winLine: 'ALB = Layer 7 (routes by host/path/header, terminates TLS, auth). NLB = Layer 4 (raw TCP/UDP, static IP, extreme throughput). Health checks pull sick targets out of rotation; Auto Scaling replaces them.',
    loseLine: 'Re-read the ELB card: match the OSI layer to the need, terminate TLS at the balancer, and let health checks + slow start protect a warming app.',
    rounds: [
      {
        prompt: 'You must route example.com/api/* to one target group and /images/* to another, purely by URL path.',
        choices: ['Application Load Balancer', 'Network Load Balancer', 'Route 53 records', 'A Security Group rule'],
        answer: 0,
        why: 'Path / host / header routing is a Layer 7 feature — that is the ALB.',
      },
      {
        prompt: 'A game backend needs raw TCP throughput, the lowest possible latency, and a fixed static IP for an allow-list.',
        choices: ['Application Load Balancer', 'Network Load Balancer', 'CloudFront', 'API Gateway'],
        answer: 1,
        why: 'The NLB works at Layer 4, preserves the client IP, hands out static/Elastic IPs, and scales to millions of req/s.',
      },
      {
        prompt: 'One instance in a target group starts failing its health check.',
        choices: ['The load balancer terminates the instance', 'The LB stops sending it new requests until it passes again', 'All targets in the group restart', 'TLS is disabled for the listener'],
        answer: 1,
        why: 'Unhealthy targets are removed from rotation, not killed. Auto Scaling (a separate service) is what replaces them.',
      },
      {
        prompt: 'Where should you terminate TLS and attach the ACM certificate for a web app behind a fleet?',
        choices: ['On every EC2 instance', 'On the load balancer listener', 'In the Route 53 hosted zone', 'On the VPC'],
        answer: 1,
        why: 'Terminate at the balancer with an ACM cert and add an HTTP→HTTPS redirect on the :80 listener. Instances stay plain HTTP inside the VPC.',
      },
      {
        prompt: 'A newly registered instance needs ~40 seconds to warm caches before it can serve well.',
        choices: ['Nothing — it takes full traffic immediately and errors', 'Use the health check + slow start so traffic ramps only once it is healthy', 'Disable health checks so it is never marked down', 'Move it to a different AZ'],
        answer: 1,
        why: 'Health checks keep traffic off until the app is ready; slow start then ramps requests in gradually instead of hitting it at full load.',
      },
      {
        prompt: 'You need to run a third-party firewall / IDS appliance transparently in the traffic path.',
        choices: ['Application Load Balancer', 'Network Load Balancer', 'Gateway Load Balancer', 'CloudFront'],
        answer: 2,
        why: 'The Gateway Load Balancer inserts inline appliances (firewalls, IDS/IPS) using the GENEVE protocol, invisibly to the application.',
      },
    ],
  });

  /* =====================================================================
     GAME: iamEval  (AWS IAM) -- be the policy engine, return ALLOW / DENY
     ===================================================================== */
  GAMES.iamEval = makeQuiz({
    controls: '↑ ↓ verdict  ·  ENTER decide',
    winAt: 4,
    winLine: 'Evaluation order: any explicit Deny (identity, resource, SCP, boundary) → DENY. Otherwise you need an Allow that survives every scope — identity ∩ permission boundary ∩ SCP. No Allow at all → implicit deny.',
    loseLine: 'Walk it every time: explicit Deny anywhere? then is it Allowed in identity AND boundary AND SCP? no Allow = deny by default.',
    rounds: [
      {
        prompt: 'Role has an identity policy allowing s3:GetObject on the bucket. No SCP or permission boundary restricts it. Request: GetObject.',
        choices: ['ALLOW', 'DENY'],
        answer: 0,
        why: 'Allowed in the identity policy, nothing denies it, no scope removes it → allow.',
      },
      {
        prompt: 'Identity policy allows ec2:*. An SCP on the account explicitly denies ec2:TerminateInstances. Request: TerminateInstances.',
        choices: ['ALLOW', 'DENY'],
        answer: 1,
        why: 'An explicit Deny — here in an SCP — overrides any Allow, no matter how broad.',
      },
      {
        prompt: 'No identity policy grants dynamodb:PutItem. There is no explicit Deny anywhere. Request: PutItem.',
        choices: ['ALLOW', 'DENY'],
        answer: 1,
        why: 'No explicit Allow means implicit deny. Access has to be granted; silence is “no”.',
      },
      {
        prompt: 'Identity policy allows lambda:InvokeFunction. The role’s permission boundary only allows s3:* and dynamodb:*. Request: InvokeFunction.',
        choices: ['ALLOW', 'DENY'],
        answer: 1,
        why: 'Effective permissions are the INTERSECTION of the identity policy and the boundary. lambda:* is not in the boundary, so it is denied.',
      },
      {
        prompt: 'Same account: the bucket’s resource policy allows this role to GetObject. The identity policy is silent. No Deny anywhere. Request: GetObject.',
        choices: ['ALLOW', 'DENY'],
        answer: 0,
        why: 'Within one account, an Allow in EITHER the identity policy or the resource policy is enough (cross-account needs both).',
      },
      {
        prompt: 'Identity policy allows s3:*. The bucket policy has an explicit Deny for this principal. Request: GetObject.',
        choices: ['ALLOW', 'DENY'],
        answer: 1,
        why: 'Explicit Deny in the resource policy wins over the identity Allow — explicit Deny always wins.',
      },
    ],
  });

  /* =====================================================================
     GAME: hotPartition  (Amazon DynamoDB) -- pick a key, watch the load land
     ===================================================================== */
  GAMES.hotPartition = makeQuiz({
    controls: '↑ ↓ pick a key  ·  ENTER commit',
    winAt: 2,
    winLine: 'Throughput scales with the number of DISTINCT, evenly-used partition-key values. Low-cardinality keys (status, type), time-based keys, or a single whale value all pile onto one partition and throttle — even when total table capacity looks fine.',
    loseLine: 'The partition key is hashed to choose a partition. You want lots of values, hit evenly. Add a second dimension when one value dominates.',
    afterPick(r, picked, fb) {
      const vals = r._bars[picked];
      const hot = vals.some((v) => v > 90);
      fb.insertAdjacentHTML(
        'afterbegin',
        `<div class="small">write load across 8 partitions with that key:</div>${barChart(vals)}` +
        (hot
          ? '<div class="explain bad">🔥 Hot partition — this key throttles under load.</div>'
          : '<div class="explain"><b class="c-green">Even spread</b> — no throttling.</div>')
      );
    },
    rounds: [
      {
        prompt: 'Table: user clickstream events, ~50M writes/day. Choose the partition key.',
        choices: ['eventType  (click / view / scroll / hover)', 'userId  (millions of distinct values)', 'eventDate  (today’s date)'],
        _bars: [[96, 90, 5, 3, 2, 0, 0, 0], [58, 62, 55, 60, 57, 59, 61, 54], [99, 0, 0, 0, 0, 0, 0, 0]],
        answer: 1,
        why: 'userId is high-cardinality and accessed evenly, so writes spread across every partition. eventType has ~4 values; eventDate funnels an entire day onto one partition.',
      },
      {
        prompt: 'Table: telemetry from 100,000 IoT devices. Choose the partition key.',
        choices: ['sensorStatus  (OK / WARN / FAIL)', 'deviceId  (one per device)', 'readingHour  (0–23)'],
        _bars: [[93, 68, 28, 0, 0, 0, 0, 0], [55, 60, 58, 52, 61, 57, 59, 56], [88, 10, 8, 6, 4, 3, 2, 2]],
        answer: 1,
        why: 'deviceId scales with the fleet and spreads load. Status has 3 values; the current hour becomes a hotspot for every device at once.',
      },
      {
        prompt: 'Multi-tenant SaaS. One tenant drives 60% of all traffic. Choose the partition key.',
        choices: ['tenantId', 'tenantId#itemId  (composite)', 'region  (us / eu / ap)'],
        _bars: [[99, 40, 20, 10, 5, 3, 2, 1], [57, 59, 58, 60, 56, 61, 55, 58], [82, 60, 24, 0, 0, 0, 0, 0]],
        answer: 1,
        why: 'When one value dominates, add a second dimension. tenantId#itemId splits even the whale tenant across many partitions; plain tenantId saturates one.',
      },
    ],
  });

  /* =====================================================================
     GAME: envelopeCrypto  (AWS KMS) -- order the envelope encryption steps
     ===================================================================== */
  GAMES.envelopeCrypto = makeOrder({
    controls: '↑ ↓ pick step  ·  ENTER place',
    winLine: 'That is envelope encryption: KMS only ever handles a tiny data key, your app does the bulk crypto locally — so KMS never sits in the data path and the whole thing stays fast and cheap.',
    steps: [
      { t: 'App calls KMS GenerateDataKey for the KMS key', tip: 'KMS returns a plaintext data key AND a copy of that key encrypted under the KMS key.' },
      { t: 'Encrypt the file locally with the plaintext data key', tip: 'The bulk bytes are encrypted on your side — they never travel to KMS.' },
      { t: 'Store the ciphertext + the encrypted data key together', tip: 'They travel as a pair. The encrypted data key is useless to anyone without KMS.' },
      { t: 'Wipe the plaintext data key from memory', tip: 'Now nothing on disk can decrypt the file without a call back to KMS.' },
      { t: 'Later: send the encrypted data key to KMS Decrypt', tip: 'KMS checks the key policy / grants, then returns the plaintext data key.' },
      { t: 'Decrypt the file locally with the recovered data key', tip: 'Same envelope pattern in reverse — KMS stayed out of the data path the entire time.' },
    ],
  });

  /* =====================================================================
     GAME: stateOrder  (AWS Step Functions) -- order the state machine
     ===================================================================== */
  GAMES.stateOrder = makeOrder({
    controls: '↑ ↓ pick state  ·  ENTER place',
    winLine: 'A Step Functions workflow is an explicit state machine: each state’s Next defines the order, a Choice branches, a Parallel forks and joins, and Catch/Retry handle failure — all in the state machine, not your code.',
    steps: [
      { t: 'Task: ValidateOrder (Lambda)', tip: 'The first state runs against the input passed to StartExecution.' },
      { t: 'Choice: is the order valid?', tip: 'A Choice state branches on the previous result — valid vs invalid.' },
      { t: 'Task: ReserveInventory', tip: 'Only reached on the “valid” branch of the Choice.' },
      { t: 'Parallel: charge card + send confirmation email', tip: 'A Parallel state runs both branches concurrently and waits for all of them.' },
      { t: 'Task: MarkOrderComplete', tip: 'Runs after the Parallel state joins its branches.' },
      { t: 'Succeed', tip: 'A terminal state. The invalid branch would instead end at a Fail state.' },
    ],
  });

  /* =====================================================================
     GAME: eventPattern  (Amazon EventBridge) -- does the rule match?
     ===================================================================== */
  GAMES.eventPattern = makeQuiz({
    controls: '↑ ↓ verdict  ·  ENTER decide',
    winAt: 4,
    winLine: 'An event pattern matches only if EVERY field it names is present and the event’s value is in the allowed list (or satisfies the matcher: prefix, numeric, exists, anything-but). Fields the pattern omits are not filtered at all.',
    loseLine: 'Read the pattern field by field: each key must be present in the event, and the value must be in the list or pass the matcher. Nested keys count too.',
    rounds: [
      {
        prompt: 'Event: source "aws.s3", detail-type "Object Created", bucket "app-uploads". Does it match?',
        extra: '{ "source": ["aws.s3"], "detail-type": ["Object Created"] }',
        choices: ['MATCHES', 'does NOT match'],
        answer: 0,
        why: 'Every field named in the pattern is present and its value is in the allowed list. The extra "bucket" field is simply ignored.',
      },
      {
        prompt: 'Event: source "aws.s3", detail-type "Object Deleted". Does it match?',
        extra: '{ "source": ["aws.s3"], "detail-type": ["Object Created"] }',
        choices: ['MATCHES', 'does NOT match'],
        answer: 1,
        why: 'detail-type must be one of the listed values. "Object Deleted" is not "Object Created", so the rule does not fire.',
      },
      {
        prompt: 'Event: source "aws.ec2", detail.state = "running". Does it match?',
        extra: '{ "source": ["aws.ec2"], "detail": { "state": ["stopped", "terminated"] } }',
        choices: ['MATCHES', 'does NOT match'],
        answer: 1,
        why: 'Nested fields are matched too. "running" is not in [stopped, terminated].',
      },
      {
        prompt: 'Event: source "aws.autoscaling". Does it match?',
        extra: '{ "source": [ { "prefix": "aws." } ] }',
        choices: ['MATCHES', 'does NOT match'],
        answer: 0,
        why: 'The prefix content-filter matches any source string that starts with "aws.".',
      },
      {
        prompt: 'Event: detail.amount = 250. Does it match?',
        extra: '{ "detail": { "amount": [ { "numeric": [ ">", 100 ] } ] } }',
        choices: ['MATCHES', 'does NOT match'],
        answer: 0,
        why: 'The numeric matcher evaluates 250 > 100 → true.',
      },
      {
        prompt: 'Event: source "aws.s3", bucket "some-other-teams-bucket". You only care about your bucket. Does the rule match?',
        extra: '{ "source": ["aws.s3"] }',
        choices: ['MATCHES', 'does NOT match'],
        answer: 0,
        why: 'The pattern only filters on source, so it matches EVERY S3 event. To narrow it you would add a detail filter on the bucket name.',
      },
    ],
  });

  /* =====================================================================
     BUILDER: makeBuild  -- "provision it yourself" config task
     Consumed by game.js with a per-concept spec (see src/builds.js):
       { label, blurb, resource, success,
         steps: [ { prompt, options:[str], correct:idx, explain } , ... ] }
     Options are shuffled per mount so `correct` stays semantic.
     ===================================================================== */
  function makeBuild(spec) {
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
        let slot = 0, opt = 0, deployed = false;
        const filled = () => picks.every((p) => p >= 0);

        function draw() {
          const s = steps[slot];
          if (opt > s.options.length - 1) opt = s.options.length - 1;
          root.innerHTML =
            `<div class="bld-rack"><div class="bld-title">${esc(spec.resource)}</div>` +
            steps.map((st, i) =>
              `<div class="bld-slot${i === slot ? ' sel' : ''}${picks[i] >= 0 ? ' set' : ''}" data-i="${i}">` +
              `<span class="bld-k">${esc(st.prompt)}</span>` +
              `<span class="bld-v">${picks[i] >= 0 ? esc(st.options[picks[i]]) : '· · ·'}</span></div>`).join('') +
            `</div>` +
            `<div class="bld-pick">set <b>${esc(s.prompt)}</b></div>` +
            `<div class="choices" id="bld-opts">` +
            s.options.map((o, i) =>
              `<button class="btn${i === opt ? ' sel' : ''}${picks[slot] === i ? ' good' : ''}" data-o="${i}">${esc(o)}</button>`).join('') +
            `</div>` +
            `<div class="sim-btnrow"><button class="btn" id="bld-deploy"${filled() ? '' : ' disabled'}>` +
            `▶ DEPLOY (${picks.filter((p) => p >= 0).length}/${steps.length})</button></div>` +
            `<div class="sim-readout">${esc(spec.blurb || 'Fill every slot, then deploy.')}</div>`;
          root.querySelectorAll('.bld-slot').forEach((el) =>
            el.addEventListener('click', () => { slot = +el.dataset.i; opt = picks[slot] >= 0 ? picks[slot] : 0; draw(); }));
          root.querySelectorAll('#bld-opts .btn').forEach((el) =>
            el.addEventListener('click', () => { opt = +el.dataset.o; commit(); }));
          const d = root.querySelector('#bld-deploy');
          if (d) d.addEventListener('click', deploy);
        }
        function commit() {
          picks[slot] = opt;
          ctx.sound.select();
          const nextEmpty = picks.findIndex((p) => p < 0);
          if (nextEmpty >= 0) { slot = nextEmpty; opt = 0; }
          draw();
        }
        function deploy() {
          if (!filled()) return;
          deployed = true;
          let right = 0;
          const rows = steps.map((st, i) => {
            const ok = picks[i] === st.correct;
            if (ok) right++;
            return `<div class="bld-check ${ok ? 'ok' : 'bad'}"><b>${ok ? '✔' : '✘'} ${esc(st.prompt)}</b><br>` +
              `<span class="small">you set: ${esc(st.options[picks[i]])}` +
              (ok ? '' : `<br>correct: ${esc(st.options[st.correct])}`) + `</span><br>` +
              `<span class="small">${esc(st.explain)}</span></div>`;
          }).join('');
          const win = right === steps.length;
          ctx.sound[win ? 'fanfare' : 'wrong']();
          root.innerHTML =
            `<div class="sim-summary ${win ? 'sim-good' : 'sim-bad'}">` +
            `<div class="sim-big">${win ? '✔' : '✘'}</div>` +
            `<div>${esc(spec.resource)} · ${right}/${steps.length} settings right</div></div>` +
            `<div class="bld-report">${rows}</div>` +
            `<div class="sim-readout ${win ? 'good' : 'bad'}">${esc(win
              ? (spec.success || 'Provisioned to best practice.')
              : 'Adjust the settings marked ✘ and redeploy.')}</div>` +
            `<div class="sim-btnrow">` +
            (win ? '' : `<button class="btn" id="bld-adj">↻ ADJUST</button>`) +
            `<button class="btn sel" id="bld-done">DONE ▶</button></div>`;
          root.querySelector('#bld-done').addEventListener('click', () => ctx.end({ win, score: right }));
          const a = root.querySelector('#bld-adj');
          if (a) a.addEventListener('click', () => {
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
              if (k === 'Enter' || k === ' ') { e.preventDefault(); const d = root.querySelector('#bld-done'); if (d) d.click(); }
              if (k === 'r' || k === 'R') { const a = root.querySelector('#bld-adj'); if (a) a.click(); }
              return;
            }
            const n = steps[slot].options.length;
            if (k === 'ArrowLeft') { e.preventDefault(); slot = (slot + steps.length - 1) % steps.length; opt = picks[slot] >= 0 ? picks[slot] : 0; ctx.sound.cursor(); draw(); }
            else if (k === 'ArrowRight') { e.preventDefault(); slot = (slot + 1) % steps.length; opt = picks[slot] >= 0 ? picks[slot] : 0; ctx.sound.cursor(); draw(); }
            else if (k === 'ArrowUp') { e.preventDefault(); opt = (opt + n - 1) % n; ctx.sound.cursor(); draw(); }
            else if (k === 'ArrowDown') { e.preventDefault(); opt = (opt + 1) % n; ctx.sound.cursor(); draw(); }
            else if (/^[1-9]$/.test(k) && +k <= n) { opt = +k - 1; draw(); }
            else if (k === 'Enter' || k === ' ') { e.preventDefault(); commit(); }
            else if (k === 'd' || k === 'D') { deploy(); }
          },
          destroy() {},
        };
      },
    };
  }

  window.AWSQUEST_MINIGAMES = GAMES;
  window.AWSQUEST_BUILD = makeBuild;
})();
