<script>
  import { onMount, tick } from "svelte";
  import { fade, fly } from "svelte/transition";
  import Sky from "$lib/dawn/Sky.svelte";
  import Wordmark from "$lib/dawn/Wordmark.svelte";
  import Mark from "$lib/dawn/Mark.svelte";
  import Wire from "$lib/dawn/Wire.svelte";
  import { dawn } from "$lib/dawn/state.svelte.js";
  import { clamp, smooth } from "$lib/dawn/sky.js";
  import { morpher } from "$lib/dawn/morph.js";

  const GH = "https://github.com/yoakeland-dev/yoakeland";
  const SERVER = "https://github.com/yoakeland-dev/yoakeland-server";
  const APP = "https://app.yoake.land";
  const RELEASES = `${GH}/releases`;
  // the footer's links, set like the back of a record
  const TRACKS = [["github", "the source", GH], ["server", "host it yourself", SERVER], ["releases", "every build", RELEASES], ["web app", "app.yoake.land", APP], ["first light", "back to the top", "#top"]];
  const LABELS = ["overview", "fleet", "any agent", "every screen", "share", "borrowing", "chapters", "and the rest", "download"];
  const STEPS = LABELS.length;
  const STEPVH = 0.8; // a step is 80svh of scroll
  const REVEAL = 0.35; // after the last step, 35svh of scroll lifts the sky off the footer
  const BASE = 12; // the frame's bottom margin in px, plus the footer when revealed
  const SOON = [5, 6];
  const COPY = [
    null,
    ["Every chat on every machine, sorted by what needs you", "Agents run on your servers while you are away. A lamp marks the one waiting on you, on the desktop and on your phone."],
    ["The agents you already pay for, in one window", "Claude Code and Codex on your own logins, next to API keys and local models. Switch mid-chat and the next one reads everything above."],
    ["One server, every screen", "Desktop, browser and phone connect straight to the yoakeland you run. No account and no cloud relay."],
    ["Share a server without sharing the machine", "Each person stands as close to the server as you let them. Their devices never stand closer than they do."],
    ["One server’s login, another server’s files", "Run the Claude Code login on your desk against a project on a VPS that has no logins of its own."],
    ["Long chats fold into chapters", "When a chat fills its context, finished work becomes a chapter. Nothing is summarised away, and the agent can open any chapter again."],
    ["And everything you’d expect", ""],
  ];
  const CHANNEL = { stable: "Tested, changes slowly.", early: "Arrives first, sometimes breaks." };
  const OSES = { linux: ["Linux", "AppImage"], mac: ["macOS", "dmg"], windows: ["Windows", "installer"] };
  const INSTALLERS = { mac: [/arm64.*\.dmg$/i, /\.dmg$/i], windows: [/\.exe$/i], linux: [/\.AppImage$/i] };

  // hero figure: the lamp star is the hub on the centre line ([x%, y%])
  const FIG = [[24, 30], [78, 27], [36, 11], [65, 9], [11, 60], [90, 58]];

  // fleet: the app's own groups and marks
  const DMX = (() => {
    const O = [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0],[3,0],[2,0],[1,0]];
    const M = [[1,1],[2,1],[3,1],[3,2],[3,3],[2,3],[1,3],[1,2]];
    const c = Array(25).fill(null);
    O.forEach(([r, q], i) => (c[r * 5 + q] = i / 16));
    M.forEach(([r, q], i) => (c[r * 5 + q] = i / 8));
    return c;
  })();
  const SERVERS = { h: ["hetzner-fsn1", "#ffb454"], l: ["homelab", "#7fd1a4"], v: ["laptop", "#7f9cff"] };
  const FLEET = [
    ["Needs you", [["lamp", "fix the flaky auth test", "Run npm test three times?", "h", "api"]]],
    ["Working", [["dmx", "port the settings page to svelte 5", "editing SettingsPanel.svelte", "l", "yoake-gui"], ["dmx", "draft the 0.1.8 release notes", "reading commit messages", "v", "yoake"]]],
    ["Ready", [["done", "bump deps and run the audit", "", "h", "api"]]],
  ];

  // any agent: the agents and providers it speaks to, and one chat that changes hands
  const PROVIDERS = [["claudecode-color"], ["codex-color"], ["opencode", true], ["kimi-color"], ["anthropic", true], ["openai", true], ["gemini-color"], ["deepseek-color"], ["mistral-color"], ["openrouter-color"], ["bedrock-color"], ["ollama", true], ["qwen-color"]];
  const RELAY = [
    ["claudecode-color", "Claude Opus 5.5", "your Claude login", "It races with the token refresh: the clock mock runs after login()."],
    ["codex-color", "GPT-5 Codex", "your ChatGPT login", "Moved the mock ahead of login() and ran the suite three times. 214 passed each run."],
    ["ollama", "Qwen3 Coder", "on this machine", "Wrote the changelog entry from the diff above.", true],
  ];

  // every screen: the server is the sun at the horizon, devices in the sky above it
  const WIRES = [
    ["unix", "#7fd1a4", "M500 355 C 475 270, 260 230, 200 151", 3],
    ["tls", "#ffb454", "M500 355 C 500 270, 500 190, 500 126", 2.6],
    ["webrtc", "#7f9cff", "M500 355 C 525 270, 740 230, 800 151", 3.4],
  ];
  const DEVICES = [
    [20, 36, "desktop app", "unix socket, same machine", '<rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M1 19h22"/>'],
    [50, 30, "browser", "tls", '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>'],
    [80, 36, "phone", "webrtc", '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>'],
  ];

  // share: people on the arc of their tier; each device on its person's arc or further out
  const R = { full: 150, trusted: 270, limited: 390 };
  const pt = (r, deg) => [500 - r * Math.cos((deg * Math.PI) / 180), 420 - r * Math.sin((deg * Math.PI) / 180)];
  const tuck = (a) => (desk ? a : 90 + (a - 90) * 0.72); // on phones the arcs are cropped, so people move toward the top
  const PEOPLE = $derived([
    { n: "Aveline", c: "#ffb454", t: "full", a: 118, nm: "r", dev: [["desktop", "full", 52, "al"], ["phone", "full", 150, "ar"]] },
    { n: "Fernando", c: "#7f9cff", t: "trusted", a: 52, nm: "r", dev: [["laptop", "trusted", 34, "br"], ["phone, Limited", "limited", 44, "al"]] },
    { n: "Rin", c: "#7fd1a4", t: "limited", a: 132, dev: [["browser", "limited", 146, "bl"]] },
    { n: "Jon", c: "#e9a6c4", t: "limited", a: 66, dev: [["phone", "limited", 76, "br"]] },
  ].map((p) => ({ ...p, at: pt(R[p.t], tuck(p.a)), devs: p.dev.map(([d, t, a, side]) => [d, pt(R[t], tuck(a)), side]) })));
  let lit = $state(null);

  // and the rest: one icon each, on a 64 x 40 grid, 1.5 stroke, one warm accent
  const HEAT = [[1,2,1,3,2,1,0],[2,3,4,2,1,3,1],[1,4,3,4,2,2,3],[0,2,1,3,4,1,2]];
  const REST = [
    ["Modes", "Plan, then Read to Run, per chat",
      '<path class="soft" d="M8 20h48"/><path class="acc" d="M8 20h24"/>' + [8, 20, 44, 56].map((x) => `<circle class="pip" cx="${x}" cy="20" r="2"/>`).join("") + '<circle class="knob" cx="32" cy="20" r="5.5"/>'],
    ["Sandbox", "Bubblewrap on Linux, Seatbelt on macOS",
      '<rect class="soft" x="7" y="5" width="42" height="30" rx="8"/><path class="wall" d="M49 11v18"/><circle class="dotacc" cx="19" cy="20" r="4"/><path class="acc" d="M25 20h17"/><path class="acc" d="M42 16v8"/><path class="soft" d="M55 15v10M60 18v4"/>'],
    ["Snapshots", "Rewind any turn that edited files",
      '<path class="soft" d="M6 28h52"/>' + [12, 25, 51].map((x) => `<circle class="hole" cx="${x}" cy="28" r="3"/>`).join("") + '<circle class="dotacc" cx="38" cy="28" r="3.5"/><path class="acc" d="M38 21.5C37 13 26 13 25 21.5"/><path class="acc" d="M21.8 18.6l3.2 3.4 3.2-3.4"/>'],
    ["Diffs and git", "Every changed file against HEAD",
      '<path class="del-s" d="M9 11h5"/><rect class="del" x="18" y="9" width="24" height="4" rx="2"/><path class="add-s" d="M9 20h5M11.5 17.5v5"/><rect class="add" x="18" y="18" width="36" height="4" rx="2"/><rect class="soft-f" x="18" y="27" width="18" height="4" rx="2"/>'],
    ["Terminals", "Tabs beside the chat, the dev server kept running",
      '<rect x="8" y="5" width="48" height="30" rx="6"/><path d="M16 15l5 4.5-5 4.5"/><rect class="dotacc" x="25" y="22" width="9" height="3" rx="1.5"/>'],
    ["Subagents", "Watch each one work",
      '<circle class="dotacc" cx="13" cy="20" r="4.5"/><path class="soft" d="M18 20c10 0 12-11 24-11M18 20h24M18 20c10 0 12 11 24 11"/>' + [9, 20, 31].map((y) => `<circle class="hole" cx="46" cy="${y}" r="3.5"/>`).join("")],
    ["Its own browser", "The agent drives it, you watch or take over",
      '<circle cx="27" cy="20" r="13"/><path class="soft" d="M14 20h26M27 7c-5 4-5 22 0 26M27 7c5 4 5 22 0 26"/><path class="cursor" d="M39 21l0 13 3.4-3.2 2.5 5.4 2.4-1.1-2.5-5.3 4.6-.2z"/>'],
    ["MCP and skills", "Bring yours, import them from other clients",
      '<path d="M22 5v7M32 5v7"/><rect x="16" y="12" width="22" height="11" rx="3.5"/><path class="soft" d="M27 23v3c0 4 3 6 7 6h10"/><circle class="dotacc" cx="49" cy="32" r="3.5"/>'],
    ["Rules and audit", "Say yes once, every approval logged",
      [11, 20, 29].map((y, i) => `<circle class="pip" cx="10" cy="${y}" r="1.6"/><path class="soft" d="M16 ${y}h${[18, 14, 20][i]}"/>`).join("") + '<path class="acc thick" d="M42 20l5 5 10-11"/>'],
    ["Questions in place", "The agent asks over the composer, you pick",
      '<path d="M14 5h32a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H22l-7 6v-6h-1a6 6 0 0 1-6-6V11a6 6 0 0 1 6-6z"/><circle class="hole" cx="17" cy="13" r="2.4"/><path class="soft" d="M23 13h16"/><circle class="dotacc" cx="17" cy="21" r="2.4"/><path d="M23 21h12"/>'],
    ["Scheduled turns", "Queue the next message, or run it later",
      '<circle cx="21" cy="20" r="13"/><path d="M21 12v8l5 3.5"/>' + [42, 50, 58].map((x, i) => `<circle class="${i ? "hole" : "dotacc"}" cx="${x}" cy="20" r="2.6"/>`).join("")],
    ["Usage", "Spend per provider, CLI agents included",
      HEAT.flatMap((row, y) => row.map((v, x) => `<rect class="${v === 4 ? "heat-hot" : "heat"}" style="--v:${[0.12, 0.25, 0.42, 0.62, 1][v]}" x="${8 + x * 7}" y="${6 + y * 7}" width="5.5" height="5.5" rx="1.4"/>`)).join("")],
  ];

  let step = $state(0);
  let prog = $state(0); // scroll progress through the steps, for the nav
  let rect = $state({ t: 12, r: 12, b: BASE, l: 12, rad: 18, fh: 0 });
  let desk = $state(false);
  let size = $state(""); // the viewport, so the visuals are only refitted when it changes and not on every scroll frame
  let reveal = $state(0);
  let footH = $state(460);
  const TRACK = $derived(100 + (STEPS - 1) * STEPVH * 100 + (desk ? REVEAL * 100 : 0)); // svh the pinned frame lives for
  let os = $state("linux");
  let assets = $state({});
  let zoneEl = $state();
  let sceneEl = $state();
  let copied = $state(false);

  const ch = $derived(dawn.early ? "early" : "stable");
  const sub = $derived(ch === "stable" ? OSES[os][1] : "early build, Linux only");
  const dlOs = $derived(ch === "early" ? "linux" : os); // early builds only exist for Linux
  const mainHref = $derived(ch === "stable" ? (assets[os] ?? RELEASES) : RELEASES);
  const others = $derived(Object.keys(OSES).filter((k) => k !== dlOs));

  function update() {
    const vh = innerHeight, vw = innerWidth, y = scrollY;
    if (jumping) landed();
    const run = (STEPS - 1) * STEPVH * vh;
    prog = run ? clamp(y / run, 0, 1) : 0; // a zero-height viewport at hydrate would make this NaN, which never settles
    const f = (y + 0.3 * vh) / (STEPVH * vh);
    if (f < step - 0.04 || f >= step + 1.04) step = clamp(Math.floor(f), 0, STEPS - 1); // a little slack, so resting on a boundary cannot flicker
    size = `${vw}x${vh}`;
    dawn.p = prog;
    dawn.dl = step === STEPS - 1; // the early channel only changes the sky here
    desk = vw >= 760;
    reveal = desk ? clamp((y - run) / (REVEAL * vh), 0, 1) : 0;
    // the sky is a window in a frame; at the end its bottom margin grows and uncovers the footer
    const fh = reveal > 0 ? smooth(reveal) * (footH + 12) : 0;
    rect = !desk ? { t: 12, r: 12, l: 12, b: Math.round(vh * 0.46), rad: 18, fh: 0 } : { t: 12, r: 12, l: 12, b: BASE + fh, rad: 18, fh };
  }
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };

  // every visual is drawn at its natural size and scaled into the space between its own copy and the nav
  let sideEl = $state();
  function fitAll() {
    if (!zoneEl || !sceneEl || !sideEl) return;
    const z = zoneEl.getBoundingClientRect(), sc = sceneEl.getBoundingClientRect();
    const panelsTop = sideEl.querySelector(".panels").getBoundingClientRect().top;
    const navTop = desk ? sideEl.querySelector(".hn").getBoundingClientRect().top : sc.bottom;
    for (const layer of sceneEl.querySelectorAll(".vis")) {
      const panel = sideEl.querySelector(`.panel[data-i="${layer.dataset.i}"]`);
      const last = desk && panel?.lastElementChild;
      // layout offsets, not rects: hidden copy sits a few px off in the direction it will arrive from
      const top = Math.max(z.top, last ? panelsTop + last.offsetTop + last.offsetHeight + 20 : z.top);
      const bottom = desk ? navTop - 12 : z.bottom;
      layer.style.top = `${top - sc.top}px`;
      layer.style.bottom = `${sc.bottom - bottom}px`;
      const el = layer.firstElementChild;
      const grow = Math.min(1.4, Math.max(1, innerWidth / 1600)); // natural size up to 1600px wide, then a little bigger
      const k = Math.min(grow, (z.width - 48) / el.offsetWidth, ((bottom - top) * 0.88) / el.offsetHeight);
      el.style.setProperty("--k", Math.max(0.25, k).toFixed(3));
    }
    placeSun();
  }
  // every screen and share stand on the same sun: one element, gliding between where each stage puts it
  let sun = $state({ x: 0, y: 0, k: 1, hw: 940, on: false, glide: false });
  function placeSun() {
    const layer = (step === 3 || step === 4) && sceneEl?.querySelector(`.vis[data-i="${step}"]`);
    if (!layer) { sun.on = sun.glide = false; return; }
    const sc = sceneEl.getBoundingClientRect(), st = layer.querySelector(".stage").getBoundingClientRect(), cr = layer.firstElementChild.getBoundingClientRect();
    const ty = new DOMMatrix(getComputedStyle(layer).transform).m42; // the layer may be mid-rise; aim where it lands
    const k = st.width / 940;
    sun.glide = !!sceneEl.querySelector(".sunhost.on"); // glide only if it is already showing; read the DOM, since state can flip twice in one flush
    Object.assign(sun, { x: (st.left + st.right) / 2 - sc.left, y: st.bottom - ty - sc.top, k, hw: (Math.min(st.right, cr.right) - Math.max(st.left, cr.left)) / k, on: true });
  }
  $effect(() => { size; desk; fitAll(); });
  // neighbouring sections hand their shared pieces to each other (lib/dawn/morph.js)
  let morphEl = $state();
  let morph, shown = 0;
  $effect(() => {
    step; placeSun();
    const a = shown, b = (shown = step);
    if (a !== b) tick().then(() => morph?.(a, b, jumping)); // after the DOM has the new step, so pieces measure where they land
  });
  $effect(() => { footH; update(); });

  async function loadRelease() {
    try {
      // Every release is a prerelease, which /releases/latest ignores, so use the list.
      const res = await fetch("https://api.github.com/repos/yoakeland-dev/yoakeland/releases?per_page=1");
      if (!res.ok) return;
      const [release] = await res.json();
      for (const [id, patterns] of Object.entries(INSTALLERS))
        for (const re of patterns) {
          const a = (release?.assets ?? []).find((x) => re.test(x.name));
          if (a) { assets[id] = a.browser_download_url; break; }
        }
    } catch {}
  }

  onMount(() => {
    const ua = navigator.userAgent;
    os = /Mac/.test(ua) ? "mac" : /Win/.test(ua) ? "windows" : "linux";
    loadRelease();
    morph = morpher(sceneEl, morphEl);
    update();
    document.fonts?.ready.then(fitAll);
    setTimeout(fitAll, 300);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); };
  });

  // a click that travels past other sections is a jump: nothing morphs on the way, the pictures just fade (until the scroll comes to rest)
  let jumping = false, jumpEnd;
  const landed = () => { clearTimeout(jumpEnd); jumpEnd = setTimeout(() => (jumping = false), 150); };
  function goto(i) {
    if (Math.abs(i - step) > 1) { jumping = true; landed(); }
    scrollTo({ top: i * STEPVH * innerHeight });
  }

  // the nav's slider: drag scrubs the page, letting go settles on the nearest section
  let trackEl = $state();
  let dragging = $state(false);
  function seek(e) {
    const r = trackEl.getBoundingClientRect();
    const f = clamp((e.clientX - r.left) / r.width, 0, 1);
    scrollTo({ top: f * (STEPS - 1) * STEPVH * innerHeight, behavior: "instant" });
    return f;
  }
  let hov = $state(null); // the dot under the pointer, its name shown in the pill
  let navAt = 0, navDir = 1; // the name rolls the way the page is moving
  const navLabel = $derived.by(() => { const i = hov ?? step; navDir = i < navAt ? -1 : 1; navAt = i; return LABELS[i]; });
  function hover(e) {
    if (e.pointerType === "touch") return;
    if (dragging) { hov = null; return; } // while dragging the name follows the page
    const r = trackEl.getBoundingClientRect();
    hov = clamp(Math.round(((e.clientX - r.left) / r.width) * (STEPS - 1)), 0, STEPS - 1); // every point of the track belongs to its nearest dot, the same one a click lands on, so there are no dead gaps
  }
  let press = null; // where the pointer went down, until it moves far enough to count as a drag
  function dragStart(e) { press = { x: e.clientX, id: e.pointerId }; }
  function dragMove(e) {
    if (!press) return;
    if (!dragging && Math.abs(e.clientX - press.x) < 6) return;
    if (!dragging) { dragging = true; trackEl.setPointerCapture(press.id); }
    seek(e);
  }
  function dragEnd(e) {
    if (!press) return;
    const r = trackEl.getBoundingClientRect();
    const f = clamp((e.clientX - r.left) / r.width, 0, 1);
    press = null;
    if (dragging) dragging = false;
    goto(Math.round(f * (STEPS - 1))); // a click lands on the nearest dot; a drag settles on it
  }
  function navKey(e) {
    const to = { ArrowRight: step + 1, ArrowUp: step + 1, ArrowLeft: step - 1, ArrowDown: step - 1, Home: 0, End: STEPS - 1 }[e.key];
    if (to == null) return;
    e.preventDefault();
    goto(clamp(to, 0, STEPS - 1));
  }
