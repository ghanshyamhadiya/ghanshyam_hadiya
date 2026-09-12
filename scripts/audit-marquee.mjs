import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
if (!['normal', 'reduced'].includes(MODE) || !Number.isInteger(WIDTH) || WIDTH < 320) {
    throw new Error('Usage: node scripts/audit-marquee.mjs BASE WIDTH normal|reduced');
}

let failures = 0;
const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};
const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 768 ? 800 : 900 },
    reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

const readMotion = () => page.locator('[data-marquee-track]').evaluateAll((tracks) => tracks.map((track) => {
    const style = getComputedStyle(track);
    return {
        x: new DOMMatrixReadOnly(style.transform).m41,
        time: performance.now(),
        state: style.animationPlayState,
        animation: style.animationName,
    };
}));
const movement = async () => {
    const before = await readMotion();
    await page.waitForTimeout(400);
    const after = await readMotion();
    return after.map((value, index) => ({
        distance: value.x - before[index].x,
        velocity: (value.x - before[index].x) * 1000 / (value.time - before[index].time),
        state: value.state,
    }));
};
const centerTicker = async () => {
    await page.locator('[data-marquee-wrapper]').evaluate((wrapper) => {
        window.scrollTo({ top: wrapper.getBoundingClientRect().top + window.scrollY - (window.innerHeight - wrapper.offsetHeight) / 2, behavior: 'instant' });
    });
    await page.waitForTimeout(350);
};

