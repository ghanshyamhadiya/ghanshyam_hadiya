import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 390);
const MODE = process.argv[4] ?? 'normal';
const HEIGHT = Number(process.argv[5] ?? (WIDTH < 768 ? 844 : 900));
const PRESETS = ['cinema', 'lateral', 'curtain', 'depth'];
const STATIC = MODE === 'reduced' || HEIGHT <= 600;
if (!['normal', 'reduced'].includes(MODE) || WIDTH < 320 || HEIGHT < 400) throw new Error('Invalid viewport or mode');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference' });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
let failures = 0;
const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};
const seek = async (progress) => {
    await page.locator('#about [data-scene-track]').evaluate((track, value) => {
        const r = track.getBoundingClientRect();
        const pin = parseFloat(getComputedStyle(track.closest('section')).getPropertyValue('--scene-pin-top'));
        window.scrollTo({ top: r.top + scrollY - pin + r.height * value, behavior: 'instant' });
    }, progress);
    await page.waitForTimeout(850);
};
const pose = () => page.locator('#about [data-cinematic-heading]').evaluate((element) => ({ transform: getComputedStyle(element).transform, clip: getComputedStyle(element).clipPath }));
const url = new URL(BASE);
url.searchParams.set('motion', 'cinema');
url.searchParams.set('motion-preview', '1');
url.searchParams.set('keep', 'yes');
url.hash = 'about';
try {
    const clean = new URL(BASE);
    clean.search = '';
    clean.hash = 'about';
    await page.goto(clean.href, { waitUntil: 'networkidle' });
    assert(await page.locator('[data-motion-lab]').count() === 0, 'normal pages hide experiment controls');
    assert(await page.locator('[data-cinematic-section][data-motion-preset="curtain"]').count() === 7, 'all seven sections use Curtain by default');
    await page.goto(url.href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    assert(await page.locator('[data-motion-option]').count() === 4, 'all four preview options are available');
    await seek(.5);
    const snapshots = [];
    for (const preset of PRESETS) {
        const y = await page.evaluate(() => scrollY);
        await page.locator(`[data-motion-option="${preset}"]`).click();
        await page.waitForTimeout(200);
        assert(await page.locator(`[data-motion-option="${preset}"]`).getAttribute('aria-pressed') === 'true', `${preset}: selection is accessible`);
        assert(await page.locator('[data-motion-option][aria-pressed="true"]').count() === 1, `${preset}: exactly one direction is selected`);
        assert(await page.locator(`[data-cinematic-section][data-motion-preset="${preset}"]`).count() === 7, `${preset}: all seven sections update without a reload`);
        const current = new URL(page.url());
        assert(current.searchParams.get('motion') === preset && current.searchParams.get('keep') === 'yes' && current.hash === '#about', `${preset}: URL retains the direction, unrelated query and hash`);
        assert(Math.abs(await page.evaluate(() => scrollY) - y) <= 1, `${preset}: selecting a direction does not move the viewport`);
        const state = await pose();
        snapshots.push(JSON.stringify(state));
        if (STATIC) assert(state.transform === 'none' && state.clip === 'none', `${preset}: static mode has no motion or masking`);
        const bounds = await page.locator('[data-motion-lab]').boundingBox();
        assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= WIDTH && bounds.y >= 0 && bounds.y + bounds.height <= HEIGHT,
            `${preset}: preview controls fit the viewport`);
    }
    if (!STATIC) assert(new Set(snapshots).size === 4, 'four visibly distinct heading poses at the same scroll position');
    await page.locator('[data-motion-lab-toggle]').click();
    assert(await page.locator('[data-motion-lab-panel]').isHidden(), 'controls collapse without choosing a direction');
    assert(await page.locator('[data-motion-lab-toggle]').evaluate((element) => element === document.activeElement), 'collapse keeps focus on the toggle');
    await page.keyboard.press('Enter');
    assert(await page.locator('[data-motion-lab-panel]').isVisible(), 'keyboard reopens the controls');
    await page.locator('[data-motion-option="lateral"]').focus();
    await page.keyboard.press('Space');
    assert(await page.locator('[data-cinematic-section][data-motion-preset="lateral"]').count() === 7, 'keyboard can select a direction');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1400);
    assert(await page.locator('[data-cinematic-section][data-motion-preset="lateral"]').count() === 7, 'chosen direction survives reload through the URL');
    await seek(1);
    await page.locator('[data-motion-replay]').click();
    await page.waitForTimeout(1100);
    const replay = await page.locator('#about').evaluate((section) => {
        const track = section.querySelector('[data-scene-track]').getBoundingClientRect();
        const pin = parseFloat(getComputedStyle(section).getPropertyValue('--scene-pin-top'));
        return { trackTop: track.top, pin, locked: getComputedStyle(document.body).overflowY === 'hidden' };
    });
    assert(Math.abs(replay.trackTop - replay.pin - 32) < 3 && !replay.locked, 'Replay returns to the current section opening without locking scroll');
    const links = await page.locator('a[download]').evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
    assert(links.length >= 3 && links.every((href) => href === '/GhanshyamHadiya.pdf'), 'CV links retain the new resume');
    if (WIDTH < 1024) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(850);
        await page.getByRole('button', { name: 'Open menu', exact: true }).click();
        await page.getByRole('dialog', { name: 'Site navigation' }).waitFor();
        await page.getByRole('dialog').getByRole('button', { name: 'Close menu', exact: true }).click();
        await page.getByRole('dialog', { name: 'Site navigation' }).waitFor({ state: 'detached' });
        assert(await page.evaluate(() => getComputedStyle(document.body).overflowY !== 'hidden'), 'mobile menu close restores scrolling');
    }
    await page.evaluate(() => {
        const url = new URL(location.href);
        url.searchParams.set('motion', 'depth');
        history.pushState(history.state, '', url);
        dispatchEvent(new PopStateEvent('popstate'));
    });
    assert(await page.locator('[data-cinematic-section][data-motion-preset="depth"]').count() === 7, 'history navigation synchronizes all sections');
    const invalid = new URL(url);
    invalid.searchParams.set('motion', 'unknown');
    await page.goto(invalid.href, { waitUntil: 'networkidle' });
    assert(await page.locator('[data-cinematic-section][data-motion-preset="curtain"]').count() === 7, 'unknown direction falls back safely to Curtain');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'no horizontal overflow');
    assert(errors.length === 0, `no runtime errors (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(error.stack);
} finally {
    await browser.close();
}
console.log(`Motion lab ${WIDTH}x${HEIGHT} ${MODE}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
