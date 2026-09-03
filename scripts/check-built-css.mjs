// Verification helper: proves the SHIPPED stylesheet contains no non-zero
// border-radius. check-radius.mjs guards the source; this guards the output,
// which is what actually reaches a browser.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist/assets';
const cssFiles = readdirSync(dir).filter((f) => f.endsWith('.css'));

if (!cssFiles.length) {
    console.log('FAIL  no built CSS found — run npm run build first');
    process.exit(1);
}

let failures = 0;

for (const file of cssFiles) {
    const css = readFileSync(join(dir, file), 'utf8');
    const declarations = [...css.matchAll(/border-radius:\s*([^;}]+)/g)].map((m) => m[1].trim());

    const nonZero = declarations.filter((v) => !/^0(px|rem|%|em)?(\s*!important)?$/.test(v));

    console.log(`${file}: ${declarations.length} border-radius declaration(s)`);
    for (const value of new Set(nonZero)) {
        failures += 1;
        console.log(`  FAIL  non-zero radius shipped: ${value}`);
    }
}

console.log(failures ? `\n${failures} non-zero radius value(s)` : '\nbuilt CSS is curve-free');
process.exit(failures ? 1 : 0);
