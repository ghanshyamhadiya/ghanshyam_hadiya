// Runs the SSR smoke test and asserts the rendered markup contains the content
// each section is supposed to produce.
import { render } from '../dist-ssr/ssr-entry.js';

let failures = 0;
let html = '';

try {
    html = render();
    console.log(`ok    rendered ${html.length} chars without throwing`);
} catch (error) {
    console.log(`FAIL  render threw: ${error.stack}`);
    process.exit(1);
}

// Each section must contribute its landmark id and some real content.
const expectations = [
    ['id="home"', 'hero section'],
    ['id="impact"', 'stats section'],
    ['id="about"', 'about section'],
    ['id="process"', 'process section'],
    ['id="skills"', 'skills section'],
    ['id="experience"', 'experience section'],
    ['id="work"', 'projects section'],
    ['id="credentials"', 'credentials section'],
    ['id="contact"', 'contact section'],
    ['id="main"', 'main landmark'],
    ['Skip to content', 'skip link'],
    // The hero headline is split into one span per word for the mask reveal,
    // so assert on single words rather than a contiguous phrase.
    ['pipelines', 'hero headline lead word'],
    ['trust.', 'hero headline emphasis word'],
    ['Ghanshyam', 'real name rendered'],
    ['hadiyaghanshyam13@gmail.com', 'real email rendered'],
    ['Flytics', 'real employer from CV'],
    ['AWS Glue', 'current-role stack from CV'],
    ['Oracle Data Integrator', 'earlier-consulting stack from CV'],
    ['Supply Chain Data Pipeline', 'real project from CV'],
    ['ghanshyamhadiya/MigrationTool', 'real repository link'],
    ['Ahmedabad Institute of Technology', 'real education from CV'],
    ['Ingestion &amp; Integration', 'skill layer from data'],
    ['aria-label="Data flow:', 'diagram accessible description'],
    // The overlay itself only mounts when open, so assert on the toggle that
    // controls it rather than on aria-modal.
    ['aria-controls="mobile-menu"', 'mobile menu toggle wiring'],
    ['aria-labelledby="skills-title"', 'sections labelled by their heading'],
];

for (const [needle, label] of expectations) {
    const present = html.includes(needle);
    if (!present) failures += 1;
    console.log(`${present ? 'ok   ' : 'FAIL '} ${label} (${needle})`);
}

// No placeholder text may ever reach a visitor. This is the single most
// important assertion in this file — a live "TODO:" on the page is worse than
// any layout bug.
const todos = [...html.matchAll(/TODO:[^<]{0,60}/g)].map((m) => m[0]);
if (todos.length) failures += 1;
console.log(
    `${todos.length ? 'FAIL ' : 'ok   '} no TODO: placeholders in rendered output${
        todos.length ? ` -> ${todos.join(' | ')}` : ''
    }`
);

// Nested anchors are invalid and were a real risk when the project card gained
// its own repository link.
const nestedAnchor = /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*?<a\b/.test(html);
if (nestedAnchor) failures += 1;
console.log(`${nestedAnchor ? 'FAIL ' : 'ok   '} no nested <a> elements`);

// dt must precede dd within each definition list group.
const dlBlocks = html.match(/<dl\b[\s\S]*?<\/dl>/g) ?? [];
const badOrder = dlBlocks.some((block) => {
    const tags = [...block.matchAll(/<(dt|dd)\b/g)].map((m) => m[1]);
    // Walk pairs: every dd must be preceded by at least one dt.
    let seenDt = 0;
    for (const tag of tags) {
        if (tag === 'dt') seenDt += 1;
        else if (seenDt === 0) return true;
    }
    return false;
});
if (badOrder) failures += 1;
console.log(`${badOrder ? 'FAIL ' : 'ok   '} dt precedes dd in all ${dlBlocks.length} <dl> blocks`);

for (const section of ['about', 'process', 'skills', 'experience', 'work', 'credentials', 'contact']) {
    const id = `${section}-title`;
    const matches = html.match(new RegExp(`<h2\\b[^>]*id="${id}"[^>]*>`, 'g')) ?? [];
    const valid = matches.length === 1 && html.includes(`aria-labelledby="${id}"`);
    if (!valid) failures += 1;
    console.log(`${valid ? 'ok   ' : 'FAIL '} single semantic heading linked to ${section}`);
}

const portraits = html.match(/<img\b[^>]*\bsrc="\/photos\/[^\"]+"[^>]*>/g) ?? [];
const heroBlock = html.match(/<section\b[^>]*\bid="home"[\s\S]*?<\/section>/)?.[0] ?? '';
const heroModel = portraits.length === 0 && heroBlock.includes('data-hero-model') && heroBlock.includes('data-model-poster');
if (!heroModel) failures += 1;
console.log(`${heroModel ? 'ok   ' : 'FAIL '} hero has a model fallback and no portrait images (${portraits.length} portraits)`);

console.log(failures ? `\n${failures} failure(s)` : '\nrender OK');
process.exit(failures ? 1 : 0);
