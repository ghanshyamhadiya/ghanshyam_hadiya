// Verification helper: the design mandates zero curves, so this fails if any
// rounded-* utility or a non-zero border-radius is committed.
//
// The radius scale in index.css @theme is all 0, but Tailwind hardcodes
// `rounded-full` as calc(infinity * 1px) rather than reading a token, so the
// scale alone cannot enforce the rule. This check does.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = 'src';
const files = [];

(function walk(dir) {
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) walk(path);
        else if (['.jsx', '.js', '.css'].includes(extname(path))) files.push(path);
    }
})(ROOT);

// Blank out comment bodies while preserving newlines, so prose that merely
// mentions "rounded" doesn't trip the check but line numbers stay accurate.
const stripComments = (source) =>
    source
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));

// The single legitimate occurrence: the rule in index.css that neutralises
// Tailwind's hardcoded rounded-full.
const ALLOWED = [/^\s*\.rounded-full\s*\{\s*$/];

let failures = 0;

for (const file of files) {
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n');

    lines.forEach((line, i) => {
        if (ALLOWED.some((pattern) => pattern.test(line))) return;

        for (const match of line.matchAll(/\brounded(-[a-z0-9[\]()-]+)?\b/g)) {
            failures += 1;
            console.log(`FAIL  ${file}:${i + 1}  ${match[0]}  -> ${line.trim().slice(0, 80)}`);
        }

        const radius = line.match(/border-radius:\s*([^;]+)/);
        if (radius && !/^0(px|rem|%)?(\s*!important)?$/.test(radius[1].trim())) {
            failures += 1;
            console.log(`FAIL  ${file}:${i + 1}  border-radius: ${radius[1].trim()}`);
        }
    });
}

console.log(
    failures
        ? `\n${failures} curve(s) found across ${files.length} files`
        : `\nno curves: ${files.length} files clean`
);
process.exit(failures ? 1 : 0);
