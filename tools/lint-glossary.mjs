/**
 * Glossary linter — checks translations/pl.json against
 * translations/enterprise_automation_glossary_pl.md
 *
 * WHY IT PARSES THE MARKDOWN INSTEAD OF A glossary.json
 * A second machine-readable file would be a second source of truth and would
 * drift from the prose one within a week. The board→tokens relationship already
 * established the rule here: one source, derived artefacts. So the glossary .md
 * stays the single source and this script reads it.
 *
 * CHECKS
 *   BLAD   ZAKAZ   a form the glossary explicitly forbids appears in a translation
 *   OSTRZ  TYPO    number+unit glued together in running prose
 *   OSTRZ  BRAK    a recurring technical term has no glossary entry
 *
 * DELIBERATELY NOT CHECKED: terminology consistency across keys.
 * Each distinct English string is one dictionary entry, so the same term in
 * two keys is two independent sentences — they are allowed to read
 * differently ("radius" → "promień zaokrąglenia" in a heading, "promień 5px"
 * inside a sentence). An earlier version of this script tried to enforce it and
 * produced 48 false positives on a fully compliant dictionary.
 *
 *   exit 1 = at least one ZAKAZ. Style warnings do not fail the run.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const GLOSSARY = resolve(root, 'translations/enterprise_automation_glossary_pl.md');
const DICT = resolve(root, 'translations/pl.json');

if (!existsSync(GLOSSARY) || !existsSync(DICT)) {
  console.error('brak glosariusza lub slownika — pomijam');
  process.exit(0);
}

const md = readFileSync(GLOSSARY, 'utf8');
const entries = Object.entries(JSON.parse(readFileSync(DICT, 'utf8')));

const errors = [];
const warnings = [];
const definedTerms = new Set();

/* ------------------------------------------------- 1. explicitly banned forms */

// The glossary states prohibitions in prose, e.g.
//   NIGDY nie tlumacz jako "elewacja" w tym kontekście.
//   Nie tlumacz mechanicznie jako samo "okruchy".
//   Nie tlumacz jako "potok", jeśli chodzi o nazwę techniczną procesu.
const PROHIBITION = /(?:NIGDY\s+nie\s+tłumacz\s+jako|Nie\s+tłumacz\s+mechanicznie\s+jako|Nie\s+tłumacz\s+jako|Nie\s+używaj\s+automatycznie|Unikaj)\s*"?([^",\n.]+?)"?\s*(?:\.|,|$)/g;

const banned = new Map();
for (const m of md.matchAll(PROHIBITION)) {
  const term = m[1].trim();
  // Conditional advice ("jeśli chodzi o nazwę techniczną") is not a hard rule.
  const conditional = /jeśli/i.test(m[0]);
  const k = term.toLowerCase();
  if (!banned.has(k)) banned.set(k, { term, conditional });
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const { term, conditional } of banned.values()) {
  const re = new RegExp(`(?<![\\w-])${esc(term)}(?![\\w-])`, 'i');
  const hits = entries.filter(([, v]) => re.test(v));
  if (!hits.length) continue;
  const head = `  "${term}"  (${hits.length})`;
  const sample = hits.slice(0, 3).map(([k]) => '„' + k.slice(0, 52) + '…”').join('\n     ');
  if (conditional) warnings.push(`ZAKAZ warunkowy  ${head}\n     ${sample}`);
  else errors.push(`ZAKAZ            ${head}\n     ${sample}`);
}

/* ------------------------------------------------- 2. typography */

// Polish separates a number from its unit with a space: "13,5–15 px".
// Scope is deliberately narrow. Compact spec lines ("odstępy 4px · 7 promieni
// zaokrągleń") and identifiers ("--bg-surface-2", "24×24px") keep the tight
// form — see the glossary section "Liczba i jednostka".
const GLUED = /(?<![-\w.$@])\d(?:[\d.,]*\d)?(px|ms|rem|em|vh|vw)\b/g;
const polishWords = (v) => (v.match(/\b[a-ząćęłńóśźż]{2,}\b/g) || []).length;

