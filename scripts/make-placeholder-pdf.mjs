// One-off generator for public/resume.pdf so the "Download CV" button always
// resolves to a real, openable file until the user drops in their own.
// Writes a spec-compliant single-page PDF with a correct xref table.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const lines = [
    { text: 'Placeholder CV', size: 22, y: 770 },
    { text: 'This file is a placeholder committed with the portfolio.', size: 11, y: 735 },
    { text: 'Replace public/resume.pdf with your real CV.', size: 11, y: 718 },
    { text: 'The Download CV buttons in the navbar, hero and contact', size: 11, y: 690 },
    { text: 'section all point at this path - no code changes needed.', size: 11, y: 673 },
];

const content = `BT\n${lines
    .map((l) => `/F1 ${l.size} Tf 1 1 1 rg 60 ${l.y} Td (${l.text}) Tj 0 0 Td ET BT`)
    .join('\n')}\nET\n`;

// Dark page background matching the site, drawn before the text.
const stream = `0.039 0.039 0.043 rg\n0 0 595 842 re f\n${content}`;

const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
];

let pdf = '%PDF-1.4\n';
const offsets = [];

objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
});

const xrefStart = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
});
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

const out = resolve(process.argv[2] ?? 'public/resume.pdf');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(pdf, 'latin1'));
console.log(`wrote ${out} (${Buffer.byteLength(pdf, 'latin1')} bytes)`);