</script>

<svelte:head>
  <title>yoake</title>
  <meta name="description" content="A calm desktop and phone client for the coding agents you leave running on your own servers." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300..400&display=swap" rel="stylesheet" />
  <style>
    @font-face { font-family: "Questrial"; src: url(/dawn/Questrial.woff2) format("woff2"); font-display: swap; }
  </style>
</svelte:head>

{#snippet foot()}
  <footer class="foot">
    <div class="foot-top">
      <nav class="tracks" aria-label="footer">
        {#each TRACKS as [name, what, href], i}
          <a {href} target={href.startsWith("http") && href !== APP ? "_blank" : undefined} rel="noopener" onclick={href === "#top" ? (e) => { e.preventDefault(); goto(0); } : undefined}><span>0{i + 1}</span><b>{name}</b><i></i><small>{what}</small></a>
        {/each}
      </nav>
      <div class="liner">
        <p class="shift">Your agents keep<br />the night shift.</p>
        <p class="note">Made with care, mostly at night.</p>
      </div>
    </div>
    <div class="wm"><Wordmark land={desk ? reveal : 1} /></div>
  </footer>
{/snippet}

{#snippet icon(name, mono = false)}<img class="bi" class:mono src="/icons/brands/{name}.svg" alt="" />{/snippet}

{#snippet glyph(g)}
  {#if g === "lamp"}<span class="lampdot"></span>
  {:else if g === "dmx"}<span class="dmx">{#each DMX as k}{#if k == null}<i></i>{:else}<i class="on" style="--k:{k}"></i>{/if}{/each}</span>
  {:else}<span class="tick"></span>{/if}
{/snippet}

<div class="page">
  <div class="track" style:height="{TRACK}svh">
    <div class="frame" id="top" style="--t:{rect.t}px;--r:{rect.r}px;--b:{rect.b}px;--l:{rect.l}px;--rad:{rect.rad}px;--fh:{rect.fh}px;--sb:{desk ? BASE : rect.b}px">
      {#if desk}<div class="footwrap" style:height="{Math.max(0, rect.fh - 12)}px" inert={reveal < 0.5}><div class="footin" bind:clientHeight={footH}>{@render foot()}</div></div>{/if}
      <div class="clip">
        <Sky />

        <div class="scene" bind:this={sceneEl} inert={reveal > 0.02}>
          <div class="zone" bind:this={zoneEl} aria-hidden="true"></div>

          <!-- 1 overview: the warm star -->
          <div class="layer fig" class:on={step === 0} class:before={step > 0} aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              {#each FIG as [x, y]}<line x1="50" y1="19" x2={x} y2={y} vector-effect="non-scaling-stroke" />{/each}
            </svg>
            {#each FIG as [x, y], i}<i class="g" style="left:{x}%;top:{y}%;--d:{i * 0.7}s"></i>{/each}
          </div>
          <i class="hubstar" class:on={step === 0} style="left:50%;top:19%" aria-hidden="true"></i>

          <!-- 2 fleet -->
          <div class="layer vis" data-i="1" class:on={step === 1} class:before={step > 1} aria-hidden="true">
            <div class="fit fleet">
              <div class="glass side2">
                <div class="sh"><span class="avs">{#each Object.entries(SERVERS) as [k, [, c]]}<i style="--c:{c}">{k}</i>{/each}</span>3 servers</div>
                {#each FLEET as [tier, rows]}
                  <h5>{tier}<span>{rows.length}</span></h5>
                  {#each rows as [g, title, meta, srv, proj]}
                    <div class="r2" class:hot={g === "lamp"}>
                      <span class="g2">{@render glyph(g)}</span>
                      <span class="t2"><b>{title}</b>{#if meta}<small>{meta}</small>{/if}<em><i style="--c:{SERVERS[srv][1]}">{srv}</i>{SERVERS[srv][0]} · {proj}</em></span>
                    </div>
                  {/each}
                {/each}
              </div>
              <div class="lock">
                <span class="lt">06:12</span><span class="ld">Monday</span>
                <div class="glass notif"><header><Mark /><b>yoake</b><small>now</small></header><strong>fix the flaky auth test</strong><span>Run npm test three times?</span></div>
                <div class="glass notif dimmer"><header><Mark /><b>yoake</b><small>14m</small></header><strong>bump deps and run the audit</strong><span>Ready for review</span></div>
              </div>
            </div>
          </div>

          <!-- 3 any agent: one chat, handed from a subscription to another to a local model -->
          <div class="layer vis" data-i="2" class:on={step === 2} class:before={step > 2} aria-hidden="true">
            <div class="fit agent">
              <div class="logos">{#each PROVIDERS as [ic, mono]}<span>{@render icon(ic, mono)}</span>{/each}</div>
              <div class="glass relay">
                <div class="you">Find out why the auth test is flaky, then fix it.</div>
                {#each RELAY as [ic, name, where, text, mono], i}
                  {#if i > 0}<div class="hand">Context handed off <span>{@render icon(RELAY[i - 1][0], RELAY[i - 1][4])}{RELAY[i - 1][1]}</span><b>→</b><span>{@render icon(ic, mono)}{name}</span></div>{/if}
                  <div class="said"><header>{@render icon(ic, mono)}{name}<small>{where}</small></header>{text}</div>
                {/each}
              </div>
            </div>
          </div>

          <!-- 4 every screen -->
          <div class="layer vis" data-i="3" class:on={step === 3} class:before={step > 3} aria-hidden="true">
            <div class="fit crop"><div class="stage">
              <svg viewBox="0 0 1000 420"><g class="tuck">
                {#each WIRES as [id, c, d, dur], i}
                  <Wire {d} {c} {dur} begin={i * 0.7} />
                {/each}
              </g></svg>
              {#each DEVICES as [x, y, name, via, ico]}
                <div class="node" style="left:calc(50% + ({x}% - 50%) * var(--tk, 1));top:{y}%"><span class="ico"><svg viewBox="0 0 24 24">{@html ico}</svg></span><b>{name}</b><small>{via}</small><span class="dot"></span></div>
              {/each}
            </div></div>
          </div>

          <!-- 5 share -->
          <div class="layer vis" data-i="4" class:on={step === 4} class:before={step > 4}>
            <div class="fit crop narrow"><div class="stage share">
              <svg viewBox="0 0 1000 420" aria-hidden="true">
                <path class="arc a1" d="M350 420 A150 150 0 0 1 650 420" /><path class="arc a2" d="M230 420 A270 270 0 0 1 770 420" /><path class="arc a3" d="M110 420 A390 390 0 0 1 890 420" />
                {#each PEOPLE as p, i}{#each p.devs as [, [dx, dy]]}<line class:dim={lit != null && lit !== i} x1={p.at[0]} y1={p.at[1]} x2={dx} y2={dy} />{/each}{/each}
              </svg>
              <span class="tl" style="top:64.3%">Full<small>acts as you on the machine</small></span>
              <span class="tl" style="top:35.7%">Trusted<small>helps run the server</small></span>
              <span class="tl" style="top:7.1%">Limited<small>works in open projects</small></span>
              {#each PEOPLE as p, i}
                {#each p.devs as [d, [dx, dy], side]}<span class="dev" class:dim={lit != null && lit !== i} style="left:{dx / 10}%;top:{dy / 4.2}%;--c:{p.c}" aria-hidden="true"><i></i><small class={side}>{d}</small></span>{/each}
                <button type="button" class="who" class:dim={lit != null && lit !== i} style="left:{p.at[0] / 10}%;top:{p.at[1] / 4.2}%;--c:{p.c}" aria-label="{p.n}, {p.t}" onmouseenter={() => (lit = i)} onmouseleave={() => (lit = null)} onfocus={() => (lit = i)} onblur={() => (lit = null)}><i>{p.n[0]}</i><b class={p.nm}>{p.n}</b></button>
              {/each}
            </div></div>
          </div>

          <!-- 6 borrowing (coming) -->
          <div class="layer vis" data-i="5" class:on={step === 5} class:before={step > 5} aria-hidden="true">
            <div class="fit borrow">
              <div class="glass srv"><header><span class="sdot" style="background:#7fd1a4"></span>homelab<small>your desk</small></header>
                <div class="lend">{@render icon("claudecode-color")}<span>Claude Code<small>your Max login</small></span></div>
                <div class="lend">{@render icon("ollama", true)}<span>Ollama<small>the GPU in this box</small></span></div>
              </div>
              <svg class="bline" viewBox="0 0 140 12" aria-hidden="true"><Wire d="M6 6H134" c="#ffb454" dots={[[6, 6], [134, 6]]} /></svg>
              <div class="glass srv"><header><span class="sdot" style="background:#ffb454"></span>hetzner-fsn1<small>a VPS, no logins on it</small></header>
                <div class="r2"><span class="g2">{@render glyph("dmx")}</span><span class="t2"><b>fix the flaky auth test</b><small>~/work/api</small></span></div>
                <div class="via">{@render icon("claudecode-color")}Claude Code, borrowed from homelab</div>
              </div>
            </div>
          </div>

          <!-- 7 chapters (coming) -->
          <div class="layer vis" data-i="6" class:on={step === 6} class:before={step > 6} aria-hidden="true">
            <div class="fit glass chapters">
              <div class="bar u"></div><div class="bar"></div>
              <div class="cdiv">Chapter 1 · Find the flaky test<span>38 messages, kept</span></div>
              <div class="bar u s"></div><div class="bar"></div><div class="bar s2"></div>
              <div class="cdiv">Chapter 2 · Fix the clock mock<span>52 messages, kept</span></div>
              <div class="bar u"></div><div class="bar"></div>
              <div class="cdiv now">Chapter 3 · Write the release notes<span>in context</span></div>
              <div class="bar u s"></div><div class="bar"></div>
            </div>
          </div>

          <!-- 8 and the rest -->
          <div class="layer vis" data-i="7" class:on={step === 7} class:before={step > 7} aria-hidden="true">
            <div class="fit rest">
              {#each REST as [h, t, g]}<div class="gt"><svg viewBox="0 0 64 40">{@html g}</svg><b>{h}</b><span>{t}</span></div>{/each}
            </div>
          </div>

          <div class="sunhost" class:on={sun.on} class:glide={sun.glide} style="transform:translate({sun.x - 470}px, {sun.y - 90}px) scale({sun.k});--hw:{sun.hw}px" aria-hidden="true">
            <div class="sun"></div><div class="horizon"></div>
            <div class="srvlbl">yoakeland<small class:gone={step !== 3}>laptop, home server or VPS</small></div>
          </div>
          <div class="morphs" bind:this={morphEl} aria-hidden="true"></div>
        </div>
      </div>
      <div class="edge" aria-hidden="true"></div>

      <!-- the copy, centred over the sky -->
      <aside class="side" class:revealing={reveal > 0} bind:this={sideEl}>
        <div class="brandrow">
          <a class="brand" href="#top" onclick={(e) => { e.preventDefault(); goto(0); }} aria-label="yoake, back to top"><Mark /><span>yoake</span></a>
          <span class="brandend"><a class="ghlink" href={GH} target="_blank" rel="noopener">github ↗</a><a class="btn btn--sm" href="#download" onclick={(e) => { e.preventDefault(); goto(STEPS - 1); }}>Download</a></span>
        </div>

        <div class="panels">
          <section class="panel hero" class:on={step === 0} class:before={step > 0} inert={step !== 0}>
            <h1><span class="ln">Leave it running,</span><span class="ln dim">Come back at first light<i class="dot" aria-hidden="true"></i></span></h1>
            <p class="sub">A calm desktop and phone client for the coding agents you leave running on your own servers.</p>
            <div class="cta">
              <a class="btn" href="#download" onclick={(e) => { e.preventDefault(); goto(STEPS - 1); }}>Download</a>
              <a class="link" href="#how" onclick={(e) => { e.preventDefault(); goto(1); }}>See how it works</a>
            </div>
            <p class="fact">Free and MIT licensed · no account · no cloud relay</p>
          </section>

          {#each COPY as c, i}
            {#if c}
              <section class="panel" data-i={i} class:on={step === i} class:before={step > i} inert={step !== i} id={i === 1 ? "how" : undefined}>
                {#if SOON.includes(i)}<span class="soon">coming</span>{/if}
                <h2>{c[0]}</h2>
                {#if c[1]}<p>{c[1]}</p>{/if}
              </section>
            {/if}
          {/each}

          <section class="panel dl" class:on={step === STEPS - 1} inert={step !== STEPS - 1} id="download">
            <h2 class="big">Get yoake</h2>
            <a class="bigbtn" href={mainHref} target="_blank" rel="noopener">
              <i class="osi" style="--src:url(/icons/os/{dlOs}.svg)" aria-hidden="true"></i>
              <span class="btxt">
                <span class="xf">{#key dlOs}<b transition:fade={{ duration: 260 }}>Download for {OSES[dlOs][0]}</b>{/key}</span>
                <span class="xf">{#key sub}<small transition:fade={{ duration: 260 }}>{sub}</small>{/key}</span>
              </span>
            </a>
            <div class="also">
              {#each others as k}
                {#if ch === "stable"}<a href={assets[k] ?? RELEASES} target="_blank" rel="noopener">{OSES[k][0]}</a>
                {:else}<span class="off" aria-disabled="true">{OSES[k][0]}</span>{/if}
              {/each}
              <a href={APP}>Open the web app</a>
            </div>
            <div class="chan">
              <span class="tog" class:right={ch === "early"} role="radiogroup" aria-label="Release channel">
                {#each ["stable", "early"] as c}<button type="button" role="radio" aria-checked={ch === c} class:on={ch === c} onclick={() => (dawn.early = c === "early")}>{c}</button>{/each}
              </span>
              <span class="roll" class:down={ch === "early"}><span>{CHANNEL.stable}</span><span>{CHANNEL.early}</span></span>
            </div>
            <p class="facts">The app starts a server for you. <a class="link" href={SERVER} target="_blank" rel="noopener">Run just the server ↗</a></p>
          </section>
        </div>

        <nav class="hn" aria-label="Sections" style="--p:{prog};opacity:{1 - Math.min(1, reveal * 5)}" inert={reveal > 0.2}>
          <span class="hl">{#key navLabel}<span in:fly={{ y: 22 * navDir, duration: 320 }} out:fly={{ y: -22 * navDir, duration: 320 }}>{navLabel}</span>{/key}</span>
          <div class="slide" class:dragging bind:this={trackEl} role="slider" tabindex="0" aria-label="Section" aria-valuemin="1" aria-valuemax={STEPS} aria-valuenow={step + 1} aria-valuetext={LABELS[step]}
            onpointerdown={dragStart} onpointermove={(e) => { hover(e); dragMove(e); }} onpointerleave={() => (hov = null)} onpointerup={dragEnd} onpointercancel={dragEnd} onkeydown={navKey}>
            <span class="rail"></span><span class="fill"></span>
            {#each LABELS as l, i}<i class:past={i <= step} class:hov={hov === i} style="left:{(i / (STEPS - 1)) * 100}%"></i>{/each}
            <span class="thumb"></span>
          </div>
          <span class="hc">{step + 1}/{STEPS}</span>
        </nav>
      </aside>
    </div>
  </div>

  {#if !desk}<div class="foot flow">{@render foot()}</div>{/if}
</div>

<style>
  :global(:root) {
    color-scheme: dark;
    --scrim: rgba(5, 7, 26, 0.55); /* colours are fixed per section, never derived from the sky */
    --cream: #fff4ea; --night: #05071a; --ink: #fff4ea; --ink-dim: rgba(255, 244, 234, 0.66); --ink-faint: rgba(255, 244, 234, 0.4);
    --lamp: #e4515c; --amber: #ffb454; --edge: rgba(255, 244, 234, 0.14); --glass: rgba(8, 10, 30, 0.46); --btn-ink: #141b36;
    --ground: hsl(226 15% 5%);
    --font-ui: "Questrial", "Segoe UI", system-ui, -apple-system, sans-serif;
    --font-serif: "Newsreader", Georgia, "Times New Roman", serif;
    --font-mono: ui-monospace, "JetBrains Mono", Menlo, monospace;
  }
  :global(html) { font-size: clamp(16px, calc(8px + 0.55vw), 22px); background: var(--ground); scroll-behavior: smooth; overscroll-behavior-y: none; scrollbar-width: none; }
  :global(html::-webkit-scrollbar) { display: none; }
  :global(body) { margin: 0; background: var(--ground); color: var(--ink); font: 400 1rem/1.5 var(--font-ui); font-synthesis: none; -webkit-font-smoothing: antialiased; overflow-x: clip; }
  :global(*, *::before, *::after) { box-sizing: border-box; }
  :global(a) { color: inherit; }
  :global(:focus-visible) { outline: 2px solid #9db3ff; outline-offset: 3px; border-radius: 6px; }
  .pad { padding-inline: max(16px, env(safe-area-inset-left, 0px)); }

  .track { position: relative; }
  .frame { position: sticky; top: 0; height: 100svh; overflow: hidden; --rt: clamp(196px, 30cqh, 330px); --rb: clamp(64px, 12cqh, 120px); --fh: 0px; }
  .clip { position: absolute; inset: 0; clip-path: inset(var(--t) var(--r) var(--b) var(--l) round var(--rad)); }
  .edge { position: absolute; top: var(--t); right: var(--r); bottom: var(--b); left: var(--l); border: 1px solid rgba(255, 244, 234, 0.12); border-radius: var(--rad); pointer-events: none; }
  .scene { position: absolute; z-index: 4; top: var(--t); right: var(--r); bottom: var(--sb); left: var(--l); container-type: size; }

  /* scene layers */
  /* the plain crossfade, for jumps and fast scrolling (neighbours at rest morph instead, lib/dawn/morph.js):
     the old picture leaves the way the page is moving before the new one arrives, so a section passed through quickly never shows */
  .layer { position: absolute; opacity: 0; transform: translateY(10px); pointer-events: none; transition: opacity 0.25s, transform 0.25s ease-in; }
  .layer.before { transform: translateY(-10px); }
  .layer.on { opacity: 1; transform: none; transition: opacity 0.5s 0.2s, transform 0.6s 0.2s cubic-bezier(0.3, 0.7, 0.2, 1); }
  .zone, .vis { position: absolute; inset: var(--rt, 0px) 0 var(--rb, 0px); }
  .zone { pointer-events: none; }
  .vis { display: flex; align-items: center; justify-content: center; }
  .vis.on { pointer-events: auto; }
  .fit { flex: none; transform: scale(var(--k, 1)); transform-origin: center; }
  .fig { inset: 0; color: var(--ink-dim); }
  svg { overflow: visible; }
  .fig svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  line { stroke: currentColor; stroke-width: 1; stroke-opacity: 0.12; }
  .g { position: absolute; width: 3px; height: 3px; margin: -1.5px 0 0 -1.5px; border-radius: 50%; background: var(--ink); opacity: 0.55; animation: tw 4s ease-in-out var(--d, 0s) infinite; }
  @keyframes tw { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.8; } }
  .hubstar { position: absolute; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: var(--amber); opacity: 0; box-shadow: 0 0 0 5px rgba(255, 180, 84, 0.18), 0 0 26px 6px rgba(255, 170, 70, 0.55); transition: opacity 0.25s; }
  .hubstar.on, .sunhost.on { opacity: 1; transition: opacity 0.5s 0.2s; }

  /* glass on the sky: the page's take on the app's panels; it follows the sky's ink */
  .glass, .gt { --ink: #fff4ea; --ink-dim: rgba(255, 244, 234, 0.72); --ink-faint: rgba(255, 244, 234, 0.5); --edge: rgba(255, 244, 234, 0.14); }
  .glass { background: rgba(10, 12, 32, 0.64); border: 1px solid var(--edge); box-shadow: 0 24px 70px rgba(5, 7, 26, 0.35); border-radius: 14px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); color: var(--ink); text-align: left; }
  .bi { width: 14px; height: 14px; flex: none; }
  .lampdot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #f0b429; box-shadow: 0 0 0 3px rgba(240, 180, 41, 0.22); }
  .tick { display: inline-block; width: 10px; height: 6px; border: solid var(--ink-dim); border-width: 0 0 1.6px 1.6px; transform: rotate(-45deg) translate(1px, -1px); }
  .dmx { display: inline-grid; grid-template: repeat(5, 1fr) / repeat(5, 1fr); width: 13px; height: 13px; }
  .dmx i { width: 2px; height: 2px; margin: auto; border-radius: 50%; background: #9db3ff; opacity: 0; }
  .dmx i.on { animation: snake 1.1s linear infinite; animation-delay: calc(var(--k) * -1.1s); }
  @keyframes snake { 0% { opacity: 1; } 60%, 100% { opacity: 0.12; } }

  /* 2 fleet */
  .fleet { display: flex; gap: 40px; align-items: center; }
  .side2 { width: 330px; padding: 10px 8px 8px; }
  .sh { display: flex; gap: 10px; align-items: center; padding: 2px 8px 6px; font-size: 13px; color: var(--ink-dim); }
  .avs { display: inline-flex; }
  .avs i, .t2 em i { width: 16px; height: 16px; border-radius: 4px; display: inline-grid; place-items: center; font: 10px var(--font-ui); font-style: normal; background: var(--c); color: #141625; }
  .avs i + i { margin-left: -4px; }
  .side2 h5 { display: flex; justify-content: space-between; margin: 8px 8px 2px; font: 400 12px var(--font-ui); color: var(--ink-dim); }
  .r2 { display: flex; gap: 10px; padding: 6px 8px; border-radius: 8px; }
  .r2.hot { background: color-mix(in srgb, var(--ink) 8%, transparent); }
  .g2 { width: 14px; height: 18px; display: grid; place-items: center; flex: none; }
  .t2 { display: grid; gap: 2px; min-width: 0; }
  .t2 b { font-weight: 400; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .t2 small { font-size: 12px; color: var(--ink-dim); }
  .t2 em { display: flex; gap: 6px; align-items: center; font-style: normal; font-size: 11px; color: var(--ink-faint); }
  .lock { width: 250px; display: grid; justify-items: center; gap: 8px; }
  .lt { font: 300 64px/1 var(--font-serif); letter-spacing: -0.02em; }
  .ld { font-size: 13px; color: var(--ink-dim); margin-bottom: 12px; }
  .notif { width: 100%; padding: 10px 12px; display: grid; gap: 2px; font-size: 13px; }
  .notif header { display: flex; gap: 6px; align-items: center; font-size: 11px; color: var(--ink-dim); }
  .notif header :global(svg) { width: 12px; height: 12px; }
  .notif header b { font-weight: 400; }
  .notif header small { margin-left: auto; }
  .notif strong { font-weight: 400; }
  .notif span { color: var(--ink-dim); }
  .notif.dimmer { opacity: 0.6; transform: scale(0.96); }

  /* 3 any agent */
  .agent { display: grid; justify-items: center; gap: 18px; width: 560px; }
  .logos { display: flex; gap: 6px; }
  .logos span { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: rgba(10, 12, 32, 0.5); border: 1px solid rgba(255, 244, 234, 0.12); }
  .bi.mono { filter: invert(1); }
  .relay { width: 100%; padding: 16px 18px; display: grid; gap: 12px; font-size: 14px; line-height: 1.5; }
  .you { justify-self: end; max-width: 80%; padding: 8px 12px; border-radius: 12px 12px 4px 12px; background: rgba(255, 244, 234, 0.1); }
  .said header { display: flex; gap: 7px; align-items: center; margin-bottom: 3px; font-size: 13px; }
  .said header small { color: var(--ink-faint); font-size: 12px; }
  .said { color: var(--ink-dim); }
  .hand { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ink-faint); white-space: nowrap; }
  .hand::before, .hand::after, .cdiv::before, .cdiv::after { content: ""; flex: 1; height: 1px; background: repeating-linear-gradient(90deg, var(--dash) 0 4px, transparent 4px 8px); }
  .hand { --dash: rgba(255, 244, 234, 0.24); }
  .hand span { display: inline-flex; gap: 5px; align-items: center; color: var(--ink-dim); }
  .hand .bi { width: 12px; height: 12px; }
  .hand b { font-weight: 400; }

  /* 4 every screen and 5 share: the server is the sun at the horizon */
  .crop { width: 940px; }
  .stage { position: relative; width: 940px; height: 395px; }
  .tuck { transform-origin: 500px 0; transform: scaleX(var(--tk, 1)); }
  .stage > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  /* a whole sun, sitting on the horizon with its lower half clipped away: when it leaves the horizon (lib/dawn/morph.js) it is round */
  .sun { position: absolute; left: 50%; bottom: -90px; width: 180px; height: 180px; margin-left: -90px; border-radius: 50%; clip-path: inset(0 0 50% 0); background: radial-gradient(circle 127px, #ffd9a6 0, #ffb454 22%, rgba(255, 140, 90, 0.55) 46%, rgba(255, 120, 90, 0) 72%); }
  .sunhost { position: absolute; left: 0; top: 0; width: 940px; height: 90px; transform-origin: 50% 100%; pointer-events: none; opacity: 0; transition: opacity 0.25s; }
  .morphs { position: absolute; inset: 0; pointer-events: none; }
  .sunhost.on.glide { transition: opacity 0.5s 0.2s, transform 0.7s cubic-bezier(0.3, 0.7, 0.2, 1); }
  .horizon { position: absolute; left: 50%; width: var(--hw); margin-left: calc(var(--hw) / -2); bottom: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 210, 170, 0.55), transparent); }
  .srvlbl { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); text-align: center; font-size: 13px; color: #1c1426; white-space: nowrap; }
  .srvlbl small { display: block; max-height: 1.4em; font-size: 11px; opacity: 0.7; transition: opacity 0.4s, max-height 0.5s; }
  .srvlbl small.gone { max-height: 0; opacity: 0; }
  .node { position: absolute; transform: translate(-50%, calc(-100% + 6px)); display: grid; justify-items: center; gap: 3px; text-align: center; }
  .node .dot { margin-top: 12px; width: 12px; height: 12px; border-radius: 50%; background: var(--cream); box-shadow: 0 0 0 6px rgba(255, 244, 234, 0.08), 0 0 22px 4px rgba(255, 244, 234, 0.35); }
  .node .ico { margin-bottom: 10px; }
  .node b { font-weight: 400; font-size: 15px; }
  .node small { font-size: 12px; color: var(--ink-dim); }
  .node .ico { width: 42px; height: 42px; border-radius: 12px; border: 1px solid rgba(255, 244, 234, 0.2); display: grid; place-items: center; background: rgba(10, 12, 32, 0.55); }
  .node .ico svg { width: 22px; height: 22px; stroke: #fff4ea; fill: none; stroke-width: 1.5; }
  .arc { fill: none; stroke: color-mix(in srgb, var(--ink) 38%, transparent); stroke-width: 1.4; stroke-dasharray: 3 6; vector-effect: non-scaling-stroke; }
  .a1 { stroke: rgba(255, 200, 140, 0.8); } .a2 { stroke: rgba(255, 200, 140, 0.55); }
  .share line { stroke: var(--ink); stroke-opacity: 0.55; stroke-width: 1.2; vector-effect: non-scaling-stroke; transition: opacity 0.3s; }
  .tl { position: absolute; left: 50%; transform: translate(-50%, -100%); padding-bottom: 7px; text-align: center; font-size: 15px; white-space: nowrap; text-shadow: 0 0 12px var(--scrim, transparent); }
  .tl small { display: block; font-size: 12px; color: var(--ink-dim); }
  .who, .dev { position: absolute; transform: translate(-50%, -50%); transition: opacity 0.3s; }
  .who { display: grid; justify-items: center; padding: 0; border: 0; background: none; color: var(--ink); font: inherit; cursor: default; }
  .who i { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font: 16px var(--font-ui); font-style: normal; background: var(--c); color: #141625; box-shadow: 0 0 0 4px rgba(10, 12, 32, 0.55), 0 0 24px color-mix(in srgb, var(--c) 45%, transparent); }
  .who b.r { top: 50%; left: 100%; margin: 0 0 0 10px; transform: translateY(-50%); }
  .who b.l { top: 50%; right: 100%; margin: 0 10px 0 0; transform: translateY(-50%); }
  .who b.a { top: auto; bottom: 100%; margin: 0 0 5px; }
  .who b.br { left: 50%; margin: 0 0 0 4px; transform: none; }
  .who b.bl { left: auto; right: 50%; margin: 0 4px 0 0; transform: none; }
  .who b.ar { top: auto; bottom: 100%; left: 50%; margin: 0 0 0 4px; transform: none; }
  .who b.al { top: auto; bottom: 100%; left: auto; right: 50%; margin: 0 4px 0 0; transform: none; }
  .dev small.l { left: auto; right: 12px; }
  .dev small.a { left: 50%; top: auto; bottom: 10px; transform: translateX(-50%); }
  .dev small.b { left: 50%; top: 10px; transform: translateX(-50%); }
  .dev small.ar { top: auto; bottom: 8px; }
  .dev small.br { top: 8px; transform: none; }
  .dev small.al { left: auto; right: 10px; top: auto; bottom: 8px; transform: none; }
  .dev small.bl { left: auto; right: 10px; top: 8px; transform: none; }
  .who b { position: absolute; top: 100%; margin-top: 5px; font-weight: 400; font-size: 14px; white-space: nowrap; }
  .dev i { display: block; width: 10px; height: 10px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 3px rgba(10, 12, 32, 0.5); }
  .dev small { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 12.5px; color: var(--ink-dim); white-space: nowrap; }
  .share .dim { opacity: 0.18; }

  /* 6 borrowing */
  .borrow { display: grid; grid-template-columns: 300px 140px 300px; align-items: center; }
  .srv { padding: 12px; display: grid; gap: 6px; }
  .srv header { display: flex; gap: 8px; align-items: center; padding: 2px 4px 6px; font-size: 15px; }
  .srv header small { margin-left: auto; font-size: 11px; color: var(--ink-dim); }
  .sdot { width: 8px; height: 8px; border-radius: 50%; }
  .lend { display: flex; gap: 10px; align-items: center; padding: 9px 10px; border-radius: 9px; background: rgba(255, 244, 234, 0.07); font-size: 14px; }
  .lend small { display: block; font-size: 11px; color: var(--ink-dim); }
  .lend .bi, .via .bi { width: 18px; height: 18px; }
  .via { display: flex; gap: 8px; align-items: center; margin-top: 4px; padding: 8px 10px; border-radius: 9px; border: 1px dashed rgba(255, 180, 84, 0.7); color: #ffc98a; font-size: 13px; }
  .bline { width: 100%; height: 12px; overflow: visible; }

  /* 7 chapters: the app's dashed-rule grammar */
  .chapters { width: 560px; display: grid; gap: 8px; padding: 18px 20px; }
  .bar { height: 9px; border-radius: 5px; background: rgba(255, 244, 234, 0.16); width: 72%; }
  .bar.u { justify-self: end; width: 46%; background: rgba(255, 244, 234, 0.26); }
  .bar.s { width: 34%; } .bar.s2 { width: 58%; }
  .cdiv { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 13px; color: var(--ink); white-space: nowrap; }
  .cdiv span { color: var(--ink-dim); }
  .cdiv { height: 20px; line-height: 20px; --dash: rgba(255, 244, 234, 0.3); }
  .cdiv.now { color: var(--amber); }
  .cdiv.now { --dash: rgba(255, 180, 84, 0.45); }

  /* 8 and the rest */
  .rest { display: grid; grid-template-columns: repeat(4, 235px); gap: 10px; }
  .gt { display: grid; gap: 3px; align-content: start; padding: 16px 18px; border-radius: 16px; background: rgba(10, 12, 32, 0.6); border: 1px solid var(--edge); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); color: var(--ink); }
  .gt svg { width: 64px; height: 40px; margin-bottom: 10px; overflow: visible; fill: none; stroke: var(--ink); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  .gt svg :global(.soft) { stroke-opacity: 0.42; }
  .gt svg :global(.soft-f) { fill: var(--ink); fill-opacity: 0.28; stroke: none; }
  .gt svg :global(.pip) { fill: var(--ink); fill-opacity: 0.55; stroke: none; }
  .gt svg :global(.hole) { fill: rgba(10, 12, 32, 0.9); stroke-opacity: 0.7; }
  .gt svg :global(.acc) { stroke: #ffb454; }
  .gt svg :global(.acc.thick) { stroke-width: 2.2; }
  .gt svg :global(.dotacc) { fill: #ffb454; stroke: none; filter: drop-shadow(0 0 5px rgba(255, 180, 84, 0.6)); }
  .gt svg :global(.knob) { fill: #ffd9a6; stroke: #ffb454; stroke-width: 2; filter: drop-shadow(0 0 6px rgba(255, 180, 84, 0.6)); }
  .gt svg :global(.wall) { stroke-width: 2.6; }
  .gt svg :global(.cursor) { fill: #ffb454; stroke: rgba(10, 12, 32, 0.9); stroke-width: 1; }
  .gt svg :global(.add) { fill: #49c38b; stroke: none; } .gt svg :global(.add-s) { stroke: #49c38b; }
  .gt svg :global(.del) { fill: #ee6b74; stroke: none; } .gt svg :global(.del-s) { stroke: #ee6b74; }
  .gt svg :global(.heat) { fill: var(--ink); fill-opacity: var(--v); stroke: none; }
  .gt svg :global(.heat-hot) { fill: #ffb454; stroke: none; }
  .gt b { font-weight: 400; font-size: 15px; }
  .gt span { font-size: 13px; color: var(--ink-dim); line-height: 1.4; }

  /* the copy: one centred column over the sky */
  .side { text-shadow: 0 0 2px var(--scrim), 0 0 16px var(--scrim), 0 0 40px var(--scrim); position: absolute; z-index: 10; inset: 0; container-type: size; display: flex; flex-direction: column; padding: 30px 40px calc(var(--sb) + 18px); pointer-events: none; }
  /* the copy never resizes: while the footer rises, the sky window just hides what it covers. Only then, since a clip would stop the nav pill blurring the sky */
  .side.revealing { clip-path: inset(var(--t) var(--r) var(--b) var(--l) round var(--rad)); }
  .side :is(a, button, input, label) { pointer-events: auto; }
  .brandrow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-size: 1.2rem; letter-spacing: -0.015em; }
  .brand :global(svg) { width: 26px; height: 26px; display: block; }
  .brandend { display: inline-flex; align-items: center; gap: 20px; }
  .ghlink { color: var(--ink-dim); text-decoration: none; font-size: 0.8125rem; transition: color 0.2s; }
  .ghlink:hover { color: var(--ink); }
  .panels { position: relative; flex: 1; min-height: 0; }
  .panel { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 14px; padding-top: clamp(4px, 3cqh, 36px); text-align: center; pointer-events: none; }
  /* one heading at a time: the old copy leaves the way the page is moving, then the new one arrives from the other side, a line at a time */
  .panel > * { opacity: 0; transform: translateY(10px); transition: opacity 0.2s, transform 0.2s ease-in; }
  .panel.before > * { transform: translateY(-10px); }
  .panel.on > * { opacity: var(--o, 1); transform: none; transition: opacity 0.5s var(--d, 0.22s), transform 0.6s var(--d, 0.22s) cubic-bezier(0.2, 0.7, 0.2, 1); }
  .panel > :nth-child(2) { --d: 0.28s; } .panel > :nth-child(3) { --d: 0.34s; } .panel > :nth-child(4) { --d: 0.4s; } .panel > :nth-child(n + 5) { --d: 0.46s; }
  .panel.on > .bigbtn { transition: opacity 0.5s var(--d), transform 0.2s, box-shadow 0.2s; } /* its hover lift stays quick */
  .panel h2 { margin: 0; max-width: 24ch; font: 400 clamp(1.6rem, min(4vw, 6.5cqh), 3.6rem)/1.04 var(--font-serif); letter-spacing: -0.015em; text-wrap: balance; }
  .panel h2.big { font-size: clamp(2rem, min(5vw, 8cqh), 4.6rem); }
  .panel p { margin: 0; max-width: 46ch; color: var(--ink); --o: 0.84; line-height: 1.5; text-wrap: balance; }
  .soon { padding: 2px 10px; border-radius: 999px; font-size: 12px; background: rgba(127, 156, 255, 0.18); color: #c4d0ff; text-shadow: none; }
  .panel.hero { justify-content: center; padding-top: 0; padding-bottom: 6cqh; gap: 0; }
  h1 { margin: 0; font: 400 clamp(2.2rem, min(5.4vw, 9.5cqh), 5.6rem)/0.98 var(--font-serif); letter-spacing: -0.03em; text-wrap: balance; }
  h1 .ln { display: block; }
  h1 .dim { color: var(--ink-dim); }
  .dot { display: inline-block; width: 0.13em; height: 0.13em; margin-left: 0.1em; border-radius: 50%; background: var(--lamp); box-shadow: 0 0 0 0.1em rgba(228, 81, 92, 0.18), 0 0 0.7em 0.12em rgba(228, 81, 92, 0.5); animation: ignite 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.9s backwards, breathe 4.5s ease-in-out infinite; }
  @keyframes breathe { 0%, 100% { opacity: 0.82; } 50% { opacity: 1; } }
  /* first load: the sky comes up from black while the copy arrives a line at a time, the red lamp lighting last. These only run on the
     first paint (fill is backwards, so nothing is pinned afterwards and the step transitions stay in charge) */
  @keyframes rise { from { opacity: 0; transform: translateY(14px); } }
  @keyframes riseline { from { opacity: 0; transform: translateY(0.3em); filter: blur(10px); } }
  @keyframes drop { from { opacity: 0; transform: translateY(-10px); } }
  @keyframes ignite { from { transform: scale(0); } 55% { transform: scale(1.7); } }
  @keyframes skyup { from { opacity: 0; } }
  @keyframes land { from { opacity: 0; transform: scale(2.2); filter: blur(28px); } 55% { filter: blur(0); } }
  @keyframes soft { from { opacity: 0; } }
  .hero h1 { transform-origin: 50% 60%; animation: land 1.1s cubic-bezier(0.12, 0.85, 0.15, 1) backwards; }
  .brandrow, .hero .sub, .hero .cta, .hero .fact, .hn { animation: soft 0.6s ease-out 0.55s backwards; }
  .hero .sub { margin-top: 22px; max-width: 44ch; font-size: 1.05rem; }
  .hero .fact { margin-top: 18px; font-size: 0.8125rem; color: var(--ink-dim); --o: 1; }
  .cta { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px 22px; margin-top: 26px; }
  .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 22px; border-radius: 999px; border: 1px solid transparent; background: var(--ink); color: var(--btn-ink); font: inherit; font-size: 0.95rem; text-decoration: none; text-shadow: none; cursor: pointer; transition: transform 0.2s, background 0.3s; }
  .btn--sm { min-height: 36px; padding: 0 16px; font-size: 0.85rem; }
  .btn:hover { transform: translateY(-1px); }
  .btn:active { transform: translateY(1px); }
  .link { color: var(--ink-dim); text-decoration: underline; text-decoration-color: color-mix(in srgb, var(--ink) 30%, transparent); text-underline-offset: 5px; transition: color 0.2s; }
  .link:hover { color: var(--ink); }

  /* 9 download: one button, the rest as footnotes */
  .panel.dl { --ink: #141b36; --ink-dim: rgba(20, 27, 54, 0.76); --ink-faint: rgba(20, 27, 54, 0.5); --edge: rgba(20, 27, 54, 0.2); --btn-ink: #fff4ea; color: var(--ink); text-shadow: 0 0 2px rgba(255, 244, 234, 0.5), 0 0 18px rgba(255, 244, 234, 0.6); justify-content: center; gap: 20px; padding-top: 0; padding-bottom: 4cqh; }
  .bigbtn { display: inline-flex; align-items: center; gap: 14px; padding: 14px 26px 14px 20px; border-radius: 999px; background: var(--ink); color: var(--btn-ink); text-decoration: none; text-shadow: none; text-align: left; box-shadow: 0 14px 40px rgba(20, 27, 54, 0.25); transition: transform 0.2s, box-shadow 0.2s; }
  .bigbtn:hover { transform: translateY(-2px); box-shadow: 0 18px 50px rgba(20, 27, 54, 0.3); }
  .bigbtn:active { transform: translateY(0); }
  .osi { flex: none; display: block; width: 22px; height: 22px; background: currentColor; -webkit-mask: var(--src) center / contain no-repeat; mask: var(--src) center / contain no-repeat; }
  .btxt { display: grid; line-height: 1.2; font-size: 1.05rem; }
  .xf { display: grid; } .xf > :global(*) { grid-area: 1 / 1; white-space: nowrap; }
  .xf b { font-weight: 400; }
  .bigbtn small { font-size: 0.75rem; opacity: 0.65; }
  .also { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 20px; font-size: 0.9rem; color: var(--ink-dim); }
  .also a { text-decoration: none; background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat; transition: background-size 0.3s, color 0.2s; }
  .also a:hover { background-size: 100% 1px; color: var(--ink); }
  .chan { display: inline-flex; align-items: center; gap: 12px; font-size: 0.8125rem; color: var(--ink-dim); }
  .tog { position: relative; display: inline-grid; grid-template-columns: 1fr 1fr; padding: 3px; border-radius: 999px; border: 1px solid var(--edge); background: color-mix(in srgb, var(--ink) 6%, transparent); }
  .tog::before { content: ""; position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc(50% - 3px); border-radius: 999px; background: var(--ink); transition: transform 0.4s cubic-bezier(0.3, 0.7, 0.2, 1); }
  .tog.right::before { transform: translateX(100%); }
  .tog button { position: relative; border: 0; padding: 4px 14px; border-radius: 999px; background: none; color: var(--ink-dim); font: inherit; cursor: pointer; transition: color 0.3s; }
  .tog button.on { color: var(--btn-ink); text-shadow: none; }
  .roll { display: inline-grid; text-align: left; }
  .roll span { grid-area: 1 / 1; transition: transform 0.4s cubic-bezier(0.3, 0.7, 0.2, 1), opacity 0.4s; }
  .roll span + span { transform: translateY(100%); opacity: 0; }
  .roll.down span:first-child { transform: translateY(-100%); opacity: 0; }
  .roll.down span + span { transform: none; opacity: 1; }
  .also .off { color: var(--ink-faint); text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--ink) 30%, transparent); cursor: not-allowed; }
  .panel .facts { font-size: 0.8125rem; color: var(--ink-dim); --o: 1; }

  /* the bottom nav: a slider in a glass pill, its own dark palette so it reads at every hour */
  .hn { align-self: center; flex: none; display: flex; align-items: center; gap: 14px; width: min(520px, 92%); height: 44px; padding: 0 18px; border-radius: 999px; background: rgba(10, 12, 32, 0.58); border: 1px solid rgba(255, 244, 234, 0.16); backdrop-filter: blur(14px) saturate(1.2); -webkit-backdrop-filter: blur(14px) saturate(1.2); box-shadow: 0 10px 30px rgba(5, 7, 26, 0.22); color: #fff4ea; text-shadow: none; font-size: 0.8125rem; pointer-events: auto; transition: opacity 0.2s; }
  .hl { align-self: stretch; display: grid; align-items: center; width: 7.6em; overflow: hidden; white-space: nowrap; } /* as tall as the pill, so the rolling name is clipped by its edges */
  .hl > :global(span) { grid-area: 1 / 1; }
  .hc { width: 2.4em; text-align: right; color: rgba(255, 244, 234, 0.55); font-variant-numeric: tabular-nums; }
  .slide { position: relative; flex: 1; align-self: stretch; cursor: grab; touch-action: none; border-radius: 999px; }
  .slide.dragging { cursor: grabbing; }
  .slide:focus-visible { outline-offset: -8px; }
  .rail, .fill { position: absolute; left: 0; top: 50%; height: 2px; margin-top: -1px; border-radius: 2px; }
  .rail { right: 0; background: rgba(255, 244, 234, 0.2); }
  .fill { width: calc(var(--p) * 100%); background: linear-gradient(90deg, rgba(255, 180, 84, 0.2), #ffb454); }
  .slide i { position: absolute; top: 50%; width: 4px; height: 4px; margin: -2px 0 0 -2px; border-radius: 50%; background: rgba(255, 244, 234, 0.45); }
  .slide i.past { background: #ffb454; }
  .slide i { transition: transform 0.2s, background 0.2s, box-shadow 0.2s; }
  .slide i.hov { transform: scale(1.9); background: #ffe3bd; box-shadow: 0 0 8px 2px rgba(255, 200, 130, 0.7); }
  .thumb { position: absolute; top: 50%; left: calc(var(--p) * 100%); width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 50%; background: #ffe3bd; box-shadow: 0 0 0 4px rgba(255, 180, 84, 0.25), 0 0 18px 4px rgba(255, 170, 70, 0.5); transition: transform 0.2s; }
  .slide:hover .thumb, .slide.dragging .thumb { transform: scale(1.18); }

  /* the footer lives under the sky: the frame's bottom margin grows and uncovers it */
  .footwrap, .foot.flow { border-radius: 18px; background: #e8e5ee; }
  .footwrap { position: absolute; z-index: 0; left: 12px; right: 12px; bottom: 12px; overflow: hidden; }
  .footin { position: absolute; left: 0; right: 0; bottom: 0; }
  .foot { isolation: isolate; --ink: #1c2038; --ink-dim: rgba(28, 32, 56, 0.72); --ink-faint: rgba(28, 32, 56, 0.5); --edge: rgba(28, 32, 56, 0.18); position: relative; color: var(--ink); display: flex; flex-direction: column; gap: 22px; padding: 30px 0 28px; }
  .foot.flow { margin: 12px; overflow: hidden; }
  .foot-top { position: relative; z-index: 1; display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 24px 48px; padding-inline: 32px; }
  .tracks { flex: 1 1 300px; max-width: 440px; display: grid; }
  .tracks a { display: flex; align-items: baseline; gap: 10px; padding: 5px 0; color: var(--ink); text-decoration: none; font-size: 0.95rem; }
  .tracks a span { width: 1.6em; color: var(--ink-faint); font-size: 0.75rem; font-variant-numeric: tabular-nums; transition: color 0.2s; }
  .tracks a b { font-weight: 400; }
  .tracks a i { flex: 1; align-self: center; height: 1px; background: repeating-linear-gradient(90deg, var(--edge) 0 2px, transparent 2px 7px); transition: background 0.2s; }
  .tracks a small { color: var(--ink-dim); font-size: 0.8125rem; transition: color 0.2s; }
  .tracks a:hover span { color: var(--lamp); }
  .tracks a:hover i { background: repeating-linear-gradient(90deg, var(--lamp) 0 2px, transparent 2px 7px); }
  .tracks a:hover small { color: var(--ink); }
  .liner { flex: 0 1 34ch; align-self: stretch; display: flex; flex-direction: column; justify-content: space-between; text-align: right; }
  .liner p { margin: 0; }
  .shift { font: 300 1.7rem/1.15 var(--font-serif); letter-spacing: -0.01em; color: var(--ink); }
  .liner .note { padding: 5px 0; font-size: 0.8125rem; color: var(--ink-dim); }
  .wm { width: min(100% - 80px, 780px); margin-inline: auto; }

  @media (max-width: 759px) {
    .panel.dl { --ink: #fff4ea; --ink-dim: rgba(255, 244, 234, 0.66); --ink-faint: rgba(255, 244, 234, 0.4); --edge: rgba(255, 244, 234, 0.16); --btn-ink: #141b36; text-shadow: none; } /* on phones the copy sits on the dark ground under the sky */
    .crop { --tk: 0.7; width: 540px; overflow: hidden; }
    .crop > .stage { margin-left: -200px; }
    .crop.narrow { width: 480px; }
    .crop.narrow > .stage { margin-left: -230px; }
    .crop .node b { font-size: 21px; } .crop .node small { font-size: 16px; }
    .crop .node .ico { width: 54px; height: 54px; } .crop .node .ico svg { width: 28px; height: 28px; }
    .crop .tl { font-size: 19px; } .crop .tl small { font-size: 15px; }
    .crop .who i { width: 50px; height: 50px; font-size: 20px; } .crop .who b { font-size: 18px; }
    .crop .dev small { font-size: 16px; }
    .agent, .chapters { width: 380px; }
    .logos { flex-wrap: wrap; justify-content: center; max-width: 300px; }
    .hand { white-space: normal; flex-wrap: wrap; justify-content: center; }
    .borrow { grid-template-columns: 300px; justify-items: stretch; }
    .bline { width: 140px; height: 12px; justify-self: center; transform: rotate(90deg); margin: 64px 0; }
    .lock { display: none; }
    .rest { grid-template-columns: repeat(3, 124px); gap: 8px; }
    .gt { padding: 12px; }
    .gt svg { margin-bottom: 6px; }
    .gt span { display: none; }
    .hn { width: 100%; }
    .frame { --rt: 0px; --rb: 0px; }
    .side { inset: calc(100svh * 0.54) 0 0 0; padding: 14px 20px 14px; clip-path: none; }
    .brandrow { display: none; }
    .panel, .panel.hero, .panel.dl { gap: 10px; align-items: flex-start; justify-content: flex-start; padding: 0; text-align: left; }
    .panel p { text-wrap: wrap; }
    .cta, .also { justify-content: flex-start; }
    h1 { font-size: 2.3rem; }
    .panel h2 { font-size: 1.6rem; }
    .hero .sub { margin-top: 12px; }
    .side { --ink: #fff4ea; --ink-dim: rgba(255, 244, 234, 0.66); --ink-faint: rgba(255, 244, 234, 0.4); --edge: rgba(255, 244, 234, 0.16); --btn-ink: #141b36; --scrim: transparent; }
    .hn { width: 100%; }
    .foot-top { padding-inline: 16px; }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(html) { scroll-behavior: auto; }
    .dot, .g, .dmx i.on, .hand { animation: none; }
    .brandrow, .hero h1, .hero .sub, .hero .cta, .hero .fact, .hn { animation: none; }
    .dmx i.on { opacity: 0.6; }
    .page, .layer, .panel > *, .hubstar, .sunhost, .srvlbl small { transition: none !important; }
  }
</style>
