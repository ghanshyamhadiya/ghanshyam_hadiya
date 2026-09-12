import { chromium } from 'playwright';
import { certifications } from '../src/data/credentials.js';
import { process as processSteps } from '../src/data/process.js';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
const HEIGHT = Number(process.argv[5] ?? (WIDTH < 768 ? 800 : 900));
const TARGETED = process.env.HEADING_AUDIT_TARGETED === '1';
if (!['normal', 'reduced', 'font-blocked'].includes(MODE) ||
    !Number.isInteger(WIDTH) || WIDTH < 320 || !Number.isInteger(HEIGHT) || HEIGHT < 400) {
    throw new Error('Usage: node scripts/audit-headings.mjs [BASE] [WIDTH >= 320] [normal|reduced|font-blocked] [HEIGHT >= 400]');
}

const headings = [
    ['about', 'What I actually do', 'opposed'],
    ['process', 'Four steps, every time', 'arc'],
    ['skills', 'The stack, layer by layer', 'layers'],
    ['experience', "Where I've done it", 'unfold'],
    ['work', "Pipelines I've built", 'connect'],
    ['credentials', certifications.length ? 'Certifications & education' : 'Education', 'press'],
    ['contact', 'Let’s talk', 'converge'],
];
let failures = 0;
let blockedFonts = 0;
const check = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};
const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    hasTouch: WIDTH < 768,
    isMobile: WIDTH < 768,
    reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference',
});
page.setDefaultTimeout(10000);
let bridge = false;

const overflow = async (label) => {
    const size = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        height: window.innerHeight,
    }));
    check(size.scroll <= size.width + 1, `${label}: viewport ${size.width}x${size.height}, document width ${size.scroll}`);
};

const graphicalProperties = ['transform', 'translate', 'rotate', 'scale', 'transformOrigin', 'opacity', 'fontSize', 'fontWeight', 'fontVariationSettings', 'display', 'visibility', 'clip', 'clipPath', 'maskImage', 'filter', 'color'];

const settleHeading = async (id, progress) => {
    const result = await page.locator(`#${id}`).evaluate((heading, properties) => new Promise((resolve) => {
        const started = performance.now();
        let previous;
        let unchangedSince = started;
        let unchangedFrames = 0;
        let frame;
        let finished = false;
        const finish = (settled) => {
            if (finished) return;
            finished = true;
            clearTimeout(deadline);
            cancelAnimationFrame(frame);
            resolve({ settled, elapsed: Math.round(performance.now() - started), unchangedFrames });
        };
        const deadline = setTimeout(() => finish(false), 900);
        const poll = () => {
            const now = performance.now();
            const snapshot = JSON.stringify([scrollX, scrollY, ...[heading, ...heading.querySelectorAll('*')].map((node) => {
                const style = getComputedStyle(node);
                const box = node.getBoundingClientRect();
                return [
                    [...node.attributes].map((attribute) => [attribute.name, attribute.value]).sort(([a], [b]) => a.localeCompare(b)),
                    properties.map((key) => style[key]),
                    [box.left, box.top, box.width, box.height],
                ];
            })]);
            if (snapshot === previous) unchangedFrames += 1;
            else {
                previous = snapshot;
                unchangedSince = now;
                unchangedFrames = 0;
            }
            if (unchangedFrames >= 4 && now - unchangedSince >= 100) finish(true);
            else frame = requestAnimationFrame(poll);
        };
        frame = requestAnimationFrame(poll);
    }), graphicalProperties);
    if (!result.settled) check(false, `${id}: p=${progress} graphical attributes (including arc startOffset), computed styles, bounds and scroll did not settle within 900ms (${result.elapsed}ms, ${result.unchangedFrames} unchanged frames)`);
};

const position = async (id, progress = 0.5) => {
    for (let attempt = 0; attempt < 24; attempt += 1) {
        const geometry = await page.locator(`#${id}`).evaluate((el, p) => {
            const r = el.getBoundingClientRect();
            const desiredTop = innerHeight * 0.9 - p * (innerHeight * 0.75 + r.height);
            const max = document.documentElement.scrollHeight - innerHeight;
            const target = Math.max(0, Math.min(max, scrollY + r.top - desiredTop));
            return { delta: target - scrollY, desiredTop, centre: (r.top + r.height / 2) / innerHeight };
        }, progress);
        if (Math.abs(geometry.delta) < 0.75) {
            await settleHeading(id, progress);
            return geometry;
        }
        if (bridge && attempt === 0) {
            await page.evaluate(async ({ id, offset }) => {
                if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    const el = document.getElementById(id);
                    window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + offset, behavior: 'instant' });
                } else {
                    const { scrollToSection } = await import('/src/utils/smoothScroll.js');
                    scrollToSection(id, { offset, immediate: true, force: true });
                }
            }, { id, offset: -geometry.desiredTop });
        } else {
            await page.mouse.wheel(0, geometry.delta);
        }
        await page.waitForTimeout(bridge && attempt === 0 ? 220 : 1400);
    }
    throw new Error(`${id}: could not settle scroll position with ${bridge ? 'Lenis bridge and wheel' : 'wheel'}`);
};

