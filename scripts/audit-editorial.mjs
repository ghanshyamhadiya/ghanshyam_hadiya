import { chromium } from 'playwright';
import { profile } from '../src/data/profile.js';
import { certifications } from '../src/data/credentials.js';
import { featuredProjects } from '../src/data/projects.js';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
const HEIGHT = Number(process.argv[5] ?? (WIDTH < 768 ? 844 : 900));
if (!Number.isInteger(WIDTH) || WIDTH < 320 || !Number.isInteger(HEIGHT) || HEIGHT < 500 || !['normal', 'reduced', 'font-blocked'].includes(MODE)) {
    throw new Error('Usage: node scripts/audit-editorial.mjs BASE WIDTH normal|reduced|font-blocked [HEIGHT]');
}
const titles = {
    about: 'What I actually do',
    process: 'Four steps, every time',
    skills: 'The stack, layer by layer',
    experience: "Where I've done it",
    work: "Pipelines I've built",
    credentials: certifications.length ? 'Certifications & education' : 'Education',
    contact: 'Let’s talk',
};
const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference',
    hasTouch: WIDTH < 768,
});
let failures = 0;
let blockedFonts = 0;
const errors = [];
const worldRequests = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('request', (request) => {
    if (/\/src\/three\/|\.(glb|gltf)(\?|$)|\/assets\/(dataWorld|world)-/.test(request.url())) worldRequests.push(request.url());
});
const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};
const scrollTo = async (selector, fraction) => {
    await page.locator(selector).first().evaluate((element, position) => {
        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - innerHeight * position, behavior: 'instant' });
    }, fraction);
    await page.waitForTimeout(850);
};
const wordState = (selector) => page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    const m = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
    return { x: m.m41, y: m.m42, opacity: Number(style.opacity) };
});
const settled = () => page.waitForFunction(() => {
    const names = [...document.querySelectorAll('[data-hero-name-target]')];
    return names.length === 2 && names.every((element) => Number(getComputedStyle(element).opacity) > .99)
        && !document.querySelector('[data-intro-overlay]') && document.querySelector('header')?.inert === false;
}, undefined, { timeout: 20000 });

