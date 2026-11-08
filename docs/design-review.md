# Yoakeland Landing Page — Design & UI Review

> **Scope:** A static, code-level review of the `yoakeland-landing` single-page site.
> **Method:** Filesystem inspection, ranged source reads, and `grep` sweeps. No dev
> server was started and the page was never rendered, so every visual judgement below
> is inferred from markup and CSS — not from a screenshot or a Lighthouse run.
> **Budget:** No source file was modified to produce this document.

---

## 1. Executive summary

The page has a clear, confident point of view. It is a dark, near-black canvas with a
WebGL starfield, a rounded display face used as a "technical" label voice, and copy that
is dry and deliberate ("No ritual.", "One binary. Windowed or headless."). The visual
language is coherent: one accent-free palette, one geometry, one motion idea.

The weaknesses are not taste problems — they are **engineering and accessibility gaps
that the design intent has not yet caught up with**:

| Area | Verdict | Sharpest issue |
| --- | --- | --- |
| Information architecture | **Strong** | Logical narrative: hero → how → byo → features → download → footer |
| Typography | **Good, with a caveat** | Questrial is fetched **twice**; the local face is misnamed `mono` |
| Color & surface | **Strong** | ~17:1 body contrast, no accent drift |
| Responsive layout | **Needs work** | Five ad-hoc breakpoints (600, 600, 700, 780, 820) with no scale |
| Iconography | **Clever** | A dual-import mask system, at the cost of 25 import statements |
| Motion | **Risk** | Zero `prefers-reduced-motion` handling anywhere in `src/` |
| Accessibility | **Mixed** | Solid contrast and `alt` discipline; state conveyed by color/dot only |
| Performance | **Weak** | ~3.7 MB of uncompressed PNGs, no modern formats, no dimensions |
| Metadata | **Weak** | No description, no Open Graph, no Twitter card |

**One-line take:** the design is done and the *polish layer* is not — motion safety,
social metadata, and an asset diet are the three things standing between this and a
page that is as good as it looks.

---

## 2. What the page actually is

A marketing landing page for a single-binary agent tool, built as:

- **Framework:** SvelteKit 2 + **Svelte 5 runes** (`$state`, `$props`)
- **Adapter:** `@sveltejs/adapter-static` with `fallback: "index.html"`
- **Bundler:** Vite 8
- **Third-party runtime dep:** `@lobehub/icons-static-svg` (the model-provider logos)

The entire rendered surface is **four files**:

```
src/app.html              19 lines    document shell
src/routes/+page.svelte  908 lines    all markup + logic
src/routes/+page.css    1176 lines    all styling
src/lib/StarField.svelte 261 lines    WebGL canvas component
```

That is a healthy ratio for a landing page: roughly **1.3 lines of CSS per line of
markup**, which suggests styling is written per-section rather than through a shared
token layer. That is the root cause of most of the layout findings below.

---

## 3. Section map and narrative flow

```
hero  ──►  how  ──►  byo  ──►  features  ──►  download  ──►  footer
 │         │        │          │              │              │
 h1 +      "No      bring      capability     CTA +          starfield
 showcase  ritual." your own   grid           platform       + links
 + CTA     + demo   server                    switch         + wordmark
```

Anchored sections, in document order:

| Line | Section | `id` | Job |
| --- | --- | --- | --- |
| ~400 | Hero | — | `<h1>`, two CTAs, app screenshot |
| 466 | `section.how` | `how` | "No ritual." — the onboarding promise |
| 561 | `section.byo` | `byo` | Bring-your-own-server positioning |
| 680 | `section.features` | — | Capability grid |
| 856 | `section.download` | `download` | Primary conversion |
| 891 | `footer` | — | Starfield, links, giant wordmark |

**What works.** The narrative is a straight line: claim → reassurance → differentiation →
evidence → action. Section headings are short sentences, not noun phrases, which keeps
the voice consistent from `<h1>` to footer.

**What is missing.**

- There is **no `<header>` and no `<nav>`** — verified with a `grep` for both tags across
  `+page.svelte` and `app.html`. On a page with five sections and three anchor ids, a
  sticky nav is not mandatory, but there is also **nothing that links to `#how`, `#byo`,
  or `#download`**. The ids are only usable by hand-typed URLs and in-page anchor
  references that do not exist. Either wire up a nav or drop the ids.
