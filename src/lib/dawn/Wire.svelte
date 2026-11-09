<script>
  // A glowing line with a packet that eases along it and rests at each end. Draw inside an <svg>.
  let { d, c, dur = 3.6, begin = 0, dots = [] } = $props();
</script>

<path class="wire" style="--c:{c}" {d} />
<circle r="4" class="pkt" style="--c:{c}">
  <animateMotion path={d} dur="{dur}s" begin="{begin}s" repeatCount="indefinite" calcMode="spline" keyPoints="0;0;1;1" keyTimes="0;0.15;0.7;1" keySplines="0 0 1 1;0.65 0 0.35 1;0 0 1 1" />
  <animate attributeName="r" begin="{begin}s" dur="{dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.15;0.425;0.7;1" values="1.2;1.2;4;1.2;1.2" keySplines="0 0 1 1;0.5 0 0.5 1;0.5 0 0.5 1;0 0 1 1" />
</circle>
{#each dots as [x, y]}<circle class="end" cx={x} cy={y} r="6" />{/each}

<style>
  .wire { fill: none; vector-effect: non-scaling-stroke; stroke: var(--c); stroke-opacity: 0.85; stroke-width: 1.6; filter: drop-shadow(0 0 4px var(--c)); }
  .pkt { fill: var(--c); filter: drop-shadow(0 0 3px var(--c)) drop-shadow(0 0 8px var(--c)) drop-shadow(0 0 14px var(--c)); }
  .end { fill: #fff4ea; filter: drop-shadow(0 0 8px rgba(255, 244, 234, 0.5)); }
</style>
