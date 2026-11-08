<script>
  import { onMount } from "svelte";
  import Mark from "./Mark.svelte";
  import { chats, by, answer, tick, touch } from "./chats.svelte.js";

  const TIERS = [["needs", "needs you"], ["working", "working"], ["ready", "ready"]];
  // 5x5 ring + inner ring: each dot gets a phase so the light chases around
  const SNAKE = (() => {
    const O = [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0],[3,0],[2,0],[1,0]];
    const M = [[1,1],[2,1],[3,1],[3,2],[3,3],[2,3],[1,3],[1,2]];
    const c = Array(25).fill(null);
    O.forEach(([r, q], i) => (c[r * 5 + q] = i / 16));
    M.forEach(([r, q], i) => (c[r * 5 + q] = i / 8));
    return c;
  })();

  let { hue = $bindable(226) } = $props();
  let sel = $state(1), clock = $state("00:00"), swap = $state(0);

  const current = $derived(chats.find((c) => c.id === sel) ?? chats[0]);
  const first = $derived(by("needs")[0]);
  function pick(id) { sel = id; touch(); swap++; }

  onMount(() => {
    const tickClock = () => { const d = new Date(); clock = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
    tickClock();
    const iv = [setInterval(tickClock, 20000)];
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) iv.push(setInterval(() => !document.hidden && tick(), 2600));
    return () => iv.forEach(clearInterval);
  });
</script>

