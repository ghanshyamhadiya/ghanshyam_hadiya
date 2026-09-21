// Bakes the display headings into resolved outline data for src/three/text3d.js.
//
// opentype.js cannot parse the shipped woff2, so this reads the WOFF that
// fetch-fonts.mjs puts in refs/fonts-src (a gitignored intermediate). The
// output IS committed, so `npm run build` needs neither network nor WOFF.
//
// The subtle part — outer contour versus hole — is done here in Node where it
// is debuggable: getting winding wrong silently fills the counters of a, b,
// d, e, o, P. Contours are classified by containment, not by assuming a
// winding direction: a contour inside an odd number of other contours is a
// hole of its smallest container, anything else is an outer.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const opentype = require('opentype.js');

const PHRASES = [
    'What I actually do',
    'Four steps, every time',
    'The stack, layer by layer',
    "Where I've done it",
    "Pipelines I've built",
    'Certifications & education',
    'Education',
    'Let’s talk',
];

const font = opentype.parse(readFileSync('refs/fonts-src/space-grotesk-700.woff').buffer);
const upem = font.unitsPerEm;
const em = (v) => Math.round((v / upem) * 1e5) / 1e5;

// Split a glyph path into closed contours, then flatten each to a polygon for
// area/containment tests. Curves are sampled densely enough that the shoelace
// area and point-in-polygon answers are reliable at this outline fidelity.
const contoursOf = (commands) => {
    const contours = [];
    let current = null;
    let pen = { x: 0, y: 0 };
    for (const c of commands) {
        if (c.type === 'M') { current = { cmds: [c], pts: [[c.x, c.y]] }; pen = { x: c.x, y: c.y }; }
        else if (c.type === 'L') { current.cmds.push(c); current.pts.push([c.x, c.y]); pen = { x: c.x, y: c.y }; }
        else if (c.type === 'Q' || c.type === 'C') {
            current.cmds.push(c);
            for (let i = 1; i <= 16; i += 1) {
                const t = i / 16;
                const mt = 1 - t;
                if (c.type === 'Q') {
                    current.pts.push([
                        mt * mt * pen.x + 2 * mt * t * c.x1 + t * t * c.x,
                        mt * mt * pen.y + 2 * mt * t * c.y1 + t * t * c.y,
                    ]);
                } else {
                    current.pts.push([
                        mt * mt * mt * pen.x + 3 * mt * mt * t * c.x1 + 3 * mt * t * t * c.x2 + t * t * t * c.x,
                        mt * mt * mt * pen.y + 3 * mt * mt * t * c.y1 + 3 * mt * t * t * c.y2 + t * t * t * c.y,
                    ]);
                }
            }
            pen = { x: c.x, y: c.y };
        } else if (c.type === 'Z') { current.cmds.push(c); contours.push(current); current = null; }
    }
    return contours;
};

const area = (pts) => {
    let a = 0;
    for (let i = 0; i < pts.length; i += 1) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        a += x1 * y2 - x2 * y1;
    }
    return a / 2;
};

const contains = (outer, pt) => {
    let inside = false;
    for (let i = 0, j = outer.length - 1; i < outer.length; j = i, i += 1) {
        const [xi, yi] = outer[i];
        const [xj, yj] = outer[j];
        if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
};

const serialise = (cmds) => cmds.map((c) => {
    if (c.type === 'M' || c.type === 'L') return [c.type, em(c.x), em(c.y)];
    if (c.type === 'Q') return [c.type, em(c.x1), em(c.y1), em(c.x), em(c.y)];
    if (c.type === 'C') return [c.type, em(c.x1), em(c.y1), em(c.x2), em(c.y2), em(c.x), em(c.y)];
    return [c.type];
});

const glyphShapes = (glyph) => {
    const contours = contoursOf(glyph.path.commands);
    const containers = contours.map((c) =>
        contours.filter((o) => o !== c && contains(o.pts, c.pts[0])).length);
    const shapes = [];
    const shapeOf = new Map();
    contours.forEach((c, i) => {
        if (containers[i] % 2 === 0) {
            const shape = { outer: serialise(c.cmds), holes: [] };
            shapes.push(shape);
            shapeOf.set(i, shape);
        }
    });
    contours.forEach((c, i) => {
        if (containers[i] % 2 !== 1) return;
        // Belongs to its smallest container — the direct parent, not any
        // ancestor further out.
        let parent = -1;
        let parentArea = Infinity;
        contours.forEach((o, j) => {
            if (containers[j] % 2 === 0 && contains(o.pts, c.pts[0]) && Math.abs(area(o.pts)) < parentArea) {
                parent = j;
                parentArea = Math.abs(area(o.pts));
            }
        });
        shapeOf.get(parent)?.holes.push(serialise(c.cmds));
    });
    return shapes;
};

const chars = [...new Set(PHRASES.join('').replace(/ /g, ''))];
const glyphs = {};
for (const c of chars) {
    const g = font.charToGlyph(c);
    if (!g || g.index === 0) throw new Error(`no glyph for ${JSON.stringify(c)}`);
    glyphs[c] = { advance: em(g.advanceWidth), shapes: glyphShapes(g) };
}

const spaceGlyph = font.charToGlyph(' ');
const phrases = {};
for (const text of PHRASES) {
    let pen = 0;
    const words = [];
    for (const word of text.split(' ')) {
        const wglyphs = [];
        let wx = 0;
        let prev = null;
        for (const c of word) {
            const g = font.charToGlyph(c);
            const kern = prev ? font.getKerningValue(prev, g) : 0;
            wx += kern;
            wglyphs.push({ c, x: em(wx) });
            wx += g.advanceWidth;
            prev = g;
        }
        words.push({ text: word, x: em(pen), width: em(wx), glyphs: wglyphs });
        pen += wx + spaceGlyph.advanceWidth;
    }
    phrases[text] = { width: em(pen - spaceGlyph.advanceWidth), spaceWidth: em(spaceGlyph.advanceWidth), words };
}

const out = { unitsPerEm: 1, ascender: em(font.ascender), descender: em(font.descender), glyphs, phrases };
writeFileSync('src/three/headingPaths.json', `${JSON.stringify(out)}\n`);
const bytes = JSON.stringify(out).length;
console.log(`ok    src/three/headingPaths.json (${(bytes / 1024).toFixed(1)} KB, ${chars.length} glyphs, ${PHRASES.length} phrases)`);
