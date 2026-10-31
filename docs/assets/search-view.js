// One search panel: a search box with a Search button, a summary, a CTA and an ordered results grid, bound to one index
// in the worker ("docs" or "notes"). Both tabs use it, so both search the same way and animate the same way.
// Why a factory over two copies: the stale-result check, the transition queue and the before-the-index path are the
// subtle parts; one implementation keeps them identical. VERIFIED: scripts/site.mjs drives both tabs.
import { formatMs, plural, renderSkeletons } from './render.js';

const motion = matchMedia('(prefers-reduced-motion: reduce)');

/**
 * @param {object} options
 * @param {'docs' | 'notes'} options.index   the worker index this panel asks
 * @param {HTMLElement} options.root         holds .search-box, form[role=search], .mk-search-summary, .ls-cta, .ls-results
 * @param {Worker} options.worker
 * @param {() => boolean} options.isReady     the index can answer
 * @param {() => object} [options.options]    search options sent with every query
 * @param {(data) => string} options.render   results markup
 * @param {(data) => string} options.count    "12 of 55 pages"
 * @param {(data) => string} [options.note]   an extra summary badge, "" for none
 * @param {(text: string) => void} [options.onInput]
 * @param {(data) => void} [options.onShown]  after results render
 */
export const createSearchView = ({ index, root, worker, isReady, options = () => ({}), render, count, note = () => '', onInput = () => {}, onShown = () => {} }) => {
  const box = root.querySelector('.search-box');
  const q = box.querySelector('input[type="search"]');
  const form = root.querySelector('form[role="search"]');
  const results = root.querySelector('.ls-results');
  const summary = root.querySelector('.mk-search-summary');
  const empty = root.querySelector('.ls-cta');
  const badge = summary.querySelector('.ls-summary-note');
  let searchId = 0;
  let debounce = 0;
  let pending = null;
  let transition = null;
  let queued = null;

  const search = text => {
    clearTimeout(debounce);
    searchId += 1;
    results.setAttribute('aria-busy', 'true');
    box.api.setState('searching');
    worker.postMessage({ type: 'search', index, id: searchId, query: text, options: options() });
  };

  const showEmpty = () => {
    searchId += 1; // drop results still in flight, and a re-rank still waiting for its transition
    queued = null;
    pending = null;
    results.removeAttribute('aria-busy');
    summary.hidden = true;
    globalThis.df$(results).morph('');
    empty.hidden = false;
  };

  /** Runs a query now: into the box, then straight to the worker; before the index is ready it waits on skeletons. */
  const ask = text => {
    if (q.value !== text) box.api.setState('filled', { value: text });
    if (isReady()) { search(text); return; }
    pending = text;
    empty.hidden = true;
    summary.hidden = true;
    globalThis.df$(results).morph(renderSkeletons(6));
  };

  // Lexical search costs microseconds to milliseconds, so a short debounce only coalesces bursts of keystrokes.
  q.addEventListener('input', () => {
    clearTimeout(debounce);
    const text = q.value.trim();
    onInput(text);
    if (!text) { showEmpty(); return; }
    empty.hidden = true;
    if (!isReady()) { ask(text); return; }
    results.setAttribute('aria-busy', 'true');
    debounce = setTimeout(() => search(text), 40);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = q.value.trim();
    if (text) ask(text);
    else q.focus();
  });
  summary.querySelector('.mk-search-summary-clear').addEventListener('click', event => {
    event.preventDefault();
    box.api.setState('default');
    showEmpty();
    q.focus();
  });

  const show = () => {
    const data = queued;
    queued = null;
    const update = () => {
      if (data.id !== searchId) return; // cleared, or a newer query was sent while this one waited
      globalThis.df$(results).morph(render(data));
      results.removeAttribute('aria-busy');
      summary.querySelector('.ls-summary-count').textContent = count(data);
      summary.querySelector('.ls-summary-query').textContent = data.query;
      const extra = note(data);
      badge.hidden = !extra;
      badge.textContent = extra;
      summary.querySelector('.mk-search-summary-time').textContent =
        `${formatMs(data.ms)} · ${plural(data.stats.postingsVisited, 'posting')} visited · ${plural(data.stats.expandedTerms, 'term')}`;
      summary.hidden = false;
      empty.hidden = true;
      onShown(data);
    };
    if (!document.startViewTransition || motion.matches) { update(); return; }
    // One re-rank animates at a time; results that arrive meanwhile wait and the newest one wins.
    transition = document.startViewTransition(update);
    transition.finished.finally(() => { transition = null; if (queued) show(); });
  };

  return {
    ask,
    /** The index is ready: run the query that waited for it. */
    resume: () => {
      const text = pending ?? q.value.trim();
      pending = null;
      if (text) search(text);
    },
    /** Re-run the current query (an option or the index changed); quiet when the box is empty. */
    refresh: () => { const text = q.value.trim(); if (text && isReady()) search(text); },
    onResults: data => {
      if (data.id !== searchId) return; // a newer query is on its way
      box.api.setState('filled');
      if (data.error) {
        results.removeAttribute('aria-busy');
        globalThis.df$(results).morph('');
        summary.querySelector('.ls-summary-count').textContent = 'No results';
        summary.querySelector('.ls-summary-query').textContent = data.query;
        badge.hidden = false;
        badge.textContent = data.error;
        summary.querySelector('.mk-search-summary-time').textContent = '';
        summary.hidden = false;
        return;
      }
      queued = data;
      if (!transition) show();
    },
    onError: () => {
      pending = null;
      results.removeAttribute('aria-busy');
      if (results.querySelector('.ls-skeleton')) showEmpty();
      if (box.api.getState().name === 'searching') box.api.setState('filled');
    },
  };
};
