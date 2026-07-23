import puppeteer from 'puppeteer';

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

await page.goto('http://localhost:5173/admin/career-guidance', { waitUntil: 'networkidle2' });
await page.waitForSelector('button', { timeout: 15000 });
const addBtn = await page.evaluateHandle(() =>
  [...document.querySelectorAll('button')].find((b) => /add article/i.test(b.textContent || ''))
);
if (addBtn) await addBtn.click();
await new Promise((r) => setTimeout(r, 1000));

const urlInput = await page.$('input[inputmode="url"]');
await urlInput.click({ clickCount: 3 });
await urlInput.type('https://picsum.photos/200/200');
await new Promise((r) => setTimeout(r, 3000));

const result = await page.evaluate(() => {
  const img = document.querySelector('.mt-2 img');
  return {
    imgSrc: img?.src || null,
    imgComplete: img?.complete,
    imgNaturalWidth: img?.naturalWidth,
    hint: document.querySelector('.text-\\[11px\\]')?.textContent,
  };
});
console.log('Preview test:', JSON.stringify(result, null, 2));
await page.screenshot({ path: 'docs/qa-sprint-b2/image-preview-test.png' });
await browser.close();
