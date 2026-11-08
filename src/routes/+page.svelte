<script>
  import "./+page.css";
  import { onMount } from "svelte";
  import Ported from "$lib/Ported.svelte";
  import { providers, modeSpecs } from "$lib/providers.js";
  import shell from "$lib/ported/shell.html?raw";
  import sidebar from "$lib/ported/sidebar.html?raw";
  import modepanel from "$lib/ported/modepanel.html?raw";
  import modelpanel from "$lib/ported/modelpanel.html?raw";
  import work from "$lib/ported/work.html?raw";
  import people from "$lib/ported/people.html?raw";
  import phone from "$lib/ported/phone.html?raw";

  let stateOn = $state("lamp");
  let modeOn = $state(1); // the dial's capture opens on Ask
  const cellWord = { allow: "Yes", ask: "Asks", deny: "No", auto: "Reviewer" };
  const modeNames = ["Read", "Ask", "Edit", "Auto", "Run"];
  const agents = providers.filter((p) => ["claudecode", "codex", "opencode", "kimi"].includes(p.id));
  const local = providers.filter((p) => p.id === "ollama");
  const apis = providers.filter((p) => !agents.includes(p) && !local.includes(p));

  // The finished row sits below the sidebar's fold at this size: bring it up for its statement.
  let listEl;
  $effect(() => {
    const pane = listEl?.querySelector(".chat-list");
    if (pane) pane.scrollTop = stateOn === "tick" ? pane.scrollHeight : 0;
  });

  function dialClick(e) {
    const t = e.target.closest('[role="radio"]');
    if (t) modeOn = [...t.parentElement.querySelectorAll('[role="radio"]')].indexOf(t);
  }

  const WEB_URL = "https://app.yoake.land";
  const REPO = "https://github.com/yoakeland-dev/yoakeland";
  const RELEASES = `${REPO}/releases`;
  const installers = {
    mac: [/arm64.*\.dmg$/i, /\.dmg$/i],
    windows: [/\.exe$/i],
    linux: [/\.AppImage$/i],
  };

  /** @type {"mac" | "windows" | "linux" | "mobile"} */
  let os = $state("linux");
  let dl = $state({});
  const downloadUrl = (id) => dl[id] ?? RELEASES;
  const mobile = $derived(os === "mobile");
  const mainHref = $derived(mobile ? WEB_URL : downloadUrl(os));
  const mainLabel = $derived(mobile ? "Open the web app" : "Download Yoake");

  async function loadRelease() {
    try {
      // Every release is a prerelease, which /releases/latest ignores, so use the list.
      const res = await fetch("https://api.github.com/repos/yoakeland-dev/yoakeland/releases?per_page=1");
      if (!res.ok) return;
      const [release] = await res.json();
      for (const [id, patterns] of Object.entries(installers)) {
        for (const re of patterns) {
          const a = (release?.assets ?? []).find((x) => re.test(x.name));
          if (a) {
            dl[id] = a.browser_download_url;
            break;
          }
        }
      }
    } catch {}
  }

  onMount(() => {
    const ua = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) os = "mobile";
    else if (/Win/.test(ua)) os = "windows";
    else if (/Mac/.test(ua)) os = "mac";
    else os = "linux";
    loadRelease();
    document.documentElement.classList.add("js");
    // Each statement lights its rows as it reaches the middle of the screen.
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (stateOn = e.target.dataset.said)),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    document.querySelectorAll("[data-said]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
</script>

{#snippet down()}
  <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v9M4 7.5 8 11.5l4-4M3 14h10" /></svg>
{/snippet}

{#snippet rows(list)}
  <ul>
    {#each list as p}
      <li><img class:inv={p.mono} src="/icons/brands/{p.icon}.svg" alt="" width="22" height="22" loading="lazy" />{p.label}</li>
    {/each}
  </ul>
{/snippet}

<header class="nav">
  <div class="container nav__bar">
    <a class="logo" href="#top"><img src="/mark.svg" alt="" width="24" height="24" />Yoake</a>
    <nav class="nav__links" aria-label="Main">
      <a class="link" href="#app">App</a>
      <a class="link" href="#modes">Modes</a>
      <a class="link" href="#providers">Providers</a>
      <a class="link" href="#devices">Devices</a>
      <a class="link" href="#faq">Questions</a>
    </nav>
    <div class="nav__end">
      <a class="link" href={REPO}>GitHub</a>
      <a class="btn btn--sm" href={mainHref}>{mainLabel}</a>
    </div>
  </div>
</header>

<main id="top">
  <section class="hero" aria-labelledby="hero-h">
    <img class="hero__sky" src="/sky-predawn.webp" alt="" width="2400" height="1760" fetchpriority="high" />
    <div class="container hero__grid">
      <div class="hero__text">
        <h1 id="hero-h">Desktop and phone app for coding agents</h1>
        <p class="lead">Run Claude Code, Codex and 11 more on a machine you own.</p>
        <div class="actions">
          <a class="btn" href={mainHref}>{mainLabel}</a>
          {#if !mobile}<a class="btn btn--quiet" href={WEB_URL}>Open the web app</a>{/if}
        </div>
        <p class="terms">Free and MIT licensed. No account and no cloud relay.</p>
      </div>
      <div class="hero__phone" role="img" aria-label="The Yoake phone app listing chats that need an answer"><Ported html={phone} w={390} fill /></div>
    </div>
  </section>

  <section class="section section--l" id="app">
    <div class="container">
      <div class="head"><h2>Every chat in one list, sorted by what needs you</h2></div>
      <div class="states">
        <div class="win states__list" bind:this={listEl} data-on={stateOn} role="img" aria-label="The Yoake chat list, grouped by what needs you"><Ported html={sidebar} w={300} fill max={1.4} /></div>
        <div class="states__said">
          <p class:on={stateOn === "lamp"} data-said="lamp">A lamp means an agent is waiting for your answer.</p>
          <p class:on={stateOn === "ring"} data-said="ring">A ring means it is working.</p>
          <p class:on={stateOn === "tick"} data-said="tick">A tick means it finished while you were away.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="modes">
    <div class="container">
      <div class="head">
        <h2>Five modes set what an agent may do</h2>
        <p class="lead">Read, Ask, Edit, Auto and Run work the same for every agent.</p>
      </div>
      <div class="modes">
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="win bare" onclick={dialClick} aria-label="The mode dial set to Ask"><Ported html={modepanel} w={231} max={1.75} hints={modeSpecs} /></div>
        <div>
          <div class="ladder-wrap">
            <table class="ladder">
              <thead><tr><th scope="col"><span class="visually-hidden">Mode</span></th><th scope="col">Read</th><th scope="col">Edit</th><th scope="col">Run</th><th scope="col">Web</th></tr></thead>
              <tbody>
                {#each modeSpecs as m, i}
                  <tr class:on={modeOn === i}>
                    <th scope="row">{modeNames[i]}</th>
                    {#each m.cells as c}<td class="c-{c}">{cellWord[c]}</td>{/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <ul class="facts">
            <li>Bubblewrap sandbox on Linux</li>
            <li>Seatbelt sandbox on macOS</li>
            <li>Every approval in an audit log</li>
          </ul>
        </div>
      </div>
      <figure class="shot">
        <div class="win win--shell" role="img" aria-label="The Yoake desktop app: a chat list beside an open chat with a question waiting"><Ported html={shell} w={1440} fill /></div>
        <figcaption class="cap">When an agent needs a yes, the question sits on top of the composer, and you can keep the answer as a rule.</figcaption>
      </figure>
    </div>
  </section>

  <section class="section section--l" id="work">
    <div class="container">
      <div class="head">
        <h2>Subagents, terminals and diffs beside the chat</h2>
        <p class="lead">Watch subagents work, read the diff before you approve it, and keep the dev server in a terminal tab. Rewind to a snapshot when a turn goes wrong.</p>
      </div>
      <div class="win win--work" role="img" aria-label="A chat with running subagents beside the subagent panel"><Ported html={work} w={1184} max={1.11} fill /></div>
    </div>
  </section>

  <section class="section" id="providers">
    <div class="container">
      <div class="head">
        <h2>Works with 13 agents and model providers</h2>
        <p class="lead">Use the coding agents you already pay for, a hosted API or models on your own GPU. Change model in the middle of a chat and the context goes with you.</p>
      </div>
      <div class="providers">
        <div class="groups">
          <div class="group"><h3>Coding agents</h3><p>The logins you already have</p>{@render rows(agents)}</div>
          <div class="group group--apis"><h3>Hosted APIs</h3><p>A key from your keyring or environment</p>{@render rows(apis)}</div>
          <div class="group"><h3>Your own GPU</h3><p>No key</p>{@render rows(local)}</div>
        </div>
        <div class="win bare" role="img" aria-label="The model picker"><Ported html={modelpanel} w={308} max={1.36} /></div>
      </div>
    </div>
  </section>

  <section class="section section--l" id="devices">
    <div class="container">
      <div class="head">
        <h2>One server for your desktop, browser and phone</h2>
        <p class="lead">Each device connects to it directly over TLS or WebRTC.</p>
      </div>
      <div class="system" role="img" aria-label="Diagram: the desktop app, a browser and a phone each connect straight to yoakeland over TLS or WebRTC.">
        <div class="system__ends">
          <div class="system__end">Desktop app</div>
          <div class="system__end">Browser</div>
          <div class="system__end">Phone</div>
        </div>
        <div class="system__wire">
          <span><b>TLS or WebRTC</b></span><span></span><span></span>
        </div>
        <div class="system__host"><code>yoakeland</code><p>Runs on a laptop, a home server or a VPS.</p></div>
      </div>
      <ol class="steps">
        <li><h3>Start yoakeland</h3><p>The desktop app starts it for you, or run it yourself on any machine.</p></li>
        <li><h3>Create a pairing code</h3><p>The app shows a code and a QR for the new device.</p></li>
        <li><h3>Connect the device</h3><p>Enter the code on your phone or another computer, then answer from there.</p></li>
      </ol>
    </div>
  </section>

  <section class="section" id="people">
    <div class="container people">
      <div>
        <h2>Limited, Trusted and Full access for each person</h2>
        <ul class="tiers">
          <li>Limited people chat and edit files in projects already open.</li>
          <li>Trusted people also help run the server.</li>
          <li>Only Full reaches the machine, and a device never has more than its owner.</li>
        </ul>
      </div>
      <div class="win" role="img" aria-label="People settings for a person with Trusted access"><Ported html={people} w={621} max={1.03} /></div>
    </div>
  </section>

  <section class="section section--l" id="faq">
    <div class="container"><div class="faq">
      <div class="faq__side">
        <h2>Questions</h2>
        <p>Read the code or report a problem on GitHub.</p>
        <a class="link faq__link" href={REPO}>See the source on GitHub</a>
      </div>
      <div>
        <div class="faq__item"><h3>What does Yoake cost?</h3><p>Nothing. Yoake is free and MIT licensed. You pay your own agent subscriptions or API bills.</p></div>
        <div class="faq__item"><h3>Does my code go through your servers?</h3><p>No. Your devices connect straight to the yoakeland you run, with no cloud relay.</p></div>
        <div class="faq__item"><h3>Do I need an account?</h3><p>No. Point it at a folder and start a chat. There is no sign-up.</p></div>
        <div class="faq__item"><h3>Do I need API keys?</h3><p>No. Claude Code and Codex use the logins you already have. API providers read a key from your keyring or environment.</p></div>
        <div class="faq__item"><h3>Which systems does it run on?</h3><p>Linux, macOS and Windows. The macOS and Windows builds are experimental, and Windows has no sandbox, only resource caps.</p></div>
      </div>
    </div></div>
  </section>
</main>

<section class="close" id="contact" aria-labelledby="close-h">
  <img class="close__sky" src="/sky-morning.webp" alt="" width="2000" height="2107" loading="lazy" />
  <div class="container close__in">
    <div>
      <h2 id="close-h">Download Yoake for your computer</h2>
      <p class="lead">Builds for macOS, Windows and Linux, free.</p>
      <div class="actions"><a class="btn btn--lg" href={mainHref}>{mainLabel}</a></div>
    </div>
    <ul class="platforms">
      <li><a href={downloadUrl("mac")}>macOS{@render down()}</a></li>
      <li><a href={downloadUrl("windows")}>Windows{@render down()}</a></li>
      <li><a href={downloadUrl("linux")}>Linux{@render down()}</a></li>
    </ul>
  </div>
</section>

<footer class="mast">
  <div class="container">
    <div class="mast__box"><a class="mast__word" href="#top">Yoake</a></div>
    <div class="mast__row">
      <p>One app for your coding agents.</p>
      <nav class="mast__links" aria-label="Footer">
        <a class="link" href="#app">Chat list</a>
        <a class="link" href="#work">In the chat</a>
        <a class="link" href="#modes">Modes</a>
        <a class="link" href="#providers">Providers</a>
        <a class="link" href="#devices">Devices</a>
        <a class="link" href={REPO}>GitHub</a>
        <a class="link" href={RELEASES}>Releases</a>
        <a class="link" href={WEB_URL}>Web app</a>
      </nav>
    </div>
    <div class="mast__legal">
      <span>&copy; 2026 Yoake</span>
      <span>Product names and logos are trademarks of their owners</span>
    </div>
  </div>
</footer>
