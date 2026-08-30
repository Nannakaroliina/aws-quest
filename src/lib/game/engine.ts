/* =========================================================================
   AWS QUEST -- game engine
   Screens: title / map / level / badges. State machine, save system, input
   router. Mounted by src/lib/components/Game.svelte into the screen-shell
   markup it renders.
   ========================================================================= */
// @ts-nocheck -- transitional: imperative screen/render code ported verbatim
// from the pre-SvelteKit src/game.js. Rebuilt as Svelte components screen by
// screen (strangler migration -- see the plan).
import { WORLDS, CONCEPTS, WORLD_CONCEPTS, PROGRESSION } from '../content';
import { sound as S } from '../audio/sound';
import { MINIGAMES, makeBuild } from '../minigames';
import { BUILDS } from '../builds';
import { load, persist } from './save';
import { XP, playerLevel, levelFrac, starCount, isUnlocked, nextConcept } from './progression';

export interface GameHandle {
  destroy(): void;
}

/**
 * Mount the game into `root` -- the screen-shell markup rendered by
 * Game.svelte. The returned handle unbinds global listeners and timers.
 */
export function createGame(root: HTMLElement): GameHandle {
  const TOTAL_STARS = PROGRESSION.length * 3;

  const save = load();

  function grantXP(n) {
    const before = playerLevel(save.xp);
    save.xp += n;
    const after = playerLevel(save.xp);
    persist(save);
    if (after > before) {
      S.levelUp();
      toast('LEVEL UP!  LV ' + after);
    }
  }

  /* ------------------------------------------------------------- DOM helpers */
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => Array.from(r.querySelectorAll(s));
  const esc = (s) =>
    String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  let toastT = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // keep the highlighted control visible inside the scrolling level body
  function scrollSel() {
    const el = $('#level-body .btn.sel') || $('#level-body .sel');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function showScreen(name) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
    state.screen = name;
    // duck the music under dialogue while inside a level
    if (S.music) S.music.duck(name === 'level' ? 0.16 : 0.34);
  }

  /* ------------------------------------------------------------- game state */
  const state = {
    screen: 'title',
    mapCursor: 0,
    level: null, // { id, stage, brief, deepRead, quizIdx, wrong, answered, choiceCursor, cardCursor }
  };

  /* ===================================================================== */
  /*  TITLE                                                                 */
  /* ===================================================================== */
  function startGame() {
    S.resume();
    S.music.begin(); // user gesture has happened -> loop the chiptune
    S.start();
    // land cursor on first not-yet-cleared concept
    const idx = PROGRESSION.findIndex((id) => !save.completed[id]);
    state.mapCursor = idx < 0 ? 0 : idx;
    renderMap();
    showScreen('map');
  }

  /* ===================================================================== */
  /*  MAP                                                                   */
  /* ===================================================================== */
  function renderMap() {
    $('#hud-level').textContent = playerLevel(save.xp);
    $('#hud-xpnum').textContent = save.xp;
    $('#hud-xp').style.width = Math.round(levelFrac(save.xp) * 100) + '%';
    $('#hud-stars').textContent = starCount(save);
    $('#hud-startotal').textContent = TOTAL_STARS;
    $('#hud-badges').textContent = save.badges.length;
    $('#btn-mute').textContent = S.isMuted() ? '♪ OFF' : '♪ ON';

    const wrap = $('#map-worlds');
    wrap.innerHTML = WORLDS.map((w) => {
      const ids = WORLD_CONCEPTS[w.id];
      const nodes = ids
        .map((id) => {
          const c = CONCEPTS[id];
          const done = save.completed[id];
          const locked = !isUnlocked(save, id);
          const gi = PROGRESSION.indexOf(id);
          const stars = done ? '★'.repeat(done.stars) + '·'.repeat(3 - done.stars) : '';
          const cls = ['node'];
          if (locked) cls.push('locked');
          if (done) cls.push('done');
          if (gi === state.mapCursor) cls.push('sel');
          return (
            '<div class="' +
            cls.join(' ') +
            '" data-id="' +
            id +
            '" data-gi="' +
            gi +
            '" role="button" tabindex="0">' +
            '<span class="icon">' +
            c.icon +
            '</span>' +
            '<span class="nm">' +
            esc(c.name) +
            '</span>' +
            '<div class="stars">' +
            stars +
            '</div>' +
            '</div>'
          );
        })
        .join('');
      return (
        '<div class="world" style="--wtint:' +
        w.tint +
        '">' +
        '<div class="wtitle">' +
        esc(w.name) +
        '</div>' +
        '<div class="wblurb">' +
        esc(w.blurb) +
        '</div>' +
        '<div class="nodes">' +
        nodes +
        '</div>' +
        '</div>'
      );
    }).join('');

    $$('.node', wrap).forEach((n) => {
      n.addEventListener('click', () => {
        state.mapCursor = parseInt(n.dataset.gi, 10);
        renderMap();
        tryEnter();
      });
    });
    const sel = $('.node.sel', wrap);
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function moveMap(delta) {
    const n = PROGRESSION.length;
    state.mapCursor = (state.mapCursor + delta + n) % n;
    S.cursor();
    renderMap();
  }
  function tryEnter() {
    const id = PROGRESSION[state.mapCursor];
    if (!isUnlocked(save, id)) {
      S.wrong();
      toast('LOCKED -- clear the previous node');
      return;
    }
    S.select();
    openLevel(id);
  }

  /* ===================================================================== */
  /*  LEVEL                                                                 */
  /* ===================================================================== */
  function openLevel(id) {
    const c = CONCEPTS[id];
    state.level = {
      id,
      stage: 'briefing',
      brief: 0,
      typing: null,
      quizIdx: 0,
      wrong: 0,
      answered: false,
      choiceCursor: 0,
      cardCursor: 0,
      simApi: null,
      buildApi: null,
    };
    const w = WORLDS.find((x) => x.id === c.world);
    $('#level-head').innerHTML =
      '<span class="big">' +
      c.icon +
      '</span>' +
      '<div><h2 style="color:' +
      w.tint +
      '">' +
      esc(c.name) +
      '</h2>' +
      '<h3>' +
      esc(c.sub) +
      ' &nbsp;·&nbsp; ' +
      esc(w.name) +
      '</h3></div>';
    showScreen('level');
    renderStage();
  }

  function renderStage() {
    const L = state.level;
    const c = CONCEPTS[L.id];
    const body = $('#level-body');
    const foot = $('#level-foot');
    body.scrollTop = 0;
    body.classList.remove('result');

    if (L.stage === 'briefing') {
      body.innerHTML =
        '<div class="dialogue">' +
        '<div class="portrait">☁️</div>' +
        '<div class="box speech">' +
        '<div class="who">CIRRUS  //  cloud guide</div>' +
        '<div class="line" id="brief-line"></div>' +
        '<div class="next blink" id="brief-next">▼</div>' +
        '</div>' +
        '</div>';
      foot.innerHTML = '<span><b>ENTER</b> next</span><span><b>ESC</b> leave</span>';
      typeLine($('#brief-line'), c.briefing[L.brief], () => {});
      return;
    }

    if (L.stage === 'card') {
      body.innerHTML =
        '<h3 class="c-amber">WHAT IT IS</h3>' +
        '<p class="metaphor">“' +
        esc(c.metaphor) +
        '”</p>' +
        '<ul class="points">' +
        c.points.map((p) => '<li>' + esc(p) + '</li>').join('') +
        '</ul>' +
        '<div style="height:12px"></div>' +
        '<div class="choices" id="card-actions">' +
        (buildOf(c)
          ? btn(
              'build',
              '🔧 ' +
                (buildOf(c).label || 'BUILD IT') +
                ' -- set it up yourself' +
                (save.builtIt[L.id] ? '  ✓' : ''),
            )
          : '') +
        (c.sim
          ? btn(
              'sim',
              '🎮 ' +
                (c.sim.label || 'TRY THE SIM') +
                ' -- play the mechanic' +
                (save.playedSim[L.id] ? '  ✓' : ''),
            )
          : '') +
        btn(
          'deep',
          '📖 DEEP DIVE -- how it works in practice' + (save.readDeep[L.id] ? '  ✓' : ''),
        ) +
        btn('chal', '⚔ START CHALLENGE') +
        btn('back', '↩ BACK TO MAP') +
        '</div>';
      foot.innerHTML =
        '<span><b>↑ ↓</b> choose</span><span><b>ENTER</b> select</span><span><b>ESC</b> map</span>';
      wireCardActions();
      highlightCard();
      return;
    }

    if (L.stage === 'deep') {
      const d = c.deep;
      body.innerHTML =
        '<div class="deep">' +
        '<h3>HOW IT WORKS</h3>' +
        d.works.map((p) => '<p>' + esc(p) + '</p>').join('') +
        '<h3>ARCHITECTURE</h3>' +
        '<pre class="diagram">' +
        esc(d.diagram) +
        '</pre>' +
        '<h3>IN PRACTICE</h3>' +
        '<ul>' +
        d.practice.map((p) => '<li>' + esc(p) + '</li>').join('') +
        '</ul>' +
        '<h3>GOTCHAS</h3>' +
        '<ul>' +
        d.gotchas.map((p) => '<li>' + esc(p) + '</li>').join('') +
        '</ul>' +
        '<h3>PRICING MODEL</h3>' +
        '<p class="pricing">' +
        esc(d.pricing) +
        '</p>' +
        '<h3>TRY IT (CLI)</h3>' +
        '<pre class="cli">' +
        esc(d.cli) +
        '</pre>' +
        '</div>' +
        '<div style="height:12px"></div>' +
        '<div class="choices"><button class="btn sel" id="deep-back">↩ BACK</button></div>';
      foot.innerHTML = '<span>scroll to read it all</span><span><b>ENTER / ESC</b> back</span>';
      $('#deep-back').addEventListener('click', () => {
        S.back();
        L.stage = 'card';
        renderStage();
      });

      if (!save.readDeep[L.id]) {
        save.readDeep[L.id] = true;
        grantXP(XP.deepDive);
        S.coin();
        toast('+' + XP.deepDive + ' XP  scholar bonus');
        renderMap();
      }
      return;
    }

    if (L.stage === 'sim') {
      renderSim();
      return;
    }

    if (L.stage === 'build') {
      renderBuild();
      return;
    }

    if (L.stage === 'challenge') {
      renderQuestion();
      return;
    }

    if (L.stage === 'result') {
      renderResult();
      return;
    }
  }

  function btn(key, label) {
    return '<button class="btn" data-key="' + key + '">' + esc(label) + '</button>';
  }

  /* ---- briefing typewriter ---- */
  function typeLine(el, text, done) {
    const L = state.level;
    clearInterval(L.typing);
    el.textContent = '';
    let i = 0;
    L.typing = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i % 2 === 0) S.type();
      if (i >= text.length) {
        clearInterval(L.typing);
        L.typing = null;
        done && done();
      }
    }, 22);
    L._full = text;
    L._el = el;
  }
  function briefAdvance() {
    const L = state.level;
    const c = CONCEPTS[L.id];
    if (L.typing) {
      // finish current line instantly
      clearInterval(L.typing);
      L.typing = null;
      L._el.textContent = L._full;
      return;
    }
    if (L.brief < c.briefing.length - 1) {
      L.brief++;
      S.move();
      typeLine($('#brief-line'), c.briefing[L.brief], () => {});
    } else {
      S.select();
      L.stage = 'card';
      renderStage();
    }
  }

  /* ---- card actions ---- */
  // build task: inline on the concept, else the shared map in src/builds.js
  function buildOf(c) {
    return (c && c.build) || (c && BUILDS[c.id]) || null;
  }
  // sim / build entries only exist for concepts that ship one
  function cardKeys() {
    const c = CONCEPTS[state.level.id];
    return (buildOf(c) ? ['build'] : [])
      .concat(c.sim ? ['sim'] : [])
      .concat(['deep', 'chal', 'back']);
  }
  function wireCardActions() {
    const keys = cardKeys();
    $$('#card-actions .btn').forEach((b) => {
      b.addEventListener('click', () => {
        state.level.cardCursor = keys.indexOf(b.dataset.key);
        cardSelect();
      });
      b.addEventListener('mousemove', () => {
        state.level.cardCursor = keys.indexOf(b.dataset.key);
        highlightCard();
      });
    });
  }
  function highlightCard() {
    $$('#card-actions .btn').forEach((b, i) =>
      b.classList.toggle('sel', i === state.level.cardCursor),
    );
    scrollSel();
  }
  function cardSelect() {
    const L = state.level;
    const key = cardKeys()[L.cardCursor];
    if (key === 'build') {
      S.open();
      L.stage = 'build';
      renderStage();
    }
    if (key === 'sim') {
      S.open();
      L.stage = 'sim';
      renderStage();
    }
    if (key === 'deep') {
      S.open();
      L.stage = 'deep';
      renderStage();
    }
    if (key === 'chal') {
      S.select();
      L.stage = 'challenge';
      L.quizIdx = 0;
      L.wrong = 0;
      L.answered = false;
      L.choiceCursor = 0;
      renderStage();
    }
    if (key === 'back') {
      S.back();
      leaveLevel();
    }
  }

  /* ---- sim (mini-game) ---- */
  function renderSim() {
    const L = state.level;
    const c = CONCEPTS[L.id];
    const body = $('#level-body');
    const foot = $('#level-foot');
    body.scrollTop = 0;
    body.classList.remove('result');

    const factory = MINIGAMES[c.sim && c.sim.game];
    if (!factory) {
      L.stage = 'card';
      renderStage();
      return;
    }

    body.innerHTML =
      '<div class="sim-head">' +
      '<h3 class="c-amber">🎮 ' +
      esc(c.sim.label || 'MINI-GAME') +
      '</h3>' +
      (c.sim.blurb ? '<p class="small">' + esc(c.sim.blurb) + '</p>' : '') +
      '</div>' +
      '<div class="sim" id="sim-root"></div>';
    foot.innerHTML =
      '<span>' +
      esc(factory.controls || 'play the sim') +
      '</span>' +
      '<span><b>ESC</b> leave</span>';

    if (L.simApi && L.simApi.destroy) L.simApi.destroy();
    L.simApi = factory.mount($('#sim-root'), {
      concept: c,
      sound: S,
      toast,
      end: () => onSimEnd(),
    });
  }

  function onSimEnd() {
    const L = state.level;
    if (!L) return;
    if (L.simApi && L.simApi.destroy) L.simApi.destroy();
    L.simApi = null;
    if (!save.playedSim[L.id]) {
      save.playedSim[L.id] = true;
      grantXP(XP.sim);
      S.coin();
      toast('+' + XP.sim + ' XP  hands-on bonus');
    } else {
      S.back();
    }
    L.stage = 'card';
    renderStage();
    renderMap();
  }

  /* ---- build (provision-it-yourself task) ---- */
  function renderBuild() {
    const L = state.level;
    const c = CONCEPTS[L.id];
    const spec = buildOf(c);
    const body = $('#level-body');
    const foot = $('#level-foot');
    body.scrollTop = 0;
    body.classList.remove('result');

    if (!spec) {
      L.stage = 'card';
      renderStage();
      return;
    }
    const factory = makeBuild(spec);

    body.innerHTML =
      '<div class="sim-head">' +
      '<h3 class="c-amber">🔧 ' +
      esc(spec.label || 'BUILD IT') +
      '</h3>' +
      (spec.blurb ? '<p class="small">' + esc(spec.blurb) + '</p>' : '') +
      '</div>' +
      '<div class="sim" id="build-root"></div>';
    foot.innerHTML =
      '<span>' +
      esc(factory.controls || 'configure the resource') +
      '</span>' +
      '<span><b>ESC</b> leave</span>';

    if (L.buildApi && L.buildApi.destroy) L.buildApi.destroy();
    L.buildApi = factory.mount($('#build-root'), {
      concept: c,
      sound: S,
      toast,
      end: (res) => onBuildEnd(res || {}),
    });
  }

  function onBuildEnd(res) {
    const L = state.level;
    if (!L) return;
    if (L.buildApi && L.buildApi.destroy) L.buildApi.destroy();
    L.buildApi = null;
    if (res.win && !save.builtIt[L.id]) {
      save.builtIt[L.id] = true;
      grantXP(XP.build);
      S.coin();
      toast('+' + XP.build + ' XP  provisioned ' + CONCEPTS[L.id].name);
    } else {
      S.back();
    }
    L.stage = 'card';
    renderStage();
    renderMap();
  }

  /* ---- challenge ---- */
  function renderQuestion() {
    const L = state.level;
    const c = CONCEPTS[L.id];
    const q = c.quiz[L.quizIdx];
    const body = $('#level-body');
    body.innerHTML =
      '<div class="q-progress">CHALLENGE  ·  Q' +
      (L.quizIdx + 1) +
      ' / ' +
      c.quiz.length +
      '  ·  misses: ' +
      L.wrong +
      '</div>' +
      '<div class="q-prompt">' +
      esc(q.q) +
      '</div>' +
      '<div class="choices" id="q-choices">' +
      q.choices
        .map(
          (ch, i) =>
            '<button class="btn" data-i="' +
            i +
            '">' +
            String.fromCharCode(65 + i) +
            '.  ' +
            esc(ch) +
            '</button>',
        )
        .join('') +
      '</div>' +
      '<div id="q-explain"></div>';
    $('#level-foot').innerHTML = L.answered
      ? '<span><b>ENTER</b> next</span>'
      : '<span><b>↑ ↓</b> choose</span><span><b>ENTER</b> answer</span><span><b>ESC</b> map</span>';

    $$('#q-choices .btn').forEach((b) => {
      b.addEventListener('click', () => {
        if (L.answered) return;
        L.choiceCursor = parseInt(b.dataset.i, 10);
        answerQuestion();
      });
      b.addEventListener('mousemove', () => {
        if (L.answered) return;
        L.choiceCursor = parseInt(b.dataset.i, 10);
        highlightChoices();
      });
    });
    highlightChoices();
  }
  function highlightChoices() {
    const L = state.level;
    $$('#q-choices .btn').forEach((b, i) =>
      b.classList.toggle('sel', i === L.choiceCursor && !L.answered),
    );
    scrollSel();
  }
  function answerQuestion() {
    const L = state.level;
    const c = CONCEPTS[L.id];
    const q = c.quiz[L.quizIdx];
    const pick = L.choiceCursor;
    const right = q.answer;
    L.answered = true;

    $$('#q-choices .btn').forEach((b, i) => {
      b.classList.remove('sel');
      b.disabled = true;
      if (i === right) b.classList.add('good', 'sel');
      if (i === pick && pick !== right) b.classList.add('bad', 'sel');
    });

    const ok = pick === right;
    if (ok) {
      S.correct();
      grantXP(XP.correct);
    } else {
      S.wrong();
      L.wrong++;
    }

    $('#q-explain').innerHTML =
      '<div class="explain ' +
      (ok ? '' : 'bad') +
      '">' +
      (ok
        ? '<b class="c-green">CORRECT +' + XP.correct + ' XP</b><br>'
        : '<b class="c-red">NOT QUITE</b><br>') +
      esc(q.why) +
      '</div>';
    $('#level-foot').innerHTML =
      '<span><b>ENTER</b> ' +
      (L.quizIdx < c.quiz.length - 1 ? 'next question' : 'see results') +
      '</span>';
  }
  function quizNext() {
    const L = state.level;
    const c = CONCEPTS[L.id];
    if (L.quizIdx < c.quiz.length - 1) {
      L.quizIdx++;
      L.answered = false;
      L.choiceCursor = 0;
      S.move();
      renderQuestion();
    } else {
      finishLevel();
    }
  }

  /* ---- result ---- */
  function finishLevel() {
    const L = state.level;
    const c = CONCEPTS[L.id];
    const stars = L.wrong === 0 ? 3 : L.wrong === 1 ? 2 : 1;
    const prev = save.completed[L.id];
    const firstClear = !prev;

    if (firstClear) grantXP(XP.firstClear);
    if (L.wrong === 0) grantXP(XP.perfect);

    save.completed[L.id] = {
      stars: Math.max(stars, prev ? prev.stars : 0),
      best: prev ? Math.min(prev.best || 99, L.wrong) : L.wrong,
    };

    let newBadge = false;
    if (!save.badges.includes(c.badge.name)) {
      save.badges.push(c.badge.name);
      newBadge = true;
    }
    persist(save);

    const nxt = nextConcept(L.id);
    const newlyUnlocked = firstClear && nxt && CONCEPTS[nxt].world === c.world;
    L.stage = 'result';
    L._res = { stars, firstClear, newBadge, nxt, newlyUnlocked };
    renderStage();

    if (L.wrong === 0) S.fanfare();
    else S.unlock();
    if (newlyUnlocked)
      setTimeout(() => {
        S.unlock();
        toast('UNLOCKED: ' + CONCEPTS[nxt].name);
      }, 600);
  }

  function renderResult() {
    const L = state.level;
    const c = CONCEPTS[L.id];
    const r = L._res;
    const body = $('#level-body');
    body.classList.add('result');
    body.innerHTML =
      '<div class="badge-big">' +
      c.badge.emoji +
      '</div>' +
      '<div class="stars-big">' +
      '★'.repeat(r.stars) +
      '<span class="c-dim">' +
      '★'.repeat(3 - r.stars) +
      '</span></div>' +
      (r.newBadge
        ? '<div class="earned">BADGE GET!  ' + esc(c.badge.name) + '</div>'
        : '<div class="small c-dim">badge already earned</div>') +
      '<p class="small">' +
      (r.stars === 3
        ? 'FLAWLESS. You clearly get it.'
        : r.stars === 2
          ? 'Solid. One slip.'
          : 'Cleared -- maybe revisit the deep dive.') +
      '</p>' +
      '<div class="small">total XP <b class="c-amber">' +
      save.xp +
      '</b>  ·  LV ' +
      playerLevel(save.xp) +
      '</div>' +
      '<div style="height:10px"></div>' +
      '<div class="choices" style="width:min(420px,90%)">' +
      (r.nxt && isUnlocked(save, r.nxt)
        ? '<button class="btn sel" data-act="next">➡ NEXT: ' +
          esc(CONCEPTS[r.nxt].name) +
          '</button>'
        : '') +
      '<button class="btn" data-act="retry">↻ RETRY CHALLENGE</button>' +
      '<button class="btn" data-act="map">🗺 OVERWORLD MAP</button>' +
      '</div>';
    body.scrollTop = 0;
    const acts = $$('#level-body .btn');
    state.level.resCursor = 0;
    const paint = () => {
      acts.forEach((b, i) => b.classList.toggle('sel', i === state.level.resCursor));
      scrollSel();
    };
    acts.forEach((b, i) => {
      b.addEventListener('mousemove', () => {
        state.level.resCursor = i;
        paint();
      });
      b.addEventListener('click', () => resultAct(b.dataset.act));
    });
    paint();
    $('#level-foot').innerHTML = '<span><b>↑ ↓</b> choose</span><span><b>ENTER</b> select</span>';
  }
  function resultAct(act) {
    const L = state.level;
    if (act === 'retry') {
      S.select();
      L.stage = 'challenge';
      L.quizIdx = 0;
      L.wrong = 0;
      L.answered = false;
      L.choiceCursor = 0;
      $('#level-body').classList.remove('result');
      renderStage();
    } else if (act === 'next') {
      S.select();
      const n = L._res.nxt;
      $('#level-body').classList.remove('result');
      openLevel(n);
    } else {
      S.back();
      leaveLevel();
    }
  }

  function leaveLevel() {
    if (state.level && state.level.typing) clearInterval(state.level.typing);
    if (state.level && state.level.simApi && state.level.simApi.destroy)
      state.level.simApi.destroy();
    if (state.level && state.level.buildApi && state.level.buildApi.destroy)
      state.level.buildApi.destroy();
    $('#level-body').classList.remove('result');
    state.level = null;
    renderMap();
    showScreen('map');
  }

  /* ===================================================================== */
  /*  BADGES                                                                */
  /* ===================================================================== */
  function renderBadges() {
    const grid = $('#badge-grid');
    grid.innerHTML = PROGRESSION.map((id) => {
      const c = CONCEPTS[id];
      const got = save.badges.includes(c.badge.name);
      return (
        '<div class="badge-cell ' +
        (got ? '' : 'locked') +
        '">' +
        '<span class="e">' +
        (got ? c.badge.emoji : '❓') +
        '</span>' +
        '<span class="n">' +
        esc(got ? c.badge.name : '— locked —') +
        '</span>' +
        '</div>'
      );
    }).join('');
    showScreen('badges');
  }

  /* ===================================================================== */
  /*  INPUT ROUTER                                                          */
  /* ===================================================================== */
  function onKey(e) {
    const k = e.key;
    if (k === 'm' || k === 'M') {
      const m = S.toggleMute();
      save.muted = m;
      persist(save);
      $('#btn-mute').textContent = m ? '♪ OFF' : '♪ ON';
      toast(m ? 'SOUND OFF' : 'SOUND ON');
      return;
    }

    if (state.screen === 'title') {
      if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        startGame();
      }
      return;
    }

    if (state.screen === 'map') {
      if (k === 'ArrowLeft') {
        e.preventDefault();
        moveMap(-1);
      } else if (k === 'ArrowRight') {
        e.preventDefault();
        moveMap(1);
      } else if (k === 'ArrowUp') {
        e.preventDefault();
        moveMap(-4);
      } else if (k === 'ArrowDown') {
        e.preventDefault();
        moveMap(4);
      } else if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        tryEnter();
      } else if (k === 'b' || k === 'B') {
        S.select();
        renderBadges();
      }
      return;
    }

    if (state.screen === 'badges') {
      if (k === 'Escape' || k === 'Enter' || k === 'b' || k === 'B') {
        S.back();
        renderMap();
        showScreen('map');
      }
      return;
    }

    if (state.screen === 'level') {
      const L = state.level;
      if (!L) return;

      if (L.stage === 'sim' || L.stage === 'build') {
        const api = L.stage === 'sim' ? L.simApi : L.buildApi;
        if (k === 'Escape') {
          S.back();
          if (api && api.destroy) api.destroy();
          if (L.stage === 'sim') L.simApi = null;
          else L.buildApi = null;
          L.stage = 'card';
          renderStage();
          return;
        }
        if (api && api.onKey) api.onKey(e);
        return;
      }

      if (k === 'Escape') {
        S.back();
        leaveLevel();
        return;
      }

      if (L.stage === 'briefing') {
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          briefAdvance();
        }
      } else if (L.stage === 'card') {
        const n = cardKeys().length;
        if (k === 'ArrowUp') {
          e.preventDefault();
          L.cardCursor = (L.cardCursor + n - 1) % n;
          S.cursor();
          highlightCard();
        }
        if (k === 'ArrowDown') {
          e.preventDefault();
          L.cardCursor = (L.cardCursor + 1) % n;
          S.cursor();
          highlightCard();
        }
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          cardSelect();
        }
      } else if (L.stage === 'deep') {
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          S.back();
          L.stage = 'card';
          renderStage();
        }
      } else if (L.stage === 'challenge') {
        const c = CONCEPTS[L.id];
        const n = c.quiz[L.quizIdx].choices.length;
        if (!L.answered) {
          if (k === 'ArrowUp') {
            e.preventDefault();
            L.choiceCursor = (L.choiceCursor + n - 1) % n;
            S.cursor();
            highlightChoices();
          }
          if (k === 'ArrowDown') {
            e.preventDefault();
            L.choiceCursor = (L.choiceCursor + 1) % n;
            S.cursor();
            highlightChoices();
          }
          if (/^[1-4]$/.test(k) && +k <= n) {
            L.choiceCursor = +k - 1;
            highlightChoices();
          }
          if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            answerQuestion();
          }
        } else if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          quizNext();
        }
      } else if (L.stage === 'result') {
        const acts = $$('#level-body .btn');
        const paintRes = () => {
          acts.forEach((b, i) => b.classList.toggle('sel', i === state.level.resCursor));
          scrollSel();
        };
        if (k === 'ArrowUp') {
          e.preventDefault();
          state.level.resCursor = (state.level.resCursor + acts.length - 1) % acts.length;
          S.cursor();
          paintRes();
        }
        if (k === 'ArrowDown') {
          e.preventDefault();
          state.level.resCursor = (state.level.resCursor + 1) % acts.length;
          S.cursor();
          paintRes();
        }
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          resultAct(acts[state.level.resCursor].dataset.act);
        }
      }
    }
  }

  /* ===================================================================== */
  /*  BOOT                                                                  */
  /* ===================================================================== */
  function boot() {
    S.setMuted(!!save.muted);
    document.addEventListener('keydown', onKey);

    $('#screen-title').addEventListener('click', () => {
      if (state.screen === 'title') startGame();
    });
    $('#btn-badges').addEventListener('click', () => {
      S.select();
      renderBadges();
    });
    $('#btn-mute').addEventListener('click', (e) => {
      e.stopPropagation();
      const m = S.toggleMute();
      save.muted = m;
      persist(save);
      $('#btn-mute').textContent = m ? '♪ OFF' : '♪ ON';
    });
    // resume audio on any first pointer interaction (autoplay policy)
    window.addEventListener('pointerdown', onPointerDown, { once: true });

    if (save.xp > 0 || Object.keys(save.completed).length) {
      // returning player: still show title, but hint progress
      $('#screen-title .press').innerHTML =
        '▶ PRESS ENTER TO CONTINUE  (LV ' + playerLevel(save.xp) + ')';
    }
  }

  function onPointerDown() {
    S.resume();
  }

  boot();

  return {
    destroy() {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
      clearTimeout(toastT);
      if (state.level) leaveLevel();
    },
  };
}