// Documented exception: a number+unit that IS a quoted CSS value stays
// tight, because the reader copies "1px", not "1 px", into their code.
// Kept in sync with the glossary section "Wyjątek — cytowana wartość CSS".
const CSS_VALUE_EXEMPT = [
  { match: (v) => /^1px \{0\}/.test(v), why: 'opis deklaracji inset-shadow' },
  { match: (v) => v.includes('po\u015bwiata 3px'), why: 'wymiar w specyfikacji komponentu' },
  { match: (v) => /\. 110ms\.$/.test(v), why: 'sama warto\u015b\u0107 na ko\u0144cu kom\u00f3rki tabeli' },
];

for (const [k, v] of entries) {
  const raw = v.replace(/`[^`]*`/g, '');        // ignore inline code spans
  const sentence = polishWords(raw) >= 8 && /[.!?]\s/.test(raw);
  if (!sentence) continue;                       // spec lines and labels are exempt
  if (CSS_VALUE_EXEMPT.some((e) => e.match(v))) continue;   // documented exception
  const hits = [...raw.matchAll(GLUED)];
  if (!hits.length) continue;
  warnings.push(`TYPO             „${k.slice(0, 48)}…”\n     brak spacji: ${hits.map((h) => h[0]).join(', ')}`);
}

/* ------------------------------------------------- 3. glossary coverage */

// Both block layouts in the glossary count as definitions:
//   term\nPreferowane tłumaczenie: X      (translatable terms)
//   TERM\n→ pozostaw X                     (terms that stay English)
for (const m of md.matchAll(/^([A-Za-z][\w \/().+-]{1,44})\n(?:Preferowane tłumaczenie:|→)/gm)) {
  definedTerms.add(m[1].trim().toLowerCase());
}

// English plurals: radii → radius, tokens → token. Collapse before comparing.
// English plurals. Regular rules cover most cases; these few do not.
const IRREGULAR = { radii: 'radius', criteria: 'criterion', phenomena: 'phenomenon', indices: 'index' };
const singular = (t) =>
  IRREGULAR[t] ??
  t.replace(/ies$/, 'y')        // entries -> entry
   .replace(/es$/, '')         // boxes   -> box
   .replace(/s$/, '');         // tokens  -> token
const has = (t) => {
  const k = t.toLowerCase();
  return definedTerms.has(k) || definedTerms.has(singular(k));
};
const word = (text, term) => new RegExp(`(?<![\\w-])${esc(term)}(?![\\w-])`, 'i').test(text);

// Recurring technical terms. Only ones that would actually change a translation.
const FREQUENT = ['payload', 'stack trace', 'ratio', 'ratios', 'radii', 'swatch',
  'unified', 'governs', 'optimised for', 'line break', 'viewport'];

for (const t of FREQUENT) {
  if (has(t)) continue;
  const n = entries.filter(([k]) => word(k, t)).length;
  if (n >= 2) warnings.push(`BRAK            "${t}" — ${n} wystąpień w kluczach, brak w glosariuszu`);
}

/* ---------------------------------------------------------------- report */

console.log(`glosariusz : ${definedTerms.size} pozycji · ${banned.size} zakazów`);
console.log(`slownik   : ${entries.length} wpisów`);
console.log('');

if (!errors.length && !warnings.length) {
  console.log('✅ brak naruszeń');
  process.exit(0);
}
if (errors.length) {
  console.log(`BLĘDY (${errors.length}) — naruszenie zakazu z glosariusza:\n`);
  errors.forEach((e) => console.log(e + '\n'));
}
if (warnings.length) {
  console.log(`DO SPRAWDZENIA (${warnings.length}) — nie blokuje:\n`);
  warnings.forEach((w) => console.log(w + '\n'));
}
process.exit(errors.length ? 1 : 0);