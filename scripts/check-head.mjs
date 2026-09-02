// Verification helper: asserts the built index.html head is coherent.
import { readFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');

// Match real tags, not prose — the explanatory comment in index.html mentions
// "canonical" and "og:image" and would otherwise trip a substring check.
const shouldBeAbsent = [
    'URL_ONLY',
    '%SITE_',
    'rel="canonical"',
    'property="og:url"',
    'property="og:image"',
    'name="twitter:image"',
];
const shouldBePresent = [
    'property="og:title"',
    'property="og:description"',
    'name="twitter:card"',
    'application/ld+json',
];

let failures = 0;

for (const token of shouldBeAbsent) {
    const present = html.includes(token);
    if (present) failures += 1;
    console.log(`${present ? 'FAIL  present' : 'ok    absent '}  ${token}`);
}

for (const token of shouldBePresent) {
    const present = html.includes(token);
    if (!present) failures += 1;
    console.log(`${present ? 'ok    present' : 'FAIL  absent '}  ${token}`);
}

const jsonLd = html.match(/ld\+json">([\s\S]*?)<\/script>/);
try {
    const parsed = JSON.parse(jsonLd[1]);
    console.log(`ok    JSON-LD parses (@type=${parsed['@type']}, ${parsed.knowsAbout?.length ?? 0} knowsAbout)`);
} catch (error) {
    failures += 1;
    console.log(`FAIL  JSON-LD invalid: ${error.message}`);
}

console.log(failures ? `\n${failures} failure(s)` : '\nhead OK');
process.exit(failures ? 1 : 0);
