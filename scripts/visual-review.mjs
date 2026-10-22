// Real PI WEB integration capture. No model calls; all sessions are synthetic.
// PI_WEB_SOURCE must point to a built checkout with stylesheet-integration v1.
import { chromium } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, cp, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { checkLogoLifecycle } from './check-logo-lifecycle.mjs';

const host = resolve(process.env.PI_WEB_SOURCE ?? '../worktrees/pendant-v5-preview');
const stage = process.argv[2] ?? 'migration';
const pluginSource = resolve(process.env.PI_PENDANT_SOURCE ?? '.');
const output = resolve('review', stage);
const temp = await mkdtemp(join(tmpdir(), 'pendant-review-'));
const children = [];
let browser;
let page;
const errors = [];
const checks = [];
const sessionId = '019ef4c0-0000-7000-8000-000000000001';
const projectId = 'pendant-review';
const demo = join(temp, 'workspace');
const workspaceId = createHash('sha1').update(`${projectId}:${demo}`).digest('hex').slice(0, 12);
const port = async () => new Promise(resolve => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const json = async (path, data) => writeFile(path, JSON.stringify(data, null, 2));
const wait = ms => new Promise(r => setTimeout(r, ms));
async function ready(url) {
  for(let i=0;i<120;i++) { try { if ((await fetch(url)).ok) return; } catch {} await wait(250); }
  throw new Error(`Not ready: ${url}; logs: ${temp}`);
}
function start(name, entry, env) {
  const p = spawn(process.execPath, [join(host, entry)], {cwd:host, env, stdio:['ignore','pipe','pipe']});
  children.push(p);
  p.stdout.on('data', d => writeFile(join(temp, `${name}.log`), d, {flag:'a'}));
  p.stderr.on('data', d => writeFile(join(temp, `${name}.log`), d, {flag:'a'}));
  return p;
}
async function seed() {
  const ms = Date.parse('2026-06-01T10:00:00Z');
  let last = null, n = 0;
  const entries = [{type:'session', version:3, id:sessionId, timestamp:new Date(ms).toISOString(), cwd:demo}];
  const add = (type, fields) => { const id = (++n).toString(16).padStart(8,'0'); entries.push({type,id,parentId:last,timestamp:new Date(ms+n*1000).toISOString(),...fields}); last=id; };
  const usage = {input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}};
  const assistant = content => add('message',{message:{role:'assistant',content,api:'openai-completions',provider:'openai',model:'gpt-4.1',usage,stopReason:'stop',timestamp:ms+n*1000}});
  add('model_change',{provider:'openai',modelId:'gpt-4.1'});
  add('session_info',{name:'Review the release checklist'});
  add('message',{message:{role:'user',content:[{type:'text',text:'Check the release candidate. Summarize the tests, show the config, and flag anything that still needs attention.'}],timestamp:ms}});
  assistant([{type:'thinking',thinking:'I will inspect the working tree and run the checks before recommending a release.'},{type:'text',text:'I’ll check the repository and validate the build. **No deployment will be performed.**'}]);
  for (const [id,command,result,isError] of [
    ['git','git status --short',' M src/config.ts\n?? docs/release.md',false],
    ['tests','npm test','Tests: 24 passed, 24 total\nDuration: 1.42s',false],
    ['build','npm run build','Error: RELEASE_CHANNEL must be set before packaging.',true],
  ]) {
    assistant([{type:'toolCall',id,name:'bash',arguments:{command}}]);
    add('message',{message:{role:'toolResult',toolCallId:id,toolName:'bash',content:[{type:'text',text:result}],isError,timestamp:ms+n*1000}});
  }
  assistant([{type:'text',text:'## Release review\n\nThe tests pass, but packaging needs **one configuration fix**.\n\n| Check | Result |\n| --- | --- |\n| Unit tests | 24 passed |\n| Working tree | 2 changes to review |\n| Package build | Missing release channel |\n\n```typescript\n// Keep release intent explicit.\nexport const release = {\n  channel: "preview",\n  retries: 3,\n  dryRun: true,\n};\n```\n\n> Set the channel, then rerun the build before publishing.\n\nSee [release notes](./docs/release.md) for the remaining checklist.'}]);
  await writeFile(join(temp,'sessions','review.jsonl'), entries.map(e=>JSON.stringify(e)).join('\n')+'\n');
  const notes = structuredClone(entries.slice(0,4));
  notes[0].id='019ef4c0-0000-7000-8000-000000000002';
  notes.find(e=>e.type==='session_info').name='Design notes';
  notes.push({type:'message',id:'00000004',parentId:'00000003',timestamp:new Date(ms+5000).toISOString(),message:{role:'assistant',content:[{type:'text',text:'## Design notes\n\nKeep the interface quiet and the **state explicit**.\n\n- Preserve keyboard focus.\n- Keep code monospaced.\n- Use pixel lettering only for section labels.\n\n> Review the screenshots before publishing.'}],api:'openai-completions',provider:'openai',model:'gpt-4.1',usage,stopReason:'stop',timestamp:ms+5000}});
  await writeFile(join(temp,'sessions','notes.jsonl'),notes.map(e=>JSON.stringify(e)).join('\n')+'\n');
}
try {
  await Promise.all([output, demo, join(demo,'src'), join(demo,'docs'), join(temp,'data','plugins'), join(temp,'agent'), join(temp,'sessions')].map(p=>mkdir(p,{recursive:true})));
  await writeFile(join(demo,'src','config.ts'), '// Keep release intent explicit.\nexport const release = {\n  channel: "preview",\n  retries: 3,\n  dryRun: true,\n};\n');
  await writeFile(join(demo,'docs','release.md'), '# Release checklist\n\n- [x] Unit tests\n- [ ] Configure release channel\n- [ ] Review working tree\n\n> Preview only. Do not deploy.\n');
  await writeFile(join(demo,'README.md'), '# Pendant sample project\n\nA deterministic visual-review fixture.\n');
  execFileSync('git',['init','-q',demo]);
  execFileSync('git',['-C',demo,'add','.']);
  execFileSync('git',['-C',demo,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Seed fixture']);
  await seed();
  await json(join(temp,'agent','settings.json'), {packages:['relays','workflows'].map(name=>({source:join(host,'dist','pi-packages',name),skills:[],extensions:[]}))});
  const pluginDir = join(temp,'data','plugins','pendant');
  await mkdir(pluginDir);
  for(const path of ['package.json','pi-web-plugin.js','styles','fonts','logos']) await cp(join(pluginSource,path), join(pluginDir,path), {recursive:true});
  await json(join(temp,'data','projects.json'), {projects:[{id:projectId,name:'Pendant preview',path:demo,createdAt:'2026-06-01T10:00:00Z'}]});
  await json(join(temp,'config.json'), {host:'127.0.0.1',allowedHosts:true,plugins:{pendant:{enabled:true}}});
  const api = await port(), daemon = await port();
  // Drop all inherited PI WEB routing/ownership variables before constructing
  // this independent instance. Never touch the session that runs this script.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('PI_WEB_')));
  Object.assign(env,{PI_WEB_DATA_DIR:join(temp,'data'),PI_WEB_CONFIG:join(temp,'config.json'),PI_WEB_PROJECTS_FILE:join(temp,'data','projects.json'),PI_WEB_SESSIOND_URL:`http://127.0.0.1:${daemon}`,PI_WEB_SESSIOND_PORT:String(daemon),PI_WEB_SESSIOND_HOST:'127.0.0.1',PI_WEB_SESSIOND_SOCKET:join(temp,'unused.sock'),PI_WEB_PORT:String(api),PI_WEB_HOST:'127.0.0.1',PI_CODING_AGENT_DIR:join(temp,'agent'),PI_CODING_AGENT_SESSION_DIR:join(temp,'sessions'),PI_OFFLINE:'1',NO_COLOR:'1'});
  start('daemon','dist/server/sessiond.js',env);
  await ready(`http://127.0.0.1:${daemon}/health`);
  start('web','dist/server/index.js',env);
  await ready(`http://127.0.0.1:${api}/api/projects`);
  browser = await chromium.launch(process.env.CHROME_BIN ? {executablePath:process.env.CHROME_BIN} : {channel:'msedge'});
  const context = await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  page = await context.newPage();
  page.on('pageerror', error=>errors.push(error.message));
  page.on('console', message=>{if(message.type()==='error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text());});
  page.on('response', response=>{if(response.status()>=400 && !(response.status()===404 && new URL(response.url()).pathname.endsWith('/notifications'))) errors.push(`${response.status()} ${response.url()}`);});
  const url = `http://127.0.0.1:${api}/?project=${projectId}&workspace=${workspaceId}&session=${sessionId}&view=chat`;
  await page.addInitScript(()=>{
    localStorage.setItem('pi-web-app-theme',JSON.stringify({themeId:'pendant:dark',auto:false}));
    window.__originalAttachShadow = Element.prototype.attachShadow;
    window.__originalSheets = Object.getOwnPropertyDescriptor(ShadowRoot.prototype,'adoptedStyleSheets')?.set;
  });
  await page.goto(url);

  await page.waitForFunction(()=>document.documentElement.dataset.piWebTheme==='pendant:dark');
  await page.getByText('Release review',{exact:true}).waitFor({timeout:30000});
  await page.waitForTimeout(1500);
  await page.getByRole('button',{name:'Files',exact:true}).first().click();
  await page.getByRole('button',{name:'README.md',exact:false}).first().waitFor();
  const scrollChat = async end => page.locator('chat-view').evaluate((host,end)=>{const chat=host.shadowRoot.querySelector('.chat');chat.scrollTop=end?chat.scrollHeight:0;},end);
  await scrollChat(true);
  await page.waitForTimeout(300);
  await page.screenshot({path:join(output,'desktop-chat.png')});
  checks.push('Real host loaded Pendant v5 and the seeded session');
  assert(await page.evaluate(()=>Element.prototype.attachShadow===window.__originalAttachShadow));
  checks.push('attachShadow prototype untouched');
  assert(await page.evaluate(()=>Object.getOwnPropertyDescriptor(ShadowRoot.prototype,'adoptedStyleSheets')?.set===window.__originalSheets));
  checks.push('adoptedStyleSheets prototype untouched');
  const shot = async name => { await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(400); await page.screenshot({path:join(output,`${name}.png`)}); };
  // These private host methods are confined to the version-pinned test driver,
  // never imported or invoked by the shipped theme.
  const theme = async id => {
    await page.evaluate(id=>document.querySelector('pi-web-app').pickTheme({themeId:id,auto:false}),id);
    await page.waitForFunction(id=>document.documentElement.dataset.piWebTheme===id,id);
    await page.waitForTimeout(600);
  };
  await page.locator('details.event-group > summary').last().click();
  await page.locator('.pendant-cmd-logo').first().waitFor();
  assert.equal(await page.locator('.pendant-cmd-logo').count(),3);
  const sizes = await page.locator('.pendant-cmd-logo').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
  for(const size of sizes) assert.deepEqual(size,{width:15,height:15});
  checks.push('Three real tool cards decorated with fixed 15px logos');
  const refined = await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--pi-font').includes('Pendant'));
  if(refined) {
    assert(await page.locator('tool-execution-view .status-icon').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).display!=='none')));
    const typography = await page.locator('formatted-text').first().evaluate(n=>({family:getComputedStyle(n).fontFamily,size:getComputedStyle(n).fontSize}));
    assert(typography.family.includes('Pendant Source Sans 3'));
    assert.equal(typography.size,'16px');
    assert(await page.evaluate(()=>document.fonts.check('16px "Pendant Source Sans 3"')));
    checks.push('Refinement: loaded semantic prose font/size and visible status glyphs verified');
  }
  await scrollChat(false);
  await shot('desktop-tools');
  for(const id of ['light','amber','green','cyan','mono','muted','dark']) {
    await theme(`pendant:${id}`);
    assert.equal(await page.locator('.pendant-cmd-logo').count(),3);
    await shot(`palette-${id}`);
    checks.push(`Palette ${id}: stylesheet loaded, logos retained`);
  }
  await theme('themes:pi-web-dark');
  assert.equal(await page.locator('.pendant-cmd-logo').count(),0);
  assert.equal(await page.locator('.pendant-cmd-hidden').count(),0);
  await shot('stock-restored');
  assert(!(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--pi-font'))).includes('Pendant'));
  checks.push('Switch to stock removes all logo decorations and semantic font overrides');
  await page.evaluate(()=>document.querySelector('pi-web-app').pickTheme({themeId:'pendant:dark',auto:true}));
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForFunction(()=>document.documentElement.dataset.piWebTheme==='pendant:light');
  await page.emulateMedia({colorScheme:'dark'});
  await page.waitForFunction(()=>document.documentElement.dataset.piWebTheme==='pendant:dark');
  checks.push('Auto pair follows light/dark media preference');
  await theme('pendant:dark');
  await page.getByRole('button',{name:'src',exact:false}).first().click();
  await page.getByRole('button',{name:'config.ts',exact:false}).first().click();
  await shot('files-code');
  const filesTab = page.getByRole('button',{name:'Files',exact:true}).first();
  await filesTab.focus();
  assert(await filesTab.evaluate(n=>parseFloat(getComputedStyle(n).outlineWidth)>=2));
  await shot('keyboard-focus');
  checks.push('Keyboard focus outline remains visible');
  await page.getByRole('button',{name:'Terminal',exact:true}).first().click();
  await page.locator('.xterm-screen').waitFor();
  const terminalInput = page.locator('.xterm-helper-textarea');
  await terminalInput.pressSequentially('echo Pendant terminal preview');
  await terminalInput.press('Enter');
  await page.waitForTimeout(700);
  await shot('terminal');
  checks.push('Real terminal mounted and accepted a harmless echo command');
  await page.getByRole('button',{name:'Files',exact:true}).first().click();
  await page.evaluate(()=>document.querySelector('pi-web-app').openSettings('general'));
  await page.locator('settings-dialog').waitFor();
  await shot('settings');
  if(refined) assert.equal(await page.locator('settings-dialog modal-surface .surface').evaluate(n=>getComputedStyle(n).borderTopLeftRadius),'0px');
  await page.evaluate(()=>document.querySelector('pi-web-app').closeSettings());
  for(const [name,width,height] of [['tablet',1024,768],['mobile',390,844]]) {
    await page.setViewportSize({width,height});
    await page.goto(url);
    await page.locator('chat-view .msg').first().waitFor();
    await scrollChat(true);
    await page.getByText('Release review',{exact:true}).waitFor();
    await shot(`${name}-chat`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    checks.push(`${name}: no document horizontal overflow`);
    await page.evaluate(()=>document.querySelector('pi-web-app').openSettings('general'));
    await shot(`${name}-settings`);
    await page.evaluate(()=>document.querySelector('pi-web-app').closeSettings());
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(url.replace(sessionId,'019ef4c0-0000-7000-8000-000000000002'));
  await page.getByRole('heading',{name:'Design notes',exact:true}).waitFor();
  await shot('second-session');
  const moduleUrl = await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).find(url=>url.includes('/pendant/') && new URL(url).pathname.endsWith('/pi-web-plugin.js')));
  assert(moduleUrl, 'Pendant browser module must have loaded');
  checks.push(...await checkLogoLifecycle(page.context(), moduleUrl));
  console.log('Capture ready:',output,'logs:',temp);
  await json(join(output,'results.json'),{browser:browser.version(),pluginHash:createHash('sha256').update(await readFile(join(pluginSource,'pi-web-plugin.js'))).update(await readFile(join(pluginSource,'styles','pendant.css'))).digest('hex'),host:execFileSync('git',['-C',host,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks,errors});
  if(errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
} catch (error) {
  await page?.screenshot({path:join(output,'failure.png')}).catch(()=>{});
  console.error('Browser errors:',errors);
  throw error;
} finally {
  await browser?.close();
  for(const child of children.reverse()) {
    if(child.exitCode!==null) continue;
    if(process.platform==='win32') {
      // Only the processes this invocation created, including their fixture
      // terminal children. Never terminate by executable name or shared port.
      try { execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'}); } catch { child.kill(); }
    } else { child.kill(); }
  }
  console.log('Isolated logs retained:',temp);
}
