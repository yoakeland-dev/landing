// Neighbouring sections hand their shared pieces to each other. Ghost copies in an overlay fly, grow,
// split and fold from one section's picture into the next while the real pieces stay hidden, then the
// ghosts go and the real pieces show. Each morph is written forwards; scrolling back plays it in reverse,
// and turning back halfway turns the morph around where it is.
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)"; // symmetric, so it reads the same played backwards
const L = (i) => `.vis[data-i="${i}"]`;
const px = (x, y) => `${x}px ${y}px`;

const PAIRS = [
  // overview -> fleet: the warm star drops into the lamp, the faint stars become the other rows' marks, the list opens from the lamp
  { T: 1.5, run({ $, $$, rest, hide, ghost, fly, play }) {
    const lamp = $(`${L(1)} .r2.hot .lampdot`);
    const marks = [...$$(`${L(1)} .avs i`), ...$$(`${L(1)} .r2:not(.hot) .g2`)];
    [lamp, ...marks].forEach(hide); // before the panel is copied, so the copy has holes where they land
    const P = ghost($(`${L(1)} .side2`)), l = rest(lamp);
    const at = `at ${(l.cx - P.r.x) / P.k}px ${(l.cy - P.r.y) / P.k}px`;
    play(P.c, { clipPath: [`circle(0px ${at})`, `circle(${Math.hypot(P.w, P.h) * 1.5}px ${at})`] }, { dur: 0.8, delay: 0.65 });
    fly($(".hubstar"), lamp, { dur: 1, lift: 0.3 });
    $$(".fig .g").forEach((s, i) => marks[i] && fly(s, marks[i], { dur: 0.9, delay: 0.05 + i * 0.05, lift: 0.2 }));
  } },
  // fleet -> any agent: the waiting row opens into its chat, its title becomes your message
  { T: 1.4, run({ $, $$, hide, grow, fly, play }) {
    const title = $(`${L(1)} .r2.hot .t2 b`), you = $(`${L(2)} .you`);
    hide(title); hide(you);
    grow($(`${L(1)} .r2.hot`), $(`${L(2)} .relay`), { dur: 1 });
    fly(title, you, { dur: 0.9, delay: 0.1, lift: 0, fade: 0 }); // the title is gone before the message shows, so the two never overlap
    $$(`${L(1)} .lock, ${L(1)} .side2`).forEach((el) => play(el, { translate: ["0 0", "0 18px"], opacity: [1, 0] }, { dur: 0.45 }));
    $$(`${L(2)} .logos span`).forEach((s, i) => play(s, { translate: ["0 8px", "0 0"], opacity: [0, 1] }, { dur: 0.4, delay: 0.6 + i * 0.03 }));
  } },
  // any agent -> every screen: the chat folds up and the three devices come out of it, the agents sink into the server, the wires come up
  { T: 1.5, run({ $, $$, rest, ghost, play, sink, pop, draw }) {
    const relay = $(`${L(2)} .relay`), R = rest(relay), sun = rest($(".sunhost .sun"));
    const G = ghost(relay);
    play(G.g, { scale: [`${G.k}`, `${G.k * 0.2}`], opacity: [1, 0.8, 0] }, { dur: 0.6 });
    play($(".sunhost"), { opacity: [0, 1] }, { dur: 0.6 });
    $$(`${L(2)} .logos span`).forEach((s, i) => sink(s, sun, { dur: 0.8, delay: 0.1 + i * 0.03 }));
    $$(`${L(3)} .node .ico`).forEach((ic, i) => pop(ic, R, { dur: 0.8, delay: 0.3 + i * 0.08, lift: 0.15 }));
    $$(`${L(3)} .wire`).forEach((w, i) => draw(w, { dur: 0.5, delay: 0.85 + i * 0.05 }));
  } },
  // every screen -> share: your desktop and phone become Aveline's, then the others arrive
  { T: 1.4, run({ $$, fly, draw, play }) {
    const dots = $$(`${L(3)} .node .dot`), devs = $$(`${L(4)} .dev i`);
    fly(dots[0], devs[0], { dur: 0.9, lift: 0.2 });
    fly(dots[2], devs[1], { dur: 0.9, delay: 0.06, lift: 0.2 });
    $$(`${L(4)} .share line`).forEach((l, i) => draw(l, { dur: 0.45, delay: i < 2 ? 0.75 : 0.85 + i * 0.05 }));
    [...$$(`${L(4)} .who`).slice(1), ...$$(`${L(4)} .dev`).slice(2)].forEach((el, i) => play(el, { opacity: [0, 1] }, { dur: 0.45, delay: 0.55 + i * 0.06 }));
  } },
  // share -> borrowing: the sun splits into two servers, the circle of people falls into it, the wire joins them
  { T: 1.4, run({ $, $$, fly, ghost, draw, play, set }) {
    const sun = $(".sunhost .sun"), [a, b] = $$(`${L(5)} .sdot`);
    // two whole suns, one on top of the other. The second only comes in as they part: both at full strength
    // on the first frame would glow twice as bright as the sun that was resting there
    [a, b].forEach((dot, i) => {
      const A = fly(sun, dot, { dur: 1.1, lift: 0.25 }).A;
      play(A.c, { clipPath: ["inset(0 0 50% 0)", "inset(0 0 0% 0)"] }, { dur: 0.4 }); // it rests half under the horizon, and comes off it whole
      if (i) play(A.c, { opacity: [0, 1] }, { dur: 0.4 });
    });
    play(ghost($(".srvlbl")).g, { opacity: [1, 0] }, { dur: 0.3 }); // the label rides over the flying sun, as it sat over the resting one
    play($(".sunhost"), { opacity: [1, 0] }, { dur: 0.6 }); // the horizon and its label; the sun itself is in flight
    const stage = $(`${L(4)} .stage`);
    set(stage, "transformOrigin", "50% 100%");
    play(stage, { scale: ["1", "0.4"], opacity: [1, 0] }, { dur: 0.45 });
    // the servers arrive once the circle of people has gone
    $$(`${L(5)} :is(.srv, .bline)`).forEach((el, i) => play(el, { translate: ["0 10px", "0 0"], opacity: [0, 1] }, { dur: 0.6, delay: 0.45 + i * 0.1 }));
    draw($(`${L(5)} .bline .wire`), { dur: 0.5, delay: 0.9 });
  } },
  // borrowing -> chapters: the borrowed task opens into its chat, and the chat folds its finished work into chapters
  { T: 1.75, run({ $, grow, play }) {
    const B = grow($(`${L(5)} .borrow > .srv:last-child .r2`), $(`${L(6)} .chapters`), { dur: 1, tall: true });
    const cls = [...B.c.querySelector(".bar").classList].filter((c) => c === "bar" || c.startsWith("svelte-")).join(" ");
    for (const cd of B.c.querySelectorAll(".cdiv:not(.now)")) {
      // the finished messages are summarised: each line shortens and they draw together into the footprint of the chapter's
      // title, turn into it, and the rule runs out from both sides. The box ends exactly the rule's size.
      const range = document.createRange();
      range.selectNodeContents(cd);
      const tw = range.getBoundingClientRect().width / B.k, mid = `calc(50% - ${tw / 2}px)`, squeeze = { dur: 0.45, delay: 1.05 };
      const box = document.createElement("div"), lines = document.createElement("div");
      box.style.cssText = "position:relative;display:flex;flex-direction:column";
      lines.style.cssText = "display:flex;flex-direction:column";
      cd.before(box);
      for (let i = 0; i < 4; i++) {
        const bar = document.createElement("div"), u = i % 2 === 0;
        bar.className = cls + (u ? " u" : "");
        Object.assign(bar.style, { flex: "none", alignSelf: "flex-start" });
        lines.append(bar);
        play(bar, { opacity: [0, 0, 1] }, { dur: 1 });
        play(bar, { width: [u ? "46%" : "72%", `${tw}px`], marginLeft: [u ? "54%" : "0%", mid], height: ["9px", "4px"], marginTop: [i ? "8px" : "0px", i ? "1.33px" : "0px"] }, squeeze);
      }
      box.append(lines, cd);
      Object.assign(cd.style, { position: "absolute", left: "0", right: "0", top: "6px", margin: "0" });
      play(box, { paddingTop: ["0px", "6px"], paddingBottom: ["0px", "6px"] }, squeeze);
      play(lines, { opacity: [1, 0] }, { dur: 0.2, delay: 1.4 });
      play(cd, { opacity: [0, 1] }, { dur: 0.2, delay: 1.4 });
      play(cd, { clipPath: [`inset(0 calc(50% - ${tw / 2 + 4}px))`, "inset(0 0%)"] }, { dur: 0.3, delay: 1.45 });
    }
  } },
  // chapters -> and the rest: the chat cracks into tiles, each draws its icon
  // (the icons start drawing while the tiles are still settling: played backwards, a long tail of only icons reads as nothing happening)
  { T: 1.2, run({ $, $$, rest, ghost, play, draw }) {
    const chap = $(`${L(6)} .chapters`), C = rest(chap), tiles = $$(`${L(7)} .gt`);
    const rs = tiles.map(rest), cols = new Set(rs.map((r) => Math.round(r.x))).size, rows = Math.ceil(tiles.length / cols);
    const cw = C.w / cols, chh = C.h / rows, far = Math.hypot(C.w, C.h) / 2;
    tiles.forEach((t, i) => {
      const G = ghost(t), cx = C.x + (i % cols + 0.5) * cw, cy = C.y + (Math.floor(i / cols) + 0.5) * chh;
      const d = (0.2 * Math.hypot(cx - C.cx, cy - C.cy)) / far;
      play(G.g, { translate: [px(cx - G.w / 2, cy - G.h / 2), G.base], scale: [`${cw / G.w} ${chh / G.h}`, `${G.k}`] }, { dur: 0.8, delay: d });
      const cs = getComputedStyle(t); // the tile's own surface comes in as the chat's goes, so nothing doubles up or pops at the start
      play(G.c, [{ backgroundColor: "transparent", borderColor: "transparent" }, { backgroundColor: cs.backgroundColor, borderColor: cs.borderTopColor, offset: 0.3 }, { backgroundColor: cs.backgroundColor, borderColor: cs.borderTopColor }], { dur: 0.8, delay: d });
      for (const ch of G.c.children) play(ch, { opacity: [0, 0, 1] }, { dur: 0.8, delay: d });
      G.c.querySelectorAll("svg *").forEach((s) => draw(s, { dur: 0.55, delay: d + 0.45 }));
    });
    play(ghost(chap).g, { opacity: [1, 0] }, { dur: 0.4 });
  } },
  // and the rest -> download: the tiles go out like stars at dawn
  // (kept short: played backwards, the tiles must not wait long behind their sparks)
  { T: 1, run({ $$, ghost, spark, play }) {
    $$(`${L(7)} .gt`).forEach((t, i) => {
      const G = ghost(t), d = i * 0.02; // gone before the download copy rises into their place
      play(G.g, { scale: [`${G.k}`, `${G.k * 0.03}`], opacity: [1, 1, 0] }, { dur: 0.4, delay: d });
      play(spark(G.r.cx, G.r.cy), { opacity: [0, 0.9, 0], scale: ["0.4", "1.4", "0.8"] }, { dur: 0.6, delay: d + 0.15 });
    });
  } },
];

