<script>
  import { onMount } from "svelte";

  let { dot = "rgba(24,16,68,.9)", ringColor = "#181344" } = $props();
  let cv, ring;

  // Dot-matrix wordmark; dots scatter from the pointer and spring home, the lamp dot stays lit.
  onMount(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, s = 10, dots = [], raf = 0, visible = true, built = false;
    const ptr = { x: -999, y: -999, on: false };

    function build() {
      const r = cv.getBoundingClientRect();
      W = Math.max(300, r.width);
      dpr = Math.min(devicePixelRatio || 1, 2);
      const fs = 100, o = document.createElement("canvas").getContext("2d");
      o.font = `400 ${fs}px Questrial`;
      const m = o.measureText("yoake"), gap = fs * 0.07, R = fs * 0.1, total = m.width + gap + R * 2, k = (W * 0.94) / total;
      const asc = (m.actualBoundingBoxAscent || fs * 0.75) * k, desc = (m.actualBoundingBoxDescent || fs * 0.2) * k;
      H = Math.ceil(asc + desc + 10);
      cv.style.height = H + "px";
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const off = document.createElement("canvas");
      off.width = Math.round(W); off.height = H;
      const x = off.getContext("2d");
      x.font = `400 ${fs * k}px Questrial`;
      x.textBaseline = "alphabetic";
      x.fillStyle = "#fff";
      const x0 = (W - total * k) / 2, base = asc + 4;
      x.fillText("yoake", x0, base);
      x.fillStyle = "#f00";
      x.beginPath(); x.arc(x0 + (m.width + gap + R) * k, base - R * k, R * k, 0, 6.283); x.fill();
      const d = x.getImageData(0, 0, off.width, off.height).data;
      s = Math.max(7, Math.round(W / 140));
      dots = [];
      for (let gy = s / 2; gy < H; gy += s)
        for (let gx = s / 2; gx < off.width; gx += s) {
          const i = ((gy | 0) * off.width + (gx | 0)) * 4;
          if (d[i + 3] > 110) dots.push({ hx: gx, hy: gy, x: gx, y: gy, vx: 0, vy: 0, l: d[i + 1] < 100 });
        }
      built = true;
      draw(performance.now());
    }

    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const r = s * 0.37;
      ctx.fillStyle = dot;
      ctx.beginPath();
      for (const d of dots) if (!d.l) { ctx.moveTo(d.x + r, d.y); ctx.arc(d.x, d.y, r, 0, 6.283); }
      ctx.fill();
      const pulse = reduce ? 0.95 : 0.8 + 0.2 * Math.sin(t * 0.0017);
      ctx.save();
      ctx.shadowColor = "rgba(228,81,92,.9)";
      ctx.shadowBlur = s * 2.2;
      ctx.fillStyle = `rgba(228,81,92,${pulse.toFixed(3)})`;
      ctx.beginPath();
      for (const d of dots) if (d.l) { ctx.moveTo(d.x + r * 1.05, d.y); ctx.arc(d.x, d.y, r * 1.05, 0, 6.283); }
      ctx.fill();
      ctx.restore();
    }

    function step() {
      const R = Math.max(100, W * 0.09), R2 = R * R;
      for (const d of dots) {
        if (ptr.on) {
          const dx = d.x - ptr.x, dy = d.y - ptr.y, dd = dx * dx + dy * dy;
          if (dd < R2 && dd > 0.01) { const q = Math.sqrt(dd), f = 1 - q / R; d.vx += (dx / q) * f * f * 7; d.vy += (dy / q) * f * f * 7; }
        }
        d.vx += (d.hx - d.x) * 0.045; d.vy += (d.hy - d.y) * 0.045;
        d.vx *= 0.84; d.vy *= 0.84; d.x += d.vx; d.y += d.vy;
      }
    }
    // runs every frame while on screen: the lamp pulses
    function loop(t) {
      raf = 0;
      if (!visible || !built) return;
      step();
      draw(t);
      raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf && visible && !reduce) raf = requestAnimationFrame(loop); };

    const onMove = (e) => {
      const r = cv.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true;
      if (e.pointerType === "mouse") { ring.style.opacity = 1; ring.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }
      kick();
    };
    const onLeave = () => { ptr.on = false; ring.style.opacity = 0; };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) { if (built && reduce) draw(0); kick(); }
    });
    io.observe(cv);

    let rb;
    const onResize = () => { clearTimeout(rb); rb = setTimeout(build, 160); };
    addEventListener("resize", onResize);
    document.fonts.load("400 100px Questrial").catch(() => {}).then(() => { build(); kick(); });

    return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", onResize); };
  });
</script>

<div class="ring" style:border-color={ringColor} bind:this={ring} aria-hidden="true"></div>
<canvas bind:this={cv} role="img" aria-label="yoake"></canvas>

<style>
  canvas { display: block; width: 100%; touch-action: pan-y; }
  @media (pointer: fine) { canvas { cursor: none; } }
  .ring { position: fixed; left: 0; top: 0; z-index: 30; width: 46px; height: 46px; margin: -23px 0 0 -23px; border: 1.5px solid #181344; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity 0.25s; }
</style>
