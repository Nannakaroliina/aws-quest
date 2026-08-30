<script lang="ts">
  import { base } from '$app/paths';
  import '../app.css';

  let { children } = $props();
</script>

{@render children()}

<!-- looping chiptune background track (ElevenLabs Music); driven by src/lib/audio/sound.ts -->
<audio id="bgm" src="{base}/assets/bgm.mp3" loop preload="auto"></audio>
<div id="crt"></div>
