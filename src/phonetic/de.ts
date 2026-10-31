/** Code of one letter under the Kölner Phonetik context rules (Postel 1969); '' for H. */
function letterCode(previous: string, char: string, next: string, first: boolean): string {
  switch (char) {
    case 'a':
    case 'e':
    case 'i':
    case 'j':
    case 'o':
    case 'u':
    case 'y':
    case 'ä':
    case 'ö':
    case 'ü':
      return '0'
    case 'b':
      return '1'
    case 'p':
      return next === 'h' ? '3' : '1'
    case 'd':
    case 't':
      return /[csz]/.test(next) ? '8' : '2'
    case 'f':
    case 'v':
    case 'w':
      return '3'
    case 'g':
    case 'k':
    case 'q':
      return '4'
    case 'c':
      if (first) return /[ahkloqrux]/.test(next) ? '4' : '8'
      return /[sz]/.test(previous) || !/[ahkoqux]/.test(next) ? '8' : '4'
    case 'x':
      return /[ckq]/.test(previous) ? '8' : '48'
    case 'l':
      return '5'
    case 'm':
    case 'n':
      return '6'
    case 'r':
      return '7'
    case 's':
    case 'z':
      return '8'
    default:
      return ''
  }
}

/**
 * Kölner Phonetik: umlauts are vowels (but not A in context rules), ß is s, other marks and non-letters are ignored.
 * VERIFIED: matches the rule table's reference codes, e.g. Müller-Lüdenscheidt 65752682 (test/phonetic.test.mjs).
 */
export function koelnerPhonetik(word: string): string {
  const letters = Array.from(word.toLowerCase().normalize('NFC'), char =>
    'äöü'.includes(char) ? char : char === 'ß' ? 's' : char.normalize('NFD').replace(/\p{M}/gu, ''),
  ).join('').replace(/[^a-zäöü]/g, '')
  let codes = ''
  for (let i = 0; i < letters.length; i++) {
    codes += letterCode(letters[i - 1] ?? '', letters[i], letters[i + 1] ?? '', i === 0)
  }
  // Collapse adjacent duplicates first, then drop every zero except a leading one.
  const collapsed = codes.replace(/(.)\1+/g, '$1')
  return collapsed.slice(0, 1) + collapsed.slice(1).replace(/0/g, '')
}
