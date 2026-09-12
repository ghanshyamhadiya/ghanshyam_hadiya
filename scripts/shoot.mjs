// Screenshots the running dev server at several widths so layout can be
// inspected instead of guessed at.
//
//   node scripts/shoot.mjs [baseUrl] [outDir]
//
// Also reports any element wider than the viewport, which is the usual cause
// of horizontal scroll on phones.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5174';
const OUT = process.argv[3] ?? 'shots';

const VIEWPORTS = [
    { name: '360', width: 360, height: 780 },
    { name: '390', width: 390, height: 844 },
    { name: '768', width: 768, height: 1024 },
    { name: '1440', width: 1440, height: 900 },
];

const SECTIONS = [
    'home',
    'impact',
    'about',
    'process',
    'skills',
    'experience',
    'work',
    'credentials',
    'contact',
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
    const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        // Touch profile for the phone widths so the crosshair/hover paths are
        // exercised the way a real phone would.
        hasTouch: vp.width < 768,
        isMobile: vp.width < 768,
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Skip the intro so it doesn't cover every shot.
    await page.evaluate(() => window.sessionStorage.setItem('intro-played', '1'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => !document.querySelector('[data-intro-overlay], [data-intro-curtain]'), null, { timeout: 12000 });

    // Horizontal overflow report
    const overflow = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const bad = [];
        for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.right > vw + 1 || r.left < -1) {
                bad.push({
                    tag: el.tagName.toLowerCase(),
                    cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 70),
                    left: Math.round(r.left),
                    right: Math.round(r.right),
                });
            }
        }
        return {
            scrollW: document.documentElement.scrollWidth,
            clientW: vw,
            bad: bad.slice(0, 8),
        };
    });

    console.log(`\n=== ${vp.name}px ===`);
    console.log(
        `scrollWidth=${overflow.scrollW} clientWidth=${overflow.clientW} ${
            overflow.scrollW > overflow.clientW ? 'HORIZONTAL OVERFLOW' : 'no h-overflow'
        }`
    );
    for (const b of overflow.bad) console.log(`  overflowing <${b.tag}> ${b.left}..${b.right}  ${b.cls}`);

    for (const id of SECTIONS) {
        const el = await page.$(`#${id}`);
        if (!el) {
            console.log(`  MISSING #${id}`);
            continue;
        }
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(700);
        await page.screenshot({ path: `${OUT}/${vp.name}-${id}.png` });
    }

    await page.close();
}

await browser.close();
console.log(`\nshots written to ${OUT}/`);
