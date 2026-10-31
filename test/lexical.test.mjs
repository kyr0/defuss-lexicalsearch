import test from 'node:test';
import assert from 'node:assert/strict';
import { LexicalSearch, apiSearchPreset, keywordAnalyzer, foldedKeywordAnalyzer, whitespaceAnalyzer, codeAnalyzer, createAnalyzer } from '../dist/index.js';
import en from '../dist/en.js';
import de from '../dist/de.js';
const ids = hits => hits.map(hit => hit.id);
const sorted = hits => ids(hits).sort();
const doc = (id, text, metadata) => ({ id, fields: { text }, ...(metadata === undefined ? {} : { metadata }) });
function keyword(...texts) { const index = new LexicalSearch({ analyzer: keywordAnalyzer }); index.addAll(texts.map(text => doc(text, text))); return index; }

for (const [a,b] of [['C++','C#'], ['foo.bar','foo::bar'], ['@scope/pkg','scope/pkg'], ['operator==','operator!='], ['/v1/users/{id}','/v1/users/id'], ['Foo','foo'], ['==','!='], ['a"b','a b'], ['é','e\u0301']]) {
  test(`literal equality preserves ${JSON.stringify(a)} versus ${JSON.stringify(b)}`, () => {
    const index = keyword(a,b);
    assert.deepEqual(ids(index.search(a, { mode:'exact' })), [a]);
    if (!a.includes('"')) assert.deepEqual(ids(index.search(a)), [a]);
  });
}
test('literal modes bypass quotes, preserve whitespace and have explicit casing', () => {
  const index = keyword('Foo.bar("x")', 'foo.bar("x")', ' Foo.bar("x") ', 'other');
  assert.deepEqual(ids(index.search('Foo.bar("x")', { mode:'exact' })), ['Foo.bar("x")']);
  assert.equal(index.search('foo.bar("x")', { mode:'exact', caseSensitive:false }).length, 2);
  assert.equal(index.search('bar("x")', { mode:'suffix' }).length, 2);
  assert.equal(index.search('bar("x")', { mode:'substring' }).length, 3);
  assert.deepEqual(ids(index.search(' Foo', { mode:'prefix' })), [' Foo.bar("x") ']);
  assert.deepEqual(index.search('', { mode:'substring' }), []);
  assert.throws(() => index.search('Foo', { mode:'exact', fuzzy:1 }), /expansions/);
});
test('literal equality works on original natural text without token limits on queries', () => {
  const index = new LexicalSearch(); index.add(doc('a', 'A very long field. With punctuation!'));
  assert.deepEqual(ids(index.search('A very long field. With punctuation!', { mode:'exact' })), ['a']);
  assert.deepEqual(ids(index.search('field. With', { mode:'substring' })), ['a']);
  assert.deepEqual(index.search('field With', { mode:'substring' }), []);
});
test('literal lookup is filtered before top-k and explanation sums to score', () => {
  const index = new LexicalSearch({ fields:{ a:{weight:4}, b:{} } });
  index.addAll([{id:'a',fields:{a:'C++',b:'C++'}},{id:'b',fields:{a:'C++'}}]);
  const result = index.searchWithStats('C++',{mode:'exact',limit:1,ids:new Set(['b']),explain:true});
  assert.equal(result.total,1); assert.equal(result.hits[0].id,'b'); assert.equal(result.hits[0].score,4);
  assert.deepEqual(index.search('C++',{mode:'exact',fields:['b']}).map(h=>h.id),['a']);
});
test('derived symbol components and text use independent field analyzers', () => {
  const index = new LexicalSearch({ ...apiSearchPreset, fields:{ ...apiSearchPreset.fields, description:{analyzer:en} } });
  index.add({ id:'a',fields:{symbol:'Array.prototype.map',description:'running transformations'} });
  assert.deepEqual(ids(index.search('run')),['a']);
  assert.deepEqual(ids(index.search('prototype')),['a']);
  assert.deepEqual(ids(index.search('Array.prototype.map')),['a']);
  assert.deepEqual(ids(index.search('Array.prototype.map',{fields:['symbol']})),['a']);
  assert.deepEqual(index.search('array.prototype.map',{fields:['symbol']}),[]);
  assert.deepEqual(index.get('a').fields,{symbol:'Array.prototype.map',description:'running transformations'});
  assert.equal(index.toJSON().documents[0].fields.parts,undefined);
  assert.throws(()=>index.add({id:'b',fields:{parts:'bad'}}),/Derived/);
});
test('raw symbol matches survive natural-text component collisions', () => {
  const index = new LexicalSearch(apiSearchPreset);
  index.addAll(['C','C++','C#','operator==','operator!=','==','!='].map(symbol=>({id:symbol,fields:{symbol,description:'language operator'}})));
  for (const symbol of ['C++','C#','operator==','operator!=','==','!=']) {
    assert.equal(index.search(symbol)[0].id,symbol);
    assert.equal(index.search(symbol)[0].tier,'literal');
    assert.deepEqual(ids(index.search(symbol,{mode:'exact',fields:['symbol']})),[symbol]);
  }
});
test('exact-first defeats rare fuzzy IDF; relevance mode remains selectable', () => {
  const index = new LexicalSearch();
  index.addAll([...Array.from({length:30},(_,i)=>doc(`a${i}`,'fetch')),doc('typo','fatch')]);
  assert.equal(index.search('fetch',{fuzzy:1})[0].id,'typo');
  const hits=index.search('fetch',{fuzzy:1,ranking:'exact-first',limit:100});
  assert.equal(hits.at(-1).id,'typo');
  assert.equal(hits[0].tier,'literal');
  assert.deepEqual(index.search('fetch',{fuzzy:1,ranking:'exact-first',limit:3,offset:29}),hits.slice(29,32));
});
test('identifier prefix ranks above component exact, regardless of field weights', () => {
  const index = new LexicalSearch({...apiSearchPreset,fields:{...apiSearchPreset.fields,description:{weight:1000000}}});
  index.addAll([{id:'prefix',fields:{symbol:'getUser',description:'irrelevant'}},{id:'component',fields:{symbol:'User.get',description:'get get get'}}]);
  const hits=index.search('get',{prefix:true});
  assert.deepEqual(ids(hits),['prefix','component']);
  assert.equal(hits[0].tier,'identifier-prefix');
  assert.ok(hits[1].score>hits[0].score);
});
test('exact-first prefers exact alternative within a field; no double counting', () => {
  const index = new LexicalSearch();
  index.addAll([...Array.from({length:30},(_,i)=>doc(`a${i}`,'fetch')),doc('mixed','fetch fatch')]);
  const hit=index.search('fetch',{fuzzy:1,ranking:'exact-first',explain:true,limit:100}).find(h=>h.id==='mixed');
  assert.equal(hit.matches.length,1); assert.equal(hit.matches[0].kind,'exact');
});
test('whole keyword values containing spaces can match unquoted queries', () => {
  const index=keyword('operator new','operator delete','operator');
  assert.equal(index.search('operator new',{ranking:'exact-first'})[0].id,'operator new');
  assert.deepEqual(ids(index.search('operator new',{operator:'all'})),['operator new']);
});
test('folded keywords preserve punctuation and are distinct from raw casing', () => {
  const index=new LexicalSearch({analyzer:foldedKeywordAnalyzer}); index.addAll([doc('a','C++'),doc('b','c#')]);
  assert.deepEqual(ids(index.search('c++')),['a']);
  assert.deepEqual(index.search('c++',{mode:'exact'}),[]);
  assert.deepEqual(ids(index.search('c++',{mode:'exact',caseSensitive:false})),['a']);
});
test('escaped quote and backslash syntax is available without breaking paths', () => {
  const index = new LexicalSearch({analyzer:whitespaceAnalyzer});
  index.addAll([doc('quote','a"b'),doc('path','C:\\src\\file'),doc('double','x\\y')]);
  assert.deepEqual(ids(index.search('a\\"b')),['quote']);
  assert.deepEqual(ids(index.search('C:\\src\\file')),['path']);
  assert.deepEqual(ids(index.search('x\\\\y')),['double']);
});
test('literal and analyzed phrases are distinct and never cross field boundaries', () => {
  const index=new LexicalSearch({fields:{a:{analyzer:whitespaceAnalyzer},b:{}}});
  index.addAll([{id:'a',fields:{a:'foo.bar x'}},{id:'b',fields:{a:'foo::bar x'}},{id:'c',fields:{a:'foo.bar',b:'x'}}]);
  assert.deepEqual(ids(index.search('"foo.bar x"',{fields:['a']})),['a']);
  assert.deepEqual(ids(index.search('foo.bar x',{mode:'substring',fields:['a']})),['a']);
});
test('AND clauses may match differently analyzed fields; phrases cannot span them', () => {
  const index=new LexicalSearch({fields:{english:{analyzer:en},german:{analyzer:de}}});
  index.add({id:'a',fields:{english:'running',german:'Häuser'}});
  assert.deepEqual(ids(index.search('run haus',{operator:'all'})),['a']);
  assert.deepEqual(index.search('"run haus"'),[]);
});
test('punctuation-separated components in one atom require all components within a field', () => {
  const index=new LexicalSearch({analyzer:codeAnalyzer}); index.addAll([doc('a','foo.bar'),doc('b','foo.baz')]);
  assert.deepEqual(ids(index.search('foo.bar')),['a']);
});
test('suffix and substring distinguish arbitrary position from prefix', () => {
  const index=keyword('getUserById','UserById','User','getUser','UserX');
  assert.deepEqual(sorted(index.search('User',{suffix:true})),['User','getUser']);
  assert.deepEqual(sorted(index.search('User',{substring:true})),['User','UserById','UserX','getUser','getUserById']);
  assert.deepEqual(sorted(index.search('User',{prefix:true})),['User','UserById','UserX']);
});
test('lazy substring/suffix indexes remain correct through updates and deletion', () => {
  const index=keyword('abcXYZ','XYZdef');
  index.search('XYZ',{substring:true,suffix:true});
  index.remove('abcXYZ'); index.upsert(doc('XYZdef','nomatch')); index.add(doc('fresh','qqXYZ'));
  assert.deepEqual(ids(index.search('XYZ',{substring:true,suffix:true})),['fresh']);
  index.clear(); index.add(doc('new','XYZnew'));
  assert.deepEqual(ids(index.search('XYZ',{substring:true})),['new']);
});
test('with prefix and fuzzy, a typo in the typed part of a word still completes it', () => {
  const index = new LexicalSearch();
  index.addAll([doc('fridge', 'Der Kühlschrank ist leer.'), doc('cool', 'Es ist kühl.'), doc('other', 'Die Küche ist sauber.')]);
  // Without prefix, fuzzy compares whole words only.
  assert.deepEqual(ids(index.search('Kül', { fuzzy: true })), ['cool']);
  const hits = index.search('Kül', { prefix: true, fuzzy: true, explain: true });
  assert.equal(hits[0].id, 'cool', 'a whole-word typo outranks a typo in a completion');
  assert.deepEqual(hits.find(hit => hit.id === 'fridge').matches.map(match => [match.term, match.kind, match.distance]), [['kühlschrank', 'fuzzy', 1]]);
  const german = new LexicalSearch({ analyzer: de });
  german.add(doc('fridge', 'Kühlschrank'));
  assert.deepEqual(ids(german.search('Kül', { prefix: true, fuzzy: true })), ['fridge']);
});

