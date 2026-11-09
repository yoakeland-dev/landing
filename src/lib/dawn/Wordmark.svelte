<script>
  import { onMount } from "svelte";

  // land: 0..1. Below 1 the dots are still under the horizon: a front of light spreads out from the lamp and each dot rises as it
  // reaches it (the footer's reveal drives it, so it scrubs both ways)
  let { land = 1 } = $props();
  let cv, slot, poke = () => {};
  $effect(() => poke(land));

  // The whole footer is one dot matrix, drawn by a shader, and the matrix is also a pond: a wave equation runs on the same grid.
  // Waves are deep and long (low damping), and the edges are a sponge so nothing bounces back. Dots are lit by the slope of the
  // water, swell on crests and shrink in troughs, and slide down the slopes so the grid visibly bends. The pointer is a warm lens
  // that lights the dots under it before it even moves; moving drags a wake that gets deeper and wider the faster you go.
  // When the footer lands, the red lamp sends a ring out and a ghost pointer sweeps once through the word to show it answers.
  onMount(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const foot = slot.offsetParent;
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const VS = `
      attribute vec4 a_p; // x, y, kind, wave height
      attribute float a_s; // how the slope faces the light, -1..1
      uniform vec2 u_size, u_lamp, u_ptr; uniform float u_dpr, u_r, u_pulse, u_land, u_rmax, u_pf; uniform vec3 u_bands;
      varying vec4 v_c; varying float v_glow, v_s;
      void main() {
        float k = a_p.z, hh = a_p.w, sh = a_s, size = 1.1 * u_r;
        float st = length(a_p.xy - u_lamp) / u_rmax * 0.55 + fract(sin(a_p.y * 12.9898 + a_p.x * 78.233) * 43758.5453) * 0.08;
        float vis = clamp((u_land - st) / 0.35, 0.0, 1.0); vis = vis * vis * (3.0 - 2.0 * vis);
        gl_Position = vec4(a_p.x / u_size.x * 2.0 - 1.0, 1.0 - (a_p.y + (1.0 - vis) * 28.0) / u_size.y * 2.0, 0.0, 1.0);
        vec3 ink = vec3(24.0, 16.0, 68.0) / 255.0; float a = k < 0.5 ? u_bands.x : k < 1.5 ? u_bands.y : u_bands.z;
        v_glow = 0.0;
        if (k > 2.5) { size = 2.0 * u_r; a = 0.9; }
        if (k < 3.5) {
          float pd = length(a_p.xy - u_ptr), pl = u_pf * exp(-pd * pd / 2600.0); // the pointer's lens
          float lit = clamp(smoothstep(0.08, 0.7, sh) + 0.7 * smoothstep(0.25, 0.9, hh) + 0.6 * pl, 0.0, 1.0);
          float dark = smoothstep(0.08, 0.7, -sh) * 0.75 + smoothstep(0.2, 0.8, -hh) * 0.4;
          ink = mix(ink, vec3(70.0, 40.0, 175.0) / 255.0, dark);
          ink = mix(ink, vec3(240.0, 132.0, 64.0) / 255.0, lit);
          a = min(1.0, a + 0.7 * abs(sh) + 0.4 * abs(hh) + 0.5 * pl);
          float body = clamp(1.0 + 1.7 * hh + 0.35 * abs(sh) + 0.9 * pl, 0.3, 3.4);
          size *= k > 2.5 ? 1.0 + (body - 1.0) * 0.55 : body;
        }
        if (k > 3.5) { size = 2.1 * u_r; a = u_pulse; ink = vec3(228.0, 81.0, 92.0) / 255.0; }
        if (k > 4.5) { size = 8.0 * u_r / 0.37; a = 0.55 * u_pulse; v_glow = 1.0; }
        a *= vis; size *= vis;
        gl_PointSize = size * u_dpr + 1.5; v_s = gl_PointSize;
        v_c = vec4(ink * a, a);
      }`;
    const FS = `
      precision mediump float;
      varying vec4 v_c; varying float v_glow, v_s;
      void main() {
        float dd = length(gl_PointCoord - 0.5) * 2.0;
        float a = v_glow > 0.5 ? pow(max(0.0, 1.0 - dd), 2.0) : 1.0 - smoothstep(1.0 - 3.0 / v_s, 1.0, dd);
        gl_FragColor = v_c * a;
      }`;
    const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); gl.useProgram(prog);
    const loc = (n) => gl.getUniformLocation(prog, n), aP = gl.getAttribLocation(prog, "a_p"), aS = gl.getAttribLocation(prog, "a_s");
    const buf = gl.createBuffer();
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const F = 5; // floats per dot: x, y, kind, height, shade
    let W = 0, H = 0, dpr = 1, s = 10, n = 0, raf = 0, visible = true, built = false, key = "", calm = true, frame = 0;
    let gw = 0, gh = 0, h, hp, hn, c2, dmp, ci, hx, hy, verts, lampN = 0, glowOn = false, lampX = 0, lampY = 0, pulseAt = 0, midY = 0;
    let curLand = land, ghostAt = -1, ghostDone = false;
    const ptr = { x: 0, y: 0, on: false }, lens = { x: 0, y: 0, f: 0 }; // lens: the smoothed pointer light, f fades it in and out

    function build() {
      if (!cv) return; // unmounted while fonts loaded
      const Ws = Math.max(300, slot.clientWidth);
      dpr = Math.min(devicePixelRatio || 1, 2);
      const fs = 100, o = document.createElement("canvas").getContext("2d");
      o.font = `400 ${fs}px Questrial`;
      const m = o.measureText("yoake"), gap = fs * 0.07, R = fs * 0.1, total = m.width + gap + R * 2, k = (Ws * 0.94) / total;
      const asc = (m.actualBoundingBoxAscent || fs * 0.75) * k, desc = (m.actualBoundingBoxDescent || fs * 0.2) * k;
      slot.style.height = Math.ceil(asc + desc + 10) + "px";
      W = foot.clientWidth; H = foot.clientHeight;
      if (!W || !H) return; // hidden: nothing to measure yet
      const kk = `${W}x${H}x${Ws}`;
      if (kk === key) return;
      key = kk;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      gl.viewport(0, 0, cv.width, cv.height);
      // the wordmark is rasterised once, to learn which dots of the matrix are lit
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const x = off.getContext("2d");
      x.font = `400 ${fs * k}px Questrial`;
      x.fillStyle = "#fff";
      const x0 = slot.offsetLeft + (Ws - total * k) / 2, base = slot.offsetTop + asc + 4;
      x.fillText("yoake", x0, base);
      x.fillStyle = "#f00";
      x.beginPath(); x.arc(x0 + (m.width + gap + R) * k, base - R * k, R * k, 0, 6.283); x.fill();
      const d = x.getImageData(0, 0, W, H).data;
      midY = base - asc * 0.4;
      s = Math.max(7, Math.round(Ws / 140));
      gw = Math.ceil((W - s / 2) / s); gh = Math.ceil((H - s / 2) / s);
      h = new Float32Array(gw * gh); hp = h.slice(); hn = h.slice(); c2 = h.slice(); dmp = h.slice();
      const pts = [], lamp = [], cells = [], lcells = [];
      let lsx = 0, lsy = 0;
      for (let iy = 0; iy < gh; iy++)
        for (let ix = 0; ix < gw; ix++) {
          const gx = s / 2 + ix * s, gy = s / 2 + iy * s, c = iy * gw + ix;
          const i = ((gy | 0) * W + (gx | 0)) * 4, f = (gy - slot.offsetTop) / H;
          // a sponge around the edges soaks waves up instead of bouncing them back; inside, the water barely damps, so ripples run long
          const eg = Math.min(ix, gw - 1 - ix, iy, gh - 1 - iy), sp = eg < 20 ? ((20 - eg) / 20) ** 2 * 0.35 : 0;
          c2[c] = 0.3; dmp[c] = 0.004 + sp;
          if (d[i + 3] <= 110) { pts.push(gx, gy, f < 0.25 ? 0 : f < 0.5 ? 1 : 2, 0, 0); cells.push(c); }
          else {
            c2[c] = 0.24; // letters: a slightly slower medium
            if (d[i + 1] < 100) { lamp.push(gx, gy, 4, 0, 0); lcells.push(c); lsx += ix; lsy += iy; }
            else { pts.push(gx, gy, 3, 0, 0); cells.push(c); }
          }
        }
      lampN = lcells.length; glowOn = lampN > 0;
      lampX = lampN ? lsx / lampN : 0; lampY = lampN ? lsy / lampN : 0;
      const all = [...(glowOn ? [s / 2 + lampX * s, s / 2 + lampY * s, 5, 0, 0] : []), ...pts, ...lamp];
      n = all.length / F; // the glow goes first, so the dots draw over it
      verts = new Float32Array(all);
      const first = glowOn ? 1 : 0, N = n - first;
      ci = Int32Array.from([...cells, ...lcells]);
      hx = new Float32Array(N); hy = new Float32Array(N);
      for (let i = 0; i < N; i++) { hx[i] = verts[(i + first) * F]; hy[i] = verts[(i + first) * F + 1]; }
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
      gl.uniform2f(loc("u_size"), W, H);
      gl.uniform1f(loc("u_dpr"), dpr); gl.uniform1f(loc("u_r"), s * 0.37);
      gl.uniform3f(loc("u_bands"), 0.05, 0.09, 0.13);
      const lx = s / 2 + lampX * s, ly = s / 2 + lampY * s;
      gl.uniform2f(loc("u_lamp"), lx, ly); gl.uniform1f(loc("u_rmax"), Math.hypot(Math.max(lx, W - lx), Math.max(ly, H - ly)));
      built = true; calm = true; pulseAt = 0;
      draw(performance.now());
    }

    function draw(t) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(loc("u_pulse"), reduce ? 0.95 : 0.8 + 0.2 * Math.sin(t * 0.0017));
      gl.uniform1f(loc("u_land"), reduce ? 1 : curLand);
      gl.uniform2f(loc("u_ptr"), lens.x, lens.y); gl.uniform1f(loc("u_pf"), lens.f);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 4, gl.FLOAT, false, F * 4, 0);
      gl.enableVertexAttribArray(aS); gl.vertexAttribPointer(aS, 1, gl.FLOAT, false, F * 4, 16);
      gl.drawArrays(gl.POINTS, 0, n);
    }

    // a gaussian stone: cx, cy in grid cells. Added to both time levels, so it starts as a dent at rest and spreads as a ring
    function drop(cx, cy, r, a) {
      const R = Math.ceil(r * 2.5);
      for (let y = Math.max(1, Math.floor(cy - R)); y <= Math.min(gh - 2, Math.ceil(cy + R)); y++)
        for (let x = Math.max(1, Math.floor(cx - R)); x <= Math.min(gw - 2, Math.ceil(cx + R)); x++) {
          const g = a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (r * r)), i = y * gw + x;
          h[i] = Math.max(-1.6, Math.min(1.6, h[i] + g)); hp[i] += g;
        }
    }
    // a wake from (x0, y0) to (x1, y1) in px: faster means deeper and wider. Directly behind the pointer a second, narrow wake fans out
    // at a small angle: small ripples dropped to either side of the recent path, further out the older the path point is
    const hist = [];
    function wake(x0, y0, x1, y1) {
      const dist = Math.hypot(x1 - x0, y1 - y0), steps = Math.min(16, Math.ceil(dist / s) || 1), a = Math.min(0.9, 0.06 + dist * 0.035), r = 2 + Math.min(2.2, dist * 0.06);
      const sp = Math.min(1, dist * 0.09);
      for (let q = 1; q <= steps; q++) {
        const f = q / steps, cx = (x0 + (x1 - x0) * f - s / 2) / s, cy = (y0 + (y1 - y0) * f - s / 2) / s;
        drop(cx, cy, r, a * (dist > s ? 0.55 : 1));
        hist.push([cx, cy]); if (hist.length > 22) hist.shift();
        const L = hist.length;
        if (sp > 0.05) for (let k = 4; k < L - 1; k += 3) {
          const p = hist[L - 1 - k], n2 = hist[L - k];
          let tx = n2[0] - p[0], ty = n2[1] - p[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
          const off = 0.8 + k * 0.32, am = 0.2 * sp * (1 - k / L * 0.4);
          drop(p[0] - ty * off, p[1] + tx * off, 1.1, am); drop(p[0] + ty * off, p[1] - tx * off, 1.1, am);
        }
      }
    }

    // one frame of water: leapfrog wave equation with per-cell speed and damping, then each dot reads its height and slope
    function step() {
      let e = 0;
      for (let y = 1; y < gh - 1; y++)
        for (let x = 1; x < gw - 1; x++) {
          const i = y * gw + x, c = h[i];
          let v = c + (c - hp[i]) * (1 - dmp[i]) + c2[i] * (h[i - 1] + h[i + 1] + h[i - gw] + h[i + gw] - 4 * c);
          v = v > 1.6 ? 1.6 : v < -1.6 ? -1.6 : v;
          hn[i] = v;
          const q = Math.abs(v) + 2 * Math.abs(v - c); if (q > e) e = q;
        }
      const t = hp; hp = h; h = hn; hn = t;
      const N = hx.length, first = glowOn ? 1 : 0, lim = s * 1.5;
      for (let i = 0; i < N; i++) {
        const c = ci[i], j = (i + first) * F;
        const gx = (h[c + 1] - h[c - 1]) * 0.5, gy = ((h[c + gw] || 0) - (h[c - gw] || 0)) * 0.5;
        let dx = -gx * s * 4, dy = -gy * s * 4; // slide down the slopes: the grid bends like looking through water
        dx = dx > lim ? lim : dx < -lim ? -lim : dx; dy = dy > lim ? lim : dy < -lim ? -lim : dy;
        const l = (gx + gy) * 2.4; // slope facing the light, upper left
        verts[j] = hx[i] + dx; verts[j + 1] = hy[i] + dy; verts[j + 3] = h[c]; verts[j + 4] = l > 1 ? 1 : l < -1 ? -1 : l;
      }
      calm = e < 0.006;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts);
    }
    // runs while on screen; at rest nothing is simulated and only the lamp breathes, a few frames a second
    function loop(t) {
      raf = 0;
      if (!visible || !built) return;
      if (lampN && curLand > 0.97 && t > pulseAt) { // the sun's ring, and the first time a ghost pointer shows the footer answers touch
        drop(lampX, lampY, 3.2, 1.3); pulseAt = t + 5200; calm = false;
        if (!ghostDone) { ghostDone = true; ghostAt = t + 900; }
      }
      if (ghostAt >= 0 && !ptr.on) { // sweep from the lamp leftwards through the letters
        const u = (t - ghostAt) / 1700;
        if (u >= 1) { ghostAt = -1; if (!ptr.on) lens.f = 0; }
        else if (u >= 0) {
          const e = u * u * (3 - 2 * u), gx = lampX * s + s / 2, x1 = gx - (gx - W * 0.07) * e, y1 = midY + Math.sin(e * 9) * s * 3.2;
          if (lens.f > 0.05 && u > 0.01) wake(lens.x, lens.y, x1, y1);
          lens.x = x1; lens.y = y1; lens.f += (1 - lens.f) * 0.2; calm = false;
        }
      } else if (ghostAt >= 0) ghostAt = -1;
      if (ptr.on) { lens.x += (ptr.x - lens.x) * 0.3; lens.y += (ptr.y - lens.y) * 0.3; lens.f += (1 - lens.f) * 0.15; calm = false; }
      else if (lens.f > 0.01 && ghostAt < 0) { lens.f *= 0.9; calm = false; }
      if (!calm) { step(); draw(t); } else if (++frame % 4 === 0) draw(t);
      raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf && visible && !reduce) raf = requestAnimationFrame(loop); };

    const cellAt = (e) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      return built && x >= 0 && y >= 0 && x <= W && y <= H ? [x, y] : null;
    };
    const onMove = (e) => {
      const p = cellAt(e);
      if (!p) { ptr.on = false; hist.length = 0; return; }
      if (reduce) return;
      if (!ptr.on) { lens.x = p[0]; lens.y = p[1]; } else wake(ptr.x, ptr.y, p[0], p[1]);
      ptr.x = p[0]; ptr.y = p[1]; ptr.on = true; calm = false; kick();
    };
    const onDown = (e) => { const p = cellAt(e); if (p && !reduce) { drop((p[0] - s / 2) / s, (p[1] - s / 2) / s, 3.5, 1.6); calm = false; kick(); } };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });

    poke = (v) => { curLand = v; if (!built) return; if (reduce) draw(0); else { calm = false; kick(); } };
    const io = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) { if (built) draw(0); kick(); }
    });
    io.observe(cv);

    let rb;
    const ro = new ResizeObserver(() => { clearTimeout(rb); rb = setTimeout(build, 120); });
    ro.observe(foot); ro.observe(slot);
    document.fonts.load("400 100px Questrial").catch(() => {}).then(() => { build(); kick(); });

    return () => { cancelAnimationFrame(raf); clearTimeout(rb); io.disconnect(); ro.disconnect(); removeEventListener("pointermove", onMove); removeEventListener("pointerdown", onDown); };
  });
</script>

<canvas bind:this={cv} aria-hidden="true"></canvas>
<div bind:this={slot} role="img" aria-label="yoake"></div>
<style>
  canvas { position: absolute; left: 0; top: 0; z-index: -1; pointer-events: none; }
  div { width: 100%; }
</style>