const textGeometry = async (id, name, inViewport = true, minimumFontSize = 30) => {
    const result = await page.locator(`#${id}`).evaluate((heading, { name, inViewport, minimumFontSize }) => {
        const issues = [];
        const normalize = (text) => text.replace(/\s+/g, ' ').trim();
        const hidden = (el) => {
            for (let node = el; node; node = node.parentElement) {
                const style = getComputedStyle(node);
                if (node.matches('.sr-only, [inert], [hidden]') || style.display === 'none' || style.visibility === 'hidden') return true;
                if (node === heading) break;
            }
            return false;
        };
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        const elements = new Set();
        let visibleText = '';
        let glyphs = 0;
        let left = Infinity;
        let right = -Infinity;
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const parent = node.parentElement;
            if (!parent || parent.closest('svg') || hidden(parent)) continue;
            visibleText += node.textContent;
            if (!node.textContent.trim()) continue;
            let opacity = 1;
            for (let el = parent; el; el = el.parentElement) {
                const s = getComputedStyle(el);
                opacity *= Number(s.opacity);
                if (s.display === 'none' || s.visibility !== 'visible' || el.matches('[hidden], [inert]')) issues.push('glyph not painted');
                if (s.clipPath !== 'none' || s.maskImage !== 'none' || (s.clip !== 'auto' && s.clip !== '')) issues.push('unsupported clip or mask prevents proving full glyph visibility');
                if (el === heading || heading.contains(el)) elements.add(el);
            }
            if (opacity < 0.95) issues.push('unfinished cumulative opacity');
            for (let i = 0; i < node.textContent.length; i += 1) {
                if (/\s/.test(node.textContent[i])) continue;
                const range = document.createRange();
                range.setStart(node, i);
                range.setEnd(node, i + 1);
                const r = range.getBoundingClientRect();
                glyphs += 1;
                left = Math.min(left, r.left);
                right = Math.max(right, r.right);
                if (r.width < 0.5 || r.height < 8) issues.push(`unsized glyph ${node.textContent[i]}`);
                if (r.left < 2 || r.right > innerWidth - 2 || (inViewport && (r.top < -2 || r.bottom > innerHeight + 2))) issues.push('glyph outside safe viewport');
                for (let el = parent; el; el = el.parentElement) {
                    const s = getComputedStyle(el);
                    const b = el.getBoundingClientRect();
                    if (/(hidden|clip|auto|scroll)/.test(s.overflowX) && (r.left < b.left - 2 || r.right > b.right + 2)) issues.push('glyph clipped horizontally');
                    if (/(hidden|clip|auto|scroll)/.test(s.overflowY) && (r.top < b.top - 2 || r.bottom > b.bottom + 2)) issues.push('glyph clipped vertically');
                }
            }
        }
        for (const el of elements) {
            const s = getComputedStyle(el);
            if (Number(s.opacity) < 0.95) issues.push('unfinished opacity');
            if (s.transform !== 'none') {
                const m = new DOMMatrixReadOnly(s.transform);
                const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                if ([...m.toFloat64Array()].some((v, i) => Math.abs(v - identity[i]) > (i === 12 || i === 13 || i === 14 ? 1 : 0.015))) issues.push('unfinished transform');
            }
            if (parseFloat(s.fontSize) < minimumFontSize) issues.push(`heading reduced to ${parseFloat(s.fontSize).toFixed(1)}px (minimum ${minimumFontSize}px)`);
        }
        if (normalize(visibleText) !== name) issues.push(`visible text ${JSON.stringify(normalize(visibleText))}`);
        if (glyphs !== name.replace(/\s/g, '').length) issues.push('readable glyph count differs from title');
        if (!glyphs) issues.push('no readable text glyphs');
        const fontSize = Math.min(...[...elements].map((el) => parseFloat(getComputedStyle(el).fontSize)));
        return { glyphs, fontSize, left, right, issues: [...new Set(issues)] };
    }, { name, inViewport, minimumFontSize });
    check(!result.issues.length, `${id}: ${result.glyphs} settled readable glyphs, ${result.fontSize.toFixed(1)}px (minimum ${minimumFontSize}px), glyph x=[${result.left.toFixed(2)}, ${result.right.toFixed(2)}]${result.issues.length ? ` — ${result.issues.join('; ')}` : ''}`);
};

