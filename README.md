# Data Engineer Portfolio

A single-page portfolio built around data-engineering evidence: impact metrics, architecture
diagrams, honest skill layering and GitHub-linked project cards.

React 19 · Vite 7 · Tailwind CSS 4 · Framer Motion · Lenis

```bash
npm install
npm run dev      # dev server
npm run lint     # eslint
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run verify   # lint + build + all checks below
```

### Checks

`npm run verify` runs everything. Individually:

| Command | Asserts |
|---|---|
| `npm run check:head` | Built `index.html` metadata is coherent, JSON-LD parses, and no `%SITE_*%` token or placeholder URL leaked through |
| `npm run check:contrast` | Every colour pairing the design uses clears WCAG AA, and the forbidden white-on-hot-pink pairing is documented rather than silently reintroduced |
| `npm run check:assets` | Every image referenced from the data layer exists on disk, with alt text and explicit width/height |
| `npm run check:render` | The whole tree server-renders without throwing, every section is present, there are **no nested `<a>` elements**, and `dt` precedes `dd` in all definition lists |

The render check exists because this is a type-less codebase: SSR-rendering the tree catches
missing data exports and undefined property access that would otherwise only show up in a browser.

### Visual checks (need `npm run dev` running)

These drive a real headless browser, so they catch layout and motion problems that no amount of
reading the source will surface.

| Command | Purpose |
|---|---|
| `npm run shots -- http://localhost:5173` | Screenshots every section at 360/390/768/1440 into `shots/`, and reports horizontal overflow |
| `npm run check:reveals -- http://localhost:5173 390` | Scrolls the whole page like a person, then fails if **any element is still hidden** — zero opacity or parked outside its mask |
| `npm run check:work -- http://localhost:5173` | The Selected Work pipeline run: every stage becomes readable, every node stays built after scrolling back up, every unfold opens, the jump index works, and the run log invents nothing |
| `npm run check:intro -- http://localhost:5173` | Verifies the first-load sequence: the hero must still be animating **after** the curtain has fully lifted, and the intro must finish under 2.6s |
| `npm run shots:intro -- http://localhost:5173` | Frame-by-frame screenshots of the boot sequence |

`check:reveals` earned its place immediately: it found 29 words in About and the entire Contact
headline that never appeared after a full scroll. `check:cards` found project cards overflowing by
up to 188px at 768px, cutting off the diagram, metrics and repo link.

`check:work` measures behaviour, not size, because a size check is not enough. An earlier sticky
card stack had cards that fitted the viewport perfectly — so the height check passed — while the
incoming card covered the outgoing one bottom-first and its metrics, repo link and stack were
unreachable at *every* scroll position. Measuring size was the wrong question.

It has already earned its keep twice: it caught the jump index being unreachable once you had
scrolled into the section, and it enforces that the run log contains no fabricated timestamps or
durations.

## Selected Work — the pipeline run

The work section is not a card list. A rail runs down it carrying a payload token; each project is
a station, and when the payload arrives that project's architecture assembles node by node while a
run log narrates it and the metrics count up as output. It is driven entirely by the
`architecture` data already in `projects.js`.

Two things are load-bearing and easy to break:

**The build progress is latched** (`useStageProgress`). It only ever increases. A raw scrubbed
value would play the whole assembly in reverse when you scroll up — and it would fail
`check:reveals`, which returns to the top and flags anything still hidden. Do not "simplify" it
back to `scrollYProgress`.

**The run log must invent nothing.** `utils/pipeline.js` derives every line from node labels, node
notes and real metrics, and uses step counters `[3/6]` rather than timestamps. A fabricated
`[00:00:04]` on a data engineer's portfolio is the same credibility problem as the self-assigned
skill percentages that were removed. `check:work` fails on any timestamp or duration pattern.

Playwright is a dev dependency only. If you'd rather not carry it, `npm rm -D playwright` — the
five checks in the table above it still run without a browser.

## Editing content

