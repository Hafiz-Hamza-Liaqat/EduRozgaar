import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'docs', 'qa-sprint-b2');
const names = ['full-qa', 'short-1page', 'medium-2page', 'long-3page'];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 850, height: 1100 });
const base = `file:///${path.resolve(dir).replace(/\\/g, '/')}/`;

for (const name of names) {
  const pdfFile = `${name}.pdf`;
  if (!fs.existsSync(path.join(dir, pdfFile))) continue;
  for (let pageNum = 1; pageNum <= 5; pageNum += 1) {
    await page.goto(`${base}${pdfFile}#page=${pageNum}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    const label = await page.evaluate(() => {
      const m = document.body?.innerText?.match(/\b(\d+)\s*\/\s*(\d+)\b/);
      return m ? { current: Number(m[1]), total: Number(m[2]) } : null;
    });
    await page.screenshot({ path: path.join(dir, `${name}-pdf-page${pageNum}.png`) });
    console.log(`${name} page ${pageNum}`, label || '');
    if (label && label.current >= label.total) break;
  }
}

await browser.close();
