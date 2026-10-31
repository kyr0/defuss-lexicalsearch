import { LexicalSearch, apiSearchPreset } from '../dist/index.js';
const index = new LexicalSearch(apiSearchPreset);
index.addAll([
  { id: 'map', fields: { symbol: 'Array.prototype.map', description: 'Transform each array element.' } },
  { id: 'cpp', fields: { symbol: 'C++', description: 'C++ language reference.' } },
  { id: 'csharp', fields: { symbol: 'C#', description: 'C# language reference.' } },
  { id: 'package', fields: { symbol: '@scope/pkg', description: 'Install the scoped package.' } },
]);
console.log('Literal equality:', index.search('C++', { mode: 'exact', fields: ['symbol'] }));
console.log('Identifier completion:', index.search('Array.prototype.ma', { prefix: true }));
console.log('Typo recovery:', index.search('prottoype', { fuzzy: 1, transpositions: true }));
console.log('Substring:', index.search('prototype', { substring: true }));
const restored = LexicalSearch.fromJSON(index.serialize());
console.log('Restored:', restored.search('@scope/pkg'));
