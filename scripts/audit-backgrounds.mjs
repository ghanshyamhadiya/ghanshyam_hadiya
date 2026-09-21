import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
const HEIGHT = Number(process.argv[5] ?? (WIDTH < 768 ? 844 : 900));
const STATIC = MODE === 'reduced' || HEIGHT <= 600;
const PRESETS = ['ambient', 'contours', 'paper'];
if (!['normal', 'reduced'].includes(MODE) || WIDTH < 320 || HEIGHT < 400) throw new Error('Invalid background audit arguments');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference' });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
let failures = 0;
const assert = (ok, label) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${label}`);
};
const seek = async (id, progress) => {
    await page.locator(`#${id} [data-scene-track]`).evaluate((track, value) => {
        const bounds = track.getBoundingClientRect();
        const pin = parseFloat(getComputedStyle(track.closest('section')).getPropertyValue('--scene-pin-top'));
        window.scrollTo({ top: bounds.top + scrollY - pin + bounds.height * value, behavior: 'instant' });
    }, progress);
    await page.waitForTimeout(850);
};
const sample = (id) => page.locator(`#${id} [data-background-moving]`).evaluate((element) => {
    const style = getComputedStyle(element);
    const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
    return { matrix: [...matrix.toFloat64Array()], transform: style.transform, curve: style.borderBottomLeftRadius };
});
const samePose = (a, b) => a.matrix.every((value, index) => Math.abs(value - b.matrix[index]) < .01) && a.curve === b.curve;
const luminance = (channels) => channels.map((value) => {
    const channel = value / 255;
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
const rgb = (hex) => hex.replace('#', '').match(/../g).map((value) => parseInt(value, 16));
const contrast = (foreground, background) => (luminance(background) + .05) / (luminance(foreground) + .05);
const openPanel = async () => {
    if (await page.locator('[data-background-lab-panel]').isHidden()) await page.locator('[data-background-lab-toggle]').click();
};
const screenshot = async (preset, name) => {
    if (process.env.CAPTURE_BACKGROUND === '1' && MODE === 'normal') await page.screenshot({ path: `refs/background-${preset}-${WIDTH}-${name}.png` });
};
try {
    const clean = new URL(BASE);
    clean.search = '';
    clean.hash = 'about';
    await page.goto(clean.href, { waitUntil: 'networkidle' });
    assert(await page.locator('[data-background-preset="paper"]').count() === 8, 'Paper is the default for hero and all seven sections');
    assert(await page.locator('[data-background-art="paper"]').count() === 8, 'default Paper decoration is actually mounted');
    assert(await page.locator('[data-background-lab], [data-motion-lab]').count() === 0, 'preview controls remain opt-in');
    const url = new URL(clean);
    url.searchParams.set('background-preview', '1');
    url.searchParams.set('keep', 'yes');
    await page.goto(url.href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    assert(await page.locator('[data-background-option]').count() === 3, 'three background choices are available');
    assert(await page.locator('[data-background-preset="paper"]').count() === 8, 'preview opens with the selected Paper background');
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (const preset of PRESETS) {
        await openPanel();
        const scrollBefore = await page.evaluate(() => scrollY);
        await page.locator(`[data-background-option="${preset}"]`).click();
        await page.waitForTimeout(150);
        assert(await page.locator(`[data-background-preset="${preset}"]`).count() === 8, `${preset}: all eight surfaces switch together`);
        assert(await page.locator(`[data-background-art="${preset}"]`).count() === 8, `${preset}: real decorative layers are mounted`);
        assert(await page.locator('[data-background-option][aria-pressed="true"]').count() === 1, `${preset}: exactly one accessible selection`);
        assert(await page.locator('[data-cinematic-section][data-motion-preset="curtain"]').count() === 7, `${preset}: Curtain remains selected in every section`);
        const current = new URL(page.url());
        assert(current.searchParams.get('background') === preset && current.searchParams.get('keep') === 'yes' && current.hash === '#about', `${preset}: URL preserves selection, other parameters and hash`);
        assert(Math.abs(await page.evaluate(() => scrollY) - scrollBefore) <= 1, `${preset}: switching does not jump the viewport`);
        assert(Math.abs(await page.evaluate(() => document.documentElement.scrollHeight) - pageHeight) <= 1, `${preset}: switching does not change document geometry`);
        const safety = await page.locator('[data-background-art]').evaluateAll((elements) => elements.map((element) => {
            const style = getComputedStyle(element);
            const surface = element.closest('section');
            const parent = getComputedStyle(surface);
            const content = surface.querySelector('[data-hero-content]') ?? surface.querySelector('[data-scene-lead]').parentElement;
            return {
                hidden: element.getAttribute('aria-hidden'), pointer: style.pointerEvents, position: style.position, z: style.zIndex,
                parentTransform: parent.transform, overflowY: parent.overflowY, contentZ: getComputedStyle(content).zIndex,
                interactive: element.querySelectorAll('a,button,input,[tabindex]').length,
                mode: element.dataset.backgroundMode,
                inverted: element.dataset.backgroundInverted,
                glow: style.getPropertyValue('--backdrop-glow').trim(),
                line: style.getPropertyValue('--backdrop-line').trim(),
                paper: style.getPropertyValue('--backdrop-paper').trim(),
            };
        }));
        assert(safety.every((state) => state.hidden === 'true' && state.pointer === 'none' && state.position === 'absolute' && state.z === '0' && Number(state.contentZ) > 0 && state.interactive === 0), `${preset}: decoration is inert and behind real content`);
        assert(safety.every((state) => state.parentTransform === 'none' && state.overflowY === 'visible'), `${preset}: no transformed or clipped section ancestors`);
        assert(safety.every((state) => state.mode === (STATIC ? 'static' : 'scroll')), `${preset}: correct static/scroll background mode`);
        assert(safety.filter((state) => state.inverted === 'true').length === 1, `${preset}: dark Work background has its own palette`);
        assert(safety.filter((state) => state.inverted === 'false').every((state) => state.glow === '#e7eee4' && state.line === '#e8ede7' && ['#eef1eb', '#fbfaf7'].includes(state.paper)), `${preset}: light surfaces retain the reviewed contrast-safe colours`);
        const subtle = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-subtle').trim());
        const grainOpacity = preset === 'ambient' ? Number(await page.locator('.backdrop-grain').first().evaluate((element) => getComputedStyle(element).opacity)) : 0;
        const floor = preset === 'ambient' ? rgb('#e7eee4').map((value) => value * (1 - grainOpacity)) : rgb(preset === 'paper' ? '#eef1eb' : '#e8ede7');
        assert(grainOpacity <= .008 && contrast(rgb(subtle), floor) >= 4.5, `${preset}: conservative light-background floor preserves small-text contrast`);
        const bounds = await page.locator('[data-background-lab]').boundingBox();
        assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= WIDTH && bounds.y >= 0 && bounds.y + bounds.height <= HEIGHT, `${preset}: controls fit the screen`);
        await page.locator('[data-background-lab-toggle]').click();
        assert(await page.locator('[data-background-lab-panel]').isHidden(), `${preset}: panel can be dismissed without changing the background`);
        await seek('about', 0);
        const start = await sample('about');
        await seek('about', 1);
        const end = await sample('about');
        assert(STATIC ? samePose(start, end) && end.transform === 'none' : !samePose(start, end), `${preset}: ${STATIC ? 'static background stays still' : 'background responds to actual scrolling'}`);
        await page.waitForTimeout(350);
        assert(samePose(end, await sample('about')), `${preset}: motion stops when scrolling stops`);
        await screenshot(preset, 'about');
        await seek('about', 0);
        assert(samePose(start, await sample('about')), `${preset}: reverse scroll restores the initial background pose`);
        if (WIDTH >= 768) {
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            await page.waitForTimeout(850);
            await screenshot(preset, 'hero');
            await seek('work', 1);
            await screenshot(preset, 'work');
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${preset}: no horizontal overflow`);
    }
    await openPanel();
    await page.locator('[data-background-original]').click();
    assert(await page.locator('[data-background-art]').count() === 0 && await page.locator('[data-background-preset="plain"]').count() === 8, 'Original removes every decorative layer');
    await page.locator('[data-background-option="contours"]').focus();
    await page.keyboard.press('Space');
    assert(await page.locator('[data-background-art="contours"]').count() === 8, 'background selection is keyboard accessible');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1400);
    assert(await page.locator('[data-background-art="contours"]').count() === 8, 'selected background survives reload');
    const links = await page.locator('a[download]').evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
    assert(links.length >= 3 && links.every((href) => href === '/GhanshyamHadiya.pdf'), 'new resume remains linked');
    const both = new URL(url);
    both.searchParams.set('motion-preview', '1');
    await page.goto(both.href, { waitUntil: 'networkidle' });
    assert(await page.locator('[data-motion-lab]').count() === 1 && await page.locator('[data-background-lab]').count() === 0, 'explicit motion lab takes priority without overlapping docks');
    const invalid = new URL(clean);
    invalid.searchParams.set('background', 'unknown');
    await page.goto(invalid.href, { waitUntil: 'networkidle' });
    assert(await page.locator('[data-background-art="paper"]').count() === 8 && await page.locator('[data-background-lab]').count() === 0, 'unknown background safely returns to Paper without preview controls');
    assert(errors.length === 0, `no runtime errors (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(error.stack);
} finally {
    await browser.close();
}
console.log(`Backgrounds ${WIDTH}x${HEIGHT} ${MODE}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