test('transpositions cost one only when enabled; OSA is not unrestricted Damerau', () => {
  const index=keyword('fetch','ABC');
  assert.deepEqual(ids(index.search('fecth',{fuzzy:1,transpositions:true})),['fetch']);
  assert.deepEqual(index.search('fecth',{fuzzy:1}),[]);
  assert.deepEqual(index.search('CA',{fuzzy:2,transpositions:true}),[]);
});
test('exclusions operate before pagination and invoke positive filter at most once per ID', () => {
  const index=new LexicalSearch();index.addAll([doc('a','cat dog'),doc('b','cat bird'),doc('c','cat fish')]);
  const calls=[];
  const result=index.searchWithStats('cat',{exclude:['dog','bird'],limit:1,filter:(_,id)=>{calls.push(id);return true;}});
  assert.deepEqual(ids(result.hits),['c']);assert.equal(result.total,1);assert.deepEqual(calls,['c']);
  assert.deepEqual(index.search('cat',{exclude:['cat']}),[]);
});
test('literal exclusions preserve punctuation', () => {
  const index=keyword('a+b','a-b');
  assert.deepEqual(ids(index.search('a',{mode:'prefix',exclude:['a+']})),['a-b']);
});
test('mixed analyzers, derivations and ranking survive snapshot restoration', () => {
  const index=new LexicalSearch({...apiSearchPreset,fields:{...apiSearchPreset.fields,description:{analyzer:en}}});
  index.add({id:'a',fields:{symbol:'Foo.bar',description:'running'}});
  assert.throws(()=>LexicalSearch.fromJSON(index.serialize()),/analyzer mismatch/);
  const restored=LexicalSearch.fromJSON(index.serialize(),{[en.id]:en});
  assert.equal(restored.serialize(),index.serialize());
  for(const query of ['Foo.bar','foo','run']) assert.deepEqual(restored.search(query,{substring:true}),index.search(query,{substring:true}));
  restored.upsert({id:'a',fields:{symbol:'C++',description:'changed'}});
  assert.deepEqual(restored.search('Foo.bar',{mode:'exact'}),[]);
  assert.deepEqual(ids(restored.search('C++',{mode:'exact',fields:['symbol']})),['a']);
});
test('schema and new option validation rejects ambiguity', () => {
  for(const fields of [{a:{source:'missing'}},{a:{source:'a'}},{a:{},b:{source:'a'},c:{source:'b'}}]) assert.throws(()=>new LexicalSearch({fields}),/source/);
  const index=keyword('a');
  for(const options of [{ranking:'bad'},{mode:'bad'},{caseSensitive:1},{suffix:1},{substring:1},{transpositions:1},{exclude:['a',1]},{exclude:Array(33).fill('a')}]) assert.throws(()=>index.search('a',options));
  assert.throws(()=>createAnalyzer({id:'bad',kind:'wrong',tokenize:s=>[s]}));
});
test('remote snapshots enforce status, streamed size, encoding, schema, and request signal', async () => {
  const index=keyword('C++'), body=index.serialize(), bytes=new TextEncoder().encode(body), signal=new AbortController().signal;
  const restored=await LexicalSearch.fromURL('https://example.test/index.json',{request:{signal},fetch:async(url,request)=>{
    assert.equal(url.protocol,'https:');assert.equal(request.signal,signal);
    return new Response(new ReadableStream({start(controller){controller.enqueue(bytes.slice(0,10));controller.enqueue(bytes.slice(10));controller.close();}}));
  }});
  assert.deepEqual(ids(restored.search('C++')),['C++']);
  await assert.rejects(()=>LexicalSearch.fromURL('file:///tmp/x'),/HTTP/);
  await assert.rejects(()=>LexicalSearch.fromURL('https://example.test',{fetch:async()=>new Response('no',{status:404})}),/404/);
  await assert.rejects(()=>LexicalSearch.fromURL('https://example.test',{maxBytes:3,fetch:async()=>new Response(body)}),/maxBytes/);
  await assert.rejects(()=>LexicalSearch.fromURL('https://example.test',{fetch:async()=>new Response(new Uint8Array([255]))}),/encoded|encoding|valid/i);
  await assert.rejects(()=>LexicalSearch.fromURL('https://example.test',{fetch:async()=>new Response('{}')}),/format/);
});

