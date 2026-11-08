<script>
  import { onMount } from "svelte";
  import Sky from "$lib/dawn/Sky.svelte";
  import Demo from "$lib/dawn/Demo.svelte";
  import Wordmark from "$lib/dawn/Wordmark.svelte";
  import Mark from "$lib/dawn/Mark.svelte";
  import Pull from "$lib/dawn/Pull.svelte";
  import { dawn } from "$lib/dawn/state.svelte.js";
  import { by, answer } from "$lib/dawn/chats.svelte.js";
  import { clamp, smooth, lerp } from "$lib/dawn/sky.js";

  const GH = "https://github.com/yoakeland-dev/yoakeland";
  const APP = "https://app.yoake.land";
  const COPY = {
    stable: "Stable builds are tested and change slowly.",
    early: "Early builds arrive first and sometimes break.",
  };
  const OS = [["linux", "linux"], ["mac", "macos"], ["win", "windows"]];
  const LABELS = ["overview", "one lamp", "your color", "remotes", "calm", "download"];
  const STEPS = LABELS.length;
  const TRACK = 665; // svh of scroll the pinned frame lives for
  // three remotes as constellations: [x, y] stars, first one is the hub
  const REMOTES = [
    { name: "unix", stars: [[150, 330], [96, 290], [212, 372], [120, 392], [58, 360]] },
    { name: "tls", stars: [[400, 150], [340, 112], [462, 96], [446, 196], [372, 202]] },
    { name: "webrtc", stars: [[650, 310], [598, 366], [712, 352], [700, 262], [622, 252]] },
  ];

  // hero figure: the lamp star is the hub, the rest are quiet neighbours ([x%, y%])
  const FIG = [[48, 40], [76, 42], [55, 16], [82, 20], [69, 56]];
  const pc = ([x, y]) => [x / 8, y / 4.6];
  const LINKS = [[0, 1], [1, 2], [0, 2]];
  let approved = $state({});

  let step = $state(0);
  let rect = $state({ t: 12, r: 12, b: 12, l: 600, rad: 18, sw: 360, bleed: 0 });
  let hue = $state(226);
  let clock = $state("00:00");
  let os = $state("");
  let open = $state(false);
  let streak = $state(0);
  let sceneEl = $state();
  let fit = $state({ w: 1180, h: 620, k: 1, dx: 0 });
  let pullP = $state(0);
  let leaving = $state(false);
  let pull;

  const nl = $derived(by("needs").length);
  const first = $derived(by("needs")[0]);
  const ch = $derived(dawn.early ? "early" : "stable");

  function update() {
    const vh = innerHeight, vw = innerWidth, y = scrollY;
    dawn.p = clamp(y / (((TRACK - 100) / 100) * vh), 0, 1);
    step = clamp(Math.floor((y + 0.35 * vh) / vh), 0, STEPS - 1);
    if (vw < 760) rect = { t: 12, r: 12, l: 12, b: Math.round(vh * 0.46), rad: 18, sw: 0, bleed: 0 };
    else {
      const m = smooth(y / (0.7 * vh)), sw = Math.max(300, Math.min(420, vw * 0.28));
      rect = { t: 12, r: 12, b: 12, l: lerp(vw * 0.42, sw, m), rad: lerp(18, 14, m), sw, bleed: 0 };
    }
  }
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };

  function fitDemo() {
    if (!sceneEl) return;
    const mobile = innerWidth < 760, w = mobile ? 272 : 1180, h = mobile ? 560 : 620;
    const r = sceneEl.getBoundingClientRect();
    fit = { w, h, k: Math.min(1, (r.width - 24) / w, (r.height - 24) / h), dx: 0 };
  }
  $effect(() => { rect; fitDemo(); });

  onMount(() => {
    const ua = navigator.userAgent;
    os = /Android|iPhone|iPad/.test(ua) ? "" : /Mac/.test(ua) ? "mac" : /Win/.test(ua) ? "win" : "linux";
    const t = () => { const d = new Date(); clock = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
    t();
    const iv = setInterval(t, 20000);
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    const onShow = (e) => { if (e.persisted) { leaving = false; pull?.reset(); } };
    addEventListener("pageshow", onShow);
    return () => {
      clearInterval(iv);
      removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); removeEventListener("pageshow", onShow);
    };
  });

  function openApp() {
    leaving = true;
    setTimeout(() => location.assign(APP), 750);
  }
  function allow(a) { if (first) { answer(first.id, a); streak++; open = false; } }
  const goto = (i) => scrollTo({ top: i * innerHeight });
  function onPortalKey(e) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    dawn.early = ["ArrowRight", "ArrowDown"].includes(e.key);
    e.currentTarget.querySelector('[aria-checked="true"]')?.focus();
  }
