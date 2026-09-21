// Pulls the self-hosted woff2 files for the display-font candidates.
//
// Google's CSS API serves per-subset files and only returns woff2 to a modern
// user agent, so the UA is spoofed and the latin subset is picked out. Run
// once; the files land in public/fonts and are committed.
import { mkdir, writeFile } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const FAMILIES = [
    { file: 'space-grotesk', query: 'Space+Grotesk:wght@400..700' },
];

await mkdir('public/fonts', { recursive: true });
for (const { file, query } of FAMILIES) {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`, { headers: { 'User-Agent': UA } });
    if (!css.ok) throw new Error(`${file}: CSS request failed with ${css.status}`);
    const text = await css.text();
    // Each @font-face block carries its unicode-range; keep the plain latin
    // one rather than latin-ext, which is larger and unused here.
    const blocks = text.split('@font-face').filter((block) => block.includes('unicode-range'));
    const latin = blocks.find((block) => /unicode-range:\s*U\+0000-00FF/.test(block)) ?? blocks.at(-1);
    const url = latin.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!url) throw new Error(`${file}: no woff2 URL in the returned CSS`);
    const font = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!font.ok) throw new Error(`${file}: font download failed with ${font.status}`);
    const bytes = Buffer.from(await font.arrayBuffer());
    await writeFile(`public/fonts/${file}.woff2`, bytes);
    console.log(`ok    ${file}.woff2 (${(bytes.length / 1024).toFixed(1)} KB)`);
}

// The 3D heading pipeline parses outlines with opentype.js, which cannot read
// woff2. A legacy UA gets WOFF instead, served as four static weights — the
// display face tops out at 700 — and the response carries no unicode-range
// blocks. The file is a build-time intermediate under gitignored refs/: it is
// parsed by build-heading-paths.mjs and never shipped.
const LEGACY_UA = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36';
const legacyCss = await fetch('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400..700&display=swap', { headers: { 'User-Agent': LEGACY_UA } });
if (!legacyCss.ok) throw new Error(`woff: CSS request failed with ${legacyCss.status}`);
const bold = (await legacyCss.text()).split('@font-face').find((block) => /font-weight:\s*700/.test(block));
const woffUrl = bold?.match(/url\((https:[^)]+\.woff)\)/)?.[1];
if (!woffUrl) throw new Error('woff: no 700-weight woff URL in the returned CSS');
const woff = await fetch(woffUrl, { headers: { 'User-Agent': LEGACY_UA } });
if (!woff.ok) throw new Error(`woff: download failed with ${woff.status}`);
const woffBytes = Buffer.from(await woff.arrayBuffer());
if (woffBytes.subarray(0, 4).toString('latin1') !== 'wOFF') throw new Error('woff: download is not a WOFF file');
await mkdir('refs/fonts-src', { recursive: true });
await writeFile('refs/fonts-src/space-grotesk-700.woff', woffBytes);
console.log(`ok    refs/fonts-src/space-grotesk-700.woff (${(woffBytes.length / 1024).toFixed(1)} KB)`);
console.log('\nfonts fetched');
