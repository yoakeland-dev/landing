<script>
  import { onMount } from "svelte";
  import { dawn } from "./state.svelte.js";
  import { makeSky, makeStars, sample, skyName, clamp, smooth } from "./sky.js";

  let skyEl, starEl, grainEl;

  onMount(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document.documentElement.style;
    const sky = makeSky(skyEl, 0.5);
    const stars = makeStars(starEl, 9500, 0.74, 1.04, reduce);

    // film grain tile
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const x = c.getContext("2d"), d = x.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) { d.data[i] = d.data[i + 1] = d.data[i + 2] = Math.random() * 255; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    doc.setProperty("--grain", `url(${c.toDataURL("image/png")})`);

    let gt = 0.02, ptrX = 0, ptrY = 0, tpx = 0, tpy = 0, time = 12, last = 0, loadFade = reduce ? 1 : 0, dirty = true, raf;
    const onPtr = (e) => { tpx = (e.clientX / innerWidth - 0.5) * 2; tpy = (e.clientY / innerHeight - 0.5) * 2; dirty = true; };
    const onScroll = () => (dirty = true);
    const size = () => { sky.resize(); stars.resize(); dirty = true; };
    let rz;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(size, 120); };
    addEventListener("pointermove", onPtr, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (ts - last) / 1000 || 0);
      last = ts;
      const moving = Math.abs(tpx - ptrX) > 0.001 || Math.abs(tpy - ptrY) > 0.001 || loadFade < 1;
      if (reduce && !dirty && !moving) return;
      if (!reduce) time += dt;
      ptrX += (tpx - ptrX) * 0.05;
      ptrY += (tpy - ptrY) * 0.05;
      // scroll progress (written by the page) sets the hour; picking the early channel pushes it into full day, but only on the download step
      const nudge = dawn.early && dawn.dl ? 0.36 : 0;
      const target = clamp(0.02 + 0.66 * smooth(dawn.p) + nudge, 0, 1);
      gt += (target - gt) * (reduce ? 1 : 0.05);
      const name = skyName(gt);
      if (name !== dawn.name) dawn.name = name;
      if (loadFade < 1) loadFade = Math.min(1, loadFade + dt / 1.8);
      const vis = (1 - smooth((gt - 0.28) / 0.3)) * loadFade; // stars melt away as the sky lights up
      sky.draw(sample(gt), time, scrollY / Math.max(1, innerHeight), ptrX, -ptrY);
      stars.draw(vis, time, scrollY * 0.00006 + time * 0.0012, ptrX, ptrY, dt, scrollY);
      grainEl.style.backgroundPosition = `${Math.round(time * 7)}px ${Math.round(time * 4 - scrollY * 0.35)}px`;
      dirty = false;
    }
    size();
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onPtr);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
    };
  });
</script>

<canvas class="layer" style="z-index:0" bind:this={skyEl} aria-hidden="true"></canvas>
<canvas class="layer" style="z-index:2" bind:this={starEl} aria-hidden="true"></canvas>
<div class="layer grain" bind:this={grainEl} aria-hidden="true"></div>

<style>
  .layer { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; display: block; }
  .grain { z-index: 3; background-image: var(--grain, none); background-size: 160px 160px; mix-blend-mode: overlay; opacity: 0.16; }
  @media (prefers-reduced-motion: reduce) { .grain { animation: none; } }
</style>