const GATE = 700; // ms a section must have been showing before it can morph into its neighbour
const RUSH = 180; // ms an overtaken morph gets to land in, if it is within twice that of landing anyway

export function morpher(scene, overlay) {
  let live = null, next = null, last = -1e9;
  const layer = (i) => scene.querySelector(i ? L(i) : ".fig");

  function end(m) {
    clearTimeout(m.timer);
    m.anims.forEach((a) => a.cancel());
    m.undo.forEach((f) => f());
    m.box.remove();
    if (live === m) live = null;
  }
  // every animation of a morph sits on one timeline of length T: aiming plays it towards either end from wherever it is
  function aim(m, to, rate = 1) {
    const t = m.clock.currentTime;
    m.to = to;
    for (const a of m.anims) { a.playbackRate = to === m.hi ? rate : -rate; a.currentTime = t; }
  }
  function done(m) {
    if (m.clock.playState !== "finished") return;
    const n = live === m && next;
    end(m);
    next = null;
    if (n && n.from === m.to) start(n.from, n.to);
  }
  // the page went somewhere else: what is in flight fades where it is, and the plain crossfade takes over
  function fade(m) {
    live = null;
    const tops = [...m.tops].map((el) => [el, getComputedStyle(el).opacity]);
    for (const a of m.anims) if (m.tops.has(a.effect.target)) a.cancel();
    for (const [el, o] of tops) m.anims.push(el.animate([{ opacity: o, offset: 0 }], 200)); // from where it is to what the page now says
    m.anims.push(m.box.animate({ opacity: [1, 0] }, { duration: 200, fill: "forwards" }));
    m.timer = setTimeout(() => end(m), 200);
  }

  function start(from, to) {
    const lo = Math.min(from, to), P = PAIRS[lo], T = P.T * 1000;
    const box = overlay.appendChild(document.createElement("div"));
    const m = (live = { lo, hi: lo + 1, T, box, anims: [], undo: [], tops: new Set(), clock: box.animate(null, T) });
    const { anims, undo } = m, hidden = new Set();
    const sc = scene.getBoundingClientRect();
    const $ = (s) => scene.querySelector(s), $$ = (s) => [...scene.querySelectorAll(s)];

    // where an element rests, in scene pixels: the incoming layer is still rising, so take its rise off
    function rest(el) {
      const r = el.getBoundingClientRect(), ly = el.closest(".layer"), t = ly && getComputedStyle(ly).transform;
      const x = r.left - sc.left, y = r.top - sc.top - (t && t !== "none" ? new DOMMatrix(t).m42 : 0);
      return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
    }
    function hide(el) {
      if (hidden.has(el)) return;
      hidden.add(el);
      el.style.visibility = "hidden";
      undo.push(() => (el.style.visibility = ""));
    }
    function set(el, prop, v) {
      const old = el.style[prop];
      el.style[prop] = v;
      undo.push(() => (el.style[prop] = old));
    }
    function play(el, kf, { dur = 1, delay = 0 } = {}) {
      if (el.parentElement === scene) m.tops.add(el);
      anims.push(el.animate(kf, { duration: dur * 1000, delay: delay * 1000, easing: EASE, fill: "both" }));
    }
    function ghost(el) {
      const r = rest(el), w = el.offsetWidth || r.w, h = el.offsetHeight || r.h, k = r.w / w, base = px(r.cx - w / 2, r.cy - h / 2);
      const g = document.createElement("div");
      Object.assign(g.style, { position: "absolute", left: "0", top: "0", width: `${w}px`, height: `${h}px`, translate: base, scale: `${k}` });
      // the ancestors come along as boxless shells, so styles scoped under them still apply
      let host = g;
      const chain = [];
      for (let a = el.parentElement; a && a !== scene && !a.classList.contains("layer"); a = a.parentElement) chain.unshift(a);
      for (const a of chain) { const s = a.cloneNode(false); s.style.display = "contents"; host.append(s); host = s; }
      const c = el.cloneNode(true);
      Object.assign(c.style, { position: "absolute", inset: "0", margin: "0", transform: "none", translate: "none", scale: "none", width: "100%", height: "100%", maxWidth: "none", visibility: "visible", opacity: "1", transition: "none" });
      host.append(c);
      box.append(g);
      hide(el);
      return { g, c, r, w, h, k, base };
    }
    // a and b swap places along an arc, a's look fading into b's
    function fly(a, b, { dur = 1, delay = 0, lift = 0.2, fade = 1 } = {}) {
      const A = ghost(a), B = ghost(b), p = A.r, q = B.r, d = Math.hypot(q.cx - p.cx, q.cy - p.cy);
      const path = `path("M${p.cx} ${p.cy} Q${(p.cx + q.cx) / 2} ${(p.cy + q.cy) / 2 - d * lift} ${q.cx} ${q.cy}")`;
      // the scale goes on the copy, not the carrier: on the carrier it would scale the path too
      for (const G of [A, B]) Object.assign(G.g.style, { translate: "none", scale: "none", offsetPath: path, offsetRotate: "0deg", offsetAnchor: "50% 50%" });
      play(A.g, { offsetDistance: ["0%", "100%"], opacity: [1, fade, 0] }, { dur, delay });
      play(A.c, { scale: [`${A.k}`, `${(A.k * q.w) / p.w}`] }, { dur, delay });
      play(B.g, { offsetDistance: ["0%", "100%"], opacity: [0, 0, 1] }, { dur, delay });
      play(B.c, { scale: [`${(B.k * p.w) / q.w}`, `${B.k}`] }, { dur, delay });
      return { A, B };
    }
    // the small piece becomes the top of the big one, which opens out of it
    function grow(small, big, { dur = 1, delay = 0, tall = false } = {}) {
      const B = ghost(big), S = ghost(small), cs = getComputedStyle(big);
      // the big piece's surface is a layer of its own behind its content: it fades in over the small piece and
      // carries the edge and the shadow with it as it opens, so neither arrives at the end
      const f = document.createElement("div");
      Object.assign(f.style, { position: "absolute", background: cs.backgroundColor, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, boxShadow: cs.boxShadow, backdropFilter: cs.backdropFilter, webkitBackdropFilter: cs.backdropFilter });
      B.g.prepend(f);
      Object.assign(B.c.style, { background: "none", borderColor: "transparent", boxShadow: "none", backdropFilter: "none", webkitBackdropFilter: "none" });
      if (tall) { // its copy may be taller than it rests: the carrier takes the copy's height and hangs from its top
        Object.assign(B.g.style, { height: "auto", transformOrigin: "50% 0" });
        Object.assign(B.c.style, { position: "relative", inset: "auto", height: "auto" });
      }
      const sw = S.r.w / B.k, sh = S.r.h / B.k, lx = Math.max(0, (B.w - sw) / 2);
      const R = parseFloat(cs.borderTopLeftRadius) || 0, sr = ((parseFloat(getComputedStyle(small).borderTopLeftRadius) || 0) * S.k) / B.k;
      const dx = S.r.cx - B.r.cx, dy = S.r.cy - (B.r.y + S.r.h / 2), bx = B.r.cx - B.w / 2, by = tall ? B.r.y : B.r.cy - B.h / 2;
      play(B.g, { translate: [px(bx + dx, by + dy), px(bx, by)] }, { dur, delay });
      play(B.c, { clipPath: [`inset(0px ${lx}px calc(100% - ${sh}px) ${lx}px round ${sr}px)`, `inset(0px 0px 0% 0px round ${R}px)`] }, { dur, delay });
      play(f, { top: ["0px", "0px"], left: [`${lx}px`, "0px"], right: [`${lx}px`, "0px"], bottom: [`calc(100% - ${sh}px)`, "0%"], borderRadius: [`${sr}px`, `${R}px`] }, { dur, delay });
      play(f, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1 }], { dur, delay });
      for (const ch of B.c.children) play(ch, [{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], { dur, delay });
      play(S.g, { translate: [S.base, px(S.r.cx - S.w / 2 - dx, S.r.cy - S.h / 2 - dy)] }, { dur, delay });
      play(S.c, [{ opacity: 1 }, { opacity: 0, offset: 0.4 }, { opacity: 0 }], { dur, delay });
      return B;
    }
    function sink(el, t, o) {
      const G = ghost(el);
      play(G.g, { translate: [G.base, px(t.cx - G.w / 2, t.cy - G.h / 2)], scale: [`${G.k}`, `${G.k * 0.3}`], opacity: [1, 1, 0] }, o);
    }
    // el comes out of point p, small, and arcs to where it rests
    function pop(el, p, { dur = 1, delay = 0, lift = 0.2 } = {}) {
      const G = ghost(el), q = G.r, d = Math.hypot(q.cx - p.cx, q.cy - p.cy);
      Object.assign(G.g.style, { translate: "none", scale: "none", offsetPath: `path("M${p.cx} ${p.cy} Q${(p.cx + q.cx) / 2} ${(p.cy + q.cy) / 2 - d * lift} ${q.cx} ${q.cy}")`, offsetRotate: "0deg", offsetAnchor: "50% 50%" });
      play(G.g, { offsetDistance: ["0%", "100%"], opacity: [0, 1, 1] }, { dur, delay });
      play(G.c, { scale: [`${G.k * 0.4}`, `${G.k}`] }, { dur, delay });
    }
    function draw(el, o) {
      el.setAttribute("pathLength", "1");
      undo.push(() => el.removeAttribute("pathLength"));
      play(el, { strokeDasharray: ["1 1", "1 1"], strokeDashoffset: ["1", "0"] }, o);
    }
    function spark(x, y) {
      const el = document.createElement("div");
      Object.assign(el.style, { position: "absolute", left: "0", top: "0", width: "4px", height: "4px", borderRadius: "50%", translate: px(x - 2, y - 2), background: "#fff4ea", boxShadow: "0 0 8px 2px rgba(255,244,234,.5)" });
      box.append(el);
      return el;
    }

    P.run({ $, $$, rest, hide, set, play, ghost, fly, grow, sink, pop, draw, spark });
    // the two sections cross over on the same timeline, so they turn back with it
    const a = layer(lo), b = layer(lo + 1);
    if (a) play(a, { opacity: [1, 0], transform: ["none", "translateY(-10px)"] }, { dur: 0.6 });
    if (b) play(b, { opacity: [0, 1], transform: ["translateY(10px)", "none"] }, { dur: 0.6 });
    anims.push(m.clock);
    m.clock.onfinish = () => done(m);
    if (to === lo) m.clock.currentTime = T;
    aim(m, to);
  }

  // plain: the page is jumping somewhere, so nothing morphs and whatever is in flight fades
  return function run(from, to, plain = false) {
    const now = performance.now(), settled = now - last > GATE, near = Math.abs(to - from) === 1;
    last = now;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (plain) { next = null; if (live) fade(live); return; }
    if (live) {
      if (to === live.lo || to === live.hi) { next = null; aim(live, to); } // turned back mid-morph: the same morph plays the other way
      else {
        const t = live.clock.currentTime, left = live.to === live.hi ? live.T - t : t;
        if (near && from === live.to && !next && left <= RUSH * 2) { // moved on with the morph all but landed: let it land, then hand over
          next = { from, to };
          aim(live, live.to, Math.max(1, left / RUSH));
        } else { next = null; fade(live); } // moved on mid-morph: racing it to the end reads as a glitch, so it fades like a jump does
      }
      return;
    }
    if (settled && near && PAIRS[Math.min(from, to)]) start(from, to); // scrolling fast: no morph, the sections just cross-fade
  };
}