**All visitor-facing copy lives in `src/data/`.** No text is hardcoded in components, so you
should never need to touch JSX to update the site.

| File | Controls |
|---|---|
| `site.js` | Deploy URL, name, SEO description, OG image path |
| `profile.js` | Name, role, hero headline, About paragraphs, email, CV, socials |
| `stats.js` | The four impact numbers under the hero |
| `skills.js` | Skills grouped by data-stack layer, plus "currently exploring" |
| `experience.js` | Roles, dates, achievements, stack |
| `projects.js` | Problem, approach, architecture diagram, metrics, repo links |
| `credentials.js` | Certifications and education |
| `navigation.js` | Nav items (each `id` must match a section `id`) |

### What's still outstanding

Content is populated from `GhanshyamHadiya_DataEngineer.pdf`. Anything left needing input is
prefixed `TODO:`; the build also warns about the important ones.

```bash
grep -rn "TODO:" src/data
```

Currently outstanding:

1. **Two missing repository links** — `projects.js` → `links.repo` for *Supply Chain Data Pipeline*
   and *Customer Churn Analysis*. Only `MigrationTool` had a matching public repo. Those two cards
   currently render "Code available on request". Publishing the repos and pasting the URLs is the
   highest-value remaining change: a project a reviewer can't open is the most common reason one
   gets skipped. `node scripts/list-repos.mjs ghanshyamhadiya` lists your public repos.
2. **`stats.js`** — the four numbers measure *breadth* (systems, platforms, layers), not *scale*.
   If you know real production figures from the Flytics pipelines — rows per run, nightly runtime,
   number of ODI mappings, SLA hit rate — swap them in; volume and latency land much harder.
3. **`experience.js` → `companyNote`** — one line on what Flytics does, for context.
4. **`credentials.js`** — `certifications` is deliberately empty since your CV lists none. Given
   the Oracle-heavy production work, an OCI or Oracle Analytics certification would be the
   highest-value addition to that section.
5. **`profile.js` → `availability`** — currently "Open to data engineering roles", which is a
   public job-seeking signal while you're employed at Flytics. Change it if that's not intended.

### Assets

| Asset | Notes |
|---|---|
| `public/resume.pdf` | Your real CV. Overwrite this file to update it |
| `public/photos/portrait-src.jpg` | Master portrait. Everything else is derived from it |
| `public/photos/portrait-*.webp` | Generated crops — see below |
| `public/og.png` | 1200×630 link preview, with your photo |
| `public/favicon.svg` · `apple-touch-icon.png` | Indigo mark |

### Regenerating the photo crops

Three crops are derived from the master with ffmpeg — a tall 2:3 for the hero, a 4:5 for About,
and a 3:2 band for Contact. After replacing `portrait-src.jpg`, re-run from `public/photos`:

```powershell
foreach ($w in 480,768,1024) { ffmpeg -y -i portrait-src.jpg -vf "scale=${w}:-2" -q:v 82 "portrait-$w.webp" }
foreach ($w in 400,640) { $h=[int]($w*1.25); ffmpeg -y -i portrait-src.jpg -vf "crop=1024:1280:0:120,scale=${w}:${h}" -q:v 82 "portrait-sq-$w.webp" }
foreach ($w in 480,768) { $h=[int]($w*0.66); ffmpeg -y -i portrait-src.jpg -vf "crop=1024:683:0:500,scale=${w}:${h}" -q:v 82 "portrait-wide-$w.webp" }
```

The `crop` offsets are tuned to this specific photo. If you swap in a different one, check the
framing and adjust — `npm run check:assets` verifies the files exist, not that the face is in shot.

## Two things worth being careful about

**Don't inflate the skills list.** `skills.js` has no proficiency percentages on purpose —
self-assigned numbers are unverifiable and invite exactly the interview question you don't want.
Depth is signalled by `primary: true`, which should mean "I have owned this in production".
Anything self-taught belongs in the `exploring` group at the bottom of the file; being explicit
about that boundary reads as confidence, not weakness.

