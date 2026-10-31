export interface QueryParts { free: string[]; phrases: string[]; literal: string }
/** Only double quotes are syntax. Backslash escapes a quote or another backslash. */
export function parseQuery(query: string): QueryParts {
  const free: string[] = [], phrases: string[] = [];
  let quoted = false, part = '', literal = '';
  const flush = () => {
    if (quoted) { if (part.length) phrases.push(part); }
    else free.push(...part.split(/\s+/u).filter(Boolean));
    part = '';
  };
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === '\\' && (query[i + 1] === '"' || query[i + 1] === '\\')) { const escaped = query[++i]; part += escaped; literal += escaped; }
    else if (char === '"') { flush(); quoted = !quoted; }
    else { part += char; literal += char; }
  }
  if (quoted) throw new SyntaxError('Unclosed phrase quote');
  flush();
  if (free.length + phrases.length > 128) throw new RangeError('Query exceeds 128 clauses');
  return { free: [...new Set(free)], phrases: [...new Set(phrases)], literal };
}
