import { LexicalSearch, apiSearchPreset, unicodeAnalyzer, codeAnalyzer, keywordAnalyzer, foldedKeywordAnalyzer, whitespaceAnalyzer, accentFoldedAnalyzer } from '../dist/index.js';
import en from '../dist/en.js';
import de from '../dist/de.js';
import es from '../dist/es.js';
import fr from '../dist/fr.js';
import ja from '../dist/ja.js';
const registry = Object.fromEntries([unicodeAnalyzer, codeAnalyzer, keywordAnalyzer, foldedKeywordAnalyzer, whitespaceAnalyzer, accentFoldedAnalyzer, en, de, es, fr, ja].map(a => [a.id, a]));
const analyzer = id => {
  if (!Object.hasOwn(registry,id)) throw new Error(`Unknown analyzer ID: ${id}`);
  return registry[id];
};
function decodeOptions(input = {}, preset) {
  if (preset !== undefined && preset !== 'api') throw new Error(`Unknown preset: ${preset}`);
  const options = { ...(preset === 'api' ? apiSearchPreset : {}), ...input };
  if (typeof options.analyzer === 'string') options.analyzer = analyzer(options.analyzer);
  if (options.fields) options.fields = Object.fromEntries(Object.entries(options.fields).map(([name, config]) => [name,
    { ...config, ...(typeof config.analyzer === 'string' ? { analyzer: analyzer(config.analyzer) } : {}) }]));
  return options;
}
let index = new LexicalSearch();
// Functions do not cross structured-clone boundaries. Specify analyzer IDs,
// preset:'api', or an array of candidate IDs. Custom analyzers belong in this module.
self.onmessage = ({ data }) => {
  const { requestId, action, payload } = data;
  try {
    let result;
    switch (action) {
      case 'initialize': {
        const next = new LexicalSearch(decodeOptions(payload.options, payload.preset));
        next.addAll(payload.documents); index = next; result = index.stats(); break;
      }
      case 'search': {
        const options = { ...payload.options };
        if (options.ids) options.ids = new Set(options.ids);
        result = index.searchWithStats(payload.query, options); break;
      }
      case 'upsert': index.upsert(payload); result = index.stats(); break;
      case 'remove': result = index.remove(payload); break;
      case 'get': result = index.get(payload); break;
      case 'clear': index.clear(); result = index.stats(); break;
      case 'stats': result = index.stats(); break;
      case 'serialize': result = index.serialize(); break;
      case 'restore': index = LexicalSearch.fromJSON(payload, registry); result = index.stats(); break;
      default: throw new Error(`Unknown worker action: ${action}`);
    }
    self.postMessage({ requestId, result });
  } catch (error) { self.postMessage({ requestId, error: error.message }); }
};
