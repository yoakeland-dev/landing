<script>
  import "./+page.css";
  import { onMount } from "svelte";
  import StarField from "$lib/StarField.svelte";

  import anthropicIcon from "@lobehub/icons-static-svg/icons/anthropic.svg?url";
  import openaiIcon from "@lobehub/icons-static-svg/icons/openai.svg?url";
  import deepseekIcon from "@lobehub/icons-static-svg/icons/deepseek.svg?url";
  import geminiIcon from "@lobehub/icons-static-svg/icons/gemini.svg?url";
  import mistralIcon from "@lobehub/icons-static-svg/icons/mistral.svg?url";
  import metaIcon from "@lobehub/icons-static-svg/icons/meta.svg?url";
  import qwenIcon from "@lobehub/icons-static-svg/icons/qwen.svg?url";
  import moonshotIcon from "@lobehub/icons-static-svg/icons/moonshot.svg?url";
  import openrouterIcon from "@lobehub/icons-static-svg/icons/openrouter.svg?url";
  import awsIcon from "@lobehub/icons-static-svg/icons/bedrock.svg?url";
  import cloudflareIcon from "@lobehub/icons-static-svg/icons/cloudflare.svg?url";
  import huggingfaceIcon from "@lobehub/icons-static-svg/icons/huggingface.svg?url";
  import nvidiaIcon from "@lobehub/icons-static-svg/icons/nvidia.svg?url";
  import ollamaIcon from "@lobehub/icons-static-svg/icons/ollama.svg?url";

  import deepseekIconColor from "@lobehub/icons-static-svg/icons/deepseek-color.svg?url";
  import geminiIconColor from "@lobehub/icons-static-svg/icons/gemini-color.svg?url";
  import mistralIconColor from "@lobehub/icons-static-svg/icons/mistral-color.svg?url";
  import metaIconColor from "@lobehub/icons-static-svg/icons/meta-color.svg?url";
  import qwenIconColor from "@lobehub/icons-static-svg/icons/qwen-color.svg?url";
  import openrouterIconColor from "@lobehub/icons-static-svg/icons/openrouter-color.svg?url";
  import awsIconColor from "@lobehub/icons-static-svg/icons/bedrock-color.svg?url";
  import cloudflareIconColor from "@lobehub/icons-static-svg/icons/cloudflare-color.svg?url";
  import huggingfaceIconColor from "@lobehub/icons-static-svg/icons/huggingface-color.svg?url";
  import nvidiaIconColor from "@lobehub/icons-static-svg/icons/nvidia-color.svg?url";

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

  const platforms = [
    { id: "mac", label: "macOS" },
    { id: "windows", label: "Windows" },
    { id: "linux", label: "Linux" },
  ];

  const providers = [
    {
      id: "anthropic",
      label: "Anthropic",
      org: "Anthropic · San Francisco",
      icon: anthropicIcon,
      color: "#D97757",
      endpoint: "api.anthropic.com/v1/messages",
      keySource: "UI Keyring (or $ANTHROPIC_API_KEY)",
      protocol: "Anthropic Messages API · Prompt Caching (90% saved)",
      runtimeNote: "direct TLS · thinking budget enabled",
      daemonLog:
        "auth: secure UI keyring · cache read hit · thinking budget 8k",
      local: false,
    },
    {
      id: "ollama",
      label: "Ollama",
      org: "Local Hardware Runtime",
      icon: ollamaIcon,
      color: "#E7E7E7",
      endpoint: "http://localhost:11434",
      keySource: "None (offline local runner)",
      protocol: "Native Ollama API & OpenAI-compatible endpoints",
      runtimeNote: "on-metal VRAM · zero network egress",
      daemonLog: "runtime: localhost:11434 · metal m-series gpu · zero egress",
      local: true,
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      org: "DeepSeek AI · Hangzhou",
      icon: deepseekIcon,
      colorIcon: deepseekIconColor,
      color: "#5786FE",
      endpoint: "api.deepseek.com/v1/chat/completions",
      keySource: "UI Keyring (or $DEEPSEEK_API_KEY)",
      protocol: "DeepSeek MoE 671B · Native <think> reasoning tokens",
      runtimeNote: "direct TLS · dynamic context caching",
      daemonLog: "auth: secure UI keyring · streaming native <think> trace",
      local: false,
    },
    {
      id: "openai",
      label: "OpenAI",
      org: "OpenAI · San Francisco",
      icon: openaiIcon,
      color: "#10A37F",
      endpoint: "api.openai.com/v1/chat/completions",
      keySource: "UI Keyring (or $OPENAI_API_KEY)",
      protocol: "OpenAI Wire Protocol · Structured Outputs & Tool Calling",
      runtimeNote: "direct TLS · reasoning effort parameter",
      daemonLog: "auth: secure UI keyring · reasoning effort: medium",
      local: false,
    },
    {
      id: "mistral",
      label: "Mistral",
      org: "Mistral AI · Paris",
      icon: mistralIcon,
      colorIcon: mistralIconColor,
      color: "#FA520F",
      endpoint: "api.mistral.ai/v1/fim/completions",
      keySource: "UI Keyring (or $MISTRAL_API_KEY)",
      protocol: "Fill-in-the-Middle (FIM) · Prefix / Suffix AST completion",
      runtimeNote: "direct TLS · sub-second European TTFT",
      daemonLog:
        "auth: secure UI keyring · FIM buffer active · low-latency stream",
      local: false,
    },
    {
      id: "qwen",
      label: "Qwen",
      org: "Alibaba Cloud · Hangzhou",
      icon: qwenIcon,
      colorIcon: qwenIconColor,
      color: "#6950EF",
      endpoint: "dashscope.aliyuncs.com/compatible-mode/v1",
      keySource: "UI Keyring (or $DASHSCOPE_API_KEY)",
      protocol: "DashScope Model Studio · 128K context window",
      runtimeNote: "direct TLS · SOTA open code architecture",
      daemonLog: "auth: secure UI keyring · 128k context buffer initialized",
      local: false,
    },
    {
      id: "gemini",
      label: "Gemini",
      org: "Google DeepMind",
      icon: geminiIcon,
      colorIcon: geminiIconColor,
      color: "#8E75B2",
      endpoint: "generativelanguage.googleapis.com/v1beta",
      keySource: "UI Keyring (or $GEMINI_API_KEY)",
      protocol: "Google AI Studio · 1M-2M context window · native multimodal",
      runtimeNote: "direct TLS · speculative decoding engine",
      daemonLog: "auth: secure UI keyring · 1M context window allocated",
      local: false,
    },
    {
      id: "openrouter",
      label: "OpenRouter",
      org: "OpenRouter · Routing Fabric",
      icon: openrouterIcon,
      colorIcon: openrouterIconColor,
      color: "#c8ff00",
      endpoint: "openrouter.ai/api/v1",
      keySource: "UI Keyring (or $OPENROUTER_API_KEY)",
      protocol: "Unified OpenAI Meta-Router with latency fallback ranking",
      runtimeNote: "direct TLS · single key gateway balance",
      daemonLog:
        "auth: secure UI keyring · fallback chain: anthropic -> bedrock",
      local: false,
    },
    {
      id: "aws",
      label: "AWS Bedrock",
      org: "Amazon Web Services · Seattle",
      icon: awsIcon,
      colorIcon: awsIconColor,
      color: "#6c90b9",
      endpoint: "bedrock-runtime.{region}.amazonaws.com",
      keySource: "AWS IAM / SigV4 Chain / UI",
      protocol: "AWS SigV4 HMAC-SHA256 · Private VPC & GovCloud routes",
      runtimeNote: "direct TLS · zero data retention agreement",
      daemonLog: "auth: AWS credential chain (us-east-1) · zero retention",
      local: false,
    },
    {
      id: "meta",
      label: "Meta",
      org: "Meta FAIR · Menlo Park",
      icon: metaIcon,
      colorIcon: metaIconColor,
      color: "#0467DF",
      endpoint: "localhost:8000/v1 (vLLM / llama.cpp)",
      keySource: "Local vLLM / self-hosted endpoint",
      protocol: "RoPE 128K context · Grouped-Query Attention (GQA)",
      runtimeNote: "on-metal / private serverless endpoint",
      daemonLog: "runtime: private vLLM instance · local KV-cache bound",
      local: false,
    },
    {
      id: "cloudflare",
      label: "Cloudflare",
      org: "Cloudflare Workers AI",
      icon: cloudflareIcon,
      colorIcon: cloudflareIconColor,
      color: "#F38020",
      endpoint: "api.cloudflare.com/client/v4/accounts/{id}/ai/v1",
      keySource: "UI Keyring (or $CLOUDFLARE_API_TOKEN)",
      protocol: "Cloudflare Workers AI REST · 300+ edge city nodes",
      runtimeNote: "direct TLS · anycast global edge routing",
      daemonLog: "auth: Cloudflare API token · routed via nearest edge pop",
      local: false,
    },
    {
      id: "huggingface",
      label: "HuggingFace",
      org: "HuggingFace · New York / Paris",
      icon: huggingfaceIcon,
      colorIcon: huggingfaceIconColor,
      color: "#FFD21E",
      endpoint: "api-inference.huggingface.co/v1",
      keySource: "UI Keyring (or $HF_TOKEN)",
      protocol: "Text Generation Inference (TGI) · Dedicated Endpoints",
      runtimeNote: "direct TLS · open model hub router",
      daemonLog: "auth: HF user token · TGI streaming container attached",
      local: false,
    },
    {
      id: "nvidia",
      label: "NVIDIA",
      org: "NVIDIA NIM · Santa Clara",
      icon: nvidiaIcon,
      colorIcon: nvidiaIconColor,
      color: "#76B900",
      endpoint: "integrate.api.nvidia.com/v1",
      keySource: "UI Keyring (or $NVIDIA_API_KEY)",
      protocol: "NVIDIA NIM Microservice · TensorRT-LLM FP8/FP4 kernels",
      runtimeNote: "direct TLS · optimized GPU inference cluster",
      daemonLog: "auth: NVIDIA API token · TensorRT-LLM optimized stream",
      local: false,
    },
    {
      id: "moonshot",
      label: "Moonshot",
      org: "Moonshot AI (Kimi) · Beijing",
      icon: moonshotIcon,
      color: "#E7E7E7",
      endpoint: "api.moonshot.cn/v1",
      keySource: "UI Keyring (or $MOONSHOT_API_KEY)",
      protocol: "Moonshot Open Platform · Long-horizon document agent",
      runtimeNote: "direct TLS · extended context memory",
      daemonLog: "auth: secure UI keyring · Kimi agentic memory attached",
      local: false,
    },
  ];

  /** @type {"mac" | "windows" | "linux" | null} */
  let dlOs = $state(null);
  let effectiveOs = $derived(dlOs ?? (os === "mobile" ? "mac" : os));

  let selectedId = $state("anthropic");
  let selected = $derived(
    providers.find((p) => p.id === selectedId) ?? providers[0],
  );

  let deckEl = $state();
  let canScrollTop = $state(false);
  let canScrollBottom = $state(false);
  let isPaused = $state(false);

  function checkScroll() {
    if (!deckEl) return;
    canScrollTop = deckEl.scrollTop > 6;
    canScrollBottom =
      deckEl.scrollTop + deckEl.clientHeight < deckEl.scrollHeight - 6;
  }

  onMount(() => {
    checkScroll();

    // Auto-cycle through providers every 4.5s
    const interval = setInterval(() => {
      if (isPaused) return;
      const idx = providers.findIndex((p) => p.id === selectedId);
      const next = providers[(idx + 1) % providers.length];
      selectedId = next.id;

      if (deckEl) {
        const activeBtn = deckEl.querySelector(`[data-id="${next.id}"]`);
        if (activeBtn) {
          const btnTop = activeBtn.offsetTop - deckEl.offsetTop;
          const btnBottom = btnTop + activeBtn.offsetHeight;
          if (
            btnTop < deckEl.scrollTop ||
            btnBottom > deckEl.scrollTop + deckEl.clientHeight
          ) {
            activeBtn.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
        }
      }
      checkScroll();
    }, 4500);

    return () => clearInterval(interval);
  });
</script>

{#snippet osIcon(p)}
  <span
    class="icon-mask os-icon"
    style="--icon: url('/icons/os/{p}.svg');"
    aria-hidden="true"
  ></span>
{/snippet}

{#snippet providerIcon(iconUrl, colorIconUrl)}
  <span class="provider-icon-swap">
    <span
      class="icon-mask provider-icon mono-icon"
      style="--icon: url(&quot;{iconUrl}&quot;);"
      aria-hidden="true"
    ></span>
    {#if colorIconUrl}
      <img
        class="provider-icon color-icon"
        src={colorIconUrl}
        alt=""
        aria-hidden="true"
      />
    {/if}
  </span>
{/snippet}

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
        {@render osIcon(os)}
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
    <p class="cta-caption mono">
      You'll need to bring your own server for the web client.
    </p>
  </div>

  <div class="showcase">
    <img class="bg" src="/background.png" alt="" width="1768" height="890" />
    <picture>
      <source media="(max-width: 600px)" srcset="/app-screenshot-mobile.png" />
      <img
        class="app-shot"
        src="/app-screenshot.png"
        alt="yoakeland app"
        width="1130"
        height="698"
      />
    </picture>
  </div>

  <svg class="divider" width="100%" height="2" preserveAspectRatio="none">
    <line x1="0" y1="1" x2="100%" y2="1" />
  </svg>

  <section class="how" id="how">
    <div class="how-content">
      <h2>No ritual.</h2>
      <p>
        Point it at a folder and let it breathe. No onboarding questionnaires,
        no telemetry handshakes, no browser tabs asking for an email before
        you've written a single line.
      </p>
      <p class="how-subtext">
        Run <span class="mono">./yoakeland -project .</span> when you sit down at
        your desk. It attaches to a local socket and waits for you.
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
          <img class="how-bg how-bg-right" src="/background-2.png" alt="" />
          <img
            class="statement-shot"
            src="/it-works-screenshot.png"
            alt="yoakeland mid-session, already working"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Remade BYO Section: Two Distinct Side-by-Side Rectangles -->
  <section class="byo" id="byo">
    <div class="byo-header">
      <h2>Any model. Same handshake.</h2>
      <p>
        Weights on your local GPU or a frontier model across the wire—to
        yoakeland, it’s all the same streaming target. Set your keys in the UI
        or pull from environment variables. Hot-swap models mid-session with
        zero daemon restarts.
      </p>
    </div>

    <div class="byo-split">
      <!-- Rectangle 1 (Left): The Scrollable Provider Deck Panel -->
      <div class="byo-panel byo-deck-panel">
        <div
          class="deck-gradient deck-gradient-top"
          class:visible={canScrollTop}
          aria-hidden="true"
        ></div>

        <div
          class="byo-deck"
          bind:this={deckEl}
          onscroll={checkScroll}
          onpointerenter={() => (isPaused = true)}
          onpointerleave={() => (isPaused = false)}
          ontouchstart={() => (isPaused = true)}
          ontouchend={() => (isPaused = false)}
        >
          {#each providers as p}
            <button
              type="button"
              class="byo-tile"
              class:active={selectedId === p.id}
              data-id={p.id}
              style="--brand: {p.color}"
              onclick={() => {
                selectedId = p.id;
                isPaused = true;
              }}
              onmouseenter={() => (selectedId = p.id)}
            >
              <span class="byo-tile-icon">
                {@render providerIcon(p.icon, p.colorIcon)}
              </span>
              <span class="mono byo-tile-label">{p.label}</span>
            </button>
          {/each}
        </div>

        <div
          class="deck-gradient deck-gradient-bottom"
          class:visible={canScrollBottom}
          aria-hidden="true"
        ></div>
      </div>

      <!-- Rectangle 2 (Right): Standalone Live Session Console -->
      <div class="byo-panel byo-inspector-panel">
        <div class="inspector-specs">
          <div class="spec-header">
            <div class="spec-brand" style="--brand: {selected.color}">
              {@render providerIcon(selected.icon, selected.colorIcon)}
              <div class="spec-title-group">
                <span class="mono spec-brand-name">{selected.label}</span>
                <span class="mono spec-brand-org">{selected.org}</span>
              </div>
            </div>
            <span class="mono spec-badge" class:local={selected.local}>
              {selected.runtimeNote}
            </span>
          </div>

          <div class="spec-table mono">
            <div class="spec-row">
              <span class="spec-key">endpoint</span>
              <span class="spec-val">{selected.endpoint}</span>
            </div>
            <div class="spec-row">
              <span class="spec-key">auth</span>
              <span class="spec-val">{selected.keySource}</span>
            </div>
            <div class="spec-row">
              <span class="spec-key">protocol</span>
              <span class="spec-val spec-protocol">{selected.protocol}</span>
            </div>
          </div>
        </div>

        <!-- The Running Daemon Terminal with Real Starry Banner -->
        <div class="inspector-cli mono">
          <div class="cli-bar">
            <div class="cli-dots">
              <span class="cli-dot"></span>
              <span class="cli-dot"></span>
              <span class="cli-dot"></span>
            </div>
            <span class="cli-caption">$ ./yoakeland</span>
          </div>
          <pre class="cli-output"><code
              ><span
                class="banner-art">      *         *  ·    .·           ·          .    ·         ·   *
  <span class="banner-strong">✦ yoakeland ✦</span
                >                     ·     .      *
           ·   ✦              ✦                    *     +     .</span
              >

<span class="cli-ts">04:18:02</span> <span class="cli-info">INFO</span
              > session active at ~/.yoake/workspace
<span class="cli-ts">04:18:02</span> <span class="cli-info">INFO</span
              > {selected.daemonLog}
<span class="cli-ts">04:18:03</span> <span class="cli-ready">READY</span
              > stream attached · 0ms daemon restart</code
            ></pre>
        </div>
      </div>
    </div>
  </section>

  <section class="features">
    <h2>Why run it yourself</h2>
    <div class="bento">
      <div class="tile tile-lg">
        <svg
          class="tile-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path
            d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"
          /><path d="M11 11a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path
            d="M12 12l0 2.5"
          /></svg
        >
        <span class="mono tile-label">sandboxed</span>
        <div class="tile-stack">
          <span class="stack-rung">Level 1: Bubblewrap (unprivileged)</span>
          <span class="stack-rung">Linux namespaces (fallback)</span>
          <span class="stack-rung warn"
            >Unconfined (fallback, logged warning)</span
          >
        </div>
        <div class="tile-boundary mono">
          <span class="line ok">ALLOWED: ~/workspace/yoake/* (rw)</span>
          <span class="line warn">BLOCKED: ~/.ssh, ~/.gnupg, /etc</span>
          <span class="line warn">CHAINED: ; && | $() ` → ask first</span>
        </div>
        <p class="tile-desc tile-caption">
          It can touch your project files, but it can never wander into your
          home directory.
        </p>
      </div>

      <div class="tile">
        <svg
          class="tile-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path
            d="M13 9a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1v-10"
          /><path
            d="M18 8v-3a1 1 0 0 0 -1 -1h-13a1 1 0 0 0 -1 1v12a1 1 0 0 0 1 1h9"
          /><path d="M16 9h2" /></svg
        >
        <span class="mono tile-label">multi-device</span>
        <p class="tile-desc">
          Start a task on your desktop, keep talking to it from a paired phone
          or laptop. One bearer token plus a self-signed CA, copied over once —
          no account, no cloud relay in between.
        </p>
      </div>

      <div class="tile">
        <svg
          class="tile-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path
            d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2m4 -14h6m-6 4h6m-2 4h2"
          /></svg
        >
        <span class="mono tile-label">tracked spend</span>
        <p class="tile-desc">
          Priced straight off your provider's own rate card — zero markup, no
          bundled credits. Route to your local GPU instead and it's a flat <span
            class="mono">$0.00</span
          >.
        </p>
      </div>

      <div class="tile tile-wide">
        <svg
          class="tile-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M12 8l0 4l2 2" /><path
            d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"
          /></svg
        >
        <span class="mono tile-label">undoable</span>
        <p class="tile-desc">
          Every write gets a snapshot first. If an agent breaks something four
          edits deep, one <span class="mono">restore</span> rolls the whole
          working tree back — no manual <span class="mono">git</span> archaeology.
          Files it created get removed too, not just edits undone, and permissions
          come back exactly as they were.
        </p>
      </div>

      <div class="tile">
        <svg
          class="tile-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M12 4l-8 4l8 4l8 -4l-8 -4" /><path
            d="M4 12l8 4l8 -4"
          /><path d="M4 16l8 4l8 -4" /></svg
        >
        <span class="mono tile-label">multi-project</span>
        <p class="tile-desc">
          One daemon serves every project you have open, each with its own
          sandbox, permissions, and history — not a separate process (and a
          separate memory footprint) per repo.
        </p>
      </div>

      <div class="tile tile-full">
        <div class="tile-header">
          <div class="tile-header-left">
            <svg
              class="tile-icon-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path
                d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6"
              /><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path
                d="M8 11v-4a4 4 0 1 1 8 0v4"
              /></svg
            >
            <span class="mono tile-label">plan mode</span>
          </div>
        </div>
        <div class="tile-gate">
          <div class="gate-col">
            <span class="gate-title">normal mode</span>
            <span class="gate-item mono ok"
              >auto: file_read · ls · pwd · git status/diff</span
            >
            <span class="gate-item mono warn"
              >ask: file_write · file_edit · bash</span
            >
          </div>
          <div class="gate-col">
            <span class="gate-title">plan mode</span>
            <span class="gate-item mono ok">only: file_read</span>
            <span class="gate-item"
              >everything else isn't offered — not denied, never defined</span
            >
          </div>
        </div>
        <p class="tile-desc tile-caption">
          Plan mode doesn't deny a write when the model tries one — it's never
          told the tool exists at all, so there's nothing to attempt.
        </p>
      </div>
    </div>
  </section>

  <svg class="divider" width="100%" height="2" preserveAspectRatio="none">
    <line x1="0" y1="1" x2="100%" y2="1" />
  </svg>

  <section class="download" id="download">
    <p class="download-statement">One binary. Windowed or headless.</p>

    <div class="download-main">
      {#if os === "mobile"}
        <a class="btn primary download-btn" href="#"
          ><span class="mono">Open on web</span></a
        >
      {:else}
        <a class="btn primary download-btn" href="#"
          >{@render osIcon(effectiveOs)}<span class="mono"
            >Download for {labels[effectiveOs]}</span
          ></a
        >
      {/if}

      <div class="platform-switch">
        {#each platforms as p}
          <button
            type="button"
            class="platform-chip"
            class:active={effectiveOs === p.id}
            aria-pressed={effectiveOs === p.id}
            onclick={() => (dlOs = p.id)}
          >
            {@render osIcon(p.id)}
            <span class="mono">{p.label}</span>
            {#if os === p.id}<span class="detect-dot" aria-hidden="true"
              ></span><span class="sr-only">(detected)</span>{/if}
          </button>
        {/each}
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="star-field-bottom">
    <StarField mode="bottom" falloffPower={0.35} />
  </div>
  <div class="footer-content">
    <p class="footer-statement">Run it on your machine.</p>
    <div class="footer-strip">
      <div class="footer-links">
        <a href="#">GitHub</a>
        <a href="#">License</a>
      </div>
      <span class="mono footer-copyright">yoakeland &copy; 2026</span>
    </div>
  </div>
  <div class="footer-wordmark-wrap">
    <div class="footer-wordmark mono" aria-hidden="true">yoakeland</div>
  </div>
</footer>
