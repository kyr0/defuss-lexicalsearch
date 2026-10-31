import test from 'node:test';
import assert from 'node:assert/strict';
import { LexicalSearch, keywordAnalyzer, apiSearchPreset } from '../dist/index.js';
let state=0x6c657869;
const rand=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%n;};
function osa(a,b,swaps=true) {
  a=Array.from(a);b=Array.from(b);
  const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)d[i][0]=i;
  for(let j=0;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));
    if(swaps&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[a.length][b.length];
}
const allWords=(alphabet,max)=>{let words=[''],front=[''];for(let i=0;i<max;i++){front=front.flatMap(w=>alphabet.map(c=>w+c));words.push(...front);}return words.slice(1);};
const ids=hits=>hits.map(h=>h.id).sort();
test('OSA trie equals exhaustive independent matrix oracle with Unicode, deletions and insertions',()=>{
  const words=allWords(['a','b','𐐨'],4), alive=new Set(words), index=new LexicalSearch({analyzer:keywordAnalyzer});
  index.addAll(words.map(term=>({id:term,fields:{text:term}})));
  for(let phase=0;phase<2;phase++){
    for(const q of words)for(const radius of [1,2]){
      const expected=[...alive].filter(t=>osa(q,t)<=radius).sort();
      assert.deepEqual(ids(index.search(q,{fuzzy:radius,transpositions:true,limit:1000})),expected,JSON.stringify({q,radius,phase}));
    }
    for(let i=0;i<words.length;i+=3){index.remove(words[i]);alive.delete(words[i]);}
    index.upsert({id:'b𐐨aba',fields:{text:'b𐐨aba'}});alive.add('b𐐨aba');
  }
});
test('literal and vocabulary partial matching equal exhaustive string oracles through random mutations',()=>{
  const alphabet=['a','b','+','.','𐐨'], word=()=>Array.from({length:1+rand(9)},()=>alphabet[rand(alphabet.length)]).join('');
  const index=new LexicalSearch({analyzer:keywordAnalyzer}), alive=new Map();
  for(let round=0;round<100;round++){
    for(let j=0;j<8;j++){
      const id=String(rand(70));
      if(rand(4)===0){alive.delete(id);index.remove(id);}else{const text=word();alive.set(id,text);index.upsert({id,fields:{text}});}
    }
    const q=word();
    for(const [mode,fn]of [['prefix','startsWith'],['suffix','endsWith'],['substring','includes']]){
      const expected=[...alive].filter(([,t])=>t[fn](q)).map(([id])=>id).sort();
      assert.deepEqual(ids(index.search(q,{[mode]:true,limit:1000})),expected);
      assert.deepEqual(ids(index.search(q,{mode,limit:1000})),expected);
    }
    const expected=[...alive].filter(([,t])=>t===q).map(([id])=>id).sort();
    assert.deepEqual(ids(index.search(q,{mode:'exact',limit:1000})),expected);
    if(round%20===0)assert.deepEqual(LexicalSearch.fromJSON(index.serialize()).search(q,{substring:true}),index.search(q,{substring:true}));
  }
});
test('exact-first top-k equals full ordering across insertion orders, filters and offset',()=>{
  const docs=Array.from({length:120},(_,i)=>({id:String(i),fields:{symbol:['fetch','fetchAll','Fetcher.fetch','fatch','fetched'][i%5],description:'fetch '.repeat(1+rand(20))},metadata:{group:i%3}}));
  const a=new LexicalSearch(apiSearchPreset),b=new LexicalSearch(apiSearchPreset);a.addAll(docs);b.addAll([...docs].reverse());
  const options={fuzzy:1,prefix:true,substring:true,explain:true,filter:m=>m.group!==2};
  const all=a.search('fetch',{...options,limit:1000});
  assert.deepEqual(all,b.search('fetch',{...options,limit:1000}));
  const order=['incomplete','fuzzy','partial','term','identifier-prefix','keyword','literal'];
  for(let i=1;i<all.length;i++)assert.ok(order.indexOf(all[i-1].tier)>=order.indexOf(all[i].tier));
  for(let offset=0;offset<all.length;offset+=7)assert.deepEqual(a.search('fetch',{...options,offset,limit:7}),all.slice(offset,offset+7));
  for(const hit of all)assert.ok(Math.abs(hit.score-hit.matches.reduce((sum,m)=>sum+m.score,0))<1e-10);
});

test('typo-tolerant completion equals the closest-prefix oracle, with and without transpositions',()=>{
  const words=allWords(['a','b','𐐨'],4), index=new LexicalSearch({analyzer:keywordAnalyzer});
  index.addAll(words.map(term=>({id:term,fields:{text:term}})));
  // The distance of a completion is that of its closest prefix, the empty one included.
  const closest=(q,t,swaps)=>Math.min(...Array.from({length:Array.from(t).length+1},(_,n)=>osa(q,Array.from(t).slice(0,n).join(''),swaps)));
  for(const transpositions of [false,true])for(const q of words)for(const radius of [1,2]){
    const expected=words.filter(t=>closest(q,t,transpositions)<=radius).sort();
    const hits=index.search(q,{prefix:true,fuzzy:radius,transpositions,limit:1000,explain:true});
    assert.deepEqual(ids(hits),expected,JSON.stringify({q,radius,transpositions}));
    for(const hit of hits)for(const match of hit.matches)if(match.kind==='fuzzy')assert.equal(match.distance,closest(q,hit.id,transpositions),JSON.stringify({q,id:hit.id}));
  }
});
