import fs from 'fs';
import path from 'path';
import { pdf } from 'pdf-to-img';

const pdfPath = process.argv[2];
const outDir = process.argv[3];
const want = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const scale = Number(process.argv[5] || 1.6);

fs.mkdirSync(outDir, { recursive: true });
let i = 0;
const doc = await pdf(pdfPath, { scale });
console.log('total pages:', doc.length);
for await (const page of doc) {
  i++;
  if (want && !want.includes(i)) continue;
  const file = path.join(outDir, `page-${String(i).padStart(2, '0')}.png`);
  fs.writeFileSync(file, page);
  console.log('wrote', path.basename(file));
}