**Don't ship metrics you can't defend.** Every number in `stats.js` and `projects.js` is a
`TODO:`. A reviewer who asks "how did you measure that?" and gets a vague answer is worse than one
who never saw a number. Delete anything you can't back up — every section renders whatever is left.

## Architecture diagrams

Project diagrams are generated from data, not images. In `projects.js`:

```js
architecture: {
  orchestrator: 'Airflow · ODI load plans',   // optional control bar
  nodes: [
    { id: 'oltp', label: 'Oracle OLTP', kind: 'source', note: '12 tables' },
    { id: 'odi',  label: 'ODI mappings', kind: 'ingest', note: 'incremental' },
  ],
  note: 'Optional caption below the diagram.',
}
```

`kind` is one of `source` · `ingest` · `transform` · `store` · `serve`, and picks the icon and
label. `PipelineDiagram` renders a compact wrapped chip flow on phones and expands to full boxes
with travelling flow dots from `md` up — one DOM, switched with CSS, so labels aren't duplicated
for screen readers.

## Design system

Light, colourful and rounded. Tokens live in one place: the `@theme` block in `src/index.css`.
Tailwind generates the utilities from them (`bg-canvas`, `text-ink`, `font-display`, `text-name`).

### Palette

Every value below is measured, not estimated — run `npm run check:contrast`.

| Token | Hex | Role |
|---|---|---|
| `canvas` | `#FFF7EC` | warm cream page |
| `surface` | `#FFFFFF` | cards |
| `amber` / `amber-soft` | `#FFC93C` / `#FFE9A8` | brand surfaces, hero |
| `indigo` / `indigo-deep` | `#332C81` / `#221C5C` | dark panels, contact, footer |
| `pink` / `pink-deep` | `#FF1E8E` / `#D6006F` | accent, CTAs |
| `ink` / `muted` / `subtle` | `#141225` / `#4A4560` / `#6E6885` | text |

⚠️ **Three colour rules, enforced by the contrast check:**

1. **Never white text on hot pink.** It measures **3.60 and fails AA** — and it is the most obvious
   CTA styling, which is exactly why it is easy to reintroduce. Use ink on pink (5.10), or
   `pink-deep` with white (5.14). `Button.jsx` bakes this in so call sites cannot get it wrong.
2. **Pink is large-text only** on canvas (3.39) and on indigo (3.21). Never body copy.
3. **Amber is never a text colour on canvas** (1.45). Surfaces and shapes only.

### Type

- **Display** Outfit 800, **sentence case** — the friendliness comes from rounded lowercase forms,
  not from caps
- **Body** Inter · **Handwriting** Caveat · **Data labels** JetBrains Mono

`--text-name` is deliberately smaller than `--text-display`. It is used inside a column, and sizing
it in raw `vw` clipped the last letter of "Ghanshyam" at desktop widths: `9vw` of a 1440px viewport
is 130px, and nine characters at that size overflow a 7-of-12 column, which the reveal mask then
cropped. If you change it, check the name still fits at 768px and 1440px.

### Zoning — bold but credible

The playfulness is deliberately not uniform. This is a rule, not a matter of taste:

| Zone | Sections | Treatment |
|---|---|---|
| **Identity** | Intro, Hero, Marquee, About, How I work, Contact | Full expression — blobs, floating objects, handwriting, saturated panels |
| **Evidence** | Skills, Experience, Work, Credentials | Disciplined. Colour encodes *structure* (a filled chip means production ownership), never decoration. **No blobs behind text** |

A reviewer skimming the work should never have to read a metric through a decorative shape. This is
what keeps a bright portfolio credible for enterprise data roles.

`Section.jsx` owns rhythm and the heading block; `tone` picks the surface. `Panel.jsx` is the
rounded card used throughout the evidence sections.

### Motion

