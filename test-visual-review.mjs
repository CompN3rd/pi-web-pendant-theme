import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { captureOptions, observeBrowserErrors } from './scripts/visual-review-checks.mjs';

test('capture requires an explicit destination and expected profile', () => {
  for(const args of [[], ['refinement'], ['--profile','refinement'], ['run','--profile','unknown'], ['run','extra','--profile','migration']]) {
    assert.throws(()=>captureOptions(args), /Usage:/);
  }
  assert.deepEqual(captureOptions(['custom-run','--profile','refinement']), {directory:'custom-run',profile:'refinement'});
  assert.deepEqual(captureOptions(['baseline-check','--profile','migration']), {directory:'baseline-check',profile:'migration'});
});

test('transport failures are recorded without an HTTP response, including aborted requests', () => {
  const page = new EventEmitter(), errors = [];
  observeBrowserErrors(page, errors);
  for(const errorText of ['net::ERR_CONNECTION_REFUSED','net::ERR_ABORTED']) {
    page.emit('requestfailed',{url:()=> 'http://fixture/fonts/body.woff2',failure:()=>({errorText})});
  }
  assert.deepEqual(errors,[
    'net::ERR_CONNECTION_REFUSED http://fixture/fonts/body.woff2',
    'net::ERR_ABORTED http://fixture/fonts/body.woff2',
  ]);
});

test('HTTP checks retain the notification exception without suppressing other failures', () => {
  const page = new EventEmitter(), errors = [];
  observeBrowserErrors(page, errors);
  for(const [status,path] of [[404,'/notifications'],[404,'/styles/pendant.css'],[503,'/notifications']]) {
    page.emit('response',{status:()=>status,url:()=>`http://fixture${path}`});
  }
  assert.deepEqual(errors,['404 http://fixture/styles/pendant.css','503 http://fixture/notifications']);
});

test('runtime and non-resource console errors remain visible', () => {
  const page = new EventEmitter(), errors = [];
  observeBrowserErrors(page, errors);
  page.emit('pageerror',new Error('activation failed'));
  page.emit('console',{type:()=> 'error',text:()=> 'stylesheet compilation failed'});
  assert.deepEqual(errors,['activation failed','stylesheet compilation failed']);
});