const arcState = async () => page.locator('#process-title').evaluate((heading) => {
    const issues = [];
    const svg = heading.querySelector('[data-arc-svg]');
    const texts = [...heading.querySelectorAll('[data-arc-text]')];
    const phrase = 'Four steps, every time';
    const lines = texts.map((text) => text.textContent.replace(/\s+/g, ' ').trim());
    if (lines.join(' ') !== phrase) issues.push('SVG lines must preserve the complete sentence in order');
    if (lines.length > 1 && JSON.stringify(lines) !== JSON.stringify(['Four steps,', 'every time'])) issues.push('mobile lines differ from the approved word grouping');
    const glyphs = [];
    const offsets = [];
    const lineBounds = [];
    let fontSize = Infinity;
    let globalIndex = 0;
    const svgBox = svg?.getBoundingClientRect();
    if (!svgBox) issues.push('missing SVG viewport');
    for (const [line, text] of texts.entries()) {
        const textPath = text.querySelector('textPath');
        const path = document.getElementById(textPath?.getAttribute('href')?.slice(1));
        const offset = Number(textPath?.getAttribute('startOffset'));
        offsets.push(offset);
        const matrix = text.getScreenCTM();
        const arc = path?.getAttribute('d')?.match(/[Aa]\s*([\d.eE+-]+)[\s,]+([\d.eE+-]+)/);
        if (!path || !matrix || !Number.isFinite(offset) || !arc || Math.abs(Number(arc[1]) - Number(arc[2])) > 0.1 || Number(arc[1]) < svgBox.width) {
            issues.push('missing native-pixel text, numeric offset or shallow circular path');
            continue;
        }
        const scaleX = Math.hypot(matrix.a, matrix.b);
        const scaleY = Math.hypot(matrix.c, matrix.d);
        fontSize = Math.min(fontSize, parseFloat(getComputedStyle(text).fontSize) * Math.min(scaleX, scaleY));
        if (Math.abs(scaleX - 1) > 0.015 || Math.abs(scaleY - 1) > 0.015) issues.push('text not in native pixel units');
        if (getComputedStyle(textPath).textAnchor !== 'middle') issues.push('line not centre anchored');
        if (text.getNumberOfChars() !== lines[line].length) issues.push('missing SVG characters');
        const ancestors = [];
        let opacity = 1;
        for (let el = textPath; el; el = el.parentElement) {
            const style = getComputedStyle(el);
            opacity *= Number(style.opacity);
            if (style.visibility !== 'visible' || style.display === 'none' || el.matches('[hidden], [inert]')) issues.push('arc not painted');
            if (style.clipPath !== 'none' || style.maskImage !== 'none') issues.push('unsupported arc clip or mask');
            ancestors.push({ box: el.getBoundingClientRect(), x: /(hidden|clip|auto|scroll)/.test(style.overflowX), y: /(hidden|clip|auto|scroll)/.test(style.overflowY), name: el.tagName });
        }
        if (opacity < 0.95 || getComputedStyle(text).fill === 'none') issues.push('arc not fully painted');
        let previousX = -Infinity;
        const currentLine = [];
        for (let i = 0; i < text.getNumberOfChars(); i += 1) {
            if (/\s/.test(lines[line][i])) continue;
            const extent = text.getExtentOfChar(i);
            const points = [[extent.x, extent.y], [extent.x + extent.width, extent.y], [extent.x, extent.y + extent.height], [extent.x + extent.width, extent.y + extent.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
            const bounds = { left: Math.min(...points.map((p) => p.x)), right: Math.max(...points.map((p) => p.x)), top: Math.min(...points.map((p) => p.y)), bottom: Math.max(...points.map((p) => p.y)) };
            const clippedBy = [];
            const sized = bounds.right - bounds.left >= 0.5 && bounds.bottom - bounds.top >= 16;
            if (!sized) clippedBy.push('no readable extent');
            if (bounds.left < 2 || bounds.right > innerWidth - 2) clippedBy.push('safe horizontal viewport');
            if (bounds.left < svgBox.left + 1 || bounds.right > svgBox.right - 1 || bounds.top < svgBox.top || bounds.bottom > svgBox.bottom) clippedBy.push('SVG viewport');
            for (const ancestor of ancestors) {
                const b = ancestor.box;
                if (ancestor.x && (bounds.left < b.left - 1 || bounds.right > b.right + 1)) clippedBy.push(`${ancestor.name} horizontal clip`);
                if (ancestor.y && (bounds.top < b.top - 1 || bounds.bottom > b.bottom + 1)) clippedBy.push(`${ancestor.name} vertical clip`);
            }
            const start = text.getStartPositionOfChar(i);
            if (start.x <= previousX) issues.push(`line ${line + 1} glyph positions do not preserve sentence order`);
            previousX = start.x;
            const fullyVisible = !clippedBy.length && bounds.top >= 0 && bounds.bottom <= innerHeight;
            const glyph = { index: globalIndex + i, char: lines[line][i], line, bounds, sized, fullyVisible, clippedBy };
            glyphs.push(glyph);
            currentLine.push(bounds);
        }
        if (currentLine.length) lineBounds.push({ top: Math.min(...currentLine.map((b) => b.top)), bottom: Math.max(...currentLine.map((b) => b.bottom)) });
        globalIndex += lines[line].length + 1;
    }
    if (fontSize < 30) issues.push(`arc font too small (${fontSize}px, minimum 30px)`);
    if (glyphs.length !== phrase.replace(/\s/g, '').length) issues.push('missing phrase glyphs');
    if (lineBounds.length === 2 && lineBounds[0].bottom >= lineBounds[1].top) issues.push('curved lines overlap or reverse order');
    const clipped = glyphs.filter((glyph) => glyph.clippedBy.length);
    if (clipped.length) issues.push(`glyphs outside safe bounds: ${JSON.stringify(clipped)}`);
    const r = heading.getBoundingClientRect();
    return { progress: (innerHeight * 0.9 - r.top) / (innerHeight * 0.75 + r.height), scroll: scrollY, centre: (r.top + r.height / 2) / innerHeight, offsets, raw: JSON.stringify(offsets), offset: offsets[0], fontSize, glyphs, visibleIndices: glyphs.filter((glyph) => glyph.fullyVisible).map((glyph) => glyph.index), issues: [...new Set(issues)] };
});

const contextGeometry = async (locator, inViewport = true) => locator.evaluate((root, inViewport) => {
    const issues = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let glyphs = 0;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim()) continue;
        let opacity = 1;
        for (let el = node.parentElement; el; el = el.parentElement) {
            const s = getComputedStyle(el);
            opacity *= Number(s.opacity);
            if (el.matches('.sr-only, [hidden], [inert], [aria-hidden="true"]') || s.display === 'none' || s.visibility !== 'visible') issues.push('context hidden or inaccessible');
            if (s.transform !== 'none') {
                const m = new DOMMatrixReadOnly(s.transform);
                if (Math.abs(m.m41) > 1 || Math.abs(m.m42) > 1 || Math.abs(m.m11 - 1) > 0.015 || Math.abs(m.m22 - 1) > 0.015) issues.push('context still transformed');
            }
        }
        if (opacity < 0.95) issues.push('context not fully opaque');
        for (let i = 0; i < node.textContent.length; i += 1) {
            if (/\s/.test(node.textContent[i])) continue;
            const range = document.createRange();
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const r = range.getBoundingClientRect();
            glyphs += 1;
            if (r.width < 0.5 || r.height < 8) issues.push('unsized context glyph');
            if (r.left < -2 || r.right > innerWidth + 2 || (inViewport && (r.top < -2 || r.bottom > innerHeight + 2))) issues.push('context glyph outside viewport');
            for (let el = node.parentElement; el; el = el.parentElement) {
                const s = getComputedStyle(el);
                const b = el.getBoundingClientRect();
                if (/(hidden|clip|auto|scroll)/.test(s.overflowX) && (r.left < b.left - 2 || r.right > b.right + 2)) issues.push('context glyph clipped horizontally');
                if (/(hidden|clip|auto|scroll)/.test(s.overflowY) && (r.top < b.top - 2 || r.bottom > b.bottom + 2)) issues.push('context glyph clipped vertically');
            }
        }
    }
    if (!glyphs) issues.push('no readable context glyphs');
    return { glyphs, issues: [...new Set(issues)] };
}, inViewport);

