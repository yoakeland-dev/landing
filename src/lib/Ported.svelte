<script>
  // A piece of the real app (markup and CSS captured from its running build), scaled to fit.
  import "./ported/ported.css";
  import { onMount } from "svelte";

  let { html, w, h = null, fill = false, max = 1, hints = null, class: cls = "" } = $props();
  let box, yk;
  let scale = $state(1);
  let bw = $state(0);
  let nh = $state(100);
  let ew = $state(w);
  let fh = $state(0); // fill: the app reflows to whatever height its frame has

  onMount(() => {
    const ro = new ResizeObserver(([e]) => {
      bw = e.contentRect.width;
      // fill: on narrow frames the app reflows to a narrower window rather than shrinking past reading size
      ew = fill ? Math.min(w, Math.max(bw < 640 ? 390 : 760, bw / 0.89)) : w;
      scale = Math.min(max, bw / ew);
      if (fill) fh = e.contentRect.height / scale;
    });
    ro.observe(box);
    const rh = new ResizeObserver(() => h == null && !fill && (nh = yk.scrollHeight));
    rh.observe(yk);
    // The capture loses scroll offsets: pin transcripts to their latest messages, as in the app.
    for (const l of yk.querySelectorAll(".list.svelte-qha2j")) l.scrollTop = l.scrollHeight;
    return () => (ro.disconnect(), rh.disconnect());
  });

  // The app's own controls, minimally wired: dials, segmented choices, switches, rows.
  function click(e) {
    const t = e.target.closest("button");
    if (!t) return;
    const grp = t.closest('[role="radiogroup"]');
    if (grp && t.getAttribute("role") === "radio") {
      const btns = [...grp.querySelectorAll('[role="radio"]')];
      const i = btns.indexOf(t);
      btns.forEach((b) => {
        b.setAttribute("aria-checked", String(b === t));
        b.classList.toggle("on", b === t);
      });
      const track = grp.querySelector(".track");
      if (track) {
        const k = parseFloat(t.style.getPropertyValue("--k"));
        track.style.setProperty("--p", k);
        track.querySelectorAll(".tick").forEach((x) => x.classList.toggle("lit", parseFloat(x.style.getPropertyValue("--k")) <= k));
      }
      if (grp.classList.contains("segmented")) grp.style.setProperty("--i", i);
      if (hints) {
        const root = grp.closest(".yk");
        const hint = root.querySelector(".detail .hint");
        const cells = [...root.querySelectorAll(".strip .cell")];
        const spec = hints[i];
        if (hint && spec) hint.textContent = spec.hint;
        if (spec) cells.forEach((c, n) => (c.classList.remove("allow", "ask", "deny", "auto"), c.classList.add(spec.cells[n])));
      }
      return;
    }
    if (t.getAttribute("role") === "switch") {
      t.setAttribute("aria-checked", String(t.getAttribute("aria-checked") !== "true"));
      return;
    }
    const row = t.closest(".row.lifted, .lr");
    if (row) {
      const scope = row.parentElement;
      scope.querySelectorAll(".row.active, .lr.on").forEach((r) => r.classList.remove("active", "on"));
      row.classList.add(row.classList.contains("lr") ? "on" : "active");
    }
  }
</script>

<div class="pbox {cls}" bind:this={box} style:height={fill ? "100%" : bw ? `${(h ?? nh) * scale}px` : null} style:aspect-ratio={!fill && !bw && h != null ? `${w} / ${h}` : null}>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="yk" bind:this={yk} style:width="{ew}px" style:height={fill ? `${fh}px` : h != null ? `${h}px` : "auto"} style:left="{Math.max(0, (bw - ew * scale) / 2)}px" style:transform="scale({scale})" onclick={click}>{@html html}</div>
</div>

<style>
  .pbox { position: relative; width: 100%; overflow: hidden; }
  .pbox > :global(.yk) { position: absolute; left: 0; top: 0; transform-origin: 0 0; overflow: hidden; }
  /* popovers were floating in the app; here they sit where they are put */
  :global(.yk .mode-panel), :global(.yk .picker-panel) { position: static !important; transform: none !important; width: 100% !important; max-width: none !important; animation: none !important; }
</style>