try {
    if (MODE === 'font-blocked') {
        await page.route('**/*.woff*', (route) => { blockedFonts += 1; return route.abort(); });
    }
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.locator('#home h1').waitFor();
    await page.keyboard.press('Escape');
    await settled();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(350);
    assert((await page.title()).includes('Ghanshyam'), 'correct portfolio served');
    assert(await page.locator('[data-design="editorial"]').count() === 1, 'editorial design is the live entry');
    assert(await page.locator('canvas, [data-world-layer], [data-station], [data-system-background], .data-scene-panel, [data-hero-figure-slot]').count() === 0, 'no avatar, decorative 3D panels, background grids or WebGL layer');
    assert(await page.locator('#home img').count() === 0, 'hero stays photo-free');
    assert(await page.locator('#home h1').count() === 1, 'one semantic h1');
    const actualName = (await page.locator('#home h1').innerText()).replace(/\s+/g, ' ').trim();
    assert(actualName === profile.nameLines.join(' '), `hero name preserved (${actualName})`);
    assert((await page.locator('[data-hero-intro]').innerText()).trim() === profile.intro, 'hero intro copy is unchanged');
    const colors = await page.evaluate(() => ({
        hero: getComputedStyle(document.querySelector('#home')).backgroundColor,
        body: getComputedStyle(document.body).backgroundColor,
        nativeCursor: !document.body.classList.contains('has-blob-cursor'),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    assert(colors.hero === 'rgb(247, 246, 242)' && colors.body === 'rgb(247, 246, 242)', 'hero and page use the off-white paper surface');
    assert(colors.nativeCursor, 'native cursor remains available');
    assert(colors.overflow <= 1, `no horizontal page overflow (${colors.overflow}px)`);
    const cta = page.locator('#home a[href="#work"]').first();
    const ctaBox = await cta.boundingBox();
    assert(ctaBox && ctaBox.y >= 0 && ctaBox.y + ctaBox.height <= HEIGHT, 'View work is visible in the initial viewport');
    const resume = page.locator('#home a[download]').first();
    assert(await resume.getAttribute('href') === profile.resume.href, 'CV keeps its real download target');
    if (MODE === 'font-blocked') assert(blockedFonts > 0, 'font failure mode genuinely intercepted font requests');

    const nameBefore = await wordState('[data-editorial-drift]');
    await page.evaluate(() => window.scrollTo({ top: 180, behavior: 'instant' }));
    await page.waitForTimeout(850);
    const nameAfter = await wordState('[data-editorial-drift]');
    assert(MODE === 'reduced' ? Math.abs(nameAfter.x - nameBefore.x) < .1 : nameAfter.x < nameBefore.x - 2,
        MODE === 'reduced' ? 'reduced motion disables hero drift' : 'hero name has a real scroll-linked inward drift');
    assert(Number(await page.locator('[data-hero-content]').evaluate((element) => getComputedStyle(element).opacity)) === 1, 'readable hero content does not fade on scroll');

    for (const [id, title] of Object.entries(titles)) {
        assert(await page.getByRole('heading', { level: 2, name: title, exact: true }).count() === 1, `${id}: exact accessible heading`);
        assert(await page.locator(`#${id}`).getAttribute('aria-labelledby') === `${id}-title`, `${id}: section labels remain linked`);
        assert(await page.locator(`#${id} h2[data-cinematic-heading]`).count() === 1, `${id}: shared cinematic heading is mounted`);
        assert(await page.locator(`#${id} [data-editorial-word], #${id} [data-heading-mask], #${id} [data-heading-echo]`).count() === 0, `${id}: no legacy word effects`);
        await scrollTo(`#${id} [data-scene-content]`, .32);
        assert(await page.locator(`#${id} [data-scene-content]`).evaluate((element) => Number(getComputedStyle(element).opacity)) >= .99, `${id}: content is fully readable after its scene`);
        const visual = await page.locator(`#${id}-title [data-scene-line]`).allTextContents();
        assert(visual.join(' ') === title, `${id}: complete visual heading copy is preserved`);
        if (id === 'about') {
            const aboutCopy = await page.locator('#about [data-scene-content] > div > p').allTextContents();
            assert(JSON.stringify(aboutCopy) === JSON.stringify(profile.about), 'cinematic About preserves every profile paragraph');
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${id}: no page overflow`);
    }

    assert(await page.locator('[data-process-step]').count() === 4, 'all four process steps remain present');
    await scrollTo('[data-process-step="2"]', .35);
    const process = await page.locator('[data-process-step="2"]').evaluate((element) => ({ text: element.innerText.trim(), opacity: Number(getComputedStyle(element).opacity) }));
    assert(process.text.length > 50 && process.opacity >= .99, 'process content remains readable after its reveal');

    assert(await page.locator('[data-marquee-band]').count() === 1, 'only one understated tools ticker remains');
    await scrollTo('[data-marquee-wrapper]', .4);
    await page.mouse.move(0, 0);
    if (MODE !== 'reduced') {
        await page.locator('[data-marquee-toggle]').click();
        assert(await page.locator('[data-marquee-toggle]').getAttribute('aria-pressed') === 'true', 'ticker pause reports its state');
        assert(await page.locator('[data-marquee-track]').evaluate((element) => getComputedStyle(element).animationPlayState) === 'paused', 'ticker animation actually pauses');
        await page.locator('[data-marquee-toggle]').click();
        assert(await page.locator('[data-marquee-toggle]').getAttribute('aria-pressed') === 'false', 'ticker resumes on request');
    } else {
        assert(await page.locator('[data-marquee-track]').evaluate((element) => getComputedStyle(element).animationName) === 'none', 'reduced-motion ticker does not animate');
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(850);
    await cta.click();
    await page.waitForTimeout(1600);
    const workBox = await page.locator('#work').boundingBox();
    assert(workBox && Math.abs(workBox.y) < 200, 'primary CTA reaches selected work');
    assert(featuredProjects.some((project) => project.links?.repo), 'project data includes a real repository to verify');
    for (const project of featuredProjects) {
        const toggle = page.locator(`#work-${project.slug} button[aria-expanded]`);
        await toggle.scrollIntoViewIfNeeded();
        await toggle.click();
        await page.waitForTimeout(600);
        const detail = await toggle.evaluate((button) => {
            const panel = document.getElementById(button.getAttribute('aria-controls'));
            return {
                expanded: button.getAttribute('aria-expanded'), inert: panel.inert,
                height: panel.getBoundingClientRect().height,
                links: [...panel.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
                text: panel.textContent,
            };
        });
        assert(detail.expanded === 'true' && !detail.inert && detail.height > 60, `${project.slug}: detail expands and is accessible`);
        assert(project.links?.repo
            ? detail.links.includes(project.links.repo)
            : detail.links.length === 0 && detail.text.includes('Code available on request'),
        `${project.slug}: real repository or honest unavailable-code state`);
        assert(detail.text.includes(project.solution), `${project.slug}: full approach copy preserved`);
        await toggle.click();
        await page.waitForTimeout(600);
        assert(await toggle.getAttribute('aria-expanded') === 'false', `${project.slug}: detail closes`);
    }
    if (WIDTH < 1024) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(850);
        const opener = page.getByRole('button', { name: 'Open menu', exact: true });
        const positionBeforeMenu = await page.evaluate(() => ({ y: scrollY, hash: location.hash }));
        await opener.click();
        const dialog = page.getByRole('dialog', { name: 'Site navigation' });
        assert(await dialog.isVisible(), 'mobile navigation opens');
        const close = dialog.getByRole('button', { name: 'Close menu', exact: true });
        await close.waitFor({ state: 'visible', timeout: 3000 });
        await page.waitForTimeout(700);
        const closeState = await close.evaluate((button) => {
            const r = button.getBoundingClientRect();
            const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
            return {
                width: r.width, height: r.height,
                inViewport: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
                reachable: button === hit || button.contains(hit), focused: document.activeElement === button,
            };
        });
        assert(closeState.width >= 44 && closeState.height >= 44 && closeState.inViewport && closeState.reachable,
            'menu close button is onscreen, unobstructed and has a touch-sized target');
        assert(closeState.focused, 'opening the menu focuses its close button');
        if (WIDTH < 768) await close.tap();
        else await close.click();
        await page.waitForTimeout(700);
        assert(await dialog.count() === 0, 'close button dismisses mobile navigation without choosing a link');
        const positionAfterMenu = await page.evaluate(() => ({ y: scrollY, hash: location.hash, locked: document.body.style.overflow === 'hidden' }));
        assert(Math.abs(positionAfterMenu.y - positionBeforeMenu.y) < 2 && positionAfterMenu.hash === positionBeforeMenu.hash,
            'closing the menu does not navigate or change scroll position');
        assert(!positionAfterMenu.locked && await opener.evaluate((button) => document.activeElement === button),
            'closing restores scrolling and focus to the menu opener');
        await opener.click();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(700);
        assert(await dialog.count() === 0, 'mobile navigation still closes with Escape');
    }
    assert(await page.locator(`#contact a[href="mailto:${profile.email}"]`).count() > 0, 'contact keeps the real email action');
    await page.goto('about:blank');
    await page.goto(new URL('#skills', BASE).href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1300);
    const skillsBox = await page.locator('#skills').boundingBox();
    assert(skillsBox && Math.abs(skillsBox.y) < 200 && await page.locator('[data-intro-overlay]').count() === 0, 'direct section links remain reachable without an intro gate');
    assert(worldRequests.length === 0, `no 3D modules or model downloads (${worldRequests.length})`);
    assert(errors.length === 0, `no browser runtime errors (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(`FAIL ${error.stack}`);
} finally {
    await browser.close();
}
console.log(`\nEditorial ${WIDTH}x${HEIGHT} ${MODE}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
