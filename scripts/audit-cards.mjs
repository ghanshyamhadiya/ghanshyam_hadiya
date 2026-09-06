// Walks the work section and asserts every project card becomes fully readable
// at some scroll position.
//
// This exists because measure.mjs was not enough. The previous sticky stack had
// cards that *fitted* the viewport perfectly — so the height check passed — yet
// the incoming card rose from the bottom and covered the outgoing one
// bottom-first, starting only ~300px after it centred. Card 1's metrics,
// repository link and stack row were unreachable at every scroll position.
//
// Measuring size was the wrong question. This measures how much of each card is
// genuinely on screen on both axes as you scroll, which is the property that
// actually matters.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const WIDTH = Number(process.argv[3] ?? 1440);
const OUT = 'shots/cards';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 1024 ? 800 : 900 },
    hasTouch: WIDTH < 1024,
    isMobile: WIDTH < 1024,
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600); // let the intro finish
await page.evaluate(() => {
    const el = document.getElementById('work');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
});
await page.waitForTimeout(600);

const best = new Map();

console.log('step  scrollY   per card: horizontal% x vertical% = readable%');

for (let step = 0; step < 22; step += 1) {
    const info = await page.evaluate(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cards = [...document.querySelectorAll('#work article')];
        return {
            y: Math.round(window.scrollY),
            cards: cards.map((c) => {
                const r = c.getBoundingClientRect();
                const hx = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) / r.width;
                const vy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / r.height;
                return { h: Math.round(hx * 100), v: Math.round(vy * 100) };
            }),
        };
    });

    const cells = info.cards.map((c, i) => {
        const readable = Math.round((c.h / 100) * (c.v / 100) * 100);
        best.set(i, Math.max(best.get(i) ?? 0, readable));
        return `c${i + 1} ${String(c.h).padStart(3)}x${String(c.v).padStart(3)}=${String(readable).padStart(3)}%`;
    });

    console.log(`${String(step).padStart(4)}  ${String(info.y).padStart(7)}   ${cells.join('  ')}`);

    if (step % 4 === 0) {
        await page.screenshot({ path: `${OUT}/${WIDTH}-step-${String(step).padStart(2, '0')}.png` });
    }

    await page.mouse.wheel(0, 340);
    await page.waitForTimeout(400);
}

console.log('\nbest readable percentage reached per card:');
let failures = 0;
for (const [i, pct] of [...best].sort((a, b) => a[0] - b[0])) {
    const ok = pct >= 97;
    if (!ok) failures += 1;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  card ${i + 1}: ${pct}%`);
}

console.log(
    failures ? `\n${failures} card(s) never fully readable` : '\nevery card becomes fully readable'
);

await browser.close();
process.exit(failures ? 1 : 0);
