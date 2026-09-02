// Verification helper: computes WCAG contrast ratios for the theme's text
// colours against the surfaces they actually sit on.
const hex = (h) => {
    const v = h.replace('#', '');
    return [0, 2, 4].map((i) => Number.parseInt(v.slice(i, i + 2), 16) / 255);
};

const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => {
    const [r, g, b] = hex(h).map(lin);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

const surfaces = { bg: '#0a0a0b', surface: '#111113', 'surface-2': '#17171a' };
const texts = {
    ink: '#ededef',
    muted: '#a1a1a8',
    subtle: '#8a8a93',
    accent: '#c98b5e',
    'accent-hi': '#e0a56f',
};

// Body text needs 4.5:1; large text (>=24px or >=18.66px bold) needs 3:1.
const MIN_BODY = 4.5;
const MIN_LARGE = 3;

let failures = 0;
console.log('colour        surface      ratio   body(4.5)  large(3.0)');

for (const [tName, tHex] of Object.entries(texts)) {
    for (const [sName, sHex] of Object.entries(surfaces)) {
        const r = ratio(tHex, sHex);
        const body = r >= MIN_BODY;
        const large = r >= MIN_LARGE;
        // accent is used for large display text and non-text UI, so only its
        // large-text threshold is enforced.
        const enforced = tName.startsWith('accent') ? large : body;
        if (!enforced) failures += 1;
        console.log(
            `${tName.padEnd(13)} ${sName.padEnd(12)} ${r.toFixed(2).padStart(5)}   ${
                body ? 'pass' : 'FAIL'
            }       ${large ? 'pass' : 'FAIL'}`
        );
    }
}

// The copper button uses bg colour as its label.
const onAccent = ratio('#0a0a0b', '#c98b5e');
console.log(`\nbg on accent (button label): ${onAccent.toFixed(2)} ${onAccent >= 4.5 ? 'pass' : 'FAIL'}`);
if (onAccent < MIN_BODY) failures += 1;

console.log(failures ? `\n${failures} failure(s)` : '\ncontrast OK');
process.exit(failures ? 1 : 0);
