/**
 * Verify examples/smoke-test.html mirrors the fragment quoted in README.md.
 * The README claims "exactly this fragment" — check that it is true.
 */
import { readFileSync } from 'node:fs';

const ex = readFileSync('examples/smoke-test.html', 'utf8');
const rd = readFileSync('README.md', 'utf8');

const block = rd.match(/#### Smoke test[\s\S]*?```html\n([\s\S]*?)```/);
if (!block) { console.error('NIE ZNALEZIONO bloku smoke test w README.md'); process.exit(1); }
const snip = block[1];

const varsOf = (s) => [...s.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);
const rv = varsOf(snip), ev = varsOf(ex);

const missing = rv.filter((v) => !ev.includes(v));
const extra = ev.filter((v) => !rv.includes(v));

const labels = ['Design system', 'Secondary text', 'Helper text', 'Primary action', '>Control<', '>Error<'];
const labelsOk = labels.every((l) => ex.includes(l.replace(/[<>]/g, '')));

console.log('zmienne w README        :', rv.length);
console.log('zmienne w smoke test    :', ev.length);
console.log('brakujace w pliku       :', missing.length, missing);
console.log('dodatkowe w pliku       :', extra.length, extra);
console.log('etykiety zgodne         :', labelsOk);

// every token used must actually resolve in tokens/index.css
const tokens = readFileSync('tokens/semantics-dark.css', 'utf8')
  + readFileSync('tokens/primitives.css', 'utf8');
const undefinedVars = ev.filter((v) => !tokens.includes(v + ':'));

console.log('niezdefiniowane tokeny  :', undefinedVars.length, undefinedVars);
console.log(labelsOk && !missing.length && !extra.length && !undefinedVars.length
  ? '\n✅ smoke test jest spójny z README.md'
  : '\n❌ rozjazd');
process.exit(labelsOk && !missing.length && !extra.length && !undefinedVars.length ? 0 : 1);