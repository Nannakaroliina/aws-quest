// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { esc } from './helpers';

export const visibilityQueue = {
  controls: 'R receive  ·  P process  ·  D delete  ·  Q → DLQ',
  mount(root, ctx) {
    const VIS = 6000,
      LIMIT = 58000;
    function mk(id, label, poison) {
      return { id, label, poison: !!poison, state: 'queued', recv: 0, until: 0, ok: false };
    }
    const msgs = [
      mk('m1', 'resize-image #1'),
      mk('m2', 'resize-image #2'),
      mk('m3', 'send-welcome-email'),
      mk('m4', 'charge-card (bad token)', true),
      mk('m5', 'resize-image #3'),
      mk('m6', 'build-report'),
    ];
    let done = 0,
      dlq = 0,
      running = true,
      note = '';
    const deadline = Date.now() + LIMIT;
    const inflight = () => msgs.find((m) => m.state === 'inflight');
    const nextQueued = () => msgs.find((m) => m.state === 'queued');

    function say(s) {
      note = s;
      render();
    }
    function receive() {
      if (inflight()) return say('A message is already in flight — process or delete it first.');
      const m = nextQueued();
      if (!m) return say('Queue is empty.');
      m.state = 'inflight';
      m.recv++;
      m.until = Date.now() + VIS;
      m.ok = false;
      ctx.sound.select();
      say(
        'Received "' + m.label + '". It is INVISIBLE to other consumers until the timeout expires.',
      );
    }
    function process() {
      const m = inflight();
      if (!m) return say('Receive a message before processing.');
      if (m.poison) {
        ctx.sound.wrong();
        say(
          '✘ "' +
            m.label +
            '" threw on attempt ' +
            m.recv +
            '. Do NOT delete it — let it time out or send it to the DLQ.',
        );
      } else {
        m.ok = true;
        ctx.sound.correct();
        say('✔ Processed "' + m.label + '". Now DELETE it or it reappears after the timeout.');
      }
    }
    function del() {
      const m = inflight();
      if (!m) return say('Nothing in flight to delete.');
      if (!m.ok)
        return say('Process the work first (a real consumer would do the job, then delete).');
      m.state = 'done';
      done++;
      ctx.sound.coin();
      say('Deleted "' + m.label + '" — gone for good.');
      check();
    }
    function toDlq() {
      const m = inflight();
      if (!m) return say('Nothing in flight.');
      if (m.recv < 3)
        return say(
          'The DLQ is for messages past maxReceiveCount (3). This one is at ' + m.recv + '.',
        );
      m.state = 'dlq';
      dlq++;
      ctx.sound.unlock();
      say('Moved "' + m.label + '" to the dead-letter queue. The main queue is unblocked.');
      check();
    }
    function check() {
      if (done + dlq >= msgs.length) {
        running = false;
        clearInterval(iv);
        setTimeout(() => end(true), 350);
      }
    }

    function tickLoop() {
      if (!running) return;
      const m = inflight();
      if (m && Date.now() > m.until) {
        m.state = 'queued';
        m.ok = false;
        say(
          '⏰ Visibility timeout expired — "' +
            m.label +
            '" is back in the queue (recv ' +
            m.recv +
            ').',
        );
      }
      if (Date.now() > deadline) {
        running = false;
        clearInterval(iv);
        return end(false);
      }
      render();
    }
    function render() {
      const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      root.innerHTML =
        `<div class="sim-hud"><span>CLEARED <b>${done}</b></span><span>DLQ <b>${dlq}</b></span>` +
        `<span>time <b>${secs}s</b></span></div>` +
        `<div class="sim-queue">` +
        msgs
          .map((m) => {
            const left =
              m.state === 'inflight'
                ? Math.max(0, Math.round((m.until - Date.now()) / 1000)) + 's'
                : '';
            return (
              `<div class="qmsg q-${m.state}"><b>${esc(m.label)}</b>` +
              `<span class="small">${m.state}${left ? ' ' + left : ''} · recv ${m.recv}${m.poison ? ' · ☠' : ''}</span></div>`
            );
          })
          .join('') +
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
        `<div class="small">${esc(
          win
            ? 'A received message is hidden, not gone. Delete on success; after 3 failed receives the poison job goes to the DLQ so it stops blocking everything behind it.'
            : 'Time ran out. Receive → process → DELETE fast, and send the repeat-failing job to the DLQ once recv hits 3.',
        )}</div>` +
        `<div class="choices"><button class="btn sel" id="vq-done">DONE ▶</button></div></div>`;
      root.querySelector('#vq-done').onclick = () => ctx.end({ win });
    }

    render();
    const iv = setInterval(tickLoop, 250);
    return {
      onKey(e) {
        const k = e.key.toLowerCase();
        if (!running) {
          if (k === 'enter' || k === ' ') {
            e.preventDefault();
            const d = root.querySelector('#vq-done');
            if (d) d.click();
          }
          return;
        }
        if (k === 'r') receive();
        if (k === 'p') process();
        if (k === 'd') del();
        if (k === 'q') toDlq();
      },
      destroy() {
        clearInterval(iv);
      },
    };
  },
};