const scrollHeadingState = async (id) => page.locator(`#${id}`).evaluate((heading, properties) => {
    const box = heading.getBoundingClientRect();
    const visual = heading.querySelector('[data-scroll-heading-visual]');
    const sr = heading.querySelector('.sr-only');
    const nodes = [heading, ...heading.querySelectorAll('*')];
    const rect = (r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    const matrix = (transform) => [...new DOMMatrixReadOnly(transform === 'none' ? undefined : transform).toFloat64Array()];
    const words = [...heading.querySelectorAll('[data-heading-word]')].map((word) => {
        const s = getComputedStyle(word);
        return { text: word.textContent, matrix: matrix(s.transform), opacity: Number(s.opacity), bounds: rect(word.getBoundingClientRect()) };
    });
    const glyphs = [];
    const walker = document.createTreeWalker(visual ?? heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement.closest('.sr-only, svg, [hidden], [inert]')) continue;
        for (let i = 0; i < node.textContent.length; i += 1) {
            if (/\s/.test(node.textContent[i])) continue;
            const range = document.createRange();
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const bounds = rect(range.getBoundingClientRect());
            const clippedBy = [];
            if (bounds.left < 2 || bounds.right > innerWidth - 2) clippedBy.push('safe horizontal viewport');
            if (bounds.left < box.left || bounds.right > box.right || bounds.top < box.top || bounds.bottom > box.bottom) clippedBy.push('reserved heading stage');
            for (let el = node.parentElement; el; el = el.parentElement) {
                const style = getComputedStyle(el);
                const box = el.getBoundingClientRect();
                if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (bounds.left < box.left - 1 || bounds.right > box.right + 1)) clippedBy.push(`${el.tagName} horizontal clip`);
                if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (bounds.top < box.top - 1 || bounds.bottom > box.bottom + 1)) clippedBy.push(`${el.tagName} vertical clip`);
            }
            glyphs.push({ char: node.textContent[i], marked: Boolean(node.parentElement.closest('[data-heading-glyph]')), bounds, clippedBy });
        }
    }
    const marked = [...heading.querySelectorAll('[data-heading-glyph]')];
    const computed = nodes.map((node) => {
        const s = getComputedStyle(node);
        return properties.map((key) => s[key]);
    });
    return {
        progress: (innerHeight * 0.9 - box.top) / (innerHeight * 0.75 + box.height),
        scroll: scrollY,
        dimensions: { width: box.width, height: box.height, top: box.top + scrollY, left: box.left, offsetWidth: heading.offsetWidth, offsetHeight: heading.offsetHeight, visualWidth: visual?.offsetWidth ?? 0, visualHeight: visual?.offsetHeight ?? 0 },
        marker: heading.getAttribute('data-scroll-heading'),
        visuals: heading.querySelectorAll('[data-scroll-heading-visual]').length,
        decorative: visual?.tagName === 'SPAN' && visual.getAttribute('aria-hidden') === 'true',
        sr: sr?.textContent.trim(),
        plain: sr?.childElementCount === 0 && heading.querySelectorAll('.sr-only').length === 1,
        markedText: marked.map((glyph) => glyph.textContent).join(''),
        markedCount: marked.length,
        contained: marked.length > 0 && marked.every((glyph) => visual?.contains(glyph) && glyph.closest('[data-heading-word]')) && words.length > 0 && [...heading.querySelectorAll('[data-heading-word]')].every((word) => word.tagName === 'SPAN' && visual?.contains(word)),
        attributes: JSON.stringify(nodes.map((node) => [...node.attributes].map((attribute) => [attribute.name, attribute.value]).sort(([a], [b]) => a.localeCompare(b)))),
        computed: JSON.stringify(computed),
        words,
        glyphs,
    };
}, graphicalProperties);

const boundDifference = (before, after, documentCoordinates = false) => {
    if (before.glyphs.length !== after.glyphs.length || !before.glyphs.length) return Infinity;
    return Math.max(...before.glyphs.flatMap((glyph, i) => {
        const other = after.glyphs[i];
        if (glyph.char !== other.char) return [Infinity];
        return Object.keys(glyph.bounds).map((key) => Math.abs(glyph.bounds[key] - other.bounds[key] +
            (documentCoordinates && (key === 'top' || key === 'bottom') ? before.scroll - after.scroll : 0)));
    }));
};

const dimensionsMatch = (before, after) => Object.keys(before.dimensions).every((key) => Math.abs(before.dimensions[key] - after.dimensions[key]) <= 0.75);
const nonidentity = (matrix) => matrix.some((value, i) => Math.abs(value - (i % 5 === 0 ? 1 : 0)) > (i >= 12 && i <= 14 ? 1 : 0.015));

