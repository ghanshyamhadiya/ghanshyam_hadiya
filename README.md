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

### Fill-in checklist

Every value that still needs your input is prefixed `TODO:`. To list them all:

```bash
grep -rn "TODO:" src/data
```

The build also prints a warning naming the important ones that are still unset.

Start with these four:

1. **`site.js` → `url`** — remove the `TODO:` prefix and set your real domain. Until you do, the
   build deliberately omits `canonical`, `og:url`, `og:image` and `sitemap.xml` rather than
   publishing URLs that point at a domain which doesn't exist.
2. **`profile.js`** — name, email, location, and the GitHub/LinkedIn URLs in `socials`.
3. **`projects.js` → `links.repo`** — a project card without a working repository link is the most
   common reason a portfolio project gets skipped.
4. **`public/resume.pdf`** — overwrite the committed placeholder with your real CV. Every
   "Download CV" button already points here.

### Replacing the placeholder assets

| Asset | Notes |
|---|---|
| `public/resume.pdf` | Placeholder PDF; overwrite with your CV |
| `public/og.png` | 1200×630 link-preview image; regenerate or replace |
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

Tokens live in one place: the `@theme` block in `src/index.css`. Tailwind generates the utilities
from them (`text-accent`, `font-display`, `bg-surface`, `text-title`).

- **Display** Instrument Serif — **weight 400 only.** Never apply `font-bold` to display text or
  the browser synthesises a fake bold.
- **Body** Inter · **Labels/metrics** JetBrains Mono
- **Accent** copper `#C98B5E`
- Text colours are contrast-checked against the **lightest surface they sit on**, not just the page
  background. Worst case: `ink` 15.3:1, `muted` 7.0:1, `subtle` 5.2:1 — all clear WCAG AA for body
  text. Nothing dimmer than `subtle` may carry text. Verify with `node scripts/check-contrast.mjs`.

`Section.jsx` owns section rhythm and the two-column editorial header, so spacing can't drift.

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

`scripts/` holds one-off maintenance helpers, not part of the build:

- `make-placeholder-pdf.mjs` — regenerates `public/resume.pdf`
- `check-head.mjs` — asserts the built `index.html` metadata is coherent
