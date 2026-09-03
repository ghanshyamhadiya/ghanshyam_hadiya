// Verification helper: asserts the built index.html head is coherent.
//
// The expected shape depends on whether site.url is set: with a real domain the
// absolute-URL tags must be present and absolute; without one they must be
// absent entirely rather than emitted as a relative "/" or a dead domain.
import { readFileSync } from 'node:fs';
import { site } from '../src/data/site.js';

const html = readFileSync('dist/index.html', 'utf8');
const hasDomain = Boolean(site.url && !site.url.startsWith('TODO:'));

// Match real tags, not prose — the explanatory comment in index.html mentions
// "canonical" and "og:image" and would otherwise trip a substring check.
const urlDependent = [
    'rel="canonical"',
    'property="og:url"',
    'property="og:image"',
    'name="twitter:image"',
];

const alwaysPresent = [
    'property="og:title"',
    'property="og:description"',
    'name="twitter:card"',
    'application/ld+json',
];

const alwaysAbsent = ['URL_ONLY', '%SITE_', 'TODO:'];

let failures = 0;

const assert = (condition, message) => {
    if (!condition) failures += 1;
    console.log(`${condition ? 'ok   ' : 'FAIL '} ${message}`);
};

console.log(hasDomain ? `domain set: ${site.url}\n` : 'no domain set (URL tags expected absent)\n');

for (const token of alwaysAbsent) {
    assert(!html.includes(token), `absent: ${token}`);
}

for (const token of alwaysPresent) {
    assert(html.includes(token), `present: ${token}`);
}

for (const token of urlDependent) {
    assert(
        html.includes(token) === hasDomain,
        `${hasDomain ? 'present' : 'absent'}: ${token}`
    );
}

if (hasDomain) {
    // Relative values in these tags are invalid for OG and useless as canonical.
    for (const attr of ['canonical', 'og:url', 'og:image', 'twitter:image']) {
        const match = html.match(new RegExp(`${attr}"[^>]*?(?:href|content)="([^"]+)"`));
        assert(
            Boolean(match && match[1].startsWith('http')),
            `${attr} is absolute (${match?.[1] ?? 'not found'})`
        );
    }
}

const jsonLd = html.match(/ld\+json">([\s\S]*?)<\/script>/);
try {
    const parsed = JSON.parse(jsonLd[1]);
    assert(parsed['@type'] === 'Person', `JSON-LD parses, @type=${parsed['@type']}`);
    assert(
        Array.isArray(parsed.sameAs) && parsed.sameAs.length > 0,
        `JSON-LD sameAs has ${parsed.sameAs?.length ?? 0} profile link(s)`
    );
    assert(
        (parsed.knowsAbout?.length ?? 0) > 0,
        `JSON-LD knowsAbout has ${parsed.knowsAbout?.length ?? 0} entries`
    );
} catch (error) {
    assert(false, `JSON-LD invalid: ${error.message}`);
}

console.log(failures ? `\n${failures} failure(s)` : '\nhead OK');
process.exit(failures ? 1 : 0);