const auditHeadingLabel = async (section, label, inViewport, previous) => {
    const locator = page.locator(`#${section} [data-heading-label]`);
    const count = await locator.count();
    check(count === 1, `${label}: exactly one stable label in its own section`);
    if (count !== 1) return null;
    const geometry = await contextGeometry(locator, inViewport);
    const state = await locator.evaluate((el, section) => {
        const owner = el.closest('section');
        const r = el.getBoundingClientRect();
        const b = owner?.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { text: el.textContent.trim(), left: r.left, top: r.top + scrollY, width: r.width, height: r.height, transform: s.transform, opacity: s.opacity,
            contained: owner?.id === section && r.left >= b.left - 2 && r.right <= b.right + 2 && r.top >= b.top - 2 && r.bottom <= b.bottom + 2 };
    }, section);
    check(state.contained && Boolean(state.text) && !geometry.issues.length, `${label}: label painted, accessible, unclipped and inside #${section}${inViewport ? ' and viewport' : ''}${geometry.issues.length ? ` — ${geometry.issues.join('; ')}` : ''}`);
    if (previous) {
        const stable = state.text === previous.text && state.transform === previous.transform && state.opacity === previous.opacity &&
            ['left', 'top', 'width', 'height'].every((key) => Math.abs(state[key] - previous[key]) <= 0.75);
        check(stable, `${label}: scrolling leaves label text, style and document geometry unchanged${stable ? '' : ` — ${JSON.stringify({ before: previous, after: state })}`}`);
    }
    return state;
};

const auditScrollHeading = async ([section, name, treatment], label, dense = true) => {
    const id = `${section}-title`;
    const prefix = `${label} ${id} (${treatment})`;
    const enhanced = MODE === 'normal';
    const initial = await scrollHeadingState(id);
    if (enhanced) {
        const contract = initial.marker === '' && initial.visuals === 1 && initial.decorative && initial.plain && initial.sr === name;
        check(contract, `${prefix}: enhanced stage marker, one decorative visual and one plain full sr-only name`);
        check(initial.contained && initial.markedText === name.replace(/\s/g, '') && initial.markedCount === name.replace(/\s/g, '').length && initial.glyphs.every((glyph) => glyph.marked) && initial.words.length === name.trim().split(/\s+/).length,
            `${prefix}: all real SplitText glyphs belong to decorative motion WORD spans`);
        if (!contract) {
            await position(id, 0.5);
            await textGeometry(id, name, true, 40);
            await auditHeadingLabel(section, prefix, true);
            return null;
        }
    } else {
        check(initial.marker === null && initial.visuals === 0, `${prefix}: ${MODE} has no scroll-stage marker or moving visual`);
    }
    check(await page.locator(`#${id} [data-heading-transient]`).count() === 0, `${prefix}: no transient glyph copies`);
    const progressValues = dense && enhanced ? (TARGETED ? [0.15, 0.3, 0.5, 0.8, 0.9] : [0.15, 0.3, 0.45, 0.5, 0.65, 0.8, 0.9]) : [0.15, 0.5, 0.9];
    const samples = [];
    let stableLabel;
    for (const p of progressValues) {
        await position(id, p);
        const state = await scrollHeadingState(id);
        samples.push(state);
        check(Math.abs(state.progress - p) < 0.015, `${prefix}: requested p=${p}, measured=${state.progress.toFixed(4)}`);
        check(dimensionsMatch(samples[0], state), `${prefix}: p=${p} preserves stage dimensions and document position${dimensionsMatch(samples[0], state) ? '' : ` — ${JSON.stringify([samples[0].dimensions, state.dimensions])}`}`);
        const clipped = state.glyphs.filter((glyph) => glyph.clippedBy.length);
        const left = Math.min(...state.glyphs.map((glyph) => glyph.bounds.left));
        const right = Math.max(...state.glyphs.map((glyph) => glyph.bounds.right));
        check(!clipped.length, `${prefix}: p=${p} glyph x=[${left.toFixed(2)}, ${right.toFixed(2)}] stays inside reserved stage, safe horizontal bounds and ancestor clips${clipped.length ? ` — ${JSON.stringify(clipped)}` : ''}`);
        check(await page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).overflowX === 'visible' && getComputedStyle(el).overflowY === 'visible'), `${prefix}: no local overflow mask hides heading motion`);
        const centre = p >= 0.45 && p <= 0.65;
        if (!enhanced || centre) {
            await textGeometry(id, name, centre, 40);
            if (enhanced) check(state.words.every((word) => !nonidentity(word.matrix) && word.opacity >= 0.999), `${prefix}: p=${p} all motion WORD spans have identity transforms and opacity 1`);
        }
        if (enhanced && (p === 0.15 || p === 0.9)) {
            check(state.words.some((word) => nonidentity(word.matrix)) && state.words.some((word) => word.opacity < 0.95),
                `${prefix}: p=${p} deliberately transforms and fades real words — ${JSON.stringify(state.words.map((word) => ({ matrix: word.matrix, opacity: word.opacity })))}`);
        }
        stableLabel = await auditHeadingLabel(section, `${prefix} p=${p}`, p === 0.5, stableLabel);
        if (p === 0.15 || p === 0.5 || p === 0.9) {
            await page.waitForTimeout(850);
            const stopped = await scrollHeadingState(id);
            const delta = boundDifference(state, stopped);
            check(Math.abs(state.scroll - stopped.scroll) < 0.5 && state.attributes === stopped.attributes && state.computed === stopped.computed && delta <= 0.1 && dimensionsMatch(state, stopped),
                `${prefix}: stopped p=${p} freezes attributes, computed styles and every actual glyph bound (delta=${delta.toFixed(3)}px; no autonomous animation)`);
        }
        await overflow(`${prefix} p=${p}`);
    }
    const middle = samples[progressValues.indexOf(0.5)];
    if (enhanced) {
        for (const index of [0, samples.length - 1]) {
            const delta = boundDifference(middle, samples[index], true);
            check(Number.isFinite(delta) && delta > 2, `${prefix}: p=${progressValues[index]} moves actual glyph pixels relative to the centre stage (delta=${delta.toFixed(2)}px)`);
        }
        if (dense) {
            for (const [a, b] of [[0, 1], [samples.length - 2, samples.length - 1]]) {
                const delta = boundDifference(samples[a], samples[b], true);
                check(Number.isFinite(delta) && delta > 1 && samples[a].computed !== samples[b].computed, `${prefix}: p=${progressValues[a]}..${progressValues[b]} continuously changes word styles and actual glyph geometry (delta=${delta.toFixed(2)}px)`);
            }
        }
    }
    const reverseIndices = TARGETED ? [progressValues.indexOf(0.5), 0, samples.length - 1] : [...Array.from({ length: samples.length - 1 }, (_, i) => samples.length - 2 - i), samples.length - 1];
    for (const i of reverseIndices) {
        const p = progressValues[i];
        await position(id, p);
        const reverse = await scrollHeadingState(id);
        const forward = samples[i];
        const scrollDelta = Math.abs(reverse.scroll - forward.scroll);
        const geometryTolerance = 3 + scrollDelta;
        const delta = boundDifference(forward, reverse);
        const wordStyles = reverse.words.length === forward.words.length && forward.words.every((word, index) => {
            const restored = reverse.words[index];
            return word.text === restored.text && Math.abs(word.opacity - restored.opacity) <= 0.015 && word.matrix.every((value, k) => Math.abs(value - restored.matrix[k]) <= (k >= 12 && k <= 14 ? 2 : 0.015));
        });
        check(Math.abs(reverse.progress - p) < 0.015 && Math.abs(reverse.progress - forward.progress) < 0.002 && scrollDelta <= 1.5 && wordStyles && delta <= geometryTolerance && dimensionsMatch(forward, reverse),
            `${prefix}: reverse p=${p} restores WORD transforms/opacity and every actual glyph bound (delta=${delta.toFixed(3)}px, tolerance=${geometryTolerance.toFixed(2)}px, scroll delta=${scrollDelta.toFixed(3)}px)`);
        await auditHeadingLabel(section, `${prefix} reverse p=${p}`, p === 0.5, stableLabel);
        if (p >= 0.45 && p <= 0.65) await textGeometry(id, name, true, 40);
    }
    if (!enhanced) {
        check(samples.every((state) => state.marker === null && state.visuals === 0 && state.attributes === initial.attributes && state.computed === initial.computed && boundDifference(middle, state, true) <= 0.75),
            `${prefix}: ${MODE} stays static at entry, centre and exit with unchanged styles and document-relative glyph geometry`);
        return null;
    }
    const entryWords = samples[0].words;
    return JSON.stringify([entryWords[0], entryWords.at(-1)].map((word) => word.matrix.map((value) => Number(value.toFixed(3)))));
};

