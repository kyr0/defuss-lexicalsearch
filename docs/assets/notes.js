// The notes board of the second tab: yellow notes the visitor writes. Every edit upserts the note into the worker's
// "notes" index; an emptied note is removed from it. The worker answers in order, so the last answer for a note always
// belongs to its newest text.
// Why every keystroke instead of a pause: an upsert of one short note takes microseconds, so the index is never stale.
// VERIFIED: scripts/site.mjs types a note and finds it in the next search.
import { formatMs, renderNote, renderNoteStatus } from './render.js';

const motion = matchMedia('(prefers-reduced-motion: reduce)');

// Hand-written samples that show what each analyzer does; the German, code and Japanese ones need their analyzer.
export const SAMPLE_NOTES = [
  'Die Häuser am Hafen werden im Frühling neu gestrichen.',
  'Morgen um 9 Uhr Zahnarzttermin, Versichertenkarte nicht vergessen.',
  'Der Kühlschrank ist fast leer: Milch, Eier und Butter kaufen.',
  'The runners were running late, so the race started without them.',
  'Remember to renew the parking permit before the end of the month.',
  'Our server answers much slower since the last update.',
  'const user = await getUserById(request.params.id);',
  'Refactor parseHttpResponse and the XMLHttpRequest fallback.',
  'snake_case_names and camelCaseNames both split into words.',
  'Las casas blancas del pueblo miran al mar.',
  'Les enfants jouaient dans les jardins du château.',
  '東京駅で新幹線に乗り換えます。',
  'C++ and C# are different languages; a literal search keeps them apart.',
  'Recipe: potato soup with leeks, carrots and a dash of cream.',
  'Im Herbst wollen wir mit dem Zug durch die Alpen reisen.',
];

/**
 * @param {object} options
 * @param {HTMLElement} options.list     where notes go
 * @param {HTMLElement} options.empty    shown while there is no note
 * @param {HTMLElement} options.count    "2 notes indexed"
 * @param {Worker} options.worker
 * @param {() => void} options.onChange  the index changed
 */
export const createNotesBoard = ({ list, empty, count, worker, onChange }) => {
  const labels = new Map(); // id → "Note n", for result cards
  let next = 1;
  let indexed = 0;
  let deck = [];

  const element = id => document.getElementById(id);
  const setStatus = (id, state, detail) => { element(id).querySelector('.ls-note-status').innerHTML = renderNoteStatus(state, detail); };
  const updateCount = () => {
    count.textContent = `${indexed} ${indexed === 1 ? 'note' : 'notes'} indexed`;
    empty.hidden = labels.size > 0;
  };
  const send = id => worker.postMessage({ type: 'note', id, text: element(id).querySelector('textarea').value });

  /** A new note; with `text` it is indexed right away. */
  const add = ({ text = '', focus = true } = {}) => {
    const n = next++;
    const id = `note-${n}`;
    labels.set(id, `Note ${n}`);
    list.insertAdjacentHTML('beforeend', renderNote(id, n));
    const textarea = element(id).querySelector('textarea');
    textarea.value = text;
    textarea.addEventListener('input', () => send(id));
    updateCount();
    if (focus) textarea.focus();
    if (text) send(id);
    return id;
  };

  /** A shuffled deck over the samples: repeated clicks draw new notes until every sample was used once. */
  const draw = () => {
    if (!deck.length) {
      deck = SAMPLE_NOTES.map((_, i) => i);
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    }
    return SAMPLE_NOTES[deck.pop()];
  };
  /** Adds `n` samples; only the notes list scrolls to them, never the page. */
  const addSamples = n => {
    for (let i = 0; i < n; i++) add({ text: draw(), focus: false });
    const scroller = list.closest('.ls-notes-scroll');
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: motion.matches ? 'auto' : 'smooth' });
  };

  return {
    add,
    addSamples,
    labels,
    onNote: data => {
      const node = element(data.id);
      if (!node) return;
      indexed = data.size;
      if (data.state === 'indexed') {
        setStatus(data.id, 'indexed', `upsert in ${formatMs(data.ms)}`);
        if (!motion.matches) node.animate([{ boxShadow: '0 0 0 0 var(--ls-note-pulse)' }, { boxShadow: '0 0 0 14px transparent' }], { duration: 700, easing: 'ease-out' });
      } else setStatus(data.id, data.state, data.message);
      updateCount();
      onChange();
    },
    /** The analyzer changed and the worker rebuilt the index from every note. */
    onRebuilt: data => {
      indexed = data.notes;
      for (const id of labels.keys()) if (element(id).querySelector('textarea').value.trim()) setStatus(id, 'indexed', `re-indexed with ${data.id}`);
      updateCount();
      onChange();
    },
  };
};
