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
| `npm run check:contrast` | Every text colour clears WCAG AA against the lightest surface it sits on |
| `npm run check:radius` | **No curves** — no `rounded-*` utility in source, and no non-zero `border-radius` in the shipped stylesheet |
| `npm run check:render` | The whole tree server-renders without throwing, every section is present, there are **no nested `<a>` elements**, and `dt` precedes `dd` in all definition lists |

The render check exists because this is a type-less codebase: SSR-rendering the tree catches
missing data exports and undefined property access that would otherwise only show up in a browser.

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
| `public/og.png` | 1200×630 link preview, generated with your name and stack |
| `public/favicon.svg` | Pipeline glyph |
| `public/apple-touch-icon.png` | 180×180 |

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

Technical grid / terminal. Tokens live in one place: the `@theme` block in `src/index.css`.
Tailwind generates the utilities from them (`text-accent`, `font-display`, `bg-surface`,
`text-title`, `grid-bg`).

### Zero curves — how it's enforced

Every corner is square, and three mechanisms keep it that way:

1. All `--radius-*` tokens are `0`.
2. `.rounded-full` is explicitly neutralised, because Tailwind hardcodes it as
   `calc(infinity * 1px)` instead of reading a token, so the scale can't reach it.
3. `npm run check:radius` fails on any `rounded-*` in source **or** any non-zero `border-radius`
   in the built CSS.

⚠️ **Never write the literal utility name for a corner radius anywhere in `src/`, even in a
comment.** Tailwind scans raw file text and does not skip comments, so merely mentioning it makes
Tailwind emit that utility and puts a curve back in the bundle. This actually happened — a comment
in `Panel.jsx` shipped a `.25rem` radius. For the same reason `index.css` uses
`@import "tailwindcss" source(none)` with explicit `@source` globs, so `scripts/` and `README.md`
are not scanned.

- **Display** Archivo 800, uppercase, tight tracking
- **Body** Inter · **Labels/readouts** JetBrains Mono
- **Accent** copper `#C98B5E`
- Text colours are contrast-checked against the **lightest surface they sit on**, not just the page
  background. Worst case: `ink` 15.3:1, `muted` 7.0:1, `subtle` 5.2:1 — all clear WCAG AA for body
  text. Nothing dimmer than `subtle` may carry text. Verify with `node scripts/check-contrast.mjs`.

`Section.jsx` owns section rhythm and the two-column header, so spacing can't drift. `Panel.jsx` is
the hard-edged container: a 1px rule plus four corner brackets and a scanline sweep on hover.

### Motion

| Piece | Where |
|---|---|
| Boot sequence | `Preloader.jsx` — counter to 100 then panel wipe. Session-scoped so it plays once per tab, dismissible by click or keypress, skipped under reduced motion |
| Text decode | `ScrambleText.jsx` / `useScramble.js` — glyph scramble on scroll-in and hover. The real string stays in the DOM for screen readers |
| Section transitions | `Section.jsx` — headings uncover via `clip-path` wipe rather than fading |
| Crosshair cursor | `Cursor.jsx` — viewport-spanning crosshair, corner-bracket reticle, live coordinate readout. Driven by motion values, so pointer movement causes **no React re-renders**. Add `data-cursor="label"` to any element to change the readout on hover |
| Hover micro-interactions | Buttons fill from the left, nav underlines wipe, panel brackets fade in, rows draw a rule across on hover |

All of it is client-side; there is no backend or proxy.

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