- `features` is the **only section without an id** — an inconsistency that suggests it
  was added last.

---

## 4. Typography

Two families, two jobs:

```css
/* +page.css:1 */
@import url("https://fonts.googleapis.com/css2?family=Questrial&display=swap");

/* +page.css:3 */
@font-face {
    font-family: "SBLiquid";
    src: url("/fonts/SBLiquid-Rounded.ttf");
}
```

| Face | Role | Where declared |
| --- | --- | --- |
| Questrial | Display + body sans | `app.html` `<link>` **and** `+page.css` `@import` |
| SBLiquid Rounded | `.mono` label voice | Local, `static/fonts/` (56 KB TTF) |

### Findings

1. **Questrial is requested twice.** `app.html` (lines 10–13) loads it via
   `<link rel="preconnect">` + stylesheet, and `+page.css` line 1 `@import`s the identical
   URL. The `@import` is the worse of the two — it blocks CSS parsing and is discovered
   late. **Delete the `@import`** and keep the `<link>`, which already has the preconnects
   set up correctly.

2. **`.mono` is a misnomer.** The class maps to `"SBLiquid", ui-monospace, monospace`,
   but SBLiquid Rounded is a *rounded display* face, not monospace. The code then fakes
   the monospace feel with `letter-spacing: 0.02em`. This works visually, but the class
   name will mislead the next person. Consider renaming to `.label` or `.tech`, or
   documenting the intent in a comment.

3. **Only two weights exist, because neither face is variable.** Questrial ships a single
   weight. This means hierarchy is carried entirely by **size and color**, never by weight.
   The `<h1>` versus body distinction therefore leans hard on scale. Worth an explicit
   type scale in a comment or a token block so the distinction stays intentional.

4. **No `display=swap` risk, but no `size-adjust` either.** The Google URL includes
   `&display=swap` (good — no invisible text), but there is no fallback metric matching,
   so the swap will reflow text once. Minor, but on a hero `<h1>` it is visible.

---

## 5. Color and surface

```css
html, body {
    background-color: #0b0c0a;   /* near-black, faint green-warm cast */
    color: #ededec;              /* near-white */
}
```

**This is the strongest part of the system.**

- Contrast between `#ededec` and `#0b0c0a` is roughly **17:1** — far beyond the WCAG AAA
  threshold of 7:1. The page is genuinely readable, not "dark mode as an aesthetic".
- The background is not pure black and the foreground is not pure white, which avoids the
  halation/smearing that pure `#000`/`#fff` produces on OLED. This is a considered choice.
- There is **no accent color**. Emphasis is carried by the starfield, the screenshot, and
  the provider logo colors that appear on hover. That restraint is what makes the color
  icons land when they do appear — see §7.

**Caveat.** Because there is no accent token, the *primary* button is differentiated only
by `class:primary` styling. If that styling is border/fill-based rather than hue-based,
verify that the two hero CTAs remain distinguishable **without color** — see §9.

---

## 6. Layout and responsive system

### The breakpoint problem

```
+page.css:360   @media (max-width: 780px)
+page.css:379   @media (max-width: 600px)
+page.css:725   @media (max-width: 820px)
+page.css:956   @media (max-width: 700px)
+page.css:1137  @media (max-width: 600px)
```

Five media queries, five different widths, and `600px` appears **twice**. This is the
classic symptom of breakpoints added *per section* at the moment a section broke, rather
than a global scale decided up front. Nothing here is broken today — but:

- Two separate `600px` blocks means one edit can silently override another by source order.
- `700px` and `780px` are close enough that a device between them may get inconsistent
  treatment across sections.
- A change to "the mobile layout" requires hunting five places.

**Recommendation:** collapse to a documented, named scale — e.g. `900 / 700 / 520` — and
declare them once at the top of the stylesheet as comments, even if the queries stay
inline. Moving to a single token block is the higher-effort, higher-payoff version.

### Width and containment

The page uses an `<svg class="divider">` with `preserveAspectRatio="none"` and a
`<line>` to draw a rule. This is a reasonable trick for a hairline at 100% width, though a
`border-top` on a wrapper would be simpler and cheaper. Worth noting as a deliberate
choice or an accidental one — a 2px-tall SVG that stretches horizontally is easy to
misread later.

