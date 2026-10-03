/**
 * Validates that every Tailwind utility used in AGENTS.md examples actually
 * resolves — either to a key in adapters/tailwind-preset.ts, or to a stock
 * Tailwind utility.
 *
 * Why this exists: a typo like documenting `border-line` when the preset only
 * exports `border-subtle` does NOT break the build. Tailwind simply never
 * generates the class and it silently does nothing. That failure is invisible
 * in review and shows up as a missing border in production. This script is
 * the guard rail.
 *
 *   node tools/validate-agent-snippets.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const agents = readFileSync(resolve(root, 'AGENTS.md'), 'utf8');
const preset = readFileSync(resolve(root, 'adapters/tailwind-preset.ts'), 'utf8');

/* ---------- 1. what the preset can generate ------------------------------- */
const generated = new Set();
const withPrefix = (prefix, name) => generated.add(`${prefix}-${name}`.toLowerCase());

const colorsSrc = preset.slice(preset.indexOf('colors:'), preset.indexOf('fontSize:'));
for (const m of colorsSrc.matchAll(/^\t*([a-zA-Z][\w-]*):\s*'([^']+)'/gm)) {
  for (const p of ['bg', 'text', 'border', 'outline', 'fill', 'ring', 'from', 'to', 'caret', 'accent', 'divide', 'shadow', 'decoration'])
    withPrefix(p, m[1]);
}
// Require 2+ tabs so the top-level `colors:` key is not mistaken for a group.
// (colors: sits at 1 tab; nested scales like surface: sit at 2.)
for (const m of colorsSrc.matchAll(/^\t{2,}([a-zA-Z][\w-]*):\s*\{([\s\S]*?)^\t*\}/gm)) {
  const group = m[1];
  for (const n of m[2].matchAll(/'?([\w-]+)'?:\s*'/g)) {
    for (const p of ['bg', 'text', 'border', 'outline', 'fill', 'ring', 'from', 'to', 'caret', 'accent', 'divide', 'shadow', 'decoration']) {
      withPrefix(p, `${group}-${n[1]}`);
      if (n[1] === 'DEFAULT') withPrefix(p, group);
    }
  }
}

const SCALES = [
  ['fontSize:', ['text']],
  ['spacing:', ['p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'ps', 'pe', 'm', 'mx', 'my',
                'mt', 'mb', 'ml', 'mr', 'w', 'h', 'size', 'gap', 'gap-x', 'gap-y',
                'space-x', 'space-y', 'inset', 'inset-x', 'inset-y', 'top', 'right',
                'bottom', 'left', 'translate-x', 'translate-y', 'basis']],
  ['borderRadius:', ['rounded']],
  ['boxShadow:', ['shadow']],
  ['transitionDuration:', ['duration']],
  ['transitionTimingFunction:', ['ease']],
  ['animation:', ['animate']],
  ['fontWeight:', ['font']],
  ['fontFamily:', ['font']],
  ['lineHeight:', ['leading']],
];
for (const [key, prefixes] of SCALES) {
  const at = preset.indexOf(key);
  if (at === -1) continue;
  const seg = preset.slice(at, at + 2000);
  // values may be a string ('…') or an array (['…', { … }]) — fontSize uses arrays
  for (const m of seg.matchAll(/^\t*'?([\w.-]+)'?:\s*(?:'[^']*'|\[)/gm))
    for (const p of prefixes) withPrefix(p, m[1]);
}

/* ---------- 2. stock Tailwind utilities we rely on ------------------------- */
const STOCK = new Set(`
inline-flex flex grid block relative absolute fixed sticky hidden contents
w-full h-full w-screen h-screen w-4 h-4 w-2 h-2 w-1.5 h-1.5 w-0.75 h-0.75
p-1 p-2 p-3 p-4 p-6 px-0 px-1 px-1.5 px-2 px-2.5 px-3 px-4 py-1 py-2 py-3
pt-1 pb-1 pl-1 pr-1 mt-1 mb-1 ml-auto mr-auto mx-auto
gap-1 gap-2 gap-3 gap-2.5 gap-1.5 gap-4
space-x-2 space-y-2 inset-y-2 -left-2.5 left-2.5
text-white text-xs text-sm text-base text-lg
bg-transparent bg-current border-2 rounded rounded-md rounded-sm rounded-lg
rounded-full rounded-r shadow-none
aspect-square translate-y-px select-none whitespace-nowrap shrink-0
font-mono font-semibold font-medium
min-h-full overflow-hidden outline outline-2 outline-offset-2 outline-none
`.trim().split(/\s+/));

/* ---------- 3. what AGENTS.md actually uses ------------------------------- */
const code = [...agents.matchAll(/```(?:tsx|ts|html|css)?\n([\s\S]*?)```/g)].map(m => m[1]).join('\n');

const UTIL = /\b(bg|text|border|outline|fill|ring|placeholder|shadow|rounded|duration|ease|animate|font|gap|p|px|py|pt|pb|pl|pr|m|mx|my|w|h|inset-y|inset-x|top|bottom|left|right|space-x|space-y|translate-y)-([a-z0-9][\w.\[\]#-]*)/gi;

const refs = new Map();   // class -> isFromNegativeExample
for (const line of code.split('\n')) {
  const isNeg = line.includes('❌') || line.includes('BŁĄD') || line.includes('~ ');
  for (const m of line.match(UTIL) || []) refs.set(m.toLowerCase(), (refs.get(m.toLowerCase()) || false) || isNeg);
}

/* ---------- 4. report ------------------------------------------------------ */
const bad = [];
for (const [cls, neg] of refs) {
  if (neg) continue;                                    // documented as wrong on purpose
  if (generated.has(cls) || STOCK.has(cls)) continue;
  if (/[\[\]#]/.test(cls)) continue;                     // arbitrary value in a ❌-adjacent spot
  bad.push(cls);
}

const negShown = [...refs].filter(([, n]) => n).map(([c]) => c);
console.log(`preset classes generated : ${generated.size}`);
console.log(`classes used in AGENTS.md: ${refs.size}`);
console.log(`verified                 : ${refs.size - bad.length - negShown.filter(c => !bad.includes(c)).length}`);
console.log('');
if (negShown.length) {
  console.log('in ❌ examples (intentional, not validated):');
  console.log('  ' + negShown.join('  '));
  console.log('');
}
if (bad.length) {
  console.log('❌ UNRESOLVED — would silently render with no effect:');
  for (const c of [...new Set(bad)].sort()) console.log('  ! ' + c);
  process.exitCode = 1;
} else {
  console.log('✅ every utility in the AGENTS.md examples resolves to the preset or stock Tailwind');
}
