import fs from 'fs';
import path from 'path';
import { DOMParser, XMLSerializer } from 'xmldom';

const TARGET_SIZE = 512;

const INPUT_DIR = './public/character';

// ❌ FILES KHÔNG ĐƯỢC ĐỘNG TỚI
const EXCLUDE_PREFIX = 'nochain';

function normalizeSVG(filePath) {
  const svg = fs.readFileSync(filePath, 'utf8');
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.getElementsByTagName('svg')[0];

  if (!svgEl) return;

  svgEl.setAttribute('viewBox', `0 0 ${TARGET_SIZE} ${TARGET_SIZE}`);
  svgEl.setAttribute('width', TARGET_SIZE);
  svgEl.setAttribute('height', TARGET_SIZE);
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const result = new XMLSerializer().serializeToString(doc);
  fs.writeFileSync(filePath, result);
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (
      file.endsWith('.svg') &&
      !file.startsWith(EXCLUDE_PREFIX) // 🚫 BỎ QUA nochain*
    ) {
      console.log('✔ Normalize:', fullPath);
      normalizeSVG(fullPath);
    } else if (file.endsWith('.svg')) {
      console.log('⏭ Skip:', fullPath);
    }
  });
}

walk(INPUT_DIR);
console.log('🎉 DONE (nochain files skipped)');
