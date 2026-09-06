// Measures the project cards against the viewport.
//
// The cards now sit in a scroll-pinned horizontal carousel rather than a sticky
// vertical stack, but the constraint is the same: while the section is pinned a
// card must fit the screen height, or its lower half is unreachable.
//
// Note this check alone is not sufficient — it passed for the old stack, whose
// cards fitted perfectly and were still covered by the next card. Pair it with
// refs/probe-work.mjs, which measures how much of each card is actually
// visible and unoccluded as you scroll.
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5174';
const widths = [360, 390, 768, 1440];

const browser = await chromium.launch();

for (const width of widths) {
    const page = await browser.newPage({
        viewport: { width, height: width < 768 ? 800 : 900 },
        hasTouch: width < 768,
        isMobile: width < 768,
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.sessionStorage.setItem('intro-played', '1'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const report = await page.evaluate(() => {
        const vh = window.innerHeight;
        const cards = [...document.querySelectorAll('#work article')];
        return {
            vh,
            cards: cards.map((card) => {
                // The pinned frame is the sticky ancestor; fall back to the
                // viewport when the carousel is in its native-scroll mode.
                const frame = card.closest('.sticky');
                const style = frame ? getComputedStyle(frame) : null;
                return {
                    h: Math.round(card.getBoundingClientRect().height),
                    holderH: frame
                        ? Math.round(frame.getBoundingClientRect().height)
                        : window.innerHeight,
                    padTop: style ? Math.round(parseFloat(style.paddingTop)) : 0,
                    padBottom: style ? Math.round(parseFloat(style.paddingBottom)) : 0,
                };
            }),
        };
    });

    console.log(`\n=== ${width}px (viewport height ${report.vh}) ===`);
    for (const [i, c] of report.cards.entries()) {
        const available = c.holderH - c.padTop - c.padBottom;
        const fits = c.h <= available;
        console.log(
            `  card ${i + 1}: height ${c.h}px | available ${available}px | ` +
                `${fits ? 'FITS' : `OVERFLOWS by ${c.h - available}px`}`
        );
    }

    await page.close();
}

await browser.close();