const auditScrollHeadings = async (label, dense = true) => {
    const signatures = [];
    for (const heading of headings.filter(([, , treatment]) => treatment !== 'arc')) {
        const signature = await auditScrollHeading(heading, label, dense);
        if (signature) signatures.push({ variant: heading[2], signature });
    }
    if (MODE === 'normal') check(signatures.length === 6 && new Set(signatures.map(({ signature }) => signature)).size === 6,
        `${label}: six variants have distinct entry transform signatures (first/last words, not text or word counts) — ${JSON.stringify(signatures)}`);
};

const auditProcessContext = async (label) => {
    const section = page.locator('#process');
    const eyebrow = section.locator('span[data-heading-label]');
    const intro = section.locator('p').filter({ hasText: 'The same sequence whether it is an ODI mapping or a Databricks notebook.' });
    const cards = section.getByRole('listitem');
    check(await eyebrow.count() === 1 && (await eyebrow.textContent()).trim() === 'How I work', `${label}: stable Process label is How I work`);
    check(await intro.count() === 1 && await cards.count() === 4, `${label}: ordinary intro and all four accessible process cards remain`);
    for (const step of processSteps) {
        check(await section.getByRole('heading', { level: 3, name: step.title, exact: true }).count() === 1, `${label}: accessible step ${JSON.stringify(step.title)}`);
    }
    if (TARGETED) {
        await position('process-title', 0.5);
        await auditHeadingLabel('process', label, true);
        check(true, `${label}: targeted heading geometry run; extended Process keyboard/card navigation is covered by the default audit`);
        return;
    }
    const processLink = page.locator('footer a[href="#process"]');
    await processLink.focus();
    await processLink.press('Enter');
    await page.waitForTimeout(1900);
    const landed = await contextGeometry(eyebrow);
    check(!landed.issues.length, `${label}: keyboard section jump lands on fully visible stable label${landed.issues.length ? ` — ${landed.issues.join('; ')}` : ''}`);
    await processLink.blur();
    const targets = [
        { name: 'Process intro', locator: intro },
        ...processSteps.map((step, i) => ({ name: step.title, locator: cards.nth(i), text: step.body })),
    ];
    for (const target of targets) {
        if (target.text) check((await target.locator.textContent()).includes(target.text), `${label}: ${target.name} body preserved`);
        let state;
        for (let attempt = 0; attempt < 40; attempt += 1) {
            state = await contextGeometry(target.locator);
            if (!state.issues.length) break;
            const key = await target.locator.evaluate((el) => {
                const r = el.getBoundingClientRect();
                if (r.top > innerHeight + 80) return 'PageDown';
                if (r.bottom < -80) return 'PageUp';
                return (r.top + r.bottom) / 2 > innerHeight / 2 ? 'ArrowDown' : 'ArrowUp';
            });
            await page.keyboard.press(key);
            await page.waitForTimeout(key.startsWith('Page') ? 1000 : 250);
        }
        check(!state.issues.length, `${label}: keyboard reaches ${target.name}, ${state.glyphs} fully visible glyphs${state.issues.length ? ` — ${state.issues.join('; ')}` : ''}`);
    }
    if (MODE === 'normal') {
        await position('process-title', 1);
        const exit = await arcState();
        const context = await Promise.all(targets.map((target) => contextGeometry(target.locator, false)));
        check(!exit.issues.length && context.every((state) => !state.issues.length), `${label}: intro and all four cards remain painted, unclipped and accessible at arc exit`);
    }
};

