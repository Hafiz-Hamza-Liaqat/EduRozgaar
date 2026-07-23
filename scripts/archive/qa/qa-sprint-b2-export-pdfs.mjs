import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'docs', 'qa-sprint-b2');

const RESUMES = [
  ['full-qa', '6a52835f49364e1570f18034'],
  ['short-1page', '6a52835f49364e1570f18037'],
  ['medium-2page', '6a52835f49364e1570f18039'],
  ['long-3page', '6a52835f49364e1570f1803b'],
];

async function login() {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@edurozgaar.pk', password: 'Admin1234' }),
  });
  return res.json();
}

async function capturePdfPages(pdfName, maxPages = 4) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 920, height: 1280 });
  const pdfPath = path.resolve(dir, `${pdfName}.pdf`).replace(/\\/g, '/');
  await page.goto(`file:///${pdfPath}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  // Click page thumbnails in Chrome PDF viewer for accurate per-page shots
  const thumbs = await page.$$('div.thumbnail');
  const count = Math.min(thumbs.length || maxPages, maxPages);
  for (let i = 0; i < count; i += 1) {
    if (thumbs[i]) await thumbs[i].click();
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(dir, `${pdfName}-pdf-page${i + 1}.png`) });
  }
  if (!thumbs.length) {
    for (let p = 1; p <= maxPages; p += 1) {
      if (p > 1) {
        await page.keyboard.press('PageDown');
        await new Promise((r) => setTimeout(r, 900));
      }
      await page.screenshot({ path: path.join(dir, `${pdfName}-pdf-page${p}.png`) });
    }
  }
  console.log(`${pdfName}: captured ${count || maxPages} page screenshot(s)`);
  await browser.close();
}

async function main() {
  fs.mkdirSync(dir, { recursive: true });
  const auth = await login();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.evaluate(
    ({ token, refresh, user }) => {
      localStorage.setItem('edurozgaar-token', token);
      localStorage.setItem('edurozgaar-refresh-token', refresh);
      localStorage.setItem('edurozgaar-user', JSON.stringify(user));
    },
    { token: auth.accessToken, refresh: auth.refreshToken, user: auth.user }
  );

  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: path.resolve(dir) });

  for (const [label, id] of RESUMES) {
    await page.goto(`http://localhost:5173/resume-builder?edit=${id}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.resume-preview', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    const before = fs.readdirSync(dir).filter((f) => f.endsWith('.pdf'));
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /download resume/i.test(b.textContent || ''));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 12000));
    const after = fs.readdirSync(dir).filter((f) => f.endsWith('.pdf'));
    const newPdf = after.find((f) => !before.includes(f));
    if (newPdf) {
      fs.copyFileSync(path.join(dir, newPdf), path.join(dir, `${label}.pdf`));
      console.log(`${label}: OK (${fs.statSync(path.join(dir, `${label}.pdf`)).size} bytes)`);
    } else {
      console.log(`${label}: FAILED`);
    }
  }
  await browser.close();

  for (const [label] of RESUMES) {
    if (fs.existsSync(path.join(dir, `${label}.pdf`))) {
      await capturePdfPages(label, label.startsWith('long') ? 4 : 3);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
