import fs from 'fs';
import path from 'path';
import { createCanvas } from '@napi-rs/canvas';

const pdfPath = process.argv[2];
const outDir = process.argv[3];
const want = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const scale = Number(process.argv[5] || 1.6);

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise;

fs.mkdirSync(outDir, { recursive: true });
const pages = want || Array.from({ length: doc.numPages }, (_, i) => i + 1);

for (const n of pages) {
  if (n > doc.numPages) continue;
  const page = await doc.getPage(n);
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const file = path.join(outDir, `page-${String(n).padStart(2, '0')}.png`);
  fs.writeFileSync(file, canvas.toBuffer('image/png'));
}
console.log('total pages:', doc.numPages, '| rendered:', pages.length);