</script>

<svelte:head>
  <title>yoake</title>
  <meta name="description" content="A calm desktop and phone client for your agent harnesses." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300..400&display=swap" rel="stylesheet" />
  <style>
    @font-face { font-family: "Questrial"; src: url(/dawn/Questrial.woff2) format("woff2"); font-display: swap; }
    @font-face { font-family: "Departure Mono"; src: url(/dawn/Departure-Mono.woff2) format("woff2"); font-display: swap; }
  </style>
</svelte:head>

<div class="page" class:leaving style:transform={leaving ? "translateY(-100%)" : `translateY(${-pullP * 140}px)`}>
  <div class="track" style:height="{TRACK}svh">
    <div class="frame" id="top" style="--t:{rect.t}px;--r:{rect.r}px;--b:{rect.b}px;--l:{rect.l}px;--rad:{rect.rad}px;--sw:{rect.sw}px;--bleed:{rect.bleed}">
      <div class="clip">
        <Sky />
        <div class="glow" style="--gx:{(hue / 360) * 100}%;--h:{hue}" class:on={step === 2}></div>

        <div class="scene" bind:this={sceneEl}>
          <!-- the warm star: the one chat that needs you -->
          <div class="layer fig" class:on={step === 0}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {#each FIG as [x, y]}<line x1="62" y1="26" x2={x} y2={y} vector-effect="non-scaling-stroke" />{/each}
            </svg>
            {#each FIG as [x, y], i}<i class="g" style="left:{x}%;top:{y}%;--d:{i * 0.7}s"></i>{/each}
          </div>
          <div class="lampstar" class:show={step === 0 || step === 4} class:calm={nl === 0}>
            <button type="button" aria-expanded={open} aria-label={nl ? "A chat needs you" : "Nothing needs you"} onclick={() => nl && (open = !open)} onmouseenter={() => nl && (open = true)}>
              <i></i><b aria-hidden="true"></b>
            </button>
            {#if nl && !open}<span class="hint mono" aria-hidden="true">needs you</span>{/if}
            {#key streak}{#if streak}<span class="streak" aria-hidden="true"></span>{/if}{/key}
            {#if open && first}
              <div class="pop mono" role="dialog" aria-label="Question from an agent">
                <p>{first.ask.q}</p><p class="d">{first.ask.d}</p>
                <div><button type="button" onclick={() => allow("allow")}>allow</button><button type="button" onclick={() => allow("deny")}>deny</button></div>
              </div>
            {/if}
          </div>

          <div class="layer demo" class:on={step === 1 || step === 2} style="width:{fit.w}px;height:{fit.h}px;transform:translate(calc(-50% + {fit.dx}px),-50%) scale({fit.k})">
            <Demo bind:hue />
          </div>

          <div class="layer remotes" class:on={step === 3}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {#each REMOTES as r}{#each r.stars as s, j}{#if j > 0}<line class="spoke" class:ok={approved[r.name]} x1={pc(r.stars[0])[0]} y1={pc(r.stars[0])[1]} x2={pc(s)[0]} y2={pc(s)[1]} vector-effect="non-scaling-stroke" />{/if}{/each}{/each}
              {#each LINKS as [a, b]}<line class="link" class:ok={approved[REMOTES[a].name] || approved[REMOTES[b].name]} x1={pc(REMOTES[a].stars[0])[0]} y1={pc(REMOTES[a].stars[0])[1]} x2={pc(REMOTES[b].stars[0])[0]} y2={pc(REMOTES[b].stars[0])[1]} vector-effect="non-scaling-stroke" />{/each}
            </svg>
            {#each REMOTES as r, i}
              {#each r.stars as s, j}{#if j > 0}<i class="g" class:ok={approved[r.name]} style="left:{pc(s)[0]}%;top:{pc(s)[1]}%;--d:{j * 0.5}s"></i>{/if}{/each}
              <button type="button" class="hub" class:ok={approved[r.name]} style="left:{pc(r.stars[0])[0]}%;top:{pc(r.stars[0])[1]}%;--d:{i * 0.9}s" onclick={() => (approved[r.name] = !approved[r.name])}>
                <i></i><b aria-hidden="true"></b>
                <span class="mono">{r.name}</span>
              </button>
            {/each}
          </div>

          <p class="layer quiet" class:on={step === 4}>{nl === 0 ? "nothing needs you." : "something does."}</p>

          <div class="layer portals" class:on={step === 5} role="radiogroup" aria-label="release channel" tabindex="-1" onkeydown={onPortalKey}>
            {#each [["stable", "dusk"], ["early", "day"]] as [c, img]}
              <button type="button" role="radio" aria-checked={ch === c} tabindex={ch === c ? 0 : -1}
                onclick={() => (dawn.early = c === "early")} onmouseenter={() => (dawn.peek = c)} onmouseleave={() => (dawn.peek = null)} onfocus={() => (dawn.peek = c)} onblur={() => (dawn.peek = null)}>
                <span class="orb"><img src="/dawn/icon-{img}.webp" alt="" /></span>
                <span class="mono">{c}</span>
              </button>
            {/each}
          </div>

          <label class="layer horizon" class:on={step === 2}>
            <span class="mono">drag to dye the sky</span>
            <input type="range" min="0" max="360" bind:value={hue} aria-label="Accent hue" aria-valuetext="hue {hue}" />
          </label>
        </div>
      </div>
      <div class="edge" aria-hidden="true"></div>

      <!-- the sidebar: text lives here, on the dark ground -->
      <nav class="rail" aria-label="sections">
        {#each LABELS as label, i}
          <button type="button" class:on={i === step} aria-label={label} aria-current={i === step} onclick={() => goto(i)}><span class="mono">{label}</span><i></i></button>
        {/each}
      </nav>
      <aside class="side">
        <div class="brandrow">
          <a class="brand" href="#top" onclick={(e) => { e.preventDefault(); goto(0); }} aria-label="yoake, back to top"><Mark /><span>yoake</span></a>
          <a class="mono ghlink" href={GH} target="_blank" rel="noopener">github ↗</a>
        </div>

        <div class="panels">
          <section class="panel hero" class:on={step === 0} inert={step !== 0}>
            <h1>leave it running.<span>come back at first light<i class="dot" aria-hidden="true"></i></span></h1>
            <p class="sub">yoake is a calm desktop and phone client for your agent harnesses. Connect to any remote, see which chat needs you, and work from wherever you are.</p>
            <div class="cta">
              <a class="btn" href="#download" onclick={(e) => { e.preventDefault(); goto(5); }}>download</a>
              <a class="link" href="#how" onclick={(e) => { e.preventDefault(); goto(1); }}>see how it works</a>
            </div>
            <div class="hud mono" aria-live="polite">
              <p class="needs"><i class="lamp" class:off={nl === 0}></i><span>{nl === 0 ? "all quiet" : nl === 1 ? "1 chat needs you" : `${nl} chats need you`}</span></p>
              <p>sky: {dawn.name}</p>
            </div>
          </section>

          <section class="panel" class:on={step === 1} inert={step !== 1} id="how">
            <h2>One lamp</h2><p>A chat lights a lamp when it needs you. Until then, the window stays quiet.</p>
            <h2>Any screen</h2><p>Use it on the desktop, in a browser or on your phone. The same chats follow you.</p>
          </section>
          <section class="panel" class:on={step === 2} inert={step !== 2}>
            <h2>Your color</h2><p>Pick a hue. Every surface follows it. Drag the line along the bottom.</p>
          </section>
          <section class="panel" class:on={step === 3} inert={step !== 3}>
            <h2>Any remote</h2><p>Connect to a server over a unix socket, TLS or WebRTC. They show up as stars in one sky, already joined.</p>
          </section>
          <section class="panel" class:on={step === 4} inert={step !== 4}>
            <h2>Calm by default</h2><p>Nothing moves until a chat needs you. Answer the star and the sky goes quiet.</p>
          </section>
          <section class="panel" class:on={step === 5} inert={step !== 5} id="download">
            <h2 class="big">get yoake</h2>
            <p>{COPY[ch]}</p>
            <div class="plats">
              {#each OS as [k, label]}
                <a class="btn" class:pri={os === k} href="{GH}/releases" target="_blank" rel="noopener">{label}</a>
              {/each}
            </div>
            <p class="meta">There is also a browser and phone client. Connect any of them to your own server.</p>
          </section>
        </div>

        <nav class="ticks" aria-label="sections">
          {#each LABELS as label, i}
            <button type="button" class:on={i === step} aria-label={label} aria-current={i === step} onclick={() => goto(i)}><i></i><span class="lbl">0{i + 1} {label}</span></button>
          {/each}
        </nav>
      </aside>
    </div>
  </div>

  <footer class="foot">
    <div class="foot-top pad">
      <nav class="foot-links" aria-label="footer">
        <a href={GH} target="_blank" rel="noopener">github</a>
        <a href="{GH}/releases" target="_blank" rel="noopener">releases</a>
        <a href="#top" onclick={(e) => { e.preventDefault(); goto(0); }}>top</a>
      </nav>
      <p class="mono note">Made with care, mostly at night. · {dawn.name} · {clock}</p>
    </div>
    <Wordmark dot="rgba(255,244,234,.82)" ringColor="#fff4ea" />
    <Pull bind:this={pull} bind:progress={pullP} href={APP} onopen={openApp} />
  </footer>
</div>

<style>
  :global(:root) {
    color-scheme: dark;
    --night: #05071a; --ink: #fff4ea; --ink-dim: rgba(255, 244, 234, 0.66); --ink-faint: rgba(255, 244, 234, 0.4);
    --lamp: #e4515c; --edge: rgba(255, 244, 234, 0.14); --glass: rgba(8, 10, 30, 0.46); --btn-ink: #141b36;
    --ground: hsl(226 15% 5%);
    --font-ui: "Questrial", "Segoe UI", system-ui, -apple-system, sans-serif;
    --font-mono: "Departure Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --font-serif: "Newsreader", Georgia, "Times New Roman", serif;
  }
  :global(html) { background: var(--ground); scroll-behavior: smooth; overscroll-behavior-y: none; }
  :global(body) { margin: 0; background: var(--ground); color: var(--ink); font: 400 16px/1.5 var(--font-ui); font-synthesis: none; -webkit-font-smoothing: antialiased; overflow-x: clip; }
  :global(*, *::before, *::after) { box-sizing: border-box; }
  :global(a) { color: inherit; }
  :global(:focus-visible) { outline: 2px solid #9db3ff; outline-offset: 3px; border-radius: 6px; }
  .mono { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.01em; }
  .pad { padding-inline: max(16px, env(safe-area-inset-left, 0px)); }

  .page { transition: transform 0.12s linear; will-change: transform; }
  .page.leaving { transition: transform 0.75s cubic-bezier(0.7, 0, 0.2, 1); }
  .track { position: relative; }
  .frame { position: sticky; top: 0; height: 100svh; overflow: hidden; }
  .clip { position: absolute; inset: 0; clip-path: inset(var(--t) var(--r) var(--b) var(--l) round var(--rad)); }
  .edge { position: absolute; top: var(--t); right: var(--r); bottom: var(--b); left: var(--l); border: 1px solid rgba(255, 244, 234, 0.12); border-radius: var(--rad); pointer-events: none; }
  .scene { position: absolute; z-index: 4; top: var(--t); right: var(--r); bottom: var(--b); left: var(--l); }
  .glow { position: absolute; inset: 0; z-index: 3; pointer-events: none; opacity: 0; transition: opacity 0.8s;
    background: radial-gradient(70% 42% at var(--gx) 100%, hsl(var(--h) 100% 70% / 0.42), hsl(var(--h) 100% 70% / 0.37) 12%, hsl(var(--h) 100% 70% / 0.29) 26%, hsl(var(--h) 100% 70% / 0.19) 40%, hsl(var(--h) 100% 70% / 0.1) 54%, hsl(var(--h) 100% 70% / 0.04) 70%, transparent 100%); mix-blend-mode: screen; }
  .glow.on { opacity: 1; }

  /* scene layers */
  .layer { position: absolute; opacity: 0; filter: blur(10px); pointer-events: none; transition: opacity 0.7s, filter 0.7s; }
  .layer.on { opacity: 1; filter: none; pointer-events: auto; }
  .demo { left: 50%; top: 50%; transform-origin: center; }
  .remotes, .fig { inset: 0; color: var(--ink-dim); }
  .remotes.on, .fig.on { pointer-events: none; }
  svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  line { stroke: currentColor; stroke-width: 1; stroke-opacity: 0.12; }
  .remotes .spoke { stroke-opacity: 0.22; transition: stroke-opacity 1s; }
  .remotes .spoke.ok { stroke-opacity: 0.4; }
  .remotes .link { stroke-opacity: 0.38; stroke: #ffb454; stroke-width: 1.2; stroke-dasharray: 3000; stroke-dashoffset: 3000; transition: stroke-opacity 1s, stroke-dashoffset 1.8s ease 0.3s; }
  .remotes.on .link { stroke-dashoffset: 0; }
  .remotes .link.ok { stroke-opacity: 0.85; }
  .g { position: absolute; width: 3px; height: 3px; margin: -1.5px 0 0 -1.5px; border-radius: 50%; background: var(--ink); opacity: 0.55; animation: tw 4s ease-in-out var(--d, 0s) infinite; transition: opacity 1s, box-shadow 1s; }
  .remotes .g.ok { opacity: 1; box-shadow: 0 0 10px 2px rgba(255, 180, 84, 0.5); }
  @keyframes tw { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.8; } }
  /* a 4-point glint; it breathes to say "ask me" */
  b { position: absolute; left: 50%; top: 50%; width: 46px; height: 46px; margin: -23px 0 0 -23px; pointer-events: none; opacity: 0.9; animation: glint 3.6s ease-in-out var(--d, 0s) infinite;
    background: linear-gradient(90deg, transparent, rgba(255,244,234,.06) 14%, rgba(255,244,234,.25) 30%, rgba(255,244,234,.62) 42%, #fff4ea 50%, rgba(255,244,234,.62) 58%, rgba(255,244,234,.25) 70%, rgba(255,244,234,.06) 86%, transparent) center / 100% 1.5px no-repeat, linear-gradient(0deg, transparent, rgba(255,244,234,.06) 14%, rgba(255,244,234,.25) 30%, rgba(255,244,234,.62) 42%, #fff4ea 50%, rgba(255,244,234,.62) 58%, rgba(255,244,234,.25) 70%, rgba(255,244,234,.06) 86%, transparent) center / 1.5px 100% no-repeat; }
  @keyframes glint { 0%, 100% { transform: scale(0.35) rotate(0); opacity: 0.2; } 50% { transform: scale(1) rotate(45deg); opacity: 1; } }
  .hub { position: absolute; display: grid; place-items: center; width: 56px; height: 56px; margin: -28px 0 0 -28px; padding: 0; border: 0; background: none; color: var(--ink); cursor: pointer; pointer-events: auto; }
  .hub i { width: 9px; height: 9px; border-radius: 50%; background: #ffb454; box-shadow: 0 0 0 6px rgba(255, 180, 84, 0.16), 0 0 28px 8px rgba(255, 170, 70, 0.5); animation: pulse 3s ease-in-out var(--d) infinite; }
  .hub span { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 2px; white-space: nowrap; color: var(--ink-dim); transition: color 0.4s; }
  .hub:hover span { color: var(--ink); }
  .hub.ok i { background: #fff4ea; box-shadow: 0 0 0 8px rgba(255, 244, 234, 0.14), 0 0 34px 10px rgba(255, 220, 170, 0.6); }
  .quiet { inset: 0; display: grid; place-items: center; margin: 0; padding: 0 5%; text-align: center; font: 400 clamp(3rem, 8vw, 8rem)/1 var(--font-serif); letter-spacing: -0.02em; color: var(--ink); }
  .portals { inset: 0; display: flex; align-items: center; justify-content: center; gap: clamp(24px, 6vw, 90px); }
  .portals button { display: grid; justify-items: center; gap: 16px; padding: 0; border: 0; background: none; color: var(--ink); opacity: 0.7; cursor: pointer; transition: opacity 0.3s; }
  .portals button[aria-checked="true"], .portals button:hover { opacity: 1; }
  .orb { display: block; width: clamp(140px, 20vw, 260px); aspect-ratio: 1; border-radius: 50%; overflow: hidden; border: 1px solid var(--edge); box-shadow: 0 0 0 0 transparent; transition: transform 0.5s cubic-bezier(0.3, 0.7, 0.2, 1), box-shadow 0.5s; }
  .orb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .portals button:hover .orb { transform: scale(1.03); }
  .portals button[aria-checked="true"] .orb { box-shadow: 0 0 0 4px var(--ink), 0 30px 80px rgba(0, 0, 0, 0.35); }
  .horizon { left: 6%; right: 6%; bottom: 26px; display: grid; gap: 10px; justify-items: center; color: var(--ink-dim); }
  .horizon input { -webkit-appearance: none; appearance: none; width: 100%; height: 22px; margin: 0; background: linear-gradient(90deg, hsl(0 90% 72%), hsl(60 90% 72%), hsl(120 90% 72%), hsl(180 90% 72%), hsl(240 90% 76%), hsl(300 90% 74%), hsl(360 90% 72%)) center / 100% 2px no-repeat; cursor: ew-resize; }
  .horizon input::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--ink); background: hsl(var(--h, 226) 100% 70% / 0.4); box-shadow: 0 0 24px hsl(var(--h, 226) 100% 70% / 0.8); }
  .horizon input::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--ink); background: transparent; box-shadow: 0 0 24px rgba(255, 255, 255, 0.5); }

  /* warm star */
  .lampstar { position: absolute; left: 62%; top: 26%; opacity: 0; pointer-events: none; transition: opacity 0.6s; }
  .lampstar.show { opacity: 1; pointer-events: auto; }
  .lampstar > button { position: relative; display: grid; place-items: center; width: 44px; height: 44px; margin: -22px 0 0 -22px; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer; }
  .lampstar > button b { width: 70px; height: 70px; margin: -35px 0 0 -35px; }
  .lampstar.calm > button b { display: none; }
  .hint { position: absolute; left: 22px; top: -8px; white-space: nowrap; color: var(--ink-dim); animation: hint 4s ease-in-out infinite; pointer-events: none; }
  @keyframes hint { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
  .lampstar > button i { width: 9px; height: 9px; border-radius: 50%; background: #ffb454; box-shadow: 0 0 0 5px rgba(255, 180, 84, 0.18), 0 0 26px 6px rgba(255, 170, 70, 0.55); animation: pulse 3.2s ease-in-out infinite; transition: background 0.8s, box-shadow 0.8s; }
  .lampstar.calm > button { cursor: default; }
  .lampstar.calm > button i { width: 4px; height: 4px; background: #dce8ff; box-shadow: 0 0 10px 2px rgba(200, 220, 255, 0.5); animation: none; }
  @keyframes pulse { 0%, 100% { transform: scale(0.85); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; } }
  .pop { position: absolute; left: 28px; top: -28px; width: 230px; padding: 14px; border: 1px solid var(--edge); border-radius: 10px; background: var(--glass); backdrop-filter: blur(14px); color: var(--ink); }
  .pop p { margin: 0; font-size: 12px; }
  .pop .d { margin-top: 2px; color: var(--ink-dim); }
  .pop div { display: flex; gap: 8px; margin-top: 12px; }
  .pop button { padding: 6px 12px; border: 1px solid var(--edge); border-radius: 999px; background: none; color: var(--ink); font: inherit; cursor: pointer; transition: background 0.2s; }
  .pop button:first-child { background: var(--ink); color: var(--btn-ink); }
  .pop button:hover { filter: brightness(1.1); }
  .streak { position: absolute; left: 0; top: 0; width: 140px; height: 1.5px; transform-origin: left; background: linear-gradient(90deg, rgba(255, 244, 234, 0.9), rgba(255, 244, 234, 0.66) 15%, rgba(255, 244, 234, 0.4) 30%, rgba(255, 244, 234, 0.2) 50%, rgba(255, 244, 234, 0.07) 75%, transparent); animation: shoot 0.9s ease-out forwards; pointer-events: none; }
  @keyframes shoot { from { transform: translate(0, 0) rotate(28deg); opacity: 1; } to { transform: translate(-260px, 140px) rotate(28deg); opacity: 0; } }

  /* minimap rail: one bar per section, the long one is where you are */
  .rail { position: absolute; z-index: 11; right: 26px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .rail button { display: flex; align-items: center; gap: 10px; padding: 7px 0 7px 14px; border: 0; background: none; color: var(--ink-faint); cursor: pointer; }
  .rail i { display: block; width: 12px; height: 2px; border-radius: 2px; background: currentColor; transition: width 0.4s cubic-bezier(0.3, 0.7, 0.2, 1), background 0.3s, box-shadow 0.3s; }
  .rail span { opacity: 0; transform: translateX(6px); transition: opacity 0.25s, transform 0.25s; pointer-events: none; }
  .rail button:hover, .rail button.on { color: var(--ink); }
  .rail button:hover span, .rail button.on span { opacity: 1; transform: none; }
  .rail button.on span { color: var(--ink-dim); }
  .rail button:hover i { width: 22px; }
  .rail button.on i { width: 34px; background: #ffb454; box-shadow: 0 0 10px #ffb454; }

  /* sidebar */
  .side { position: absolute; z-index: 10; inset: 0 auto 0 0; width: max(var(--l), var(--sw)); display: flex; flex-direction: column; padding: 18px 28px 28px max(20px, env(safe-area-inset-left, 0px)); }
  .brandrow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-size: 1.2rem; letter-spacing: -0.015em; }
  .brand :global(svg) { width: 26px; height: 26px; display: block; }
  .ghlink { color: var(--ink-faint); text-decoration: none; transition: color 0.2s; }
  .ghlink:hover { color: var(--ink); }
  .panels { position: relative; flex: 1; min-height: 0; }
  .panel { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; padding-bottom: 28px; opacity: 0; transform: translateY(14px); pointer-events: none; transition: opacity 0.5s, transform 0.5s cubic-bezier(0.3, 0.7, 0.2, 1); }
  .panel.on { opacity: 1; transform: none; pointer-events: auto; }
  .panel h2 { margin: 14px 0 0; font: 400 clamp(1.7rem, 2.4vw, 2.4rem)/1 var(--font-serif); letter-spacing: -0.01em; }
  .panel h2:first-child { margin-top: 0; }
  .panel h2.big { font-size: clamp(2.4rem, 3.6vw, 3.6rem); }
  .panel .count { margin-top: 6px; color: var(--ink); }
  .panel p { margin: 0; max-width: 32ch; color: var(--ink-dim); line-height: 1.5; }
  .panel .meta { margin-top: 12px; font-size: 0.9rem; }
  h1 { margin: 0; font: 400 clamp(2.6rem, 4.8vw, 5rem)/0.98 var(--font-serif); letter-spacing: -0.025em; text-wrap: balance; }
  h1 span { display: block; color: var(--ink-dim); }
  .dot { display: inline-block; width: 0.13em; height: 0.13em; margin-left: 0.1em; border-radius: 50%; background: var(--lamp);
    box-shadow: 0 0 0 0.1em rgba(228, 81, 92, 0.18), 0 0 0.7em 0.12em rgba(228, 81, 92, 0.5); animation: breathe 4.5s ease-in-out infinite; }
  @keyframes breathe { 0%, 100% { opacity: 0.82; } 50% { opacity: 1; } }
  .hero .sub { margin-top: 18px; max-width: 36ch; font-size: 1rem; }
  .cta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 22px; margin-top: 18px; }
  .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 22px; border-radius: 999px; border: 1px solid transparent; background: var(--ink); color: var(--btn-ink); font: inherit; font-size: 0.95rem; text-decoration: none; cursor: pointer; transition: transform 0.2s, background 0.3s; }
  .btn:hover { transform: translateY(-1px); }
  .btn:active { transform: translateY(1px); }
  .link { color: var(--ink-dim); text-decoration: underline; text-decoration-color: rgba(255, 244, 234, 0.3); text-underline-offset: 5px; transition: color 0.2s; }
  .link:hover { color: var(--ink); }
  .hud { display: grid; gap: 4px; margin-top: 26px; padding-top: 16px; border-top: 1px solid var(--edge); color: var(--ink-faint); }
  .hud p { margin: 0; max-width: none; }
  .needs { display: inline-flex; align-items: center; gap: 9px; color: var(--ink) !important; }
  .lamp { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #f0b429; box-shadow: 0 0 0 3px rgba(240, 180, 41, 0.22); flex: none; transition: opacity 0.4s; }
  .lamp.off { opacity: 0.25; box-shadow: none; }
  .plats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .plats .btn { background: transparent; border-color: var(--edge); color: var(--ink); }
  .plats .btn.pri { background: var(--ink); border-color: var(--ink); color: var(--btn-ink); }
  .ticks { display: none; flex-direction: column; gap: 2px; padding-top: 14px; border-top: 1px solid var(--edge); }
  .ticks button { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border: 0; border-radius: 6px; background: none; color: var(--ink-faint); font: 12px var(--font-mono); text-align: left; cursor: pointer; transition: background 0.2s, color 0.2s; }
  .ticks button i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.5; transition: background 0.3s, box-shadow 0.3s; }
  .ticks button:hover { background: rgba(255, 244, 234, 0.05); color: var(--ink-dim); }
  .ticks button.on { background: rgba(255, 244, 234, 0.08); color: var(--ink); }
  .ticks button.on i { background: #ffb454; opacity: 1; box-shadow: 0 0 8px #ffb454; }

  /* footer */
  .foot { position: relative; z-index: 2; display: flex; flex-direction: column; justify-content: flex-end; gap: 28px; min-height: 100svh; padding-top: 80px; background: var(--ground); overflow: hidden; }
  .foot-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
  .foot-links { display: flex; gap: 2px; padding: 4px; border: 1px solid var(--edge); border-radius: 12px; }
  .foot-links a { padding: 8px 14px; border-radius: 8px; color: var(--ink-dim); text-decoration: none; font-size: 0.9rem; transition: background 0.2s, color 0.2s; }
  .foot-links a:hover { background: rgba(255, 244, 234, 0.09); color: var(--ink); }
  .note { margin: 0; color: var(--ink-faint); }

  @media (max-width: 759px) {
    .rail { display: none; }
    .ticks { display: flex; }
    .side { inset: calc(100svh * 0.54) 0 0 0; width: auto; padding: 14px 20px 18px; }
    .brandrow { display: none; }
    .panel { justify-content: flex-start; padding-bottom: 0; }
    h1 { font-size: 2.3rem; }
    .hud { display: none; } /* no room under the sky on a phone */
    .ticks { flex-direction: row; gap: 8px; padding-top: 12px; border-top: 0; }
    .ticks button { width: 22px; padding: 10px 0; background: none !important; }
    .ticks button i { width: 22px; height: 2px; border-radius: 2px; }
    .ticks button .lbl { display: none; }
    .panel h2 { font-size: 1.6rem; }
    .lampstar { left: 70%; }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(html) { scroll-behavior: auto; }
    .dot, .lampstar > button i, b, .g, .hint, .hub i { animation: none; }
    .layer { filter: none !important; }
    .page, .layer, .panel { transition: none; }
  }
</style>
