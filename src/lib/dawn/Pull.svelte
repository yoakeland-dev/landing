<script>
  import { onMount } from "svelte";

  // Overscroll at the very bottom fills a bar; at 100% the page opens the app.
  let { progress = $bindable(0), onopen, href } = $props();
  const T = 1400;
  let done = false;
  export function reset() { done = false; progress = 0; }

  onMount(() => {
    let shown = 0, pull = 0, last = 0, raf = 0, y0 = 0;
    const atEnd = () => scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    function add(d) {
      if (done) return;
      pull = Math.max(0, Math.min(T, pull + d));
      last = performance.now();
      if (pull >= T) { done = true; onopen(); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function loop(t) {
      raf = 0;
      if (done) return;
      if (t - last > 260) pull = Math.max(0, pull - 7); // springs back when you stop
      shown += (pull / T - shown) * 0.12; progress = shown;
      if (pull > 0 || shown > 0.002) raf = requestAnimationFrame(loop);
    }
    const onWheel = (e) => { if (atEnd() && e.deltaY > 0) add(e.deltaY * 0.35); else if (pull > 0 && e.deltaY < 0) add(e.deltaY); };
    const onStart = (e) => (y0 = e.touches[0].clientY);
    const onMove = (e) => { const y = e.touches[0].clientY, dy = y0 - y; y0 = y; if (atEnd() && dy > 0) add(dy * 0.9); else if (pull > 0 && dy < 0) add(dy); };
    const onShow = (e) => { if (e.persisted) { pull = 0; reset(); } };
    addEventListener("wheel", onWheel, { passive: true });
    addEventListener("touchstart", onStart, { passive: true });
    addEventListener("touchmove", onMove, { passive: true });
    addEventListener("pageshow", onShow);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("wheel", onWheel); removeEventListener("touchstart", onStart);
      removeEventListener("touchmove", onMove); removeEventListener("pageshow", onShow);
    };
  });
</script>

<div class="pull">
  <p class="mono" aria-hidden="true">keep scrolling to open the app</p>
  <div class="bar" aria-hidden="true"><i style:transform="scaleX({progress})"></i></div>
  <a class="open mono" {href}>or open it now</a>
</div>

<style>
  .pull { display: grid; justify-items: center; gap: 12px; padding: 0 16px 28px; color: var(--ink-dim); text-align: center; }
  p { margin: 0; }
  .bar { width: min(360px, 70vw); height: 2px; border-radius: 2px; background: var(--edge); overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--ink); transform-origin: left; transform: scaleX(0); }
  .open { color: var(--ink-faint); text-decoration: underline; text-underline-offset: 4px; text-decoration-color: rgba(255, 244, 234, 0.25); }
  .open:hover { color: var(--ink); }
</style>
