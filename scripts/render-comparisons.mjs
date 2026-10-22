import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const browser = await chromium.launch(process.env.CHROME_BIN ? {executablePath:process.env.CHROME_BIN} : {channel:'msedge'});
try {
  const page = await browser.newPage({viewport:{width:2000,height:1100},deviceScaleFactor:1});
  await page.goto(pathToFileURL(resolve('review/index.html')).href);
  const options = await page.locator('#view option').evaluateAll(nodes=>nodes.map(n=>n.value));
  for(const view of options) {
    await page.selectOption('#view',view);
    await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
    assert(await page.locator('img').evaluateAll(nodes=>nodes.every(n=>n.naturalWidth>0)));
    if(['desktop-chat','desktop-tools','settings','mobile-chat'].includes(view)) {
      if(view.startsWith('mobile')) await page.locator('main').screenshot({path:resolve(`review/compare-${view}.png`)});
      else await page.screenshot({path:resolve(`review/compare-${view}.png`),fullPage:true});
    }
  }
  // Review contact sheet includes every palette, without altering source PNGs.
  await page.setContent('<style>body{background:#161616;color:white;font:18px system-ui;display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px}figure{margin:0}img{width:100%}</style>'+['dark','light','amber','green','cyan','mono','muted'].map(id=>`<figure><figcaption>${id}</figcaption><img src="${pathToFileURL(resolve(`review/refinement/palette-${id}.png`)).href}"></figure>`).join(''));
  await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
  await page.screenshot({path:resolve('review/refined-palettes.png'),fullPage:true});
  console.log(`Verified ${options.length} comparison pairs; wrote four comparisons and palette contact sheet`);
} finally { await browser.close(); }
