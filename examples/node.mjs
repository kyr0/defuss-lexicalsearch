import { LexicalSearch } from '../dist/index.js';
import de from '../dist/de.js';

const index = new LexicalSearch({ analyzer: de, fields: { title: { weight: 2 }, body: {} } });
index.addAll([
  { id: 'housing', fields: { title: 'Häuser in München', body: 'Eine Wohnung mit Garten.' }, metadata: { category: 'housing' } },
  { id: 'travel', fields: { title: 'Reise nach München', body: 'Die Stadt und ihre Parks.' }, metadata: { category: 'travel' } },
]);
console.log(index.search('Haus', { explain: true }));
const restored = LexicalSearch.fromJSON(index.serialize(), de);
console.log(restored.search('München', { filter: metadata => metadata.category === 'housing' }));
