import { chromium } from 'playwright';

const SCRATCH = 'C:\\Users\\Lenovo\\AppData\\Local\\Temp\\claude\\c--Users-Lenovo-Desktop-ALL-FILES-business-Chavee-application-chavee--claude-worktrees-chavee-mobile-redesign-a916c2\\efb0a777-913e-4fb0-9c66-f3a5408803ce\\scratchpad\\';
const TEST_EMAIL = process.argv[2] || `worksirfhan+chaveetest-${Date.now()}@gmail.com`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
page.on('requestfailed', req => console.log('[reqfailed]', req.url(), req.failure()?.errorText));

try {
  console.log('Navigating to https://chavee.in/ ...');
  await page.goto('https://chavee.in/', { waitUntil: 'networkidle', timeout: 60000 });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[type="email"][placeholder="Enter your email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill(TEST_EMAIL);
  console.log('Filled email:', TEST_EMAIL);

  console.log('Waiting for turnstile widget...');
  const tsFrame = page.frameLocator('iframe[src*="challenges.cloudflare.com"]').first();
  await page.waitForSelector('iframe[src*="challenges.cloudflare.com"]', { timeout: 20000 }).catch(() => console.log('no turnstile iframe found within timeout'));

  await page.waitForTimeout(5000);

  try {
    const cb = tsFrame.locator('input[type="checkbox"], #challenge-stage, .cb-c');
    if (await cb.count() > 0) {
      await cb.first().click({ timeout: 5000 });
      console.log('Clicked turnstile checkbox');
    }
  } catch (e) {
    console.log('checkbox click attempt failed/skip:', e.message);
  }

  await page.waitForTimeout(3000);

  let tokenFound = false;
  for (let i = 0; i < 20; i++) {
    const val = await page.evaluate(() => {
      const el = document.querySelector('input[name="cf-turnstile-response"]');
      return el ? el.value : null;
    });
    if (val) { tokenFound = true; console.log('Turnstile token acquired, length:', val.length); break; }
    await page.waitForTimeout(1500);
  }
  console.log('tokenFound:', tokenFound);

  if (!tokenFound) {
    await page.screenshot({ path: SCRATCH + 'newsletter_fail.png', fullPage: true });
    console.log('Screenshot saved (fail state).');
  } else {
    const submitBtn = page.locator('button[type="submit"]', { hasText: /Subscribe|✓|\.\.\./ });
    await submitBtn.first().click({ timeout: 10000 });
    console.log('Clicked submit');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: SCRATCH + 'newsletter_result.png', fullPage: true });
    console.log('Screenshot saved (result state).');
  }
} catch (err) {
  console.error('ERROR:', err);
  await page.screenshot({ path: SCRATCH + 'newsletter_error.png', fullPage: true }).catch(()=>{});
} finally {
  await browser.close();
}