const auditArc = async (label) => {
    if (MODE === 'reduced' || MODE === 'font-blocked') {
        check(!await page.locator('#process-title [data-arc-svg]').isVisible(), `${label}: ${MODE} uses visible static title, not animated SVG`);
        for (const p of [0.18, 0.5, 0.82, 0.5]) {
            await position('process-title', p);
            await textGeometry('process-title', headings[1][1], p === 0.5, 30);
        }
        await auditProcessContext(label);
        return;
    }
    const structure = await page.locator('#process-title').evaluate((el) => {
        const sr = el.querySelector('.sr-only');
        const svg = el.querySelector('[data-arc-svg]');
        return { sr: sr?.textContent.trim(), plain: sr?.childElementCount === 0, decorative: svg?.getAttribute('aria-hidden') === 'true' || Boolean(svg?.closest('[aria-hidden="true"]')) };
    });
    check(structure.sr === headings[1][1] && structure.plain && structure.decorative, `${label}: arc has plain full sr-only title and decorative SVG`);
    const progressValues = [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1];
    const samples = [];
    for (const p of progressValues) {
        await position('process-title', p);
        const state = await arcState();
        samples.push(state);
        const left = Math.min(...state.glyphs.map((glyph) => glyph.bounds.left));
        const right = Math.max(...state.glyphs.map((glyph) => glyph.bounds.right));
        check(Math.abs(state.progress - p) < 0.015 && !state.issues.length, `${label}: arc p=${p}, measured=${state.progress.toFixed(3)}, offset=${state.raw}, ${state.fontSize.toFixed(1)}px, glyph x=[${left.toFixed(2)}, ${right.toFixed(2)}], fully visible indices=[${state.visibleIndices}]${state.issues.length ? ` — ${state.issues.join('; ')}` : ''}`);
        const stable = await contextGeometry(page.locator('#process span[data-heading-label]'), false);
        check(!stable.issues.length && await page.locator('#process').getByRole('listitem').count() === 4 && await page.locator('#process').getByRole('paragraph').count() === 5, `${label}: p=${p} stable label, intro and four accessible cards${stable.issues.length ? ` — ${stable.issues.join('; ')}` : ''}`);
        await overflow(`${label} arc ${p}`);
    }
    const entry = samples[0];
    const mid = samples[progressValues.indexOf(0.5)];
    const exit = samples.at(-1);
    const travel = Math.abs(exit.offset - entry.offset);
    check(travel >= 4 && travel <= 32 && samples.slice(1).every((state, i) => state.offset < samples[i].offset), `${label}: shallow arc moves gently and continuously within its safe inset (${travel.toFixed(2)}px travel)`);
    const glyphTravel = boundDifference(entry, exit, true);
    check(glyphTravel >= 20 && glyphTravel <= 80, `${label}: bounded lift/tilt visibly moves actual glyph bounds (${glyphTravel.toFixed(2)}px) without leaving the reserved SVG stage`);
    check(Math.abs(mid.centre - 0.525) < 0.01, `${label}: stable wrapper midpoint at ${(mid.centre * 100).toFixed(2)}% viewport`);
    const expected = headings[1][1].replace(/\s/g, '').length;
    check(mid.visibleIndices.length === expected && !mid.issues.length, `${label}: all ${expected} title glyphs and all words are readable simultaneously at centre`);
    for (const state of samples.filter((sample) => sample.progress >= 0.29 && sample.progress <= 0.71)) {
        check(state.visibleIndices.length === expected, `${label}: reading phase p=${state.progress.toFixed(3)} keeps every word simultaneously inside viewport`);
    }
    for (let i = samples.length - 2; i >= 0; i -= 1) {
        await position('process-title', progressValues[i]);
        const reverse = await arcState();
        const forward = samples[i];
        const neighbor = samples[i + 1];
        const slope = Math.abs((neighbor.offset - forward.offset) / (neighbor.progress - forward.progress));
        const tolerance = Math.max(1, slope * (Math.abs(reverse.progress - forward.progress) + 0.00025));
        check(!reverse.issues.length && Math.abs(reverse.progress - progressValues[i]) < 0.015 && Math.abs(reverse.offset - forward.offset) <= tolerance, `${label}: reverse p=${progressValues[i]} restores numeric offset within ${tolerance.toFixed(2)} path units${reverse.issues.length ? ` — ${reverse.issues.join('; ')}` : ''}`);
        const geometryTolerance = 3 + tolerance;
        check(reverse.glyphs.length === forward.glyphs.length && forward.glyphs.every((glyph) => {
            const restored = reverse.glyphs.find((g) => g.index === glyph.index);
            return restored && restored.sized === glyph.sized && Object.keys(glyph.bounds).every((key) => Math.abs(glyph.bounds[key] - restored.bounds[key]) <= geometryTolerance);
        }), `${label}: reverse p=${progressValues[i]} restores every indexed glyph bound within ${geometryTolerance.toFixed(2)}px`);
    }
    for (const p of [0.25, 0.5, 0.75]) {
        await position('process-title', p);
        const stopped = await arcState();
        const stoppedStyles = await scrollHeadingState('process-title');
        await page.waitForTimeout(800);
        const later = await arcState();
        const laterStyles = await scrollHeadingState('process-title');
        const delta = boundDifference(stopped, later);
        check(!stopped.issues.length && !later.issues.length && Math.abs(stopped.scroll - later.scroll) < 0.5 && stopped.raw === later.raw && Math.abs(stopped.offset - later.offset) < 0.01 &&
            stoppedStyles.attributes === laterStyles.attributes && stoppedStyles.computed === laterStyles.computed && delta <= 0.1 && dimensionsMatch(stoppedStyles, laterStyles),
            `${label}: stopped scroll at p=${p} freezes startOffset, graphical attributes/styles and every actual glyph bound exactly after settling (delta=${delta.toFixed(3)}px; no autonomous travel)`);
    }
    await auditProcessContext(label);
};

