// Minimal PDF text extractor: inflates FlateDecode content streams and pulls
// strings out of the Tj / TJ text-showing operators. Enough to read a resume;
// not a general-purpose PDF parser.
import { readFileSync } from 'node:fs';
import { inflateSync, inflateRawSync } from 'node:zlib';

const buf = readFileSync(process.argv[2]);
const latin = buf.toString('latin1');

const chunks = [];
const re = /stream\r?\n?/g;
let match;

while ((match = re.exec(latin)) !== null) {
    const start = match.index + match[0].length;
    const end = latin.indexOf('endstream', start);
    if (end === -1) continue;

    const raw = buf.subarray(start, end);
    for (const fn of [inflateSync, inflateRawSync]) {
        try {
            chunks.push(fn(raw).toString('latin1'));
            break;
        } catch {
            /* not a deflate stream, or a different filter — skip */
        }
    }
    re.lastIndex = end;
}

const unescape = (s) =>
    s
        .replace(/\\([nrtbf])/g, (_, c) => ({ n: '\n', r: '', t: '\t', b: '', f: '' })[c])
        .replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(Number.parseInt(o, 8)))
        .replace(/\\(.)/g, '$1');

const out = [];

for (const content of chunks) {
    // TJ arrays: [(Hello) -250 (World)] TJ
    // Tj strings: (Hello) Tj
    const ops = content.matchAll(/\[((?:[^[\]\\]|\\.)*)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*Tj|(T\*|Td|TD|ET)/g);
    for (const op of ops) {
        if (op[1] !== undefined) {
            const parts = [...op[1].matchAll(/\(((?:[^()\\]|\\.)*)\)/g)].map((m) => unescape(m[1]));
            out.push(parts.join(''));
        } else if (op[2] !== undefined) {
            out.push(unescape(op[2]));
        } else {
            out.push('\n');
        }
    }
}

console.log(
    out
        .join('')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{2,}/g, '\n')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('\n')
);
