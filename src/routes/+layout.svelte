<script lang="ts">
  import { asset } from '$app/paths';
  import '../app.css';

  let { children } = $props();
</script>

{@render children()}

<!-- looping chiptune background track (ElevenLabs Music); driven by src/lib/audio/sound.ts -->
<audio id="bgm" src={asset('assets/bgm.mp3')} loop preload="auto"></audio>
<div id="crt"></div>
