<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { createGame, type GameHandle } from '$lib/game/engine';

  let root: HTMLDivElement;
  let game: GameHandle | undefined;

  onMount(() => {
    game = createGame(root);
  });
  onDestroy(() => game?.destroy());
</script>

<!--
  Screen-shell markup. The engine (src/lib/game/engine.ts) renders into these
  containers with innerHTML. Converting a screen to a real Svelte component
  (and lifting its rules out of src/app.css into a scoped <style>) is the next
  strangler pass.
-->
<div id="app" bind:this={root}>
  <!-- ===================================================== TITLE ===== -->
  <section id="screen-title" class="screen active">
    <div class="cloud">☁️</div>
    <div class="logo">AWS<br />QUEST</div>
    <div class="sub">A RETRO CLOUD ADVENTURE</div>
    <div class="press blink">▶ PRESS ENTER / TAP TO START</div>
    <div class="small c-dim" style="margin-top: 10px">
      28 AWS concepts · 6 worlds · learn · build it · play the mechanic · prove it
    </div>
    <div class="credit small c-dim">
      ← → ↑ ↓ move &nbsp;·&nbsp; ENTER select &nbsp;·&nbsp; ESC back &nbsp;·&nbsp; M mute
    </div>
  </section>

  <!-- ===================================================== MAP ======= -->
  <section id="screen-map" class="screen">
    <div class="box hud">
      <span class="stat">LV <b id="hud-level">1</b></span>
      <div class="xpbar"><span id="hud-xp"></span></div>
      <span class="stat">XP <b id="hud-xpnum">0</b></span>
      <span class="stat">★ <b id="hud-stars">0</b>/<span id="hud-startotal">84</span></span>
      <span class="stat">🎖 <b id="hud-badges">0</b></span>
      <button type="button" class="btn" id="btn-badges" style="padding: 6px 10px">BADGES</button>
      <button type="button" class="btn" id="btn-mute" style="padding: 6px 10px">♪ ON</button>
    </div>
    <div class="box map-scroll scroller" id="map-worlds"></div>
    <div class="foot">
      <span><b>← →</b> pick</span><span><b>↑ ↓</b> world</span> <span><b>ENTER</b> enter</span><span
        ><b>B</b> badges</span
      >
    </div>
  </section>

  <!-- ===================================================== LEVEL ===== -->
  <section id="screen-level" class="screen">
    <div class="box level-head" id="level-head"></div>
    <div class="box level-body scroller" id="level-body"></div>
    <div class="foot" id="level-foot"></div>
  </section>

  <!-- ===================================================== BADGES ==== -->
  <section id="screen-badges" class="screen">
    <div class="box"><h2 class="c-amber">🎖 BADGE VAULT</h2></div>
    <div class="box scroller" id="badge-grid-wrap">
      <div class="badge-grid" id="badge-grid"></div>
    </div>
    <div class="foot">
      <span><b>ESC</b> back to map</span>
    </div>
  </section>

  <div id="toast"></div>
</div>