{#snippet dmx()}
  <span class="dmx">{#each SNAKE as k}{#if k == null}<i></i>{:else}<i class="on" style="--k:{k}"></i>{/if}{/each}</span>
{/snippet}
{#snippet glyph(s)}
  {#if s === "needs"}<span class="lamp"></span>{:else if s === "working"}{@render dmx()}{:else}<span class="done"></span>{/if}
{/snippet}
{#snippet row(c, button)}
  <svelte:element this={button ? "button" : "div"} {...button ? { type: "button", onclick: () => pick(c.id) } : {}} class="row" class:sel={button && c.id === sel} class:hot={c.state === "needs"}>
    <span class="g">{@render glyph(c.state)}</span>
    <span class="rt"><span class="rtitle">{c.title}</span><span class="rsub">{c.remote}<b>{c.via}</b></span></span>
  </svelte:element>
{/snippet}
{#snippet list(button)}
  {#each TIERS as [s, label]}
    {@const l = by(s)}
    {#if l.length}
      <div class="tier"><h4><span>{label}</span><span>{l.length}</span></h4>{#each l as c (c.id)}{@render row(c, button)}{/each}</div>
    {/if}
  {/each}
{/snippet}

<div class="stage" style="--h:{hue}">
  <div class="win" role="img" aria-label="The yoake desktop window showing five sample chats in three groups: needs you, working and ready. You can click the chats.">
    <aside class="side">
      <div class="side-head"><span class="srv"><i class="led"></i>3 remotes</span><span class="newchat" aria-hidden="true">+</span></div>
      {@render list(true)}
    </aside>
    {#key swap}
      <section class="panel" class:swap={swap > 0}>
        <div class="ph">
          <div>
            <span class="ptitle">{current.title}</span>
            <span class="psub"><span><i class="prov" style="--pc:{current.pc}"></i>{current.provider}</span><b>{current.remote}</b><b>{current.via}</b></span>
          </div>
          <div class="pstate">
            {#if current.state === "needs"}<span class="lamp"></span>needs you{:else if current.state === "working"}{@render dmx()}working{:else}ready{/if}
          </div>
        </div>
        <div class="msgs">
          <div class="msg user">{current.prompt}</div>
          <div class="msg agent">
            <p>{current.reply}</p>
            <div class="tools">{#each current.tools as t}<span class="chip">{t}</span>{/each}</div>
            {#if current.state === "working"}<div class="live">{@render dmx()}{current.live}</div>{/if}
            {#if current.state === "ready"}<div class="doneline">Ready for review.</div>{/if}
          </div>
        </div>
        <div class="dock">
          {#if current.state === "needs"}
            <div class="ask">
              <p class="q">{current.ask.q}</p><p class="d">{current.ask.d}</p>
              <div class="acts">
                <button type="button" class="b pri" onclick={() => answer(current.id, "allow")}>Allow once</button>
                <button type="button" class="b" onclick={() => answer(current.id, "always")}>Always allow</button>
                <button type="button" class="b" onclick={() => answer(current.id, "deny")}>Deny</button>
              </div>
            </div>
          {/if}
          <div class="composer">
            <span class="ph-txt">Message the agent</span><span class="eff">effort<span></span></span>
            <span class="send"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11.5V2.5M3 6.5l4-4 4 4"/></svg></span>
          </div>
        </div>
      </section>
    {/key}
  </div>

  <figure class="phone-wrap">
    <div class="phone"><div class="screen">
      <div class="p-top"><span>{clock}</span><span>yoake</span></div>
      <div class="p-head"><Mark />yoake</div>
      <div class="p-list">{@render list(false)}</div>
      {#if first}
        <div class="p-ask">
          <p class="q">{first.ask.q}</p><p class="d">{first.title}</p>
          <div class="acts">
            <button type="button" class="b pri" onclick={() => answer(first.id, "allow")}>Allow</button>
            <button type="button" class="b" onclick={() => answer(first.id, "deny")}>Deny</button>
          </div>
        </div>
      {:else}
        <div class="p-quiet">All quiet. Nothing needs you.</div>
      {/if}
    </div></div>
    <figcaption class="mono">the same chats, on your phone</figcaption>
  </figure>
</div>


<style>
  .stage { --g: hsl(var(--h) 15% 5%); --p: hsl(var(--h) 12% 7%); --e: hsla(var(--h) 20% 95% / 0.08); --t: hsl(var(--h) 10% 92%); --td: hsl(var(--h) 6% 62%); --ac: hsl(var(--h) 100% 74%);
    --w1: color-mix(in srgb, var(--t) 4%, transparent); --w2: color-mix(in srgb, var(--t) 6%, transparent); --w3: color-mix(in srgb, var(--t) 9%, transparent); --w4: color-mix(in srgb, var(--t) 14%, transparent);
    --warn: #f0b429; --ok: #58d68d;
    width: 272px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 30px; }
  .win, .phone { font-size: 15px; color: var(--t); font-family: var(--font-ui); }
  .win { display: none; grid-template-columns: 238px minmax(0, 1fr); gap: 6px; padding: 6px; height: 620px; background: var(--g); border: 1px solid var(--e); border-radius: 14px;
    box-shadow: 0 -30px 120px rgba(255, 190, 130, 0.1), 0 30px 90px rgba(0, 0, 0, 0.5); min-width: 0; }
  .phone-wrap { margin: 0; display: grid; justify-items: center; gap: 14px; }
  .phone-wrap figcaption { color: var(--ink-faint); }
  @media (min-width: 760px) { .win { display: grid; } .stage { width: 1180px; grid-template-columns: minmax(0, 1fr) 272px; align-items: end; } }

  .side { display: flex; flex-direction: column; gap: 6px; min-height: 0; padding: 6px 2px; overflow: hidden; }
  .side-head { display: flex; align-items: center; gap: 8px; padding: 4px 8px 10px; }
  .srv { display: inline-flex; align-items: center; gap: 8px; font-size: 0.78em; font-weight: 500; color: var(--td); }
  .led { width: 6px; height: 6px; border-radius: 50%; background: var(--ok); }
  .newchat { margin-left: auto; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; background: var(--w2); color: var(--td); font-size: 1.1em; line-height: 1; }
  .tier h4 { margin: 0; padding: 12px 10px 4px; display: flex; justify-content: space-between; font-size: 0.72em; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--td); }
  .row { display: flex; align-items: flex-start; gap: 10px; width: 100%; margin: 0; padding: 8px 10px; border: 0; border-radius: 6px; background: transparent; color: var(--t); text-align: left; font: inherit; }
  button.row { cursor: pointer; transition: background 0.15s; }
  button.row:hover { background: var(--w2); }
  .row.sel { background: var(--w3); }
  .row .g { flex: none; display: grid; place-items: center; width: 13px; height: 16px; }
  .rt { display: grid; gap: 2px; min-width: 0; }
  .rtitle { font-size: 0.82em; font-weight: 500; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row.hot .rtitle { font-weight: 700; }
  .rsub { display: flex; gap: 8px; font-size: 0.72em; color: var(--td); white-space: nowrap; }
  .rsub b { font-weight: 400; opacity: 0.7; }
  .lamp { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--warn); box-shadow: 0 0 0 3px rgba(240, 180, 41, 0.22); flex: none; }
  .done { width: 7px; height: 7px; border-radius: 50%; background: var(--td); opacity: 0.45; }
  .dmx { display: grid; grid-template: repeat(5, 1fr) / repeat(5, 1fr); width: 13px; height: 13px; flex: none; }
  .dmx i { display: block; width: 2px; height: 2px; margin: auto; border-radius: 50%; background: var(--ac); opacity: 0; }
  .dmx i.on { animation: snake 1.1s linear infinite; animation-delay: calc(var(--k) * -1.1s); }
  @keyframes snake { 0%, 100% { opacity: 0.14; } 10% { opacity: 1; } 35% { opacity: 0.4; } 60% { opacity: 0.14; } }

  .panel { display: flex; flex-direction: column; min-width: 0; min-height: 0; background: var(--p); border: 1px solid var(--e); border-radius: 10px; overflow: hidden; }
  .panel.swap { animation: swapin 0.18s ease-out; }
  @keyframes swapin { from { opacity: 0.4; } to { opacity: 1; } }
  .ph { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--e); }
  .ptitle { display: block; font-size: 1.05em; font-weight: 700; }
  .psub { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin-top: 3px; font-size: 0.72em; color: var(--td); }
  .prov { display: inline-block; width: 7px; height: 7px; margin-right: 6px; border-radius: 2px; background: var(--pc); }
  .psub b { font-weight: 400; opacity: 0.75; }
  .pstate { display: inline-flex; align-items: center; gap: 8px; font-size: 0.78em; font-weight: 500; color: var(--td); white-space: nowrap; }
  .msgs { flex: 1; min-height: 0; overflow: hidden; padding: 20px 22px; display: flex; flex-direction: column; gap: 18px; }
  .msg { max-width: 62ch; font-size: 0.85em; line-height: 1.6; }
  .msg.user { align-self: flex-end; padding: 10px 14px; border: 1px solid var(--w3); border-radius: 10px; background: hsl(var(--h) 13% 16%); }
  .msg.agent p { margin: 0 0 10px; }
  .tools { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { padding: 3px 8px; border-radius: 4px; background: var(--w2); color: var(--td); font-size: 0.88em; }
  .live { display: flex; align-items: center; gap: 10px; margin-top: 12px; color: var(--td); font-size: 0.92em; }
  .doneline { margin-top: 12px; color: var(--ok); font-size: 0.92em; }
  .dock { padding: 0 14px 14px; }
  .ask { padding: 14px 16px; border: 1px solid var(--w4); border-bottom: 0; border-radius: 14px 14px 0 0; background: hsl(var(--h) 13% 11%); }
  .ask p, .p-ask p { margin: 0; }
  .q { font-size: 0.88em; font-weight: 700; }
  .d { margin-top: 2px; font-size: 0.78em; color: var(--td); }
  .acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .b { padding: 7px 14px; border: 0; border-radius: 6px; background: var(--w3); color: var(--t); font: inherit; font-size: 0.8em; font-weight: 500; cursor: pointer; transition: filter 0.15s; }
  .b:hover { filter: brightness(1.25); }
  .b.pri { background: var(--ac); color: hsl(var(--h) 40% 8%); }
  .composer { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--w4); border-radius: 14px; background: hsl(var(--h) 13% 11%); color: var(--td); font-size: 0.85em; }
  .ask + .composer { border-radius: 0 0 14px 14px; }
  .ph-txt { flex: 1; min-width: 0; }
  .eff { display: inline-flex; align-items: center; gap: 8px; font-size: 0.84em; }
  .eff span { position: relative; display: block; width: 56px; height: 3px; border-radius: 3px; background: var(--w3); }
  .eff span::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 62%; border-radius: 3px; background: linear-gradient(90deg, transparent, var(--ac)); box-shadow: 0 0 10px var(--ac); }
  .send { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--w3); color: var(--t); }
  .send svg { width: 13px; height: 13px; }

  .phone { width: 272px; height: 560px; padding: 9px; border-radius: 42px; background: var(--g); border: 1px solid var(--e); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5); }
  .screen { height: 100%; display: flex; flex-direction: column; border-radius: 34px; background: var(--p); overflow: hidden; }
  .p-top { display: flex; justify-content: space-between; padding: 16px 20px 6px; font-size: 0.72em; color: var(--td); }
  .p-head { display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 1.05em; font-weight: 700; }
  .p-head :global(svg) { width: 18px; height: 18px; }
  .p-list { flex: 1; min-height: 0; overflow: hidden; padding: 0 8px; }
  .p-ask { margin: 8px; padding: 14px; border: 1px solid var(--w4); border-radius: 14px; background: hsl(var(--h) 13% 11%); }
  .p-ask .q { font-size: 0.84em; }
  .p-ask .d { font-size: 0.74em; }
  .p-quiet { margin: 8px; padding: 14px; font-size: 0.8em; color: var(--td); text-align: center; }


  @media (prefers-reduced-motion: reduce) { .dmx i.on { animation: none; opacity: 0.6; } }
</style>
