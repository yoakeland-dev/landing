<script>
  import { onMount } from "svelte";
  import { dawn } from "./state.svelte.js";
  import { makeSky, makeStars, sample, skyName, clamp, smooth, lerp } from "./sky.js";

  let skyEl, starEl, grainEl;

  onMount(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = skyEl.parentElement.style; // theme vars scope to the sky container, not the page
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

    // ink follows the hour: cream on night sky, navy once the sky is light
    const CREAM = [255, 244, 234], NAVY = [20, 27, 54];
    const mix = (a, b, u) => a.map((v, i) => Math.round(lerp(v, b[i], u)));
    let lastU = -1;
    function theme(t) {
      const u = smooth((t - 0.62) / 0.22);
      if (Math.abs(u - lastU) < 0.004) return;
      lastU = u;
      const rgb = mix(CREAM, NAVY, u).join(",");
      root.setProperty("--ink", `rgb(${rgb})`);
      root.setProperty("--ink-dim", `rgba(${rgb},${lerp(0.66, 0.78, u).toFixed(2)})`);
      root.setProperty("--ink-faint", `rgba(${rgb},${lerp(0.4, 0.58, u).toFixed(2)})`);
      root.setProperty("--edge", `rgba(${rgb},${lerp(0.16, 0.26, u).toFixed(2)})`);
      root.setProperty("--btn-ink", `rgb(${mix(NAVY, CREAM, u)})`);
      root.setProperty("--glass", `rgba(${mix([8, 10, 30], [255, 255, 255], u)},${lerp(0.46, 0.34, u).toFixed(2)})`);
      root.setProperty("--scrim", `rgba(5,7,26,${(0.66 * (1 - u)).toFixed(2)})`);
    }

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
      // scroll progress (written by the page) sets the hour; the "early" channel and a hovered portal nudge it toward day
      const nudge = dawn.early ? 0.3 : dawn.peek === "early" ? 0.12 : 0;
      const target = clamp(0.02 + 0.66 * smooth(dawn.p) + nudge, 0, 1);
      gt += (target - gt) * (reduce ? 1 : 0.05);
      const name = skyName(gt);
      if (name !== dawn.name) dawn.name = name;
      if (loadFade < 1) loadFade = Math.min(1, loadFade + dt / 1.8);
      const vis = lerp(1, 1.9, smooth((gt - 0.3) / 0.25)) * loadFade; // brighter by day so they still read on the light sky
      sky.draw(sample(gt), time, scrollY / Math.max(1, innerHeight), ptrX, -ptrY);
      stars.draw(vis, time, scrollY * 0.00045 + time * 0.005, ptrX, ptrY, dt, scrollY);
      grainEl.style.backgroundPosition = `${Math.round(time * 7)}px ${Math.round(time * 4 - scrollY * 0.35)}px`;
      theme(gt);
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