try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    assert((await page.title()).includes('Ghanshyam'), `correct portfolio served at ${BASE}`);
    await page.waitForFunction(() => !document.querySelector('[data-intro-curtain]'), undefined, { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#home').evaluate((hero) => window.scrollTo({ top: hero.offsetHeight * 0.45, behavior: 'instant' }));
    await page.waitForTimeout(1000);
    const heroReading = await page.locator('[data-hero-content]').evaluate((content) => ({
        opacity: Number(getComputedStyle(content).opacity),
        visibleLinks: [...content.querySelectorAll('a')].filter((link) => {
            const r = link.getBoundingClientRect();
            return r.top < innerHeight && r.bottom > 0;
        }).length,
    }));
    assert(heroReading.opacity === 1 && heroReading.visibleLinks > 0, 'hero content remains opaque while its links are still in view');
    const bands = page.locator('[data-marquee-band]');
    const count = await bands.count();
    assert(count === 2, `two ticker rows expose data-marquee-band (found ${count})`);
    assert(await page.locator('[data-marquee-wrapper]').count() === 1, 'ticker exposes its cream wrapper');
    if (count !== 2) throw new Error('Cannot audit ticker geometry without two band contract markers');
    await centerTicker();
    await page.mouse.move(WIDTH - 1, 1);

    const geometry = await page.evaluate(() => {
        const wrapper = document.querySelector('[data-marquee-wrapper]');
        const wr = wrapper.getBoundingClientRect();
        const hero = document.querySelector('#home');
        const stats = document.querySelector('#impact');
        const rows = [...document.querySelectorAll('[data-marquee-band]')].map((band) => {
            const rect = band.getBoundingClientRect();
            const viewport = band.querySelector('[data-marquee-viewport]');
            const vr = viewport?.getBoundingClientRect();
            const track = band.querySelector('[data-marquee-track]');
            const groups = [...band.querySelectorAll('[data-marquee-group]')];
            const style = track && getComputedStyle(track);
            const glyphFailures = [...band.querySelectorAll('[data-marquee-item]')].flatMap((item) => {
                const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
                const failures = [];
                let node;
                while ((node = walker.nextNode())) {
                    for (let offset = 0; offset < node.length; offset += 1) {
                        if (!node.textContent[offset].trim()) continue;
                        const range = document.createRange();
                        range.setStart(node, offset);
                        range.setEnd(node, offset + 1);
                        const glyph = range.getBoundingClientRect();
                        if (glyph.top < rect.top + 1 || glyph.bottom > rect.bottom - 1 ||
                            (vr && (glyph.top < vr.top || glyph.bottom > vr.bottom))) {
                            failures.push({ glyph: node.textContent[offset], top: glyph.top, bottom: glyph.bottom });
                        }
                    }
                }
                return failures;
            });
            let clean = true;
            for (let element = band; element && element !== wrapper.parentElement; element = element.parentElement) {
                const css = getComputedStyle(element);
                const matrix = new DOMMatrixReadOnly(css.transform);
                clean &&= css.filter === 'none' && ['none', '0deg'].includes(css.rotate) &&
                    Math.abs(matrix.b) < 0.0001 && Math.abs(matrix.c) < 0.0001 && Math.abs(matrix.m42) < 0.01;
            }
            return {
                top: rect.top, bottom: rect.bottom, height: rect.height, clean, glyphFailures,
                widths: groups.map((group) => group.getBoundingClientRect().width),
                copiesMatch: groups.length === 2 && groups[0].textContent === groups[1].textContent,
                hidden: groups.map((group) => group.getAttribute('aria-hidden')),
                trailingGap: groups[0] && parseFloat(getComputedStyle(groups[0]).paddingRight),
                groupGap: groups[0] && parseFloat(getComputedStyle(groups[0]).columnGap),
                trackGap: style && (parseFloat(style.columnGap) || 0),
                trackWidth: track?.getBoundingClientRect().width,
                direction: style?.animationDirection,
                duration: style && parseFloat(style.animationDuration),
                animation: style?.animationName,
                scrollable: viewport && ['auto', 'scroll'].includes(getComputedStyle(viewport).overflowX),
                focusable: viewport?.tabIndex === 0,
                viewportWidth: viewport?.clientWidth,
                viewportScrollWidth: viewport?.scrollWidth,
                color: getComputedStyle(band).backgroundColor,
            };
        });
        const coveredContent = ['#home h1', '#home p', '#home a', '#impact dt', '#impact dd'].flatMap((selector) =>
            [...document.querySelectorAll(selector)].filter((element) => {
                const rect = element.getBoundingClientRect();
                return rect.width && rect.height && rows.some((row) => rect.bottom > row.top && rect.top < row.bottom);
            }).map((element) => element.textContent.trim().slice(0, 50)));
        return {
            rows, coveredContent,
            wrapperColor: getComputedStyle(wrapper).backgroundColor,
            wrapperHeight: wr.height,
            heroClear: !hero || hero.getBoundingClientRect().bottom <= wr.top + 1,
            statsClear: !stats || stats.getBoundingClientRect().top >= wr.bottom - 1,
            pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
        };
    });
    assert(geometry.wrapperColor === 'rgb(255, 247, 236)', 'wrapper preserves cream canvas');
    assert(geometry.rows[0].color === 'rgb(255, 30, 142)' && geometry.rows[1].color === 'rgb(51, 44, 129)', 'pink and indigo colours preserved');
    assert(geometry.rows[1].top - geometry.rows[0].bottom >= 8, 'opposite rows have at least 8px clear separation');
    assert(geometry.wrapperHeight <= 230, `tools remain compact (${geometry.wrapperHeight}px wrapper)`);
    assert(geometry.heroClear && geometry.statsClear, 'wrapper has no negative vertical overlap with Hero or Stats');
    assert(geometry.coveredContent.length === 0, `Hero/Stats content is not covered (${geometry.coveredContent.join(', ') || 'clear'})`);
    assert(geometry.pageOverflow <= 1, `page has no horizontal overflow (${geometry.pageOverflow}px)`);
    geometry.rows.forEach((row, index) => {
        assert(row.clean, `row ${index + 1}: no rotation, blur, skew or vertical translation`);
        assert(row.glyphFailures.length === 0, `row ${index + 1}: all text glyphs fit vertically inside band and viewport (${row.glyphFailures.length} clipped)`);
        assert(row.focusable, `row ${index + 1}: reading viewport is keyboard reachable`);
        if (MODE === 'normal') {
            assert(row.widths.length === 2 && Math.abs(row.widths[0] - row.widths[1]) < 0.5, `row ${index + 1}: equal-width groups (${row.widths.join(', ')})`);
            assert(row.copiesMatch && row.hidden[0] !== 'true' && row.hidden[1] === 'true', `row ${index + 1}: identical duplicate is aria-hidden`);
            assert(row.widths[0] >= row.viewportWidth, `row ${index + 1}: one group covers the viewport`);
            assert(row.trackGap === 0 && Math.abs(row.trackWidth - 2 * row.widths[0]) < 1, `row ${index + 1}: no track gap; half-track equals one group`);
            assert(row.trailingGap > 0 && row.trailingGap === row.groupGap, `row ${index + 1}: trailing gap is included in the group`);
            assert(Math.abs(row.widths[0] / row.duration - 26) < 0.1, `row ${index + 1}: measured duration gives 26px/sec (${row.duration}s)`);
        } else {
            assert(row.widths.length === 1 && row.hidden[0] !== 'true', `row ${index + 1}: reduced motion has one readable copy`);
            assert(row.animation === 'none' && row.scrollable, `row ${index + 1}: reduced motion is static and horizontally scrollable`);
        }
    });

    if (MODE === 'normal') {
        assert(geometry.rows[0].direction === 'normal' && geometry.rows[1].direction === 'reverse', 'tracks run in opposite directions');
        const live = await movement();
        assert(live[0].velocity < -20 && live[0].velocity > -32 && live[1].velocity > 20 && live[1].velocity < 32, `actual movement is smooth ~26px/sec (${live.map((row) => row.velocity.toFixed(2)).join(', ')})`);
        const loop = await page.locator('[data-marquee-track]').evaluateAll(async (tracks) => {
            const results = [];
            for (const track of tracks) {
                const animation = track.getAnimations()[0];
                if (!animation) { results.push({ distance: 0, width: 1, seam: 99 }); continue; }
                const previousTime = animation.currentTime;
                const duration = animation.effect.getTiming().duration;
                animation.currentTime = 0;
                const start = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
                animation.currentTime = duration - 0.01;
                const end = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
                const groups = track.querySelectorAll('[data-marquee-group]');
                const first = groups[0].firstElementChild.getBoundingClientRect();
                const next = groups[1].firstElementChild.getBoundingClientRect();
                const width = groups[0].getBoundingClientRect().width;
                results.push({ distance: Math.abs(end - start), width, seam: Math.abs(next.left - first.left - width) });
                animation.currentTime = previousTime;
            }
            return results;
        });
        assert(loop.every((row) => Math.abs(row.distance - row.width) < 0.1 && row.seam < 0.1), `actual keyframe loop distance equals one group with no seam (${JSON.stringify(loop)})`);
        const toggle = page.locator('[data-marquee-toggle]');
        assert(await toggle.count() === 1 && await toggle.evaluate((element) => element.tagName === 'BUTTON' && !element.disabled), 'one native keyboard-accessible pause/resume control');
        await toggle.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);
        assert(await toggle.getAttribute('aria-pressed') === 'true' && /resume/i.test(await toggle.innerText()), 'keyboard Enter pauses and offers Resume');
        assert((await movement()).every((row) => Math.abs(row.distance) < 0.1 && row.state === 'paused'), 'pause control actually freezes both transforms');
        await page.keyboard.press('Space');
        await page.waitForTimeout(100);
        assert(await toggle.getAttribute('aria-pressed') === 'false' && /pause/i.test(await toggle.innerText()), 'keyboard Space resumes and offers Pause');
        assert((await movement()).every((row) => Math.abs(row.distance) > 5), 'resume control actually restarts both transforms');
        for (let index = 0; index < 2; index += 1) {
            await bands.nth(index).hover();
            await page.waitForTimeout(100);
            assert(Math.abs((await movement())[index].distance) < 0.1, `row ${index + 1}: hover pauses actual motion`);
            await page.mouse.move(WIDTH - 1, 1);
            await bands.nth(index).locator('[data-marquee-viewport]').focus();
            await page.waitForTimeout(100);
            assert(Math.abs((await movement())[index].distance) < 0.1, `row ${index + 1}: keyboard focus pauses actual motion`);
            await toggle.focus();
        }
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }); });
        await page.waitForTimeout(500);
        assert((await movement()).every((row) => Math.abs(row.distance) < 0.1 && row.state === 'paused'), 'offscreen tracks stop their transforms');
        await centerTicker();
        assert((await movement()).every((row) => Math.abs(row.distance) > 5), 'visible tracks resume after returning onscreen');
        await page.setViewportSize({ width: WIDTH < 640 ? 768 : 390, height: WIDTH < 768 ? 800 : 900 });
        await page.waitForTimeout(250);
        const resized = await page.locator('[data-marquee-track]').evaluateAll((tracks) => tracks.map((track) => {
            const width = track.firstElementChild.getBoundingClientRect().width;
            return { width, speed: width / parseFloat(getComputedStyle(track).animationDuration) };
        }));
        assert(resized.every((row, index) => Math.abs(row.width - geometry.rows[index].widths[0]) > 10 && Math.abs(row.speed - 26) < 0.1), `ResizeObserver remeasures changed groups and preserves pixel speed (${JSON.stringify(resized)})`);
        await page.setViewportSize({ width: WIDTH, height: WIDTH < 768 ? 800 : 900 });
    } else {
        assert(await page.locator('[data-marquee-toggle]').count() === 0, 'reduced motion has no unnecessary pause control');
        assert((await movement()).every((row) => Math.abs(row.distance) < 0.1), 'reduced-motion transforms stay still');
        for (let index = 0; index < 2; index += 1) {
            const viewport = bands.nth(index).locator('[data-marquee-viewport]');
            await viewport.focus();
            await page.keyboard.press('End');
            await viewport.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
            const reachable = await viewport.evaluate((element) => {
                const last = element.querySelector('[data-marquee-group]').lastElementChild.getBoundingClientRect();
                const bounds = element.getBoundingClientRect();
                return last.right <= bounds.right + 1 && last.left >= bounds.left && element.scrollLeft > 0;
            });
            assert(reachable, `row ${index + 1}: last tool can be scrolled fully into view`);
        }
    }
    for (const id of ['process', 'contact']) {
        const samples = [];
        for (const position of [0.95, 0.35, 0.95]) {
            await page.locator(`#${id}`).evaluate((section, position) => {
                window.scrollTo({ top: section.getBoundingClientRect().top + scrollY - innerHeight * position, behavior: 'instant' });
            }, position);
            await page.waitForTimeout(1000);
            samples.push(await page.locator(`#${id}`).evaluate((section) => {
                const rect = section.getBoundingClientRect();
                const label = section.querySelector('[data-heading-label]').getBoundingClientRect();
                return { radius: parseFloat(getComputedStyle(section).borderTopLeftRadius), height: rect.height, top: rect.top + scrollY, labelTop: label.top + scrollY };
            }));
        }
        assert(samples.every((s) => Math.abs(s.height - samples[0].height) < 1 && Math.abs(s.top - samples[0].top) < 1 && Math.abs(s.labelTop - samples[0].labelTop) < 1), `${id}: surface motion does not move section or label geometry`);
        assert(MODE === 'reduced' ? samples.every((s) => s.radius === samples[0].radius) : samples[0].radius - samples[1].radius > 10 && Math.abs(samples[2].radius - samples[0].radius) < 1, `${id}: section corners ${MODE === 'reduced' ? 'stay static' : 'glide and reverse with scroll'}`);
    }
    assert(errors.length === 0, `no browser runtime errors (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(`FAIL ${error.message}`);
} finally {
    await browser.close();
}
console.log(`\nMarquee ${WIDTH}px ${MODE}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
