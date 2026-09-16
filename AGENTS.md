# Verification

- Run `npm run verify` for lint, production build, metadata, palette, asset and SSR checks. Browser audits are separate; `verify` does not run them.
- Run `node scripts/audit-headings.mjs <BASE> <WIDTH> <MODE> [HEIGHT]` against the portfolio server. Modes: `normal`, `reduced`, `font-blocked`. Check widths 360, 390, 768 and 1440, including a short 1440x700 viewport.
- Run `node scripts/audit-reveals.mjs <BASE> <WIDTH>`, `node scripts/audit-work.mjs <BASE> 1440`, and `node scripts/audit-intro.mjs <BASE> <WIDTH> full` / `short` for related regressions.
- Confirm the server is this repository before interpreting browser failures. An occupied default port can belong to a different application. Use an explicitly selected Vite port rather than stopping unrelated Node processes.

# Heading motion

- Keep the hero and intro boot timing separate from section-heading motion.
- Keep one semantic h2 and its section's aria-labelledby linkage. Split glyphs are decorative; preserve a plain-text accessible heading.
- The Process arc follows reversible scroll progress. Unlike the work pipeline's latched assembly, it must not latch. Test actual SVG glyph bounds in the reading window; full opacity does not prove visibility.
- Shared Reveal must respect explicit duration overrides and reduced motion. Keep useReveal's observer and fail-safes intact.
- Preserve final text geometry during variable-weight animation, and remove temporary split-flap copies when the animation settles.
- Display typography is self-hosted Space Grotesk (`public/fonts`, refreshed by `scripts/fetch-fonts.mjs`, preloaded in `index.html`). Font-dependent motion must read the `--font-display` token rather than naming a family. The face tops out at wght 700 and has no optical-size axis, so display styles must not pin `opsz` or ask for 800.
- The Process arc is contained: every visible glyph must stay inside the screen and its stage, not travel through clipped side edges. Mobile uses two curved lines with one accessible full heading. Test simultaneous readability, safe horizontal bounds and reversible motion.
- The personal portrait appears only in the hero. About and Contact must not repeat it; the SSR check enforces a single portrait in the hero.
- The six non-arc section headings also follow reversible scroll progress via AnimatedHeading, with opposed/layers/unfold/connect/press/converge treatments. They are not one-time reveals. Keep stationary section labels and readable centre states. Do not wrap those labels in Reveal: its rise-in shifts their geometry during heading entry.
- audit-reveals verifies these headings at their reading positions before excluding their offstage decorative spans from the final one-shot scan. Do not replace this with a blanket aria-hidden exclusion. audit-headings additionally verifies the trajectories, reversal, stopped-scroll state, actual glyph bounds and static fallbacks.
- Shared scroll smoothing lives in useGlideProgress and SCROLL_GLIDE; navigation-sized jumps snap rather than slowly catching up. Heading audits allow bounded settling (900ms maximum), then require exact stillness. Do not replace those checks with unbounded sleeps.
- useSectionSurface animates only section background corners. Do not transform the entire section: content geometry and sticky project navigation must stay stable.
- The hero content must remain opaque while its text/links are visible; do not restore the old scroll-opacity fade.
- Tickers are separate straight tracks, not crossed ribbons. Keep equal-width duplicate groups with a trailing gap, 26px/sec travel, pause/resume controls and a static reduced-motion path. Run `node scripts/audit-marquee.mjs <BASE> <WIDTH> normal|reduced` for clipping, loop, controls, hero opacity and section-surface regressions.
- Welcome and hero share one name/mark hand-off: the two name lines land on data-hero-name-target, and GH lands on data-nav-mark. Do not run a second masked hero-name entrance. Light/ink flight copies must share identical geometry across the moving background clip.
- INTRO_TIMING defines the slower first/repeat scene and budgets. getBooted enables the supporting hero content at hand-off start; getIntroComplete reveals the final name/badge and releases the intro scroll lock. Both states must finish on skip, resize, reduced motion or the fail-safe.
- Keep scrollbar-gutter stable during the intro lock to prevent a horizontal landing jump. Direct section links bypass the homepage intro and are positioned once layout/fonts are ready; respect user input rather than overriding their scroll.
- Browser checks must wait for the intro overlay to disappear, not sleep for the older short intro duration. audit-intro verifies welcome reading time, name and badge start/landing alignment, colour-layer alignment, no second entrance, unlock, Escape, resize and deep links.