| Piece | Where |
|---|---|
| Intro curtain | `Preloader.jsx` — indigo panel, the name assembles, amber and pink blobs peel in from the corners, then the whole thing lifts. Session-scoped, dismissible, skipped under reduced motion |
| Boot gating | `utils/bootState.js` / `useBooted.js` — **entry animations wait for the curtain** |
| Scroll reveals | `useReveal.js` / `Reveal.jsx` — **one shared system for the whole site** |
| Organic shapes | `Blob.jsx` — SVG paths, always `aria-hidden`, never behind text |
| Floating objects | `FloatingObjects.jsx` — pointer parallax via motion values, so no re-render per mousemove |
| Ticker | `Marquee.jsx` — CSS keyframe, duplicated track translated exactly -50% for a seamless loop |
| Blob cursor | `Cursor.jsx` — swells on interactive elements; add `data-cursor="label"` to any element to show a word |

All of it is client-side; there is no backend or proxy.

#### Why reveals go through `useReveal`, not `whileInView`

Every scroll reveal uses the shared hook. Do not reintroduce per-element `whileInView` — it failed
in two ways that were very visible on a phone:

1. **It fails closed.** If the observer misses — fast flick scrolling, Lenis smoothing, a hash jump
   — the element keeps its hidden state forever while still occupying layout, so you get a blank
   gap rather than an obvious error.
2. **One observer per element.** Word-by-word text meant ~200 observers on one page, which is both
   slow and where most of the misses happened. `AnimatedText` now reveals a paragraph as a block;
   per-word motion is not worth a sentence with holes in it.

`useReveal` uses a single shared observer plus three fail-safes — reveal on intersection, reveal
immediately if already at or above the fold at mount, and a scroll-driven sweep that reveals
anything the observer never fired for. `npm run check:reveals` enforces the result.

All reveals share one distance, duration and easing from `utils/motion.js`, so the page moves with
a single rhythm. Values had previously drifted to four different distances and four durations.

#### Entry animations must gate on `useBooted()`

Anything that animates on mount — the hero, the navbar, and every `useReveal` above the fold —
waits for `useBooted()`. Without it the entry sequence runs *behind the preloader*: measured, the
hero headline animated from y=202 to y=0 between 579ms and 1464ms while the curtain did not clear
until 3184ms, so the page simply appeared already settled. It only happened on a first load,
because the intro is session-scoped and skipped afterwards, which made it easy to miss.

`Preloader` calls `setBooted()` as the wipe **starts**, not when the overlay unmounts, so the hero
moves while the panels are still travelling and the two motions read as one. `bootState` resolves
synchronously at import, so repeat visits and reduced-motion users never wait on the gate.

Two things that are easy to undo by accident:

- The preloader container must have **no background of its own**. It previously carried `bg-bg`,
  which painted over the wipe panels and hid them entirely — all you saw was a fade.
- The panels need their copper trailing edge. They are the same colour as the page behind them, so
  without that line the wipe is genuinely invisible.

`npm run check:intro` enforces the timing.

## Deployment (Vercel)

Framework preset **Vite**, build `npm run build`, output `dist`. `vercel.json` adds SPA rewrites
and long-lived caching for hashed assets.

Set `site.url` before your first production deploy so the SEO tags are emitted.

## Accessibility

Kept passing, so please don't regress it:

- The mobile menu is a focus-trapped `role="dialog"` that restores focus on close.
- Skip link to `#main`; every section is labelled by its heading.
- Project cards are **not** wrapped in an anchor — they contain their own repo link, and nesting
  interactive elements is invalid and ambiguous for keyboard and screen-reader users.
- `prefers-reduced-motion` disables Lenis, the grain overlay, the custom cursor, magnetic buttons,
  count-ups and the diagram flow dots.

## Scripts

`scripts/` holds maintenance helpers, not part of the build:

- `list-repos.mjs <user>` — lists public GitHub repos, for filling in project links
- `extract-pdf-text.mjs <file>` — dumps CV text, for re-syncing content after a CV update
- `make-placeholder-pdf.mjs` — regenerates a placeholder `public/resume.pdf`
- `check-*.mjs` / `ssr-entry.jsx` — the verification suite described above