test('same analyzer ID cannot silently serialize conflicting field definitions',()=>{
  const a=createAnalyzer({id:'shared-v1',tokenize:s=>[s]}),b=createAnalyzer({id:'shared-v1',tokenize:s=>s.split(' ')});
  assert.throws(()=>new LexicalSearch({fields:{a:{analyzer:a},b:{analyzer:b}}}),/Conflicting analyzer/);
});
test('keyword analyzer contract rejects token decomposition atomically',()=>{
  const index=new LexicalSearch({analyzer:createAnalyzer({id:'bad-keyword-v1',kind:'keyword',tokenize:s=>s.split('.'),normalize:s=>s})});
  assert.throws(()=>index.add(doc('a','foo.bar')),/complete input/);assert.equal(index.size,0);
});
test('optional accent folding leaves the default analyzer unchanged',async()=>{
  const {accentFoldedAnalyzer}=await import('../dist/index.js');
  const index=new LexicalSearch({analyzer:accentFoldedAnalyzer});index.add(doc('a','Café mañana'));
  assert.deepEqual(ids(index.search('cafe manana',{operator:'all'})),['a']);
  assert.deepEqual(LexicalSearch.fromJSON(index.serialize()).search('cafe'),index.search('cafe'));
});

test('analyzer callbacks cannot change the owned source used by derived fields or snapshots',()=>{
  const input={id:'a',fields:{symbol:'C++'},metadata:{version:1}};
  const mutate=createAnalyzer({id:'mutating-v1',tokenize:s=>{input.id='changed';input.fields.symbol='C#';input.metadata.version=2;return [s];},normalize:s=>s});
  const index=new LexicalSearch({fields:{symbol:{analyzer:mutate},parts:{source:'symbol',analyzer:keywordAnalyzer}}});
  index.add(input);
  assert.deepEqual(index.get('a'),{id:'a',fields:{symbol:'C++'},metadata:{version:1}});
  assert.deepEqual(ids(index.search('C++',{mode:'exact',fields:['parts']})),['a']);
  assert.equal(index.has('changed'),false);
});
test('literal exact lookup probes small candidate ID sets directly',()=>{
  const index=new LexicalSearch();index.addAll(Array.from({length:500},(_,i)=>doc(String(i),'same')));
  const result=index.searchWithStats('same',{mode:'exact',ids:new Set(['42','absent'])});
  assert.deepEqual(ids(result.hits),['42']);assert.equal(result.stats.postingsVisited,1);
});

test('exact-first literal tier uses syntax-decoded quotes and preserves literal whitespace',()=>{
  const index=keyword('a"b','C:\\foo',' a"b ');
  assert.equal(index.search('a\\"b',{ranking:'exact-first'})[0].tier,'literal');
  assert.equal(index.search('"a\\"b"',{ranking:'exact-first'})[0].tier,'literal');
  assert.equal(index.search('C:\\\\foo',{ranking:'exact-first'})[0].tier,'literal');
  assert.deepEqual(ids(index.search(' a"b ',{mode:'exact'})),[' a"b ']);
});
test('query tokens longer than the indexed token limit match nothing exactly instead of throwing',()=>{
  const index=new LexicalSearch({maxTokenLength:5,fields:{path:{analyzer:keywordAnalyzer},title:{}}});
  index.add({id:'a',fields:{path:'a.mdx',title:'quite long title words'}});
  assert.deepEqual(ids(index.search('quite long title words')),['a']);
  assert.deepEqual(index.search('abcdefgh'),[]);
  assert.deepEqual(ids(index.search('wordsx',{fuzzy:1})),['a']);
  assert.throws(()=>index.add({id:'b',fields:{title:'abcdef'}}),/code points/);
});
