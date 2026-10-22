import assert from 'node:assert/strict';

// Synthetic DOM fixture for the private tool-card adapter, complementary to
// visual-review's real host/session coverage. No PI WEB controllers are mocked.
export async function checkLogoLifecycle(context, moduleUrl) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e=>errors.push(e.message));
  const fixtureUrl = new URL('/__pendant-logo-fixture',moduleUrl).href;
  await page.route(fixtureUrl, route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
  try {
    await page.goto(fixtureUrl);
    await page.evaluate(async url=>{
      window.plugin = (await import(url)).default.activate();
      document.documentElement.dataset.piWebTheme='pendant:dark';
      window.card = (command='git status') => {
        const host = document.createElement('div');
        document.body.append(host);
        const root = host.attachShadow({mode:'open'});
        root.innerHTML='<section class="tool-card"><div class="tool-header"><div class="tool-title"><span class="status-icon">✓</span><strong>bash</strong><span class="summary"></span></div></div><div class="detail-target"><pre></pre></div></section>';
        root.querySelector('pre').textContent=command;
        return host;
      };
      window.first = window.card();
      window.plugin.start();
    },moduleUrl);
    await page.locator('.pendant-cmd-logo').waitFor();
    assert.equal(await page.locator('.pendant-cmd-name').innerText(),'Git');
    await page.evaluate(()=>{first.shadowRoot.querySelector('pre').textContent='npm test';});
    await page.waitForFunction(()=>first.shadowRoot.querySelector('.pendant-cmd-name')?.textContent==='npm');
    await page.evaluate(()=>{first.shadowRoot.querySelector('strong').textContent='read';});
    await page.waitForFunction(()=>!first.shadowRoot.querySelector('.pendant-cmd-logo'));
    assert.equal(await page.locator('.pendant-cmd-hidden').count(),0);
    await page.evaluate(()=>{first.shadowRoot.querySelector('strong').textContent='bash';first.shadowRoot.querySelector('pre').textContent='unmapped-command';});
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.pendant-cmd-logo').count(),0);
    // Reuse the card, and exercise discovery of a root attached after startup.
    await page.evaluate(()=>{first.shadowRoot.querySelector('pre').textContent='git diff';window.second=window.card('python --version');});
    await page.waitForFunction(()=>second.shadowRoot.querySelector('.pendant-cmd-logo'));
    assert.equal(await page.locator('.pendant-cmd-logo').count(),2);
    await page.evaluate(()=>first.remove());
    await page.waitForTimeout(850);
    assert(await page.evaluate(()=>!first.shadowRoot.querySelector('.pendant-cmd-logo')));
    await page.evaluate(()=>document.body.append(first));
    await page.waitForFunction(()=>first.shadowRoot.querySelector('.pendant-cmd-logo'));
    await page.evaluate(()=>document.documentElement.dataset.piWebTheme='themes:pi-web-dark');
    await page.waitForFunction(()=>!first.shadowRoot.querySelector('.pendant-cmd-logo'));
    assert.equal(await page.locator('.pendant-cmd-hidden').count(),0);
    await page.evaluate(()=>document.documentElement.dataset.piWebTheme='pendant:mono');
    await page.waitForFunction(()=>first.shadowRoot.querySelector('.pendant-cmd-logo'));
    assert(await page.locator('.pendant-cmd-logo svg').first().evaluate(n=>n.style.color.includes('--pi-text-secondary')));
    await page.evaluate(()=>plugin.dispose());
    assert.equal(await page.locator('.pendant-cmd-logo').count(),0);
    await page.evaluate(()=>{first.shadowRoot.querySelector('pre').textContent='npm test';window.card();});
    await page.waitForTimeout(850);
    assert.equal(await page.locator('.pendant-cmd-logo').count(),0);
    assert.deepEqual(errors,[]);
    return ['Logo adapter: command mutation, recycled non-bash card, unknown command, late shadow root, disconnect/reconnect, stock/mono switching, disposal'];
  } finally { await page.close(); }
}