### Images without intrinsic size

```svelte
<img class="bg" src="/background.png" alt="" />
<img class="app-shot" src="/app-screenshot.png" alt="yoakeland app" />
```

Neither `<img>` declares `width`/`height`, and the hero uses `<picture>` with a
`max-width: 600px` source. Without intrinsic dimensions, the browser cannot reserve
space, so the hero **will** shift as images arrive — a direct CLS cost on the most
important viewport of the page.

---

## 7. Iconography — the clever bit

The page pulls **25 SVG imports** from `@lobehub/icons-static-svg`: 15 plain variants and
10 `-color` variants. It then solves the "how do I tint an `<img>`" problem with a CSS
mask:

```css
.icon-mask {
    background-color: currentColor;
    -webkit-mask-image: var(--icon);
    mask-image: var(--icon);
    /* …size/position/repeat */
}
```

And it cross-fades plain → color on hover:

```css
.provider-icon-swap { position: relative; }
.provider-icon-swap .provider-icon { position: absolute; inset: 0; transition: opacity .15s ease; }
.provider-icon-swap .color-icon   { opacity: 0; }
```

**Why this is good:**

- `currentColor` inside a `mask` means the monochrome icons inherit text color for free —
  no per-icon fill rules, and they stay correct if the palette changes.
- The stacked absolute-positioned swap is the correct technique: no layout shift, one
  transition, both images preloaded by virtue of being in the DOM.
- The hover payoff (gray outline logo blooms into full brand color) is a genuinely nice
  detail that reinforces the "many providers" story.

**Costs and risks:**

- **25 static imports** is a lot of ceremony. If the list ever grows, this should become a
  data array rendered in an `{#each}`, otherwise the import block is the first thing to
  rot. It is already the longest part of the `<script>`.
- **Hover-only affordance.** The color reveal is triggered by `:hover`. Touch devices get
  no reveal at all, and keyboard users only get it if the rule is written as
  `:hover, :focus-visible`. Verify the selector covers focus.
- The `.icon-mask` / `.provider-icon` / `.provider-icon-swap` trio is three overlapping
  systems for one job; a comment explaining when to use which would prevent drift.

---

## 8. Motion and the starfield

`StarField.svelte` is the signature element. It:

- obtains a **WebGL** context (with `experimental-webgl` fallback) and bails silently if
  unavailable,
- builds a **4×4 texture atlas** of 128px cells from the glyph set
  `["✮", "✦", "✧", "★", "✶", "⊹", "✦", "✧"]` rendered to an offscreen 2D canvas,
- accepts `mode` (`"top"` / `"bottom"`) and `falloffPower` props via `$props()`.

It is used twice — once in the hero (`mode="top"`) and once in the footer with a
*softer* falloff:

```svelte
<StarField mode="bottom" falloffPower={0.35} />
```

Reusing one component with a falloff parameter, rather than duplicating the canvas, is
exactly right. The graceful `if (!gl) return;` bail-out is also correct — no crash on
software-rendering or blocked-WebGL environments.

### The one serious gap

> **There is no `prefers-reduced-motion` handling anywhere in `src/`.**
>
> Verified: `grep -rn "prefers-reduced-motion" src` returns **zero matches**.
> Verified: `grep -nE "@keyframes|animation:" src/routes/+page.css` also returns
> **zero matches** — so CSS is not the culprit; the motion lives in the WebGL canvas.

For a user who has set "reduce motion" at the OS level, a continuously animating
background canvas is precisely the kind of thing that setting exists to stop. Recommended
fixes, in order of effort:

1. **Cheapest:** in `StarField`'s `onMount`, check
   `window.matchMedia("(prefers-reduced-motion: reduce)").matches` and render a single
   static frame instead of starting the animation loop.
2. **Better:** do the same but also keep the composition — draw the stars once at their
   seeded positions so the visual identity survives, motionless.

Also worth confirming in the canvas code: whether the RAF loop is cancelled on component
destroy. `StarField` is mounted in the footer of a single-page app, so the practical risk
is low, but an uncancelled `requestAnimationFrame` is a classic leak in any component
that gets reused or re-mounted.

