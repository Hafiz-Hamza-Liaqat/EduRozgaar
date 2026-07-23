import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'docs', 'qa-sprint-b2');

const RESUMES = [
  ['short-1page', '6a52835f49364e1570f18037'],
  ['medium-2page', '6a52835f49364e1570f18039'],
  ['long-3page', '6a52835f49364e1570f1803b'],
];

const auth = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@edurozgaar.pk', password: 'Admin1234' }),
}).then((r) => r.json());

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
const dlPath = path.join(dir, 'downloads-tmp');
fs.mkdirSync(dlPath, { recursive: true });
await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: path.resolve(dlPath) });

for (const [label, id] of RESUMES) {
  fs.rmSync(dlPath, { recursive: true, force: true });
  fs.mkdirSync(dlPath, { recursive: true });
  await page.goto(`http://localhost:5173/resume-builder?edit=${id}`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.resume-preview', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /download resume/i.test(b.textContent || ''));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 15000));
  const files = fs.readdirSync(dlPath).filter((f) => f.endsWith('.pdf'));
  if (files.length) {
    fs.copyFileSync(path.join(dlPath, files[0]), path.join(dir, `${label}.pdf`));
    console.log(`${label}: ${files[0]} (${fs.statSync(path.join(dir, `${label}.pdf`)).size} bytes)`);
  } else {
    console.log(`${label}: FAILED`);
  }
}

await browser.close();
