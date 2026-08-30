/* =========================================================================
   AWS QUEST -- sound engine
   - SFX: a tiny WebAudio blipper, all synthesised square/triangle waves.
   - Music: a looping <audio id="bgm"> chiptune track (assets/bgm.mp3),
     faded between volume targets so screens can duck it under dialogue.
   Both start on the first user gesture (browser autoplay policy) and are
   silenced together by setMuted() / toggleMute().
   ========================================================================= */

const Sound = (() => {
  let ctx = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  }

  function resume() {
    ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  /* one note */
  function tone(freq, start, dur, type = 'square', vol = 1, glideTo = null) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
    // simple AD envelope -> "8-bit" pluck
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  /* a sequence: [ [freq, durSeconds, type?, vol?], ... ] */
  function seq(notes, type = 'square', gap = 0) {
    ensure();
    if (!ctx || muted) return;
    let t = ctx.currentTime + 0.01;
    for (const n of notes) {
      const [f, d, ty, v] = n;
      if (f > 0) tone(f, t, d, ty || type, v == null ? 1 : v);
      t += d + gap;
    }
  }

  function noise(dur = 0.12, vol = 0.6) {
    ensure();
    if (!ctx || muted) return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g).connect(master);
    src.start();
  }

  /* ----------------------------------------------------------------------
     Background music: a looping <audio> track (chiptune loop from assets/).
     Kept separate from the WebAudio blipper above. Fades between volume
     targets so screen changes can duck it under dialogue.
     ---------------------------------------------------------------------- */
  let bgmEl = null;
  let bgmWanted = false;     // caller asked for music (a user gesture has happened)
  let bgmVol = 0.34;         // current "loud" target

  function bgmInit() {
    if (bgmEl) return;
    bgmEl = typeof document !== 'undefined' && document.getElementById('bgm');
    if (bgmEl) { bgmEl.loop = true; bgmEl.volume = 0; }
  }
  function bgmApply() {
    if (!bgmEl) return;
    const target = bgmWanted && !muted ? bgmVol : 0;
    const from = bgmEl.volume;
    let i = 0;
    const steps = 14;
    clearInterval(bgmEl._fade);
    if (target > 0 && bgmEl.paused) { const p = bgmEl.play(); if (p) p.catch(() => {}); }
    bgmEl._fade = setInterval(() => {
      i++;
      bgmEl.volume = Math.max(0, Math.min(1, from + (target - from) * (i / steps)));
      if (i >= steps) {
        clearInterval(bgmEl._fade);
        bgmEl.volume = target;
        if (target === 0) bgmEl.pause();
      }
    }, 45);
  }

  // note helpers (equal temperament, A4 = 440), semitone offsets from A4
  const N = (s) => 440 * Math.pow(2, s / 12);
  const C4 = N(-9), G4 = N(-2);
  const C5 = N(3),  E5 = N(7),  G5 = N(10), A5 = N(12);
  const C6 = N(15), E6 = N(19), G6 = N(22);

  return {
    resume,
    isMuted: () => muted,
    toggleMute() { muted = !muted; if (!muted) resume(); bgmApply(); return muted; },
    setMuted(v) { muted = !!v; if (!muted) resume(); bgmApply(); },

    // looping background track
    music: {
      begin() { bgmInit(); bgmWanted = true; bgmApply(); },
      stop()  { bgmWanted = false; bgmApply(); },
      duck(v) { bgmVol = v; bgmApply(); },   // set the "loud" target (0..1)
    },

    move()   { seq([[G5, 0.04]], 'square'); },
    cursor() { seq([[E5, 0.035]], 'square'); },
    select() { seq([[C5, 0.05], [G5, 0.06]], 'square'); },
    back()   { seq([[G5, 0.05], [C5, 0.06]], 'square'); },
    open()   { seq([[C5, 0.04], [E5, 0.04], [G5, 0.05], [C6, 0.08]], 'square'); },
    type()   { if (Math.random() < 0.5) seq([[N(10 + ((Math.random() * 4) | 0)), 0.012, 'square', 0.5]]); },

    correct() { seq([[E5, 0.06], [G5, 0.06], [C6, 0.12]], 'square'); },
    wrong()   { seq([[N(-1), 0.10, 'sawtooth', 0.9], [N(-4), 0.18, 'sawtooth', 0.9]], 'sawtooth'); noise(0.1, 0.22); },

    coin()   { seq([[A5, 0.05], [E6, 0.12]], 'square'); },
    unlock() { seq([[C5, 0.06], [E5, 0.06], [G5, 0.06], [C6, 0.06], [E6, 0.14]], 'triangle'); },

    fanfare() {
      seq([
        [C5, 0.11], [C5, 0.11], [C5, 0.11], [C5, 0.16],
        [G4, 0.16], [A5, 0.16], [C6, 0.11], [G5, 0.16], [E5, 0.30],
      ], 'square', 0.01);
      setTimeout(() => seq([
        [C4, 0.30, 'triangle', 0.8], [G4, 0.30, 'triangle', 0.8], [C5, 0.40, 'triangle', 0.8],
      ], 'triangle', 0.01), 60);
    },

    levelUp() { seq([[C5, 0.07], [E5, 0.07], [G5, 0.07], [C6, 0.07], [E6, 0.07], [G6, 0.2]], 'square'); },
    start()   { seq([[C5, 0.09], [E5, 0.09], [G5, 0.09], [C6, 0.18], [E6, 0.18], [C6, 0.28]], 'square', 0.005); },
  };
})();

window.AWSQUEST_SOUND = Sound;
