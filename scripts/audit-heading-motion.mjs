import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
const HEIGHT = Number(process.argv[5] ?? (WIDTH < 768 ? 844 : 900));
if (!Number.isInteger(WIDTH) || WIDTH < 320 || !Number.isInteger(HEIGHT) || HEIGHT < 500 || !['normal', 'reduced', 'font-blocked'].includes(MODE)) {
    throw new Error('Usage: node scripts/audit-heading-motion.mjs BASE WIDTH normal|reduced|font-blocked [HEIGHT]');
}
const variants = { process: 'steps', skills: 'layers', experience: 'unfold', work: 'connect', credentials: 'press', contact: 'converge' };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference' });
let failures = 0;
let blocked = 0;
const errors = [];
const signatures = new Set();
const assert = (condition, label) => {
    if (!condition) failures += 1;
    console.log(`${condition ? 'ok   ' : 'FAIL '} ${label}`);
};
page.on('pageerror', (error) => errors.push(error.message));
const locate = async (id, fraction) => {
    await page.locator(`#${id}-title`).evaluate((element, position) => {
        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - innerHeight * position, behavior: 'instant' });
    }, fraction);
    await page.waitForTimeout(850);
};
const sample = (id) => page.locator(`#${id}-title`).evaluate((heading) => {
    const state = (element) => {
        const css = getComputedStyle(element);
        const matrix = new DOMMatrixReadOnly(css.transform === 'none' ? undefined : css.transform);
        return {
            matrix: [matrix.m11, matrix.m12, matrix.m13, matrix.m14, matrix.m21, matrix.m22, matrix.m23, matrix.m24, matrix.m31, matrix.m32, matrix.m33, matrix.m34, matrix.m41, matrix.m42, matrix.m43, matrix.m44].map((value) => Math.round(value * 10000) / 10000),
            opacity: Number(css.opacity), clip: css.clipPath, fontSize: parseFloat(css.fontSize),
        };
    };
    const headingRect = heading.getBoundingClientRect();
    const words = [...heading.querySelectorAll('[data-editorial-word]')].map((element) => {
        const r = element.getBoundingClientRect();
        const mask = element.closest('[data-heading-mask]');
        const m = mask?.getBoundingClientRect();
        return {
            ...state(element), text: element.textContent,
            width: r.width, height: r.height, left: r.left, right: r.right,
            maskWidth: m?.width ?? 0, maskHeight: m?.height ?? 0,
            maskLeft: m?.left ?? -Infinity, maskRight: m?.right ?? Infinity,
            clipped: m ? Math.max(0, m.top - r.top, r.bottom - m.bottom, m.left - r.left, r.right - m.right) : Infinity,
            visibleHeight: m ? Math.max(0, Math.min(r.bottom, m.bottom, innerHeight) - Math.max(r.top, m.top, 0)) : 0,
        };
    });
    return {
        variant: heading.dataset.headingMotion,
        text: heading.querySelector('.sr-only')?.textContent,
        x: headingRect.x, width: headingRect.width, height: headingRect.height,
        words,
        letters: [...heading.querySelectorAll('[data-heading-letter]')].map(state),
        echoes: [...heading.querySelectorAll('[data-heading-echo]')].map(state),
        lines: [...heading.querySelectorAll('[data-heading-underline]')].map(state),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
});
const motionOnly = (sample) => [sample.words, sample.letters, sample.echoes, sample.lines].flat().map(({ matrix, opacity, clip }) => ({ matrix, opacity, clip }));
const identity = (matrix) => matrix.every((value, index) => Math.abs(value - ([0, 5, 10, 15].includes(index) ? 1 : 0)) < .002);
const matches = (a, b) => {
    const one = motionOnly(a);
    const two = motionOnly(b);
    return one.length === two.length && one.every((value, index) =>
        Math.abs(value.opacity - two[index].opacity) < .005 && value.clip === two[index].clip
        && value.matrix.every((number, at) => Math.abs(number - two[index].matrix[at]) < .1));
};
const treatmentPresent = (variant, state) => {
    const word = state.words[0];
    if (!word) return false;
    const m = word.matrix;
    if (variant === 'opposed') return Math.abs(m[12]) > word.fontSize * .2 && Math.abs(m[13]) < .1;
    if (variant === 'steps') return m[13] > word.fontSize * .2 && Math.abs(m[1]) > .02;
    if (variant === 'layers') return m[13] > word.fontSize * .2 && Math.abs(m[12]) > 1 && state.echoes.some((echo) => echo.opacity > .05);
    if (variant === 'unfold') return Math.abs(m[6]) > .2 && m[5] < .95;
    if (variant === 'connect') return word.clip !== 'none' && [...word.clip.matchAll(/([\d.]+)%/g)].some((match) => Number(match[1]) > 20) && state.lines.some((line) => line.matrix[0] > 0 && line.matrix[0] < .9);
    if (variant === 'press') return m[0] < .9 && Math.abs(m[1]) > .03;
    if (variant === 'converge') return state.letters.length > 3 && state.letters.some((letter) => Math.abs(letter.matrix[2]) > .1 && letter.matrix[13] > 1);
    return false;
};

try {
    if (MODE === 'font-blocked') await page.route('**/*.woff*', (route) => { blocked += 1; return route.abort(); });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.locator('#home h1').waitFor();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => [...document.querySelectorAll('[data-hero-name-target]')].length === 2
        && [...document.querySelectorAll('[data-hero-name-target]')].every((element) => Number(getComputedStyle(element).opacity) > .99)
        && !document.querySelector('[data-intro-overlay]'), undefined, { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    assert(await page.locator('h2[data-editorial-heading]').count() === 6 && await page.locator('#about h2[data-cinematic-heading]').count() === 1,
        'six original editorial treatments remain alongside the About-only cinematic preview');
    for (const [id, variant] of Object.entries(variants)) {
        await locate(id, .85);
        const entry = await sample(id);
        assert(entry.variant === variant, `${id}: assigned ${variant} treatment`);
        assert(entry.words.length > 0 && entry.words.every((word) => word.maskWidth > 0 && word.maskLeft >= -1 && word.maskRight <= WIDTH + 1), `${id}: word masks stay within viewport during entry`);
        assert(entry.overflow <= 1, `${id}: entry does not create page overflow`);
        await locate(id, .72);
        const middle = await sample(id);
        assert(Math.abs(entry.height - middle.height) < .5 && Math.abs(entry.width - middle.width) < .5, `${id}: animation does not change heading layout dimensions`);
        if (MODE !== 'reduced') {
            assert(treatmentPresent(variant, entry), `${id}: actual transforms implement a noticeable ${variant} transition`);
            assert(!matches(entry, middle), `${id}: the transition follows scroll rather than a static pose`);
            signatures.add(JSON.stringify(motionOnly(entry).slice(0, 1)));
        } else {
            assert(matches(entry, middle), `${id}: reduced-motion pose does not change with scroll`);
        }
        await locate(id, .35);
        const reading = await sample(id);
        assert(reading.words.length === reading.text.split(' ').length, `${id}: every word is present without semantic duplicates`);
        assert(await page.getByRole('heading', { name: reading.text, exact: true, level: 2 }).count() === 1, `${id}: accessible heading name is exact and unique`);
        assert(await page.locator(`#${id}`).getAttribute('aria-labelledby') === `${id}-title`, `${id}: section retains its heading linkage`);
        assert(reading.words.every((word) => word.opacity >= .99 && identity(word.matrix) && word.clipped <= 1 && word.height > 0 && word.visibleHeight >= word.height * .95), `${id}: all words settle to fully visible identity geometry`);
        assert(reading.words.every((word) => word.clip === 'none' || ![...word.clip.matchAll(/([\d.]+)%/g)].some((match) => Number(match[1]) > .1)), `${id}: no residual scan clipping in reading state`);
        assert(reading.letters.every((letter) => identity(letter.matrix) && letter.opacity >= .99), `${id}: letter motion settles without distortion`);
        assert(reading.echoes.every((echo) => echo.opacity < .001), `${id}: no ghost text remains after assembly`);
        assert(reading.lines.every((line) => Math.abs(line.matrix[0] - 1) < .002), `${id}: drawn underlines complete`);
        assert(reading.overflow <= 1, `${id}: settled state has no page overflow`);
        await page.waitForTimeout(350);
        assert(matches(reading, await sample(id)), `${id}: heading remains still when scrolling stops`);
        await locate(id, .2);
        assert(matches(reading, await sample(id)), `${id}: heading remains readable after its entrance completes`);
        await locate(id, .85);
        assert(matches(entry, await sample(id)), `${id}: upward scroll restores the entrance pose`);
        if (MODE === 'reduced') {
            assert(entry.words.every((word) => identity(word.matrix) && word.opacity === 1)
                && entry.letters.every((letter) => identity(letter.matrix) && letter.opacity === 1)
                && entry.echoes.length === 0, `${id}: reduced motion has no transforms or layered copies`);
        }
    }
    if (MODE !== 'reduced') assert(signatures.size === 6, `the six unchanged headings retain distinct measured trajectories (${signatures.size})`);
    if (MODE === 'font-blocked') assert(blocked > 0, 'font fallback mode genuinely blocked font requests');
    assert(errors.length === 0, `no runtime errors (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(`FAIL ${error.stack}`);
} finally {
    await browser.close();
}
console.log(`\nHeading motion ${WIDTH}x${HEIGHT} ${MODE}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
