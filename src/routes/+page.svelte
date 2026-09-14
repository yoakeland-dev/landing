<script>
  import { onMount } from "svelte";
  import StarField from "$lib/StarField.svelte";

  /** @type {"mac" | "windows" | "linux" | "mobile"} */
  let os = $state("mac");

  const labels = { mac: "macOS", windows: "Windows", linux: "Linux" };

  onMount(() => {
    const platform = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod/.test(platform)) os = "mobile";
    else if (/Win/.test(platform)) os = "windows";
    else if (/Linux|X11/.test(platform)) os = "linux";
    else os = "mac";
  });

  function roundedPolygonPath(points, radius) {
    const n = points.length;
    let d = "";
    for (let i = 0; i < n; i++) {
      const prev = points[(i - 1 + n) % n];
      const curr = points[i];
      const next = points[(i + 1) % n];
      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const len1 = Math.hypot(v1.x, v1.y);
      const n1 = { x: v1.x / len1, y: v1.y / len1 };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };
      const len2 = Math.hypot(v2.x, v2.y);
      const n2 = { x: v2.x / len2, y: v2.y / len2 };
      const r = Math.min(radius, len1 / 2, len2 / 2);
      const p1 = { x: curr.x - n1.x * r, y: curr.y - n1.y * r };
      const p2 = { x: curr.x + n2.x * r, y: curr.y + n2.y * r };
      d += i === 0 ? `M ${p1.x} ${p1.y} ` : `L ${p1.x} ${p1.y} `;
      d += `Q ${curr.x} ${curr.y} ${p2.x} ${p2.y} `;
    }
    return d + "Z";
  }

  const HOW_RADIUS = 16;
  const HOW_KERF = 10;
  const HOW_SEAM_SLANT = 35;
  let howW = $state(0);
  let howH = $state(0);

  let howClips = $derived.by(() => {
    if (!howW || !howH) return { left: "", right: "" };
    const center = howW / 2;
    const seamTop = center + HOW_SEAM_SLANT;
    const seamBottom = center - HOW_SEAM_SLANT;
    const half = HOW_KERF / 2;
    const left = roundedPolygonPath(
      [
        { x: 0, y: 0 },
        { x: seamTop - half, y: 0 },
        { x: seamBottom - half, y: howH },
        { x: 0, y: howH },
      ],
      HOW_RADIUS,
    );
    const right = roundedPolygonPath(
      [
        { x: seamTop + half, y: 0 },
        { x: howW, y: 0 },
        { x: howW, y: howH },
        { x: seamBottom + half, y: howH },
      ],
      HOW_RADIUS,
    );
    return { left, right };
  });

  let illoScale = $derived(
    howW && howH ? Math.min(1, howW / 380, howH / 300) : 1,
  );
  let illoScaleH = $derived(howH ? Math.min(1, howH / 300) : 1);
</script>

<div class="star-field-top">
  <StarField mode="top" falloffPower={1.0} />
</div>