try {
    if (MODE === 'font-blocked') {
        await page.route('**/*', (route) => {
            const request = route.request();
            if (request.resourceType() === 'font' || /fonts\.(googleapis|gstatic)\.com/.test(request.url())) {
                blockedFonts += 1;
                return route.abort();
            }
            return route.continue();
        });
    }
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
        const curtain = document.querySelector('[data-intro-curtain]');
        if (!curtain) return true;
        const r = curtain.getBoundingClientRect();
        return r.bottom <= 0 || r.top >= innerHeight;
    }, null, { timeout: 12000 });
    await page.waitForTimeout(1400);
    const interactive = await page.locator('body').getByRole('heading', { name: headings[0][1], exact: true, level: 2 }).count();
    if (!interactive) {
        const state = await page.locator('body').evaluate((body) => ({
            headings: [...body.querySelectorAll('h2')].map((heading) => ({ id: heading.id, inertAncestor: heading.closest('[inert]')?.tagName ?? null })),
            curtain: Boolean(body.querySelector('[data-intro-curtain]')),
        }));
        throw new Error(`Intro has not released accessible body headings; no boot state was bypassed: ${JSON.stringify(state)}`);
    }
    bridge = await page.evaluate(() => Boolean(document.querySelector('script[src*="/@vite/client"]')));
    console.log(`Heading audit: ${BASE} ${WIDTH}x${HEIGHT} ${MODE}${TARGETED ? ' (targeted geometry)' : ''}; scroll via ${bridge ? 'Lenis bridge, native reduced-motion, wheel correction' : 'wheel'}`);
    if (MODE === 'font-blocked') check(blockedFonts > 0, `${blockedFonts} font/font-stylesheet requests blocked`);
    await overflow('initial');
    check(await page.locator('main img[src^="/photos/"]').count() === 0 &&
        await page.locator('#home [data-hero-model]').count() === 1,
        'hero: one interactive-model slot and no portrait images');
    for (const [section, name, treatment] of headings) {
        const id = `${section}-title`;
        check(await page.locator(`h2#${id}`).count() === 1, `${id}: exactly one semantic h2`);
        check(await page.getByRole('heading', { name, exact: true, level: 2 }).count() === 1 &&
            await page.locator(`#${section}`).getByRole('heading', { name, exact: true, level: 2 }).getAttribute('id') === id, `${id}: exact accessible name ${JSON.stringify(name)}`);
        const linked = await page.locator(`#${section}`).evaluateAll((sections, id) =>
            sections.length === 1 && sections[0].getAttribute('aria-labelledby')?.split(/\s+/).includes(id), id);
        check(linked, `${id}: section aria-labelledby linkage`);
        check(await page.locator(`h2#${id}[data-heading-motion="${treatment}"]`).count() === 1, `${id}: ${treatment} treatment`);
        if (MODE !== 'normal' && await page.locator(`h2#${id}`).count() === 1) await textGeometry(id, name, false, treatment === 'arc' ? 30 : 40);
    }
    if (await page.locator(headings.map(([section]) => `h2#${section}-title`).join(',')).count() !== 7) {
        throw new Error(`Expected all seven portfolio headings at ${BASE}; check the server URL before interpreting motion failures`);
    }
    await auditScrollHeadings('initial');
    if (await page.locator('h2#process-title[data-heading-motion="arc"]').count()) await auditArc('initial');
    else check(false, 'arc geometry and travel require the arc heading contract');
    await position('about-title', 0.05);
    const distance = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let traversed = 0; traversed < distance + HEIGHT; traversed += 600) {
        await page.mouse.wheel(0, 600);
        await page.waitForTimeout(65);
    }
    await page.waitForTimeout(1600);
    await overflow('after full fast scroll');
    for (const [section, name, treatment] of [...headings].reverse()) {
        if (treatment === 'arc' && MODE === 'normal') continue;
        await position(`${section}-title`);
        await textGeometry(`${section}-title`, name, true, treatment === 'arc' ? 30 : 40);
        await auditHeadingLabel(section, `${section} after fast scroll and reverse`, true);
        await overflow(`${section} after reverse`);
    }
    if (!TARGETED) {
        const resizedWidth = WIDTH < 768 ? 1440 : 390;
        await page.setViewportSize({ width: resizedWidth, height: HEIGHT });
        await page.waitForTimeout(600);
        if (await page.locator('h2#process-title[data-heading-motion="arc"]').count()) await auditArc(`resize ${resizedWidth}x${HEIGHT}`);
        await auditScrollHeadings(`resize ${resizedWidth}x${HEIGHT}`, false);
        if (MODE !== 'normal') {
            await position('process-title');
            await textGeometry('process-title', headings[1][1]);
        }
        await overflow('after resize');
    }
} catch (error) {
    check(false, error.stack ?? error.message);
} finally {
    await browser.close();
}
console.log(`\n${failures ? `${failures} failure(s)` : 'heading audit OK'}`);
process.exitCode = failures ? 1 : 0;
