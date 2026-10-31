import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { serve } from './server.mjs';

/**
 * Drives the examples in Chromium against the build served at /dist/; returns the browser version.
 * VERIFIED: page errors, console errors, failed requests and HTTP errors fail the run, so a broken example cannot pass.
 */
export async function runBrowser({ dist }) {
  const { server, url } = await serve({ dist });
  let browser;
  try {
    for (const path of ['/package.json', '/.git/config', '/examples/../package.json']) {
      assert.equal((await fetch(url + path)).status, 404, `server must not expose ${path}`);
    }
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.url()}: HTTP ${response.status()}`); });
    await page.goto(new URL('/examples/browser.html', url).href); await page.waitForFunction(() => window.demoIndex?.size === 4);
    assert.ok((await page.locator('#results li').count()) > 0);
    await page.locator('#query').fill('databse');
    await page.waitForFunction(() => document.querySelector('#results')?.textContent.includes('Local database'));
    await page.locator('#query').fill('"exact phrase"');
    await page.waitForFunction(() => document.querySelector('#results')?.textContent.includes('Phrase search'));
    const direct = await page.evaluate(async () => {
      const { LexicalSearch } = await import('/dist/index.js');
      const { de } = await import('/dist/de.js');
      const index = new LexicalSearch({ analyzer: de });
      index.add({ id: 'a', fields: { text: 'Häuser und Gärten' } });
      const restored = LexicalSearch.fromJSON(index.serialize(), de);
      return restored.search('haus')[0].id;
    });
    assert.equal(direct, 'a');
    await page.goto(new URL('/examples/api.html', url).href);
    await page.waitForFunction(() => window.apiIndex?.size === 10);
    assert.equal(await page.locator('#results li').first().getAttribute('data-id'), 'cpp');
    await page.locator('#mode').selectOption('exact');
    await page.waitForFunction(() => document.querySelectorAll('#results li').length === 1);
    await page.locator('#query').fill('operator==');
    await page.waitForFunction(() => document.querySelector('#results li')?.dataset.id === 'equal');
    assert.equal(await page.locator('#results li').count(), 1);
    await page.locator('#mode').selectOption('lexical');
    await page.locator('#query').fill('prottoype');
    await page.waitForFunction(() => document.querySelector('#results li')?.dataset.id === 'map');
    const workerResult = await page.evaluate(async () => {
      const worker = new Worker('/examples/worker.mjs', { type: 'module' });
      let sequence = 0;
      const pending = new Map();
      worker.onmessage = ({ data }) => {
        const task = pending.get(data.requestId); pending.delete(data.requestId);
        if (data.error) task.reject(new Error(data.error)); else task.resolve(data.result);
      };
      const call = (action, payload) => new Promise((resolve, reject) => {
        const requestId = ++sequence; pending.set(requestId, { resolve, reject });
        worker.postMessage({ requestId, action, payload });
      });
      try {
        await call('initialize', { documents: [{ id: 'a', fields: { text: 'hello world' } }, { id: 'b', fields: { text: 'hello moon' } }] });
        const first = await call('search', { query: 'helo', options: { fuzzy: 1, ids: ['b'] } });
        await call('remove', 'b');
        const snapshot = await call('serialize');
        await call('restore', snapshot);
        const second = await call('search', { query: 'hello' });
        await call('initialize', { preset: 'api', documents: [{ id: 'cpp', fields: { symbol: 'C++', description: 'language' } }, { id: 'csharp', fields: { symbol: 'C#', description: 'language' } }] });
        const api = await call('search', { query: 'C++', options: { mode: 'exact', fields: ['symbol'] } });
        await call('restore', await call('serialize'));
        const apiRestored = await call('search', { query: 'C++' });
        await call('initialize', { options: { analyzer: 'de-lexicalsearch-v1' }, documents: [{id:'german',fields:{text:'Häuser'}}] });
        const german = await call('search', {query:'haus'});
        return { first: first.hits.map(h => h.id), second: second.hits.map(h => h.id), api: api.hits.map(h=>h.id), apiRestored: apiRestored.hits[0].id, german:german.hits[0].id };
      } finally { worker.terminate(); }
    });
    assert.deepEqual(workerResult, { first: ['b'], second: ['a'], api: ['cpp'], apiRestored: 'cpp', german: 'german' });
    assert.deepEqual(errors, []);
    return browser.version();
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}