<main>
  <div class="brand">
    <img src="/logo.png" alt="yoakeland logo" />
    <span class="mono">yoakeland</span>
  </div>

  <div class="hero">
    <h1>
      Agents that run on <span class="locus"
        ><svg
          class="locus-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          ><rect x="3" y="5" width="18" height="11" rx="1" /><path
            d="M8 20h8M12 16v4"
          /></svg
        ><span class="mono locus-text">your machine</span></span
      >, never
      <span class="locus"
        ><svg
          class="locus-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          ><path
            d="M17.5 19a4.5 4.5 0 0 0 0-9 5.5 5.5 0 0 0-10.5-1.7A4 4 0 0 0 6 19h11.5Z"
          /></svg
        ><span class="mono locus-text">someone else's cloud</span></span
      >.
    </h1>
    <div class="cta-row">
      <a
        class="btn"
        class:primary={os !== "mobile"}
        class:disabled={os === "mobile"}
        href={os === "mobile" ? undefined : "#"}
        aria-disabled={os === "mobile"}
        title={os === "mobile"
          ? "Unavailable on mobile — use the web version"
          : undefined}
        onclick={os === "mobile" ? (e) => e.preventDefault() : undefined}
      >
        {#if os === "mac"}
          <svg viewBox="64 64 896 896"
            ><path
              d="M747.4 535.7c-.4-68.2 30.5-119.6 92.9-157.5-34.9-50-87.7-77.5-157.3-82.8-65.9-5.2-138 38.4-164.4 38.4-27.9 0-91.7-36.6-141.9-36.6C273.1 298.8 163 379.8 163 544.6c0 48.7 8.9 99 26.7 150.8 23.8 68.2 109.6 235.3 199.1 232.6 46.8-1.1 79.9-33.2 140.8-33.2 59.1 0 89.7 33.2 141.9 33.2 90.3-1.3 167.9-153.2 190.5-221.6-121.1-57.1-114.6-167.2-114.6-170.7zm-105.1-305c50.7-60.2 46.1-115 44.6-134.7-44.8 2.6-96.6 30.5-126.1 64.8-32.5 36.8-51.6 82.3-47.5 133.6 48.4 3.7 92.6-21.2 129-63.7z"
            /></svg
          >
        {:else if os === "windows"}
          <svg viewBox="64 64 896 896"
            ><path
              d="M523.8 191.4v288.9h382V128.1zm0 642.2l382 62.2v-352h-382zM120.1 480.2H443V201.9l-322.9 53.5zm0 290.4L443 823.2V543.8H120.1z"
            /></svg
          >
        {:else if os === "linux"}
          <svg viewBox="64 64 896 896" fill-rule="evenodd"
            ><path
              d="M530.8 64c-5.79 0-11.76.3-17.88.78-157.8 12.44-115.95 179.45-118.34 235.11-2.88 40.8-11.2 72.95-39.24 112.78-33.03 39.23-79.4 102.66-101.39 168.77-10.37 31.06-15.3 62.87-10.71 92.92a15.83 15.83 0 00-4.14 5.04c-9.7 10-16.76 22.43-24.72 31.32-7.42 7.43-18.1 9.96-29.75 14.93-11.68 5.08-24.56 10.04-32.25 25.42a49.7 49.7 0 00-4.93 22.43c0 7.43 1 14.97 2.05 20.01 2.17 14.9 4.33 27.22 1.46 36.21-9.26 25.39-10.42 42.79-3.92 55.44 6.5 12.47 19.97 17.51 35.05 22.44 30.28 7.46 71.3 5.04 103.6 22.36 34.56 17.43 69.66 25.05 97.65 17.54a66.01 66.01 0 0045.1-35.27c21.91-.12 45.92-10.05 84.37-12.47 26.09-2.17 58.75 9.97 96.23 7.43.94 5.04 2.36 7.43 4.26 12.47l.11.1c14.6 29.05 41.55 42.27 70.33 39.99 28.78-2.24 59.43-20.01 84.26-48.76 23.55-28.55 62.83-40.46 88.77-56.1 12.99-7.43 23.48-17.51 24.23-31.85.86-14.93-7.43-30.3-26.66-51.4v-3.62l-.1-.11c-6.35-7.47-9.34-19.98-12.63-34.57-3.17-14.97-6.8-29.34-18.36-39.05h-.11c-2.2-2.02-4.6-2.5-7.02-5.04a13.33 13.33 0 00-7.1-2.39c16.1-47.7 9.86-95.2-6.45-137.9-19.9-52.63-54.7-98.48-81.2-130.02-29.71-37.52-58.83-73.06-58.27-125.77 1-80.33 8.85-228.95-132.3-229.17m19.75 127.11h.48c7.95 0 14.79 2.31 21.8 7.4 7.13 5.03 12.32 12.39 16.4 19.89 3.91 9.67 5.89 17.13 6.19 27.03 0-.75.22-1.5.22-2.2v3.88a3.21 3.21 0 01-.15-.79l-.15-.9a67.46 67.46 0 01-5.6 26.36 35.58 35.58 0 01-7.95 12.5 26.5 26.5 0 00-3.28-1.56c-3.92-1.68-7.43-2.39-10.64-4.96a48.98 48.98 0 00-8.18-2.47c1.83-2.2 5.42-4.96 6.8-7.39a44.22 44.22 0 003.28-15v-.72a45.17 45.17 0 00-2.27-14.93c-1.68-5.04-3.77-7.5-6.84-12.47-3.13-2.46-6.23-4.92-9.96-4.92h-.6c-3.47 0-6.57 1.12-9.78 4.92a29.86 29.86 0 00-7.65 12.47 44.05 44.05 0 00-3.36 14.93v.71c.07 3.33.3 6.69.74 9.97-7.2-2.5-16.35-5.04-22.66-7.54-.37-2.46-.6-4.94-.67-7.43v-.75a66.15 66.15 0 015.6-28.7 40.45 40.45 0 0116.05-19.9 36.77 36.77 0 0122.18-7.43m-110.58 2.2h1.35c5.3 0 10.08 1.8 14.9 5.04a51.6 51.6 0 0112.83 17.36c3.36 7.43 5.27 14.97 5.72 24.9v.15c.26 5 .22 7.5-.08 9.93v2.99c-1.12.26-2.09.67-3.1.9-5.67 2.05-10.23 5.03-14.67 7.46.45-3.32.49-6.68.11-9.97v-.56c-.44-4.96-1.45-7.43-3.06-12.43a22.88 22.88 0 00-6.2-9.97 9.26 9.26 0 00-6.83-2.39h-.78c-2.65.23-4.85 1.53-6.94 4.93a20.6 20.6 0 00-4.48 10.08 35.24 35.24 0 00-.86 12.36v.52c.45 5.04 1.38 7.5 3.02 12.47 1.68 5 3.62 7.46 6.16 10 .41.34.79.67 1.27.9-2.61 2.13-4.37 2.61-6.57 5.08a11.39 11.39 0 01-4.89 2.53 97.84 97.84 0 01-10.27-15 66.15 66.15 0 01-5.78-24.9 65.67 65.67 0 012.98-24.94 53.38 53.38 0 0110.57-19.97c4.78-4.97 9.7-7.47 15.6-7.47M491.15 257c12.36 0 27.33 2.43 45.36 14.9 10.94 7.46 19.52 10.04 39.31 17.47h.11c9.52 5.07 15.12 9.93 17.84 14.9v-4.9a21.32 21.32 0 01.6 17.55c-4.59 11.6-19.26 24.04-39.72 31.47v.07c-10 5.04-18.7 12.43-28.93 17.36-10.3 5.04-21.95 10.9-37.78 9.97a42.52 42.52 0 01-16.72-2.5 133.12 133.12 0 01-12.02-7.4c-7.28-5.04-13.55-12.39-22.85-17.36v-.18h-.19c-14.93-9.19-22.99-19.12-25.6-26.54-2.58-10-.19-17.51 7.2-22.4 8.36-5.04 14.19-10.12 18.03-12.55 3.88-2.76 5.34-3.8 6.57-4.89h.08v-.1c6.3-7.55 16.27-17.52 31.32-22.44a68.65 68.65 0 0117.4-2.43m104.48 80c13.4 52.9 44.69 129.72 64.8 166.98 10.68 19.93 31.93 61.93 41.15 112.89 5.82-.19 12.28.67 19.15 2.39 24.11-62.38-20.39-129.43-40.66-148.06-8.25-7.5-8.66-12.5-4.59-12.5 21.99 19.93 50.96 58.68 61.45 102.92 4.81 19.97 5.93 41.21.78 62.34 2.5 1.05 5.04 2.28 7.65 2.5 38.53 19.94 52.75 35.02 45.92 57.38v-1.6c-2.27-.12-4.48 0-6.75 0h-.56c5.63-17.44-6.8-30.8-39.76-45.7-34.16-14.93-61.45-12.54-66.11 17.36-.27 1.6-.45 2.46-.64 5.04-2.54.86-5.19 1.98-7.8 2.39-16.05 10-24.71 24.97-29.6 44.31-4.86 19.9-6.35 43.16-7.66 69.77v.11c-.78 12.47-6.38 31.29-11.9 50.44-56 40.01-133.65 57.41-199.69 12.46a98.74 98.74 0 00-15-19.9 54.13 54.13 0 00-10.27-12.46c6.8 0 12.62-1.08 17.36-2.5a22.96 22.96 0 0011.72-12.47c4.03-9.97 0-26.02-12.88-43.42C398.87 730.24 377 710.53 345 690.9c-23.51-14.89-36.8-32.47-42.93-52.1-6.16-19.94-5.33-40.51-.56-61.42 9.15-39.94 32.6-78.77 47.56-103.14 4-2.43 1.38 5.04-15.23 36.36-14.78 28.03-42.6 93.21-4.55 143.87a303.27 303.27 0 0124.15-107.36c21.06-47.71 65.07-130.81 68.54-196.66 1.8 1.34 8.1 5.04 10.79 7.54 8.14 4.96 14.18 12.43 22.02 17.36 7.88 7.5 17.81 12.5 32.7 12.5 1.46.12 2.8.23 4.15.23 15.34 0 27.21-5 37.18-10 10.83-5 19.45-12.48 27.63-14.94h.18c17.44-5.04 31.21-15 39.01-26.13m81.6 334.4c1.39 22.44 12.81 46.48 32.93 51.41 21.95 5 53.53-12.43 66.86-28.56l7.88-.33c11.76-.3 21.54.37 31.62 9.97l.1.1c7.77 7.44 11.4 19.83 14.6 32.7 3.18 14.98 5.75 29.13 15.27 39.8 18.15 19.68 24.08 33.82 23.75 42.56l.1-.22v.67l-.1-.45c-.56 9.78-6.91 14.78-18.6 22.21-23.51 14.97-65.17 26.58-91.72 58.61-23.07 27.51-51.18 42.52-76 44.46-24.79 1.98-46.18-7.46-58.76-33.52l-.19-.11c-7.84-14.97-4.48-38.27 2.1-63.1 6.56-24.93 15.97-50.2 17.28-70.85 1.38-26.65 2.83-49.83 7.28-67.71 4.48-17.36 11.5-29.76 23.93-36.74l1.68-.82zm-403.72 1.84h.37c1.98 0 3.92.18 5.86.52 14.04 2.05 26.35 12.43 38.19 28.07l33.97 62.12.11.11c9.07 19.9 28.15 39.72 44.39 61.15 16.2 22.32 28.74 42.22 27.21 58.61v.22c-2.13 27.78-17.88 42.86-42 48.3-24.07 5.05-56.74.08-89.4-17.31-36.14-20.01-79.07-17.51-106.66-22.48-13.77-2.46-22.8-7.5-26.99-14.97-4.14-7.42-4.21-22.43 4.6-45.91v-.11l.07-.12c4.37-12.46 1.12-28.1-1-41.77-2.06-14.97-3.1-26.47 1.6-35.09 5.97-12.47 14.78-14.9 25.72-19.9 11.01-5.04 23.93-7.54 34.2-17.5h.07v-.12c9.55-10 16.61-22.43 24.93-31.28 7.1-7.5 14.19-12.54 24.75-12.54M540.76 334.5c-16.24 7.5-35.27 19.97-55.54 19.97-20.24 0-36.21-9.97-47.75-17.4-5.79-5-10.45-10-13.96-12.5-6.12-5-5.38-12.47-2.76-12.47 4.07.6 4.81 5.04 7.43 7.5 3.58 2.47 8.02 7.43 13.47 12.43 10.86 7.47 25.39 17.44 43.53 17.44 18.1 0 39.3-9.97 52.19-17.4 7.28-5.04 16.6-12.47 24.19-17.43 5.82-5.12 5.56-10 10.41-10 4.82.6 1.27 5-5.48 12.42a302.3 302.3 0 01-25.76 17.47v-.03zm-40.39-59.13v-.83c-.22-.7.49-1.56 1.09-1.86 2.76-1.6 6.72-1.01 9.7.15 2.35 0 5.97 2.5 5.6 5.04-.22 1.83-3.17 2.46-5.04 2.46-2.05 0-3.43-1.6-5.26-2.54-1.94-.67-5.45-.3-6.09-2.42m-20.57 0c-.74 2.16-4.22 1.82-6.2 2.46-1.75.93-3.2 2.54-5.18 2.54-1.9 0-4.9-.71-5.12-2.54-.33-2.47 3.29-4.97 5.6-4.97 3.03-1.15 6.87-1.75 9.67-.18.71.33 1.35 1.12 1.12 1.86v.79h.11z"
            /></svg
          >
        {/if}
        <span class="mono">
          {os === "mobile"
            ? "Unavailable on mobile"
            : `Download for ${labels[os]}`}
        </span>
      </a>
      <a class="btn" class:primary={os === "mobile"} href="#"
        ><span class="mono">Open on web</span></a
      >
    </div>
  </div>

  <div class="showcase">
    <img class="bg" src="/background.png" alt="" />
    <picture>
      <source media="(max-width: 600px)" srcset="/app-screenshot-mobile.png" />
      <img class="app-shot" src="/app-screenshot.png" alt="yoakeland app" />
    </picture>
  </div>

  <svg class="divider" width="100%" height="2" preserveAspectRatio="none">
    <line x1="0" y1="1" x2="100%" y2="1" />
  </svg>

  <section class="how" id="how">
    <div class="how-content">
      <h2>Nothing to sign into</h2>
      <p>
        Open the app and it's already working — no account, no dashboard, no
        cloud sitting in between you and the model. It talks straight from your
        machine to the provider you picked. Want it running somewhere you're not
        — a home server, a box in a closet? Install it headless there instead,
        and reach it from your phone or laptop the same way.
      </p>
    </div>

    <svg width="0" height="0" class="how-clip-defs">
      <defs>
        <clipPath id="how-clip-left" clipPathUnits="userSpaceOnUse">
          <path d={howClips.left} />
        </clipPath>
        <clipPath id="how-clip-right" clipPathUnits="userSpaceOnUse">
          <path d={howClips.right} />
        </clipPath>
      </defs>
    </svg>

    <div class="how-illustration-scroll">
      <div
        class="how-illustration"
        bind:clientWidth={howW}
        bind:clientHeight={howH}
        style="--illo-scale: {illoScale}; --illo-scale-h: {illoScaleH}"
      >
        <div
          class="how-card how-card-terminal"
          style="clip-path: url(#how-clip-left)"
        >
          <img class="how-bg" src="/background.png" alt="" />
          <div class="how-overlay"></div>
          <div class="terminal">
            <div class="terminal-bar">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <pre class="terminal-body mono"><span
                class="banner">      *         *  ·    .·           ·          .    ·         ·   *
  <span class="banner-strong">✦ yoakeland ✦</span
                >                     ·     .      *
           ·   ✦              ✦                    *     +     .</span
              >

<span class="log"
                ><span class="ts">2026/09/14 00:02:48</span> <span class="lvl"
                  >INFO</span
                >  local socket listening at /run/user/1000/yoake/yoakeland.sock</span
              >
<span class="log"
                ><span class="ts">2026/09/14 00:02:49</span> <span class="lvl"
                  >INFO</span
                >  sandbox: bubblewrap</span
              >
<span class="log"
                ><span class="ts">2026/09/14 00:02:49</span> <span class="lvl"
                  >INFO</span
                >  provider: anthropic (claude-sonnet-5)</span
              >
<span class="log log-bright"
                ><span class="ts">2026/09/14 00:02:50</span> <span class="lvl"
                  >INFO</span
                >  no cloud round trip, we checked</span
              >
<span class="log log-bright"
                ><span class="ts">2026/09/14 00:02:51</span> <span class="lvl"
                  >INFO</span
                >  waiting for you to ask it to fix something</span
              ></pre>
          </div>
        </div>

        <div
          class="how-card how-card-statement"
          style="clip-path: url(#how-clip-right)"
        >
          <div class="statement">
            <p class="mono statement-line">no login</p>
            <p class="mono statement-line">no relay</p>
            <p class="mono statement-line">no cloud</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="features">
    <h2>Why run it yourself</h2>
    <div class="pillars">
      <div class="pillar">
        <span class="mono pillar-label">sandboxed</span>
        <p class="pillar-desc">
          Every command it runs is boxed off from the rest of your machine. If
          your system can't sandbox, it tells you plainly instead of quietly
          running wide open.
        </p>
      </div>
      <div class="pillar">
        <span class="mono pillar-label">undoable</span>
        <p class="pillar-desc">
          Every change is snapshotted before it happens. Didn't like where that
          edit went? Roll it back with one command, no git required.
        </p>
      </div>
      <div class="pillar">
        <span class="mono pillar-label">yours</span>
        <p class="pillar-desc">
          API keys stay on your disk, encrypted once you set a passphrase. Pick
          up a session from your phone through a certificate your own machine
          issues.
        </p>
      </div>
      <div class="pillar">
        <span class="mono pillar-label">any model</span>
        <p class="pillar-desc">
          Anthropic, OpenAI, OpenRouter, or a model running on your own
          hardware. Switch mid-conversation whenever you want.
        </p>
      </div>
    </div>
  </section>

  <section class="install" id="install">
    <div class="install-code">
      <pre class="mono"><code
          >go build -o yoakeland ./cmd/yoakeland
./yoakeland -project .</code
        ></pre>
    </div>
    <div class="install-content">
      <h2>Running it headless</h2>
      <p>
        Most people just download the app above. If you'd rather it lived on a
        machine you don't sit in front of — a home server, a spare box, a VPS —
        build the binary and point it at a project. No wizard, no background
        updater, no account to make.
      </p>
    </div>
  </section>
</main>

<footer>
  <div class="star-field-bottom">
    <StarField mode="bottom" falloffPower={0.35} />
  </div>
  <p class="footer-statement">Run it on your machine.</p>
  <div class="footer-links">
    <div class="footer-col">
      <span class="mono footer-heading">product</span>
      <a href="#">Download</a>
      <a href="#how">How it runs</a>
      <a href="#install">Install</a>
    </div>
    <div class="footer-col">
      <span class="mono footer-heading">project</span>
      <a href="#">GitHub</a>
      <a href="#">License</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span class="mono">yoakeland</span>
    <span class="mono">2026</span>
  </div>
</footer>

<style>
  @font-face {
    font-family: "Departure Mono";
    src: url("/fonts/DepartureMono-Regular.woff2") format("woff2");
    font-weight: 400;
    font-display: swap;
  }

  :global(body) {
    margin: 0;
    background: #0b0c0a;
    color: #ededec;
    font-family:
      "Questrial",
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .mono {
    font-family: "Departure Mono", ui-monospace, monospace;
    font-weight: 400;
    letter-spacing: 0.02em;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 400;
    padding: 24px 0;
  }
  .brand img {
    width: 24px;
    height: 24px;
  }

  main {
    position: relative;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .hero {
    padding: 64px 0 48px;
  }
  h1 {
    font-size: clamp(28px, 5vw, 44px);
    line-height: 1.2;
    font-weight: 400;
    margin: 0 0 32px;
    max-width: 820px;
  }
  .locus {
    display: inline-flex;
    align-items: baseline;
    gap: 0.16em;
    padding-right: 0.2em;
    white-space: nowrap;
  }
  .locus-icon {
    width: 0.8em;
    height: 0.8em;
    flex: none;
    align-self: center;
  }
  .locus-text {
    font-size: 0.86em;
    letter-spacing: 0;
  }

  .cta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 20px;
    border-radius: 8px;
    font-size: 14px;
    color: #ededec;
    text-decoration: none;
    background: #1c1c1a;
  }
  .btn.primary {
    background: #ededec;
    color: #0b0c0a;
  }
  .btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  .showcase {
    position: relative;
    height: min(560px, 70vw);
    border-radius: 8px;
    overflow: hidden;
  }
  .showcase .bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .app-shot {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 78%;
    border-radius: 8px;
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
  }
  .divider {
    display: block;
    width: 100vw;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    margin: 56px 0;
  }
  .divider line {
    stroke: #2a2a27;
    stroke-width: 1.5;
    stroke-dasharray: 18 14;
  }

  .how {
    padding: 0 0 96px;
    display: grid;
    grid-template-columns: minmax(0, 480px) minmax(380px, 1fr);
    gap: 48px;
    align-items: center;
  }
  .how h2 {
    font-size: clamp(20px, 3vw, 26px);
    font-weight: 400;
    margin: 0 0 16px;
  }
  .how p {
    color: #b7b7b2;
    line-height: 1.6;
    margin: 0;
  }
  .how-clip-defs {
    position: absolute;
  }
  .how-illustration {
    position: relative;
    height: 300px;
  }
  .how-illustration-scroll {
    min-width: 0;
  }
  .how-card {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #141412;
  }
  .how-card-statement {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .statement {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 20px 0 52px;
    transform: scale(var(--illo-scale, 1));
  }
  .statement-line {
    margin: 0;
    font-size: 14px;
    color: #ededec;
    white-space: nowrap;
  }
  .how-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 15%;
    transform: scale(1.15);
  }
  .how-overlay {
    position: absolute;
    inset: 0;
    background: rgba(11, 12, 10, 0.35);
  }
  .terminal {
    position: absolute;
    top: 50%;
    left: 24px;
    width: 320px;
    transform-origin: left center;
    transform: translateY(-50%) scale(var(--illo-scale-h, 1));
    background: rgba(11, 12, 10, 0.85);
    border: 1px solid #2a2a27;
    border-radius: 8px;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
  }
  .terminal-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3a3a36;
  }
  .terminal-body {
    margin: 0;
    padding: 14px 18px 18px;
    font-size: 10px;
    line-height: 1.35;
    white-space: pre;
  }
  .terminal .banner {
    display: inline-block;
    color: #ededec;
    font-size: 9px;
    line-height: 1.3;
  }
  .terminal .banner-strong {
    color: #ededec;
  }
  .terminal .log {
    display: block;
    color: #8a8a86;
  }
  .terminal .log .ts {
    color: #6b6b66;
  }
  .terminal .log .lvl {
    color: #6f9bd8;
  }
  .terminal .log-bright {
    color: #ededec;
  }

  @media (max-width: 780px) {
    .how {
      grid-template-columns: 1fr;
      gap: 32px;
    }
    .how-illustration {
      width: 100%;
      max-width: 380px;
      aspect-ratio: 380 / 300;
      height: auto;
      margin: 0 auto;
    }
    .terminal {
      width: min(320px, calc(100% - 48px));
    }
  }

  @media (max-width: 600px) {
    .how {
      gap: 24px;
    }
    .how-illustration {
      max-width: none;
      aspect-ratio: 1.91;
    }
  }

  .features,
  .install {
    padding: 0 0 96px;
    max-width: 640px;
  }
  .features h2,
  .install h2 {
    font-size: clamp(20px, 3vw, 26px);
    font-weight: 400;
    margin: 0 0 24px;
  }

  .pillars {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .pillar {
    border: 1px solid #2a2a27;
    border-radius: 12px;
    padding: 20px;
    background: #141412;
  }
  .pillar-label {
    display: block;
    font-size: 13px;
    color: #ededec;
    margin-bottom: 10px;
  }
  .pillar-desc {
    margin: 0;
    color: #b7b7b2;
    line-height: 1.5;
    font-size: 14px;
  }

  @media (max-width: 560px) {
    .pillars {
      grid-template-columns: 1fr;
    }
  }

  .install {
    max-width: 900px;
    display: grid;
    grid-template-columns: minmax(0, 380px) minmax(0, 420px);
    gap: 48px;
    align-items: center;
  }
  .install-code pre {
    margin: 0;
    background: #1c1c1a;
    border: 1px solid #2a2a27;
    border-radius: 8px;
    padding: 20px;
    font-size: 13px;
    line-height: 1.7;
    color: #ededec;
    overflow-x: auto;
  }
  .install-content p {
    color: #b7b7b2;
    line-height: 1.6;
    margin: 0;
  }

  @media (max-width: 780px) {
    .install {
      grid-template-columns: 1fr;
    }
  }

  .star-field-top {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 220px;
    pointer-events: none;
    z-index: 0;
  }
  .brand,
  .hero {
    position: relative;
    z-index: 1;
  }

  footer {
    position: relative;
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px 40px;
  }
  .star-field-bottom {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    height: 220px;
    pointer-events: none;
    z-index: 0;
  }
  .footer-statement,
  .footer-links,
  .footer-bottom {
    position: relative;
    z-index: 1;
  }
  .footer-statement {
    font-size: clamp(22px, 4vw, 32px);
    font-weight: 400;
    margin: 0 0 32px;
  }
  .footer-links {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 160px));
    gap: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #2a2a27;
  }
  .footer-col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .footer-heading {
    font-size: 11px;
    color: #5a5a55;
    margin-bottom: 4px;
  }
  .footer-col a {
    color: #b7b7b2;
    text-decoration: none;
    font-size: 14px;
  }
  .footer-col a:hover {
    color: #ededec;
  }
  .footer-bottom {
    display: flex;
    justify-content: space-between;
    padding-top: 20px;
    color: #5a5a55;
    font-size: 12px;
  }

  @media (max-width: 600px) {
    main {
      padding: 0 20px;
    }
    .brand {
      padding: 20px 0;
    }
    .hero {
      padding: 24px 0 32px;
    }
    .cta-row {
      flex-direction: column;
    }
    .btn {
      justify-content: center;
    }
    .showcase {
      width: 100vw;
      position: relative;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 0;
      margin-top: 48px;
      margin-bottom: 64px;
      overflow: visible;
    }
    .showcase .bg {
      border-radius: 0;
    }
    .app-shot {
      top: 0;
      transform: translate(-50%, -24px);
    }
    .footer-links {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
