import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { percent, RECALL_TABS, renderRecall } from './docs.mjs';
import { serve } from './server.mjs';

// Drives the website in Chromium the way a visitor would: every section, every demo control, both tabs, the palette,
// the needle, the benchmark, theme, copy and a phone-sized viewport. Fails on page errors, console errors, failed
// requests and HTTP errors, including the defuss-shadcn CDN files and their SRI checks.
// VERIFIED: every figure the page prints is compared with docs/data/manifest.json, so a stale number fails here.
// Returns the copied usage snippet, which scripts/e2e.mjs runs against the installed package.
const root = fileURLToPath(new URL('../', import.meta.url));
const kb = bytes => `${Math.round(bytes / 1e3).toLocaleString('en')} kB`;
const mb = bytes => `${(bytes / 1e6).toFixed(bytes >= 1e7 ? 1 : 2)} MB`;
const LOAD_MS = 60_000;

export async function runSite({ output }) {
  const manifest = JSON.parse(await readFile(join(root, 'docs/data/manifest.json'), 'utf8'));
  const raw = await readFile(join(root, 'docs/index.html'), 'utf8');
  const html = raw.replaceAll('&nbsp;', ' ');
  // VERIFIED: the recall section is rendered from docs/data/recall.json, measured by bench/recall.mjs with this version.
  const recall = JSON.parse(await readFile(join(root, 'docs/data/recall.json'), 'utf8'));
  assert.equal(recall.version, manifest.version, 'docs/data/recall.json was measured with another version: run make docs');
  assert.ok(raw.includes(renderRecall(recall)), 'docs/index.html recall section differs from docs/data/recall.json: run make docs');
  // The static markup carries the same figures the manifest holds, so the page reads right before the worker reports.
  for (const figure of [kb(manifest.library.coreGzipBytes), kb(manifest.corpus.bytes), mb(manifest.corpus.textBytes), `v${manifest.version}`, `${manifest.corpus.pages} pages`]) {
    assert.ok(html.includes(figure), `docs/index.html must state ${figure} (docs/data/manifest.json)`);
  }

  const { server, url } = await serve();
  const browser = await chromium.launch();
  const errors = [];
  const watch = page => {
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.url()}: HTTP ${response.status()}`); });
  };
  const checks = [];
  let usage = '';
  const check = async (name, run) => { await run(); checks.push(name); };
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: url });
    const page = await context.newPage();
    watch(page);
    await page.goto(url);
    const text = selector => page.locator(selector).first().textContent();
    const results = page.locator('#results > li');
    const firstHit = () => results.first().getAttribute('id');
    /** Types a query into the documentation search and waits for its results to render. */
    const search = async query => {
      await page.fill('#q', query);
      await page.waitForFunction(q => document.querySelector('#summary .ls-summary-query')?.textContent === q && !document.querySelector('#summary').hidden, query);
      await page.waitForFunction(() => !document.querySelector('#results').hasAttribute('aria-busy'));
    };

    await check('one h1, every section present', async () => {
      assert.equal(await page.locator('h1').count(), 1);
      for (const id of ['intro', 'demo', 'how', 'bench', 'recall', 'consulting', 'use']) assert.equal(await page.locator(`#${id}`).count(), 1, `section #${id}`);
    });

    await check('corpus downloads and indexes; figures match the manifest', async () => {
      await page.waitForFunction(() => document.getElementById('ring').api?.getState().name === 'complete', null, { timeout: LOAD_MS });
      assert.equal(await page.evaluate(() => document.getElementById('p-index').api.getState().name), 'complete');
      // The npm tags in the hero, header, phone menu and install section carry the version and link to the package.
      for (const id of ['hero-version', 'header-version', 'menu-version', 'use-version']) {
        assert.equal(await text(`#${id}`), `v${manifest.version}`, id);
        assert.equal(await page.locator(`#${id}`).evaluate(node => node.closest('a')?.href), 'https://www.npmjs.com/package/defuss-lexicalsearch', id);
      }
      assert.equal(await text('#hero-size'), `in ${kb(manifest.library.coreGzipBytes)} of gzipped JavaScript`);
      assert.equal(await text('#intro-size'), kb(manifest.library.coreGzipBytes));
      assert.equal(await text('#demo-pages'), String(manifest.corpus.pages));
      assert.equal(await text('#demo-text'), mb(manifest.corpus.textBytes));
      assert.equal(await text('[data-stat="pages"]'), String(manifest.corpus.pages));
      assert.match(await text('[data-stat="terms"]'), /^\d{1,3}(,\d{3})+$/);
      assert.equal(await page.locator('#cmd-list .command-item[data-page]').count(), manifest.corpus.pages);
    });

    await check('ranked search, typos and phrases', async () => {
      await search('dialog');
      assert.equal(await firstHit(), 'hit-pages_overlays_dialog_mdx');
      assert.match(await text('#summary .ls-summary-count'), /^12 of \d+ pages$/);
      assert.ok(await results.first().locator('.ls-excerpt mark').count() > 0, 'excerpt highlights the match');
      await search('dialgo');
      assert.equal(await firstHit(), 'hit-pages_overlays_dialog_mdx');
      assert.match(await results.first().locator('.ls-terms').textContent(), /fuzzy 1/);
      await search('"dark mode"');
      assert.equal(await firstHit(), 'hit-pages_guides_dark-mode_mdx');
    });

    await check('literal modes, fields and sections', async () => {
      await page.click('#mode [data-mode="substring"]');
      assert.equal(await page.isDisabled('#opt-typos'), true, 'word options are off in literal modes');
      await search('aria-label');
      assert.equal(await results.first().locator('.ls-excerpt mark').first().textContent(), 'aria-label');
      await page.click('#mode [data-mode="exact"]');
      await page.selectOption('#opt-field', 'path');
      await search('pages/overlays/command.mdx');
      assert.equal(await results.count(), 1);
      assert.equal(await results.first().locator('.card-footer .badge').first().textContent(), 'literal');
      await page.click('#mode [data-mode="lexical"]');
      await page.selectOption('#opt-field', 'all');
      await page.selectOption('#opt-section', 'overlays');
      await search('menu');
      const ids = await results.evaluateAll(items => items.map(item => item.id));
      assert.ok(ids.length > 0 && ids.every(id => id.startsWith('hit-pages_overlays_')), `section filter: ${ids}`);
    });

    await check('example chips clear the filters', async () => {
      await page.click('#summary .mk-search-summary-clear');
      await page.waitForSelector('#empty:not([hidden])');
      await page.click('#examples [data-example="completion"]');
      await page.waitForFunction(() => document.querySelector('#summary .ls-summary-query')?.textContent === 'scaff');
      assert.equal(await page.inputValue('#q'), 'scaff');
      assert.equal(await firstHit(), 'hit-pages_application_application-scaffolds_mdx');
      assert.equal(await page.inputValue('#opt-section'), 'all');
    });

    await check('command palette picks a page', async () => {
      await page.click('.mk-header-actions [data-command-trigger="cmd"]');
      await page.waitForSelector('#cmd[open]');
      await page.fill('#cmd .command-input', 'Command');
      await page.click('#cmd .command-item[data-page="pages/overlays/command.mdx"]');
      await page.waitForFunction(() => document.querySelector('#summary .ls-summary-note')?.textContent.startsWith('Picked page at #'));
      assert.equal(await page.locator('#results > li[data-gold]').getAttribute('id'), 'hit-pages_overlays_command_mdx');
    });

    await check('needle in the haystack', async () => {
      await page.click('#needle-button');
      await page.waitForFunction(() => /^Needle page ".+" at #\d+$/.test(document.querySelector('#summary .ls-summary-note')?.textContent ?? ''));
      assert.equal(await page.locator('#results > li[data-gold]').count(), 1);
    });

    await check('benchmark measured in the browser', async () => {
      await page.waitForFunction(() => document.querySelectorAll('#bench-rows tr').length === 7);
      for (const name of ['download', 'index', 'rare', 'typo']) assert.match(await text(`[data-bench="${name}"]`), /^\d+(\.\d+)? (µs|ms)$/, name);
    });

    await check('recall per language: every strategy tab shows its figures', async () => {
      const ids = await page.locator('#recall-tabs [role="tab"]').evaluateAll(tabs => tabs.map(tab => tab.id.replace('recall-tab-', '')));
      assert.deepEqual(ids, RECALL_TABS);
      for (const id of [...ids].reverse()) {
        const strategy = recall.strategies.find(s => s.id === id);
        await page.click(`#recall-tab-${id}`);
        await page.waitForSelector(`#recall-panel-${id}:not([hidden])`);
        assert.equal(await page.isVisible(`#recall-panel-${ids.find(other => other !== id)}`), false, 'one panel at a time');
        assert.equal(await text(`[data-recall-mean="${id}"]`), percent(strategy.r5, 1));
        const shown = await page.locator(`#recall-panel-${id} .progress-field`).evaluateAll(fields => fields.map(field =>
          [field.dataset.recall, field.querySelector('output').textContent, Number(field.querySelector('progress').value)]));
        assert.equal(shown.length, Object.keys(recall.languages).length);
        for (const [code, label, value] of shown) {
          assert.equal(label, percent(strategy.languages[code]), `${id} ${code}`);
          assert.equal(value, Math.round(100 * strategy.languages[code]));
        }
        assert.deepEqual(shown.map(([, , value]) => value), shown.map(([, , value]) => value).sort((a, b) => b - a), 'sorted by R@5');
      }
      await page.locator('#recall').screenshot({ path: join(output, 'site-recall.png') });
      // The README shows this card: 2x pixels, and reduced motion so the scroll reveal has settled. `cp` it to
      // docs/assets/recall.png after a re-measurement.
      const sharp = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'reduce' });
      const card = await sharp.newPage();
      watch(card);
      await card.goto(`${url}#recall`);
      await card.locator('.ls-recall').screenshot({ path: join(output, 'recall.png') });
      await sharp.close();
    });

    await check('my data: German notes, upsert, typo completion and inside-word search', async () => {
      await page.click('#tab-notes');
      await page.selectOption('#notes-analyzer', 'de');
      await page.waitForFunction(() => document.getElementById('log').textContent.includes('analyzer de-lexicalsearch-v1'));
      await page.click('#add-note');
      await page.keyboard.type('Die Häuser am Hafen werden neu gestrichen.');
      await page.waitForFunction(() => document.getElementById('notes-count').textContent === '1 note indexed');
      await page.fill('#notes-q', 'haus');
      await page.waitForFunction(() => document.querySelectorAll('#notes-results > li').length === 1);
      await page.click('#add-note');
      await page.keyboard.type('Der Kühlschrank ist leer, und XMLHttpRequest wartet.');
      await page.waitForFunction(() => document.getElementById('notes-count').textContent === '2 notes indexed');
      // A typo in the typed part of a word, and fragments inside words, find the note.
      for (const query of ['Kül', 'ühl', 'schrank', 'http']) {
        await page.fill('#notes-q', query);
        await page.waitForFunction(q => document.querySelector('#notes-summary .ls-summary-query')?.textContent === q, query);
        assert.equal(await page.locator('#notes-results > li').first().getAttribute('id'), 'note-note-2', query);
      }
      await page.click('#add-samples');
      await page.waitForFunction(() => document.getElementById('notes-count').textContent === '7 notes indexed');
      await page.fill('#note-1-text', '');
      await page.waitForFunction(() => document.getElementById('notes-count').textContent === '6 notes indexed');
      await page.screenshot({ path: join(output, 'site-notes.png') });
      // A language added with the analyzers of 0.3.0: an inflected Russian query finds its note.
      await page.selectOption('#notes-analyzer', 'ru');
      await page.waitForFunction(() => document.getElementById('log').textContent.includes('analyzer ru-lexicalsearch-v1'));
      await page.click('#add-note');
      await page.keyboard.type('Мы читали книги в библиотеке.');
      await page.waitForFunction(() => document.getElementById('notes-count').textContent === '7 notes indexed');
      await page.fill('#notes-q', 'библиотека');
      await page.waitForFunction(() => document.querySelector('#notes-summary .ls-summary-query')?.textContent === 'библиотека');
      assert.equal(await page.locator('#notes-results > li').count(), 1);
      await page.click('#tab-docs');
    });

    await check('theme, copy and back to top', async () => {
      await page.click('label.swap');
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), true);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('defuss-shadcn-theme'))), 'dark');
      await page.click('#copy-prompt');
      await page.waitForFunction(() => document.getElementById('copy-prompt-status').textContent === 'Copied');
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^Integrate defuss-lexicalsearch/);
      await page.click('.mk-code-block-copy');
      usage = await page.evaluate(() => navigator.clipboard.readText());
      assert.match(usage, /new LexicalSearch/);
      await page.screenshot({ path: join(output, 'site-desktop.png'), fullPage: true });
    });

    await check('phone viewport without horizontal scroll', async () => {
      const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
      watch(phone);
      await phone.goto(url);
      await phone.waitForFunction(() => document.getElementById('ring').api?.getState().name === 'complete', null, { timeout: LOAD_MS });
      await phone.fill('#q', 'dialog');
      await phone.waitForSelector('#results > li');
      assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll at 390 px');
      await phone.screenshot({ path: join(output, 'site-mobile.png'), fullPage: true });
      await phone.close();
    });

    assert.deepEqual(errors, [], 'no page errors, console errors or failed requests');
    return { checks, usage, version: browser.version() };
  } finally {
    await browser.close();
    server.close();
  }
}