---

## 9. Accessibility

### What is already right

- `alt=""` on the two decorative backgrounds, and descriptive `alt="yoakeland app"` on the
  meaningful screenshot. Correct discipline, applied consistently.
- `aria-hidden="true"` on the decorative `detect-dot` and on the giant footer wordmark —
  the wordmark is purely typographic decoration, so hiding it from the a11y tree is right.
- The disabled mobile CTA carries `aria-disabled`, a `title` explaining *why*, and a
  `preventDefault` handler. It is thoughtfully built rather than just visually grayed.
- Contrast is excellent (§5).

### What needs attention

| # | Issue | Where | Why it matters |
| --- | --- | --- | --- |
| A1 | Platform chips expose state via `class:active` only | `platform-switch` buttons, ~L872 | No `aria-pressed`, so a screen reader cannot tell which platform is selected |
| A2 | "Detected" is signalled by a colored dot only | `detect-dot`, ~L879 | The auto-detected OS is real information conveyed purely visually |
| A3 | Anchor without `href` is not focusable | mobile CTA, L449 | `aria-disabled` on a link with `href={undefined}` may never be reached by keyboard |
| A4 | Hover-only color reveal | `.provider-icon-swap` | Touch users never see it; keyboard only if `:focus-visible` is included |
| A5 | No reduced-motion path | `StarField.svelte` | See §8 — the most consequential item on this list |
| A6 | Missing `lang`-level description | `app.html` | Page has a `<title>` but no meta description (§12) |

**On A2 specifically:** the `.detect-dot` is a small colored dot next to the auto-detected
platform. The code marks it `aria-hidden`, which is correct *if* the information is
available another way — but nothing announces "this is your detected platform". Consider
visually-hidden text (`<span class="sr-only">detected</span>`) so the dot has a semantic
twin.

**On A3 specifically:** an `<a>` with no `href` is not in the tab order in most browsers.
The button is therefore unreachable by keyboard, so its `aria-disabled` state can't be
announced. If it should be focusable-but-inert, use `role="link"` + `tabindex="0"`, or
better, render a `<button disabled>` for the mobile case.

---

## 10. Performance and asset budget

`static/` totals roughly **3.7 MB**, of which the images are almost everything:

| Asset | Size | Used? | Notes |
| --- | ---: | --- | --- |
| `background-2.png` | **1.67 MB** | L549 (`how-bg-right`) | Largest file on the site |
| `background.png` | **1.35 MB** | hero, `<img class="bg">` | Second largest, above the fold |
| `app-screenshot.png` | 306 KB | hero showcase | The one image that carries meaning |
| `app-screenshot-mobile.png` | 214 KB | `<source media=…600px>` | Good that a mobile variant exists |
| `it-works-screenshot.png` | 107 KB | L552 | In `how`/`byo` |
| `logo.png` | 172 KB | favicon + likely header | Favicon pointing at a 172 KB PNG |
| `SBLiquid-Rounded.ttf` | 56 KB | `.mono` | Single face, no subsetting visible |

### Findings

1. **~3 MB of PNG for decorative backgrounds.** The two backgrounds are the visual
   signature, so they earn their place — but PNG is the wrong format for what are almost
   certainly smooth, photographic-heavy gradients. Converting to **WebP** (or AVIF with a
   WebP fallback via `<picture>`) typically cuts 70–90% here. This is the single largest
   performance win available, and the hero already uses `<picture>`, so the pattern is in
   place.
2. **The favicon is a 172 KB PNG.** `app.html` points `rel="icon"` at `logo.png`. Favicons
   should be tiny. Adding a resized `favicon.ico`/`32×32 PNG` and an `apple-touch-icon`
   is a one-line fix with real payoff.
3. **No `width`/`height` on hero images** → CLS, as noted in §6.
4. **No `<link rel="preload">` for the hero background**, which is by definition the LCP
   candidate if it is the largest visible element.
5. **Font is loaded from Google's CDN** while a local font already exists — acceptable,
   but it means a third-party connection on first paint. The `preconnect` hints are
   present, which mitigates it.

> **Suggested target:** get `static/` under **1 MB** without changing a single visual.
> The screenshot and backgrounds are the whole budget; the icons and font are noise.

