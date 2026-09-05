// Verification helper: every image referenced from the data layer must exist
// on disk, with alt text and explicit dimensions.
//
// A broken portrait is one of the few failures that is both very visible and
// completely silent at build time — Vite does not resolve /public paths, so a
// renamed file ships as an alt-text box. This catches it.
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { profile } from '../src/data/profile.js';

let failures = 0;

const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};

// Collect every path a <picture> could request: the src plus each srcSet entry.
const pathsFrom = (photo) => {
    const set = new Set([photo.src]);
    for (const entry of (photo.srcSet ?? '').split(',')) {
        const url = entry.trim().split(/\s+/)[0];
        if (url) set.add(url);
    }
    return [...set];
};

const photos = Object.entries(profile.photos ?? {});
assert(photos.length > 0, `profile.photos defines ${photos.length} image slot(s)`);

for (const [name, photo] of photos) {
    assert(Boolean(photo.alt?.trim()), `${name}: has alt text`);
    assert(
        Number.isFinite(photo.width) && Number.isFinite(photo.height),
        `${name}: has explicit width/height (prevents layout shift)`
    );

    for (const url of pathsFrom(photo)) {
        const file = join('public', url.replace(/^\//, ''));
        const exists = existsSync(file);
        assert(
            exists,
            `${name}: ${url}${exists ? ` (${Math.round(statSync(file).size / 1024)} KB)` : ' — MISSING'}`
        );
    }
}

console.log(failures ? `\n${failures} asset problem(s)` : '\nassets OK');
process.exit(failures ? 1 : 0);
