import { performance } from 'node:perf_hooks';
import { cpus, platform, arch } from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import { LexicalSearch, apiSearchPreset } from '../dist/index.js';
const n=Number(process.argv[2]??10000);
if(!Number.isSafeInteger(n)||n<1000||n>100000)throw new Error('Document count must be 1000–100000');
const docs=Array.from({length:n},(_,i)=>({id:String(i),fields:{symbol:`@scope/pkg${i}.getUserById`,description:`Retrieve user record from package ${i}.`}}));
const index=new LexicalSearch(apiSearchPreset);
let start=performance.now();index.addAll(docs);const buildMs=performance.now()-start;
const requests=[
 ['literal equality','@scope/pkg999.getUserById',{mode:'exact',fields:['symbol']}],
 ['identifier prefix','@scope/pkg999',{prefix:true,fields:['symbol']}],
 ['identifier suffix','pkg999.getUserById',{suffix:true,fields:['symbol']}],
 ['identifier substring','pkg999.',{substring:true,fields:['symbol']}],
 ['transposition','@scope/pkg999.getUesrById',{fuzzy:1,transpositions:true,fields:['symbol']}],
 ['literal substring scan','pkg999.',{mode:'substring',fields:['symbol']}],
 ['component common','get',{prefix:true}],
];
const queries=[];
for(const[name,query,options]of requests){
 start=performance.now();index.search(query,options);const firstQueryMs=performance.now()-start;
 for(let j=0;j<5;j++)index.search(query,options);
 const times=[];for(let j=0;j<30;j++){start=performance.now();index.search(query,options);times.push(performance.now()-start);}times.sort((a,b)=>a-b);
 const result=index.searchWithStats(query,options);
 queries.push({name,firstQueryMs,medianMs:times[15],p95Ms:times[28],total:result.total,...result.stats});
}
const report={kind:'Synthetic API fixture; first query includes lazy-index setup where applicable; no production SLA',node:process.version,platform:`${platform()} ${arch()}`,cpu:cpus()[0]?.model,documents:n,buildMs,heapUsedBytes:process.memoryUsage().heapUsed,maxRssKiB:process.resourceUsage().maxRSS,memoryNote:'Fixture source documents and one index, including lazy suffix and substring indexes; not isolated index memory.',queries};
const output=new URL(`../output/bench/api-results-${n}.json`,import.meta.url);
await mkdir(new URL('.',output),{recursive:true});
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
