// Measures the project cards against the viewport. The sticky card stack only
// works if a card fits in one screen; anything taller is silently clipped by
// the next card sliding over it.
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
                const holder = card.parentElement;
                return {
                    h: Math.round(card.getBoundingClientRect().height),
                    holderH: Math.round(holder.getBoundingClientRect().height),
                    padTop: Math.round(parseFloat(getComputedStyle(holder).paddingTop)),
                    padBottom: Math.round(parseFloat(getComputedStyle(holder).paddingBottom)),
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