---

## 11. Copy and voice

The writing is the page's most underrated asset. It is short, declarative, and free of
marketing filler:

| Location | Copy |
| --- | --- |
| `<h1>` | "Agents that run on *your machine*, never *someone else's cloud*." |
| `how` | "**No ritual.** Point it at a folder and let it breathe." |
| `how` | "No onboarding questionnaires, no telemetry handshakes, no browser tabs asking for an email…" |
| `download` | "One binary. Windowed or headless." |
| `footer` | "Run it on your machine." |

Two structural observations:

- **The `<h1>` uses inline SVG glyphs inside `.locus` spans** (a monitor icon, a cloud
  icon) to visually contrast the two halves of the sentence. This is the strongest idea in
  the header — but the icons are inline SVGs with `stroke="currentColor"` and no
  `aria-hidden`, and they sit *inside* the `<h1>`. Confirm they don't inject stray
  content into the accessible name of the heading.
- **"No ritual."** is set as an `<h2>` with the explanation following. Leading with the
  negation is a deliberate, effective rhythm — and the section body even includes a real
  command, `./yoakeland -project .`, styled with `.mono`. Putting a literal CLI invocation
  in the marketing copy is a credibility signal aimed squarely at the audience. Keep it.

Minor: the hero CTA caption ("You'll need to bring your own server for the web client.")
is honest and in-voice, but it is a **qualifier placed directly under the primary CTA** —
the one place where a caveat can cost conversions. Consider whether it belongs below both
buttons or as a tooltip, so the eye reaches "Open on web" before the disclaimer.

---

## 12. Metadata and discoverability

`app.html` contains exactly three meaningful tags:

```html
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Yoakeland</title>
```

Missing:

- `<meta name="description">` — appears in search results and is worth writing, given how
  good the copy already is. **No extra writing effort is needed** — the `<h1>` or the
  "No ritual." paragraph would serve.
- **Open Graph** (`og:title`, `og:description`, `og:image`, `og:type`, `og:url`) — without
  these, sharing the link anywhere (Slack, Discord, X, iMessage) produces a bare URL. For
  a developer tool that spreads by word of mouth, this is a real distribution gap.
- **Twitter/X card** (`twitter:card`, `twitter:image`).
- **Canonical URL.**
- **`theme-color`** — a natural fit here, since the whole page is one color
  (`#0b0c0a` would tint mobile browser chrome to match the site).
- **JSON-LD `SoftwareApplication`** structured data — optional, but this is a downloadable
  app with platforms; it is exactly the shape that schema describes.

Since `adapter-static` prerenders everything, all of this is a pure `app.html` edit with
zero runtime cost.

> **Note on the adapter:** `adapter-static` is configured with `fallback: "index.html"`,
> which produces an SPA-style catch-all. For a genuinely single-page site, that fallback
> is arguably unnecessary — it means unknown routes serve the landing page rather than a
> 404. Harmless, but worth confirming it is intentional.

---

## 13. Prioritized recommendations

### P0 — do before shipping (correctness / inclusivity)

| # | Action | Files | Effort |
| --- | --- | --- | --- |
| 1 | Add `prefers-reduced-motion` handling; render one static frame | `StarField.svelte` | S |
| 2 | Add `width`/`height` to hero images to kill CLS | `+page.svelte` | S |
| 3 | Give platform chips `aria-pressed` | `+page.svelte` | S |
| 4 | Add a semantic twin for the "detected" dot | `+page.svelte`, `+page.css` | S |

### P1 — high payoff, low risk

| # | Action | Files | Effort |
| --- | --- | --- | --- |
| 5 | Drop the duplicate `@import` of Questrial; keep the `<link>` | `+page.css:1` | XS |
| 6 | Add `rel="icon"` at a real favicon size (stop using the 172 KB PNG) | `app.html`, `static/` | S |
| 7 | Convert the two backgrounds to WebP via the existing `<picture>` pattern | `static/`, `+page.svelte` | M |
| 8 | Add `meta description` + Open Graph + Twitter card + `theme-color` | `app.html` | S |
| 9 | Extend the icon swap reveal to `:focus-visible` | `+page.css` | XS |
| 10 | Make the mobile CTA keyboard-reachable (`tabindex` or use `<button>`) | `+page.svelte` | S |

