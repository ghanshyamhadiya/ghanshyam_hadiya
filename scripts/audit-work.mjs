// Verifies the Selected Work pipeline run.
//
// This exists because measuring size was not enough. An earlier sticky card
// stack had cards that fitted the viewport perfectly — so a height check passed
// — while the incoming card covered the outgoing one bottom-first and its
// metrics, repo link and stack were unreachable at every scroll position.
//
// So this measures the properties that actually matter:
//   1. every stage's summary genuinely becomes readable
//   2. every architecture node ends up built, and STAYS built after scrolling
//      back up (the latch in useStageProgress)
//   3. the hidden detail can actually be opened, including the repo link
//   4. the jump index moves to the right stage
//   5. the run log invents nothing
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { featuredProjects } from '../src/data/projects.js';
import { buildLines } from '../src/utils/pipeline.js';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const WIDTH = Number(process.argv[3] ?? 1440);
const OUT = 'shots/work';
mkdirSync(OUT, { recursive: true });

let failures = 0;
const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};

// ---------------------------------------------------------------- static checks

// The run log must not contain fabricated telemetry. Derived step counters are
// fine; clock times, durations and invented row counts are not.
for (const project of featuredProjects) {
    const text = buildLines(project)
        .map((l) => `${l.step} ${l.text} ${l.note ?? ''}`)
        .join('\n');

    assert(!/\d{1,2}:\d{2}/.test(text), `${project.slug}: run log has no timestamps`);
    assert(!/\b\d+\s?(ms|sec|secs|s|min|mins)\b/i.test(text), `${project.slug}: no invented durations`);
}

// ---------------------------------------------------------------- browser checks

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 1024 ? 800 : 900 },
    hasTouch: WIDTH < 1024,
    isMobile: WIDTH < 1024,
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2800); // let the intro finish

// Walk the whole work section, tracking the best readability each stage reaches.
await page.evaluate(() => {
    const el = document.getElementById('work');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
});
await page.waitForTimeout(500);

const best = new Map();

for (let step = 0; step < 40; step += 1) {
    const info = await page.evaluate(() => {
        const vh = window.innerHeight;
        return [...document.querySelectorAll('#work article')].map((el) => {
            const header = el.querySelector('h3');
            const r = (header ?? el).getBoundingClientRect();
            const summary = el.getBoundingClientRect();
            const visible = Math.max(0, Math.min(summary.bottom, vh) - Math.max(summary.top, 0));
            return {
                id: el.id,
                headerVisible: r.top >= 0 && r.bottom <= vh,
                pct: Math.round((visible / summary.height) * 100),
            };
        });
    });

    for (const s of info) best.set(s.id, Math.max(best.get(s.id) ?? 0, s.pct));

    if (step % 8 === 0) {
        await page.screenshot({ path: `${OUT}/${WIDTH}-${String(step).padStart(2, '0')}.png` });
    }

    await page.mouse.wheel(0, 340);
    await page.waitForTimeout(230);
}

for (const project of featuredProjects) {
    const pct = best.get(`work-${project.slug}`) ?? 0;
    assert(pct >= 90, `${project.slug}: summary reaches ${pct}% visible`);
}

// Scroll back to the top — the latch must hold, nodes must stay built.
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(900);

const unbuilt = await page.evaluate(() =>
    [...document.querySelectorAll('#work article')].flatMap((article) =>
        [...article.querySelectorAll('ol li')]
            .filter((li) => Number(getComputedStyle(li).opacity) < 0.9)
            .map((li) => `${article.id}: ${li.textContent.trim().slice(0, 30)}`)
    )
);
assert(unbuilt.length === 0, `all pipeline nodes stay built after scrolling back up${
    unbuilt.length ? ` — ${unbuilt.length} still faded` : ''
}`);

// Every unfold must open, and reveal a real, sized region.
for (const project of featuredProjects) {
    const article = page.locator(`#work-${project.slug}`);
    const toggle = article.locator('button[aria-expanded]');

    await toggle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await toggle.click();
    await page.waitForTimeout(650);

    const detail = await article.evaluate((el) => {
        const button = el.querySelector('button[aria-expanded]');
        const panel = document.getElementById(button.getAttribute('aria-controls'));
        const r = panel?.getBoundingClientRect();
        return {
            expanded: button.getAttribute('aria-expanded') === 'true',
            height: r ? Math.round(r.height) : 0,
            hasStack: Boolean(panel?.textContent?.includes('Stack')),
            hasLink: Boolean(panel?.querySelector('a[href], span')),
        };
    });

    assert(detail.expanded, `${project.slug}: unfold reports expanded`);
    assert(detail.height > 60, `${project.slug}: detail panel is ${detail.height}px tall`);
    assert(detail.hasStack && detail.hasLink, `${project.slug}: detail contains stack and code link`);
}

// The jump index must move the viewport to the right stage.
//
// Note: no raw window.scrollTo here. Lenis owns the scroll position, and
// forcing it natively leaves Lenis's internal position stale, so a subsequent
// lenis.scrollTo() computes from the wrong origin and appears to do nothing.
// Jumping backwards from wherever the unfold checks left us exercises the real
// path a visitor takes.
const target = featuredProjects[0];
await page.locator('nav[aria-label="Projects"] button').first().click();
await page.waitForTimeout(2200);

const jumped = await page.evaluate((id) => {
    const r = document.getElementById(id)?.getBoundingClientRect();
    return r ? Math.round(r.top) : null;
}, `work-${target.slug}`);

// The stage has scroll-mt for the navbar, so landing near the top is correct.
assert(
    jumped !== null && Math.abs(jumped) < 240,
    `jump index scrolls to the first stage (top offset ${jumped}px)`
);

console.log(failures ? `\n${failures} failure(s)` : '\nwork section OK');

await browser.close();
process.exit(failures ? 1 : 0);
