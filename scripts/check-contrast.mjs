// Verification helper: every colour pairing the design actually uses, checked
// against WCAG AA.
//
// A light multi-colour palette has far more failure modes than the previous
// dark monochrome one, and one of them is a trap: white text on hot pink — the
// most obvious CTA styling, and what the reference site itself uses — measures
// 3.60 and fails. It is listed below as an explicit expected-failure so nobody
// "fixes" the palette by reintroducing it.
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

// Must mirror the @theme block in src/index.css.
const C = {
    canvas: '#fff7ec',
    surface: '#ffffff',
    amber: '#ffc93c',
    amberSoft: '#ffe9a8',
    indigo: '#332c81',
    indigoDeep: '#221c5c',
    pink: '#ff1e8e',
    pinkDeep: '#d6006f',
    ink: '#141225',
    muted: '#4a4560',
    subtle: '#6e6885',
};

// BODY  4.5 — any text below 24px (or 18.66px bold)
// LARGE 3.0 — display text and non-text UI such as borders and icons
// DECOR 1.0 — never carries text; listed so the value is still reported
const BODY = 4.5;
const LARGE = 3.0;
const DECOR = 1.0;

const pairs = [
    // Text on the light canvas and cards
    [C.ink, C.canvas, BODY, 'ink on canvas'],
    [C.muted, C.canvas, BODY, 'muted on canvas'],
    [C.subtle, C.canvas, BODY, 'subtle on canvas'],
    [C.ink, C.surface, BODY, 'ink on white card'],
    [C.muted, C.surface, BODY, 'muted on white card'],
    [C.subtle, C.surface, BODY, 'subtle on white card'],
    [C.indigo, C.canvas, BODY, 'indigo on canvas'],
    [C.pinkDeep, C.canvas, BODY, 'pink-deep on canvas'],

    // Amber panels
    [C.ink, C.amber, BODY, 'ink on amber panel'],
    [C.indigo, C.amber, BODY, 'indigo on amber panel'],
    [C.ink, C.amberSoft, BODY, 'ink on soft amber'],

    // Indigo panels (hero curtain, contact, footer)
    [C.canvas, C.indigo, BODY, 'cream on indigo'],
    [C.surface, C.indigo, BODY, 'white on indigo'],
    [C.amber, C.indigo, BODY, 'amber on indigo'],
    [C.canvas, C.indigoDeep, BODY, 'cream on deep indigo'],

    // Buttons
    [C.ink, C.pink, BODY, 'ink on pink button'],
    [C.surface, C.pinkDeep, BODY, 'white on pink-deep button'],
    [C.canvas, C.indigo, BODY, 'cream on indigo button'],

    // Large-display and decorative only
    [C.pink, C.canvas, LARGE, 'pink on canvas (display only)'],
    [C.pink, C.indigo, LARGE, 'pink on indigo (display only)'],
    [C.amber, C.canvas, DECOR, 'amber on canvas (decoration only)'],
];

// Pairings that must NEVER be used. Reported if someone widens the palette
// rules without re-reading the numbers.
const forbidden = [[C.surface, C.pink, 'white text on hot pink']];

let failures = 0;

console.log('ratio  need  status  pairing');
for (const [fg, bg, min, label] of pairs) {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) failures += 1;
    console.log(
        `${r.toFixed(2).padStart(5)}  ${min.toFixed(1)}   ${ok ? 'pass  ' : 'FAIL  '}  ${label}`
    );
}

console.log('\nforbidden pairings (must stay below AA, documenting why):');
for (const [fg, bg, label] of forbidden) {
    const r = ratio(fg, bg);
    console.log(`${r.toFixed(2).padStart(5)}  ----   noted   ${label} — use ink on pink instead`);
}

console.log(failures ? `\n${failures} failing pairing(s)` : '\ncontrast OK');
process.exit(failures ? 1 : 0);