### P2 — structural cleanup, schedule deliberately

| # | Action | Files | Effort |
| --- | --- | --- | --- |
| 11 | Collapse five breakpoints onto a documented scale | `+page.css` | M |
| 12 | Rename `.mono` → `.label`/`.tech`, or comment the intent | both | S |
| 13 | Convert the 25 icon imports into a data array + `{#each}` | `+page.svelte` | M |
| 14 | Wire nav links to the existing `#how` / `#byo` / `#download` ids, or drop the ids | `+page.svelte` | S |
| 15 | Add `aria-hidden="true"` to the inline `<h1>` decorative SVGs (if not already) | `+page.svelte` | XS |
| 16 | Reconsider the CTA caveat placement | `+page.svelte` | S |

---

## 14. Quick-win checklist

Copy-paste-able, in the order I would actually do them:

- [ ] `app.html`: add `description`, `theme-color`, `og:*`, `twitter:*`
- [ ] `app.html`: replace the 172 KB `logo.png` favicon with a small dedicated icon
- [ ] `+page.css:1`: delete the `@import` line
- [ ] `+page.svelte`: add `width`/`height` to `.bg` and `.app-shot`
- [ ] `+page.svelte`: `aria-pressed={effectiveOs === p.id}` on `.platform-chip`
- [ ] `+page.svelte`: visually-hidden "detected" text next to `.detect-dot`
- [ ] `+page.css`: `:hover, :focus-visible` on `.provider-icon-swap`
- [ ] `StarField.svelte`: early-return a static frame when reduced motion is requested
- [ ] `static/`: export both backgrounds to WebP, add `<source type="image/webp">`

---

## 15. Open questions for the author

1. **Is the starfield load-bearing or decorative?** If decorative, it is a candidate for
   removal on small screens — which would solve motion, battery, and reduced-motion in one
   move.
2. **Where does the download button actually point?** Both hero and download-section CTAs
   currently use `href="#"`. Until they resolve, the page's primary conversion is a no-op.
3. **Is `background-2.png` (1.67 MB) worth 1.67 MB?** It appears once, in a `how` section
   background. It is the single largest asset on the site and the easiest to shrink.
4. **Is there a light mode / has one been ruled out?** The palette is excellent, but it is
   the *only* palette, and there is no `prefers-color-scheme` branch.
5. **Is the 600px duplication intentional?** Two `@media (max-width: 600px)` blocks suggest
   an edit that landed in a second place rather than an intentional two-tier rule.

---

## Appendix — evidence index

Every claim above traces to one of these observations:

| Claim | Evidence |
| --- | --- |
| 908 / 1176 / 261 / 19 line counts | `wc -l` on the four source files |
| Questrial fetched twice | `app.html` L10–13 `<link>`; `+page.css:1` `@import` |
| `.mono` maps to SBLiquid + fallback | `+page.css` @font-face L3, `.mono` rule |
| Palette `#0b0c0a` / `#ededec` | `html, body` rule in `+page.css` |
| Five breakpoints, 600 twice | `grep -n "@media"` → 360, 379, 725, 956, 1137 |
| Four sections + footer | `grep -nF "<section"` → 466, 561, 680, 856; footer at 891 |
| No nav/header | `grep -nE "<nav\|<header\|<footer"` — only `footer` matched |
| No reduced-motion handling | `grep -rn "prefers-reduced-motion" src` → **0 matches** |
| No CSS keyframes/animation | `grep -nE "@keyframes\|animation:"` → **0 matches** |
| Only 3 meta-ish tags | `app.html` read in full |
| `.mono` used at two call sites | `grep -nF "labels["` → 442, 867 |
| Starfield props | `StarField.svelte` L1–40 (`$props()`, glyph atlas) |
| Soft footer falloff | `+page.svelte:893` `falloffPower={0.35}` |
| Asset sizes | `ls -la static` and `static/fonts` |
| `background-2.png` used once | `grep -rnF "background-2" src` → L549 |
| Adapter + fallback | `svelte.config.js` read in full |

---

*Review produced by static inspection only. No files were modified to gather this
evidence; this document is the sole addition.*
