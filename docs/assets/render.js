// Pure markup builders: data in, defuss-shadcn markup out. No DOM, no state.
// Why HTML strings + df$.morph: morph matches cards by id and moves them, so a re-rank keeps each card's node and its
// view-transition name. Every interpolated value goes through escape(): the corpus and the notes are untrusted text.
// VERIFIED: scripts/site.mjs reads the rendered cards back: rank order, tier badges, highlighted excerpts and terms.
export const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const formatMs = ms => (ms < 0.1 ? `${(ms * 1000).toFixed(0)} µs` : ms < 10 ? `${ms.toFixed(2)} ms` : `${Math.round(ms)} ms`);
export const plural = (n, word) => `${n.toLocaleString('en')} ${word}${n === 1 ? '' : 's'}`;
export const kb = bytes => `${Math.round(bytes / 1e3).toLocaleString('en')} kB`;
export const mb = bytes => `${(bytes / 1e6).toFixed(bytes >= 1e7 ? 1 : 2)} MB`;
export const sectionName = name => name.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());

// Badges print the tier and match-kind IDs the API returns, so the demo reads like the README and the results.
const TIER_VARIANTS = {
  literal: 'default', keyword: 'default', 'identifier-prefix': 'secondary', term: 'secondary', partial: 'outline', fuzzy: 'outline', incomplete: 'outline',
};

const renderExcerpt = ({ before, after, segments }) =>
  `${before ? '… ' : ''}${segments.map(([text, mark]) => (mark ? `<mark>${escape(text)}</mark>` : escape(text))).join('')}${after ? ' …' : ''}`;

const renderExpansions = list => (list.length ? `<ul class="ls-terms" aria-label="Matched terms">${list.map(e =>
  `<li><span class="badge" data-variant="outline" data-size="sm">${escape(e.query)}${e.term !== e.query ? ` <span aria-hidden="true">·</span> ${escape(e.term)}` : ''} <span class="ls-kind">${e.kind}${e.kind === 'fuzzy' ? ` ${e.distance}` : ''}</span></span></li>`).join('')}</ul>` : '');

/** One result card per hit, best first; the first wears an aura and `gold` marks the page a needle or pick expects. */
const renderCard = (hit, i, { gold, source, subtitle }) => {
  const card = `<article class="card">
    <div class="card-header">
      <span class="ls-rank" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <div class="ls-hit-head"><h3 class="card-title">${escape(hit.title)}</h3><p class="card-description">${subtitle(hit)}</p></div>
      ${hit.id === gold ? '<span class="aura aura-gold aura-sm ls-gold" style="--shape-round:999px"><span class="badge" data-size="sm">Needle page</span></span>' : ''}
    </div>
    <div class="card-content">
      <p class="ls-excerpt"><span class="ls-field">${escape(hit.excerpt.field)}</span> ${renderExcerpt(hit.excerpt)}</p>
      ${renderExpansions(hit.expansions)}
    </div>
    <div class="card-footer">
      ${hit.tier ? `<span class="badge" data-variant="${TIER_VARIANTS[hit.tier]}" data-size="sm" title="Exact-first tier">${hit.tier}</span>` : ''}
      <span class="ls-score" title="Score: weighted BM25 for ranked search, summed field weights for literal modes">score ${hit.score.toFixed(3)}</span>
      ${source ? `<a class="btn ls-source" data-variant="link" data-size="sm" href="${escape(source(hit))}" target="_blank" rel="noopener">MDX source<span class="sr-only"> of ${escape(hit.title)} (opens in a new tab)</span></a>` : ''}
    </div>
  </article>`;
  const key = `${subtitle === noteSubtitle ? 'note' : 'hit'}-${hit.id.replace(/[^\w-]/g, '_')}`;
  return `<li class="ls-hit" id="${key}" style="view-transition-name:${key}"${hit.id === gold ? ' data-gold' : ''} data-df-entrance="up">
  ${i === 0 ? `<div class="aura ls-top" style="--shape-ink:var(--chart-2)">${card}</div>` : card}
</li>`;
};

const pageSubtitle = hit => `<span class="${hit.pathMatched ? 'ls-path-hit' : ''}">${escape(hit.id)}</span> · ${escape(sectionName(hit.section))}`;
const noteSubtitle = () => 'your note';

