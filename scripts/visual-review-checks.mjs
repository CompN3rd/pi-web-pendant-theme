import { parseArgs } from 'node:util';

export function captureOptions(args) {
  const { values, positionals } = parseArgs({args, options:{profile:{type:'string'}}, allowPositionals:true});
  if(positionals.length!==1 || !positionals[0].trim() || !['migration','refinement'].includes(values.profile)) {
    throw new Error('Usage: node scripts/visual-review.mjs <output-directory> --profile <migration|refinement>');
  }
  return {directory:positionals[0], profile:values.profile};
}

export function observeBrowserErrors(page, errors) {
  page.on('pageerror', error=>errors.push(error.message));
  // HTTP failures are recorded with their URLs below, rather than twice.
  page.on('console', message=>{if(message.type()==='error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text());});
  page.on('response', response=>{if(response.status()>=400 && !(response.status()===404 && new URL(response.url()).pathname.endsWith('/notifications'))) errors.push(`${response.status()} ${response.url()}`);});
  page.on('requestfailed', request=>errors.push(`${request.failure()?.errorText ?? 'Request failed'} ${request.url()}`));
}
