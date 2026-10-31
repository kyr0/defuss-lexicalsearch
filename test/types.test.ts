import { LexicalSearch, type SearchResult, type LexicalDocument, type MatchTier, apiSearchPreset, keywordAnalyzer, codeAnalyzer, createAnalyzer } from 'defuss-lexicalsearch';
import de from 'defuss-lexicalsearch/de';
const index = new LexicalSearch<{ category: string }>({ analyzer: de, fields: { title: { weight: 2 } } });
const document: LexicalDocument<{ category: string }> = { id: 'a', fields: { title: 'Häuser' }, metadata: { category: 'home' } };
index.add(document);
const hits: SearchResult<{ category: string }>[] = index.search('haus', { filter: metadata => metadata?.category === 'home' });
const id: string = hits[0].id;
void id;
const restored = LexicalSearch.fromJSON<{ category: string }>(index.toJSON(), de);
restored.add(document);
createAnalyzer({ id: 'custom-v1', tokenize: text => [text] });
// @ts-expect-error IDs must be stable strings.
index.add({ id: 1, fields: { title: 'bad' } });
// @ts-expect-error Metadata must match the index's generic type.
index.add({ id: 'b', fields: {}, metadata: { category: 1 } });
// @ts-expect-error Edit distance is explicitly bounded.
index.search('hello', { fuzzy: 3 });

const api = new LexicalSearch<{ category: string }>(apiSearchPreset);
const symbol: LexicalDocument<{category:string}> = { id:'cpp', fields:{symbol:'C++',description:'language'},metadata:{category:'language'} };
api.add(symbol);
const apiHits = api.search('C++',{mode:'exact',fields:['symbol'],caseSensitive:true,ranking:'exact-first',exclude:['C#']});
const tier: MatchTier | undefined = apiHits[0]?.tier;
void tier;
const mixed = new LexicalSearch({fields:{symbol:{analyzer:keywordAnalyzer},parts:{source:'symbol',analyzer:codeAnalyzer}}});
LexicalSearch.fromJSON(mixed.serialize(),{[keywordAnalyzer.id]:keywordAnalyzer,[codeAnalyzer.id]:codeAnalyzer});
const pending: Promise<LexicalSearch> = LexicalSearch.fromURL('https://example.test/index.json',{maxBytes:1024,request:{signal:new AbortController().signal}});
void pending;
// @ts-expect-error unsupported ranking must be rejected statically
api.search('x',{ranking:'boost-exact'});
// @ts-expect-error mode is a closed union
api.search('x',{mode:'regex'});