export const renderHits = (hits, { gold, sourceBase }) =>
  hits.map((hit, i) => renderCard(hit, i, { gold, subtitle: pageSubtitle, source: sourceBase ? h => `${sourceBase}/${h.id}` : null })).join('');

export const renderNoteHits = (hits, labels) =>
  hits.map((hit, i) => renderCard({ ...hit, title: labels.get(hit.id) ?? 'Note' }, i, { subtitle: noteSubtitle })).join('');

/** Placeholder cards while the corpus loads under a query that already waits. */
export const renderSkeletons = count => Array.from({ length: count }, (_, i) => `<li class="ls-hit" id="skeleton-${i}"><div class="card ls-skeleton">
  <div class="skeleton" style="height:1rem;width:${35 + (i * 7) % 15}%"></div><div class="skeleton" style="height:.75rem;width:96%"></div>
  <div class="skeleton" style="height:.75rem;width:${82 + (i * 5) % 14}%"></div><div class="skeleton" style="height:.75rem;width:${55 + (i * 11) % 25}%"></div>
</div></li>`).join('');

/** The corpus pages as palette groups, one per section. */
export const renderPageGroups = (pages, sections) => sections.map(({ name }) => `<div class="command-group"><p class="command-group-heading">${escape(sectionName(name))}</p>${
  pages.filter(page => page.section === name).map(page => `<button class="command-item" data-page="${escape(page.id)}">${escape(page.title)}<span class="ls-cmd-path">${escape(page.id)}</span></button>`).join('')}</div>`).join('');

export const renderSectionOptions = sections => `<option value="all" selected>All sections</option>${
  sections.map(({ name, pages }) => `<option value="${escape(name)}">${escape(sectionName(name))} (${pages})</option>`).join('')}`;

/** A worker log line as a terminal line; the newest one carries the cursor. */
export const renderLogLine = (tone, text) =>
  `<pre data-prefix="${tone === 'success' ? '✓' : tone === 'warning' ? '!' : tone === 'destructive' ? '✗' : '>'}" data-tone="${tone}" data-cursor><code>${escape(text)}</code></pre>`;

/** The search options of a benchmark row in words: one badge per option a visitor would switch on. */
const optionNames = options => Object.entries(options).flatMap(([key, value]) =>
  key === 'fields' ? [`${value.join(', ')} only`] : key === 'mode' ? [`${value} mode`] : key === 'prefix' ? ['completion']
    : key === 'fuzzy' ? ['typos'] : key === 'substring' ? ['inside words'] : []);

/** Benchmark rows: label, query and options, median latency, first-run latency and result count. */
export const renderBenchRows = rows => rows.map(row => `<tr>
  <th scope="row">${escape(row.label)}</th>
  <td><code>${escape(row.query)}</code>${optionNames(row.options).map(name => ` <span class="badge" data-variant="outline" data-size="sm">${escape(name)}</span>`).join('')}</td>
  <td class="ls-num" data-bench-p50>${formatMs(row.p50)}</td>
  <td class="ls-num">${formatMs(row.firstMs)}</td>
  <td class="ls-num">${row.total.toLocaleString('en')}</td>
</tr>`).join('');

/** A sticky note: a native textarea and a status line the board fills in. */
export const renderNote = (id, n) => `<article class="ls-note" id="${id}" data-df-entrance="pop">
  <label class="ls-note-label" for="${id}-text">Note ${n}</label>
  <textarea class="textarea ls-note-text" id="${id}-text" rows="4" placeholder="Write anything, in any language…"></textarea>
  <p class="ls-note-status" role="status" aria-live="polite"><span class="ls-note-hint">Not indexed yet</span></p>
</article>`;

export const renderNoteStatus = (state, detail = '') => ({
  indexed: `<span class="badge" data-variant="secondary" data-size="sm">Indexed</span><span class="ls-note-time">${escape(detail)}</span>`,
  removed: '<span class="ls-note-hint">Empty: removed from the index</span>',
  failed: `<span class="badge" data-variant="outline" data-size="sm">Not indexed</span><span class="ls-note-time">${escape(detail)}</span>`,
})[state];
