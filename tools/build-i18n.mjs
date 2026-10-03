/**
 * i18n build for the design system board.
 *
 *   node tools/build-i18n.mjs --extract    regenerate translations/en.json (manifest)
 *   node tools/build-i18n.mjs --build      write index.<lang>.html per language
 *   node tools/build-i18n.mjs --check      coverage + orphan report
 *   node tools/build-i18n.mjs --debug      why elements are rejected
 *
 * WHY THE UNIT IS AN ELEMENT, NOT A TEXT NODE
 * --------------------------------------------
 * The board mixes prose with inline markup:
 *
 *     <p>Product code references <code>--surface-raised</code>, never
 *        <code>--gray-850</code>. Primitives may changeâ€¦</p>
 *
 * Splitting that at text-node boundaries yields fragments such as
 * "Product code references", ", never", ". Primitives may changeâ€¦".
 * Polish reorders and declines, so fragments translated in isolation produce
 * broken sentences. A translation unit is therefore the WHOLE element, with
 * each inline child replaced by a {{n}} placeholder:
 *
 *     "Product code references {{0}}, never {{1}}. Primitives may changeâ€¦"
 *
 * The translator sees a complete sentence with the code spans still in place,
 * and the result is order-independent. --check verifies the placeholder count
 * matches, so a dropped {{0}} is caught before it ships.
 *
 * NEVER TRANSLATED
 *   <script> <style> <pre> <code> <svg> code and comments stay English
 *   class / id / href / data-* / style  the CSS contract, not prose
 *   cells marked .token .t-mono â€¦      the token contract
 *   hex colours, bare numbers, ratios  matched by pattern
 *   <meta name="viewport" content>     machine syntax
 * TRANSLATED
 *   element text, plus <title>, meta description, alt, title=, aria-label=,
 *   placeholder. Attribute NAMES stay English; their VALUES are speech.
 *
 * index.html (English) is the hand-edited source and is never annotated.
 * Adding a language means dropping one file into translations/ and rebuilding.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const SRC = resolve(root, 'index.html');
const T_DIR = resolve(root, 'translations');

/* ------------------------------------------------------------------ config */

const SKIP_TAGS = new Set(['script', 'style', 'pre', 'code', 'kbd', 'samp', 'textarea', 'svg']);

// Elements allowed *inside* a translation unit. Anything else is a block
// boundary, so the unit becomes that block's child rather than this element.
const INLINE = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em', 'i',
  'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup',
  'time', 'u', 'var', 'wbr',
]);

const SKIP_CLASSES = new Set([
  'token', 't-mono', 't-mono-sm', 't-num',
  'sw__name', 'sw__hex', 'subhead__id', 'section__num', 'board-footer',
  'brand__name', 'brand__sub', 'sp-meta', 'pv__label', 'stat__v',
  'mono-row', 'dtable__meta', 'tab__count', 'nav-item__count', 'field__counter',
  'chip-dot', 'chip-line', 'meter', 'kv',
]);

const TRANSLATABLE_ATTRS = ['title', 'alt', 'aria-label', 'placeholder', 'content'];
const NEVER_ATTRS = new Set([
  'class', 'id', 'href', 'src', 'style', 'type', 'role', 'name', 'value', 'lang',
  'rel', 'target', 'for', 'charset', 'media', 'sizes', 'viewBox', 'transform',
  'fill', 'stroke', 'width', 'height', 'd', 'points', 'x', 'y', 'r', 'cx', 'cy',
]);

const NON_PROSE = [
  /^#[0-9a-f]{3,8}$/i,
  /^[0-9.,\s:%()×+-]+$/,
  // bare measurements: "13px", "300ms", "22px" — not translatable
  /^\d+(?:\.\d+)?(?:px|rem|em|ms|s|ch|vh|vw|%)$/,
  /^--[a-z0-9-]+$/i,
  /^[a-z0-9-]+\/[0-9.]+[a-z]*$/i,
  /^[A-Z]{2,6}$/,
  /^DS - \d{2}$/i,
  /^\/[\w/.-]+$/,
  /^v?\d+\.\d+(\.\d+)?$/,
];

const META_SKIP = new Set(['viewport', 'theme-color', 'color-scheme']);

const hasLetter = (s) => /[A-Za-zÄ„Ä†ÄĹĹĂ“ĹšĹąĹ»Ä…Ä‡Ä™Ĺ‚Ĺ„ĂłĹ›ĹşĹĽ]/.test(s);

const ENTITIES = {
  nbsp: '\u00A0', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  middot: 'Â·', times: 'Ă—', ndash: 'â€“', mdash: 'â€”', hellip: 'â€¦',
  laquo: 'Â«', raquo: 'Â»', larr: 'â†', rarr: 'â†’', bull: 'â€˘', deg: 'Â°',
};
const decodeEnt = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENTITIES ? ENTITIES[n.toLowerCase()] : m));
const encodeEnt = (s) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\u00A0/g, '&nbsp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  .replace(/â€”/g, '&mdash;').replace(/Â·/g, '&middot;').replace(/â€¦/g, '&hellip;')
  .replace(/â†’/g, '&rarr;').replace(/â†/g, '&larr;')
  .replace(/Â«/g, '&laquo;').replace(/Â»/g, '&raquo;');

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const PH_RE = /\{+(\d+)\}+/g;
const phCount = (s) => ((s.match(PH_RE) || []).length);

function isProse(s) {
  const t = norm(decodeEnt(s));
  if (t.length < 2 || !hasLetter(t)) return false;
  return !NON_PROSE.some((re) => re.test(t));
}

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'area', 'col', 'track', 'wbr']);

/* --------------------------------------------------------------- tokenizer */

function tokenize(html) {
  const out = [];
  let i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { out.push({ t: 'text', v: html.slice(i) }); break; }
    if (lt > i) out.push({ t: 'text', v: html.slice(i, lt) });

    if (html.startsWith('<!--', lt)) {
      const e = html.indexOf('-->', lt + 4);
      const s = e === -1 ? n : e + 3;
      out.push({ t: 'comment', v: html.slice(lt, s) }); i = s; continue;
    }
    if (html.startsWith('<!', lt)) {
      const e = html.indexOf('>', lt);
      const s = e === -1 ? n : e + 1;
      out.push({ t: 'decl', v: html.slice(lt, s) }); i = s; continue;
    }
    if (html[lt + 1] === '/') {
      const e = html.indexOf('>', lt);
      const s = e === -1 ? n : e + 1;
      out.push({ t: 'tag', v: html.slice(lt, s), closing: true,
                 name: html.slice(lt + 2, e).trim().toLowerCase() });
      i = s; continue;
    }
    let j = lt + 1, q = null;
    while (j < n) {
      const c = html[j];
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '>') break;
      j++;
    }
    const raw = html.slice(lt, j + 1);
    const name = (raw.match(/^<([a-zA-Z][\w-]*)/) || [, ''])[1].toLowerCase();
    const selfClose = /\/>$/.test(raw);
    out.push({ t: 'tag', v: raw, closing: false, selfClose, name });
    i = j + 1;
    if (!selfClose && (name === 'script' || name === 'style')) {
      const m = html.slice(i).match(new RegExp(`</${name}\\s*>`, 'i'));
      const end = m ? i + m.index : n;
      if (end > i) out.push({ t: 'raw', v: html.slice(i, end) });
      // The closing tag MUST be emitted as a token. Dropping it silently
      // misaligns the element range index for the rest of the document,
      // because </style> would never pop <style> off the open stack.
      if (m) out.push({ t: 'tag', v: m[0], closing: true, name });
      i = m ? end + m[0].length : n;
    }
  }
  return out;
}

const attrOf = (tagSrc, attr) => {
  const m = tagSrc.match(new RegExp(`\\s${attr}\\s*=\\s*"([^"]*)"`, 'i'))
        || tagSrc.match(new RegExp(`\\s${attr}\\s*=\\s*'([^']*)'`, 'i'));
  return m ? m[1] : null;
};

/**
 * Single pass: build the element index, the parent chain AND the tokenâ†’owner
 * map. All three must come from the same push/pop walk â€” computing them in
 * separate passes silently breaks the parent chain.
 */
function indexDocument(tokens) {
  const els = [];
  const owner = new Array(tokens.length).fill(null);
  const stack = [];

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t === 'raw') { owner[i] = stack[stack.length - 1] || null; continue; }
    if (tk.t !== 'tag') { owner[i] = stack[stack.length - 1] || null; continue; }

    if (tk.closing) {
      const top = stack[stack.length - 1];
      if (top) { top.closeIdx = i; stack.pop(); }
      owner[i] = stack[stack.length - 1] || null;
      continue;
    }
    const selfClose = tk.selfClose || VOID.has(tk.name);
    const el = {
      name: tk.name,
      cls: attrOf(tk.v, 'class'),
      openIdx: i,
      closeIdx: selfClose ? i : -1,
      selfClose,
      parent: stack[stack.length - 1] || null,
    };
    els.push(el);
    if (!selfClose) stack.push(el);
    owner[i] = el;
  }
  for (const e of els) if (e.closeIdx === -1) e.closeIdx = e.selfClose ? e.openIdx : tokens.length;
  return { els, owner };
}

const hasClass = (el, set) => !!el.cls && el.cls.split(/\s+/).some((c) => set.has(c));

/**
 * Containers whose values are mostly code but whose labels — and sometimes
 * prose values — must still translate:
 *
 *   <dl class="kv"><dt>Accent hex</dt><dd>#1F6FEB</dd>
 *   <div class="mono-row"><b>Height</b><span>38px (sm 30 / lg 46)</span><em>…</em>
 *
 * <b>, <em> and <dt> are the labels. <span> and <dd> are usually values: some
 * are code (isProse() rejects hex and bare numbers) and some are real prose
 * ("Inter with tabular figures"). Letting them through is safe — a value with
 * no translation simply falls back to English.
 */
const LABEL_TAGS = new Set(['b', 'em', 'dt', 'span', 'dd']);
const LABEL_HOSTS = new Set(['mono-row', 'kv']);
const isLabelish = (el) =>
  LABEL_TAGS.has(el.name) && !!el.parent && hasClass(el.parent, LABEL_HOSTS);

/** Direct child elements strictly between an element's open and close tags. */
function childElements(tokens, openIdx, closeIdx) {
  const out = [];
  for (let i = openIdx + 1; i < closeIdx; i++) {
    const tk = tokens[i];
    if (tk.t !== 'tag' || tk.closing) continue;
    const selfClose = tk.selfClose || VOID.has(tk.name);
    let end = i;
    if (!selfClose) {
      let d = 1, j = i + 1;
      while (j < tokens.length && d > 0) {
        const t2 = tokens[j];
        if (t2.t === 'tag') {
          if (!t2.closing && !(t2.selfClose || VOID.has(t2.name))) d++;
          else if (t2.closing) d--;
        }
        j++;
      }
      end = j - 1;
    }
    out.push({ name: tk.name, openIdx: i, closeIdx: end });
    i = end;
  }
  return out;
}


/**
 * True when an inline child carries prose of its own and no more of the
 * parent's sentence follows it — i.e. it is a separate fragment, not emphasis.
 *
 *   <dd>Web · Chromium…<small>Desktop-first, 1280px min</small></dd>  -> true
 *        (a subtitle; the text would otherwise be sealed inside a {0})
 *
 *   <p><strong>One primary action.</strong> All other actions…</p>       -> false
 *        (prose continues, so it stays one unit and {0} stays repositionable)
 */
function endsWithProseChild(tokens, el, kids) {
  for (let k = kids.length - 1; k >= 0; k--) {
    // <code>, <kbd> and friends hold identifiers, never prose — never split on them
    if (SKIP_TAGS.has(kids[k].name)) continue;
    // only the text after the LAST prose-bearing child matters
    for (let i = kids[k].closeIdx + 1; i < el.closeIdx; i++) {
      const tk = tokens[i];
      if (tk.t === 'tag') return false;
      if (isProse(tk.v)) return false;
    }
    const inner = tokens.slice(kids[k].openIdx + 1, kids[k].closeIdx);
    if (inner.some((t) => t.t === 'text' && isProse(t.v))) return true;
  }
  return false;
}

/* -------------------------------------------------------- translation units */

function buildUnits(tokens, els, owner) {
  const units = [];
  const covered = new Array(tokens.length).fill(false);

  // Walk the ancestor chain instead of scanning every element per call.
  const inSkip = (el) => {
    for (let cur = el; cur; cur = cur.parent) {
      if (SKIP_TAGS.has(cur.name) || hasClass(cur, SKIP_CLASSES)) return true;
    }
    return false;
  };
  const skipped = (el) => !isLabelish(el) && inSkip(el);

  for (const el of els) {
    if (['html', 'head', 'body', 'style', 'script'].includes(el.name)) continue;
    if (!isLabelish(el) && (SKIP_TAGS.has(el.name) || hasClass(el, SKIP_CLASSES))) continue;
    if (el.selfClose || el.closeIdx <= el.openIdx) continue;
    if (covered[el.openIdx]) continue;
    if (skipped(el.parent)) continue;

    const kids = childElements(tokens, el.openIdx, el.closeIdx);
    if (kids.some((k) => !INLINE.has(k.name))) continue;   // block boundary inside

    const { template, placeholders, ownText } = slice(tokens, el.openIdx, el.closeIdx, kids);
    if (!template || !ownText) continue;

    // An inline child carrying its own prose, with no more of the parent's
    // sentence after it, is a separate fragment rather than emphasis — split
    // it, otherwise its text gets sealed inside a {0} the translator cannot edit.
    if (endsWithProseChild(tokens, el, kids)) continue;
    // key keeps the {n} markers inline so the translator sees BOTH the English
    // wording and exactly where the inline element belongs. Entities are decoded
    // here so the key reads "&", not "&amp;" — attribute keys already were, and
    // the two must agree or lookups silently miss.
    const key = decodeEnt(template).replace(/\{\{(\d+)\}\}/g, '{$1}');
    if (!isProse(key)) continue;

    units.push({ kind: 'element', openIdx: el.openIdx, closeIdx: el.closeIdx,
                 key, template, placeholders });
    for (let i = el.openIdx; i <= el.closeIdx; i++) covered[i] = true;
  }

  // bare text not inside any unit (e.g. directly in <button> or <h1>)
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t !== 'text' || covered[i] || !isProse(tk.v)) continue;
    if (skipped(owner[i])) continue;
    units.push({ kind: 'text', openIdx: i, closeIdx: i,
                 key: decodeEnt(norm(tk.v)), template: norm(tk.v), placeholders: [] });
    covered[i] = true;
  }

  // translatable attribute values
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t !== 'tag' || tk.closing) continue;
    if (skipped(owner[i])) continue;
    const metaName = tk.name === 'meta' ? attrOf(tk.v, 'name') : null;
    if (metaName && META_SKIP.has(metaName.toLowerCase())) continue;
    for (const a of TRANSLATABLE_ATTRS) {
      if (NEVER_ATTRS.has(a)) continue;
      const v = attrOf(tk.v, a);
      if (v && isProse(v)) {
        units.push({ kind: 'attr', attr: a, openIdx: i, closeIdx: i,
                     key: norm(decodeEnt(v)), template: norm(decodeEnt(v)), placeholders: [] });
        break;
      }
    }
  }

  units.sort((a, b) => a.openIdx - b.openIdx);
  return units;
}

/** "text with {{n}} per inline child element". */
function slice(tokens, openIdx, closeIdx, kids) {
  const placeholders = [];
  const parts = [];
  let k = 0, ownText = false;
  for (let i = openIdx + 1; i < closeIdx; i++) {
    if (k < kids.length && i === kids[k].openIdx) {
      let html = '';
      for (let j = kids[k].openIdx; j <= kids[k].closeIdx; j++) html += tokens[j].v;
      const closeHtml = kids[k].closeIdx > kids[k].openIdx ? tokens[kids[k].closeIdx].v : '';
      placeholders.push({
        html,
        text: norm(html.replace(/<[^>]+>/g, '')),
        openHtml: tokens[kids[k].openIdx].v,
        closeHtml,
      });
      parts.push(`{{${placeholders.length - 1}}}`);
      i = kids[k].closeIdx;
      k++;
    } else {
      parts.push(tokens[i].v);
      if (norm(tokens[i].v)) ownText = true;
    }
  }
  const template = norm(parts.join(''));
  return template ? { template, placeholders, ownText } : { template: '', placeholders: [], ownText: false };
}

/* ----------------------------------------------------------------- writing */

/**
 * Substitute inline elements back into a translated string.
 * Accepts both {0} and {{0}} — keys use the short form, older hand-written
 * translations may use the double-brace form.
 */
const applyTemplate = (tpl, ph, translated, frag = {}) => {
  let s = translated;
  ph.forEach((p, idx) => {
    const inner = frag[p.text] ?? p.text;
    const html = p.openHtml ? p.openHtml + inner + p.closeHtml : p.html;
    s = s.split(`{{${idx}}}`).join(html).split(`{${idx}}`).join(html);
  });
  return s;
};

/** Any {n} still present after substitution. */
const leftoverPh = (s) => (s.match(/\{+\d+\}+/g) || []);

/**
 * Placeholder integrity for one unit.
 *   leftover — a marker survived substitution (invented or mis-typed)
 *   missing  — the translation has fewer markers than the source (dropped)
 * Both render broken HTML, so both are fatal.
 */
function phProblem(key, translated, substituted) {
  const src = phCount(key), got = phCount(translated);
  const left = leftoverPh(substituted);
  if (src === got && !left.length) return null;
  const why = left.length
    ? `leftover ${left.join(' ')}`
    : `expected ${src} marker(s), got ${got}`;
  return `  x ${key.slice(0, 72)}  ->  ${why}`;
}

/** Swap a text node, preserving its original surrounding whitespace. */
function replaceText(raw, translated) {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
  return m ? m[1] + translated + m[3] : translated;
}

function setAttr(tagSrc, attr, value) {
  const re = new RegExp(`(\\s${attr}\\s*=\\s*")([^"]*)(")`, 'i');
  if (re.test(tagSrc)) return tagSrc.replace(re, `$1${value}$3`);
  return tagSrc.replace(new RegExp(`(\\s${attr}\\s*=\\s*')([^']*)(')`, 'i'), `$1${value}$3`);
}

const fixLangSwitch = (html, lang) => html.replace(
  /<a\b([^>]*?)data-lang="([a-z]{2})"([^>]*?)>/gi,
  (m, pre, l, post) => {
    const href = l === 'en' ? 'index.html' : `index.${l}.html`;
    const attrs = `${pre}data-lang="${l}"${post}`
      .replace(/\s+href="[^"]*"/i, '')
      .replace(/\s+aria-current="[^"]*"/i, '');
    return `<a${attrs} href="${href}"${l === lang ? ' aria-current="true"' : ''}>`;
  }
);

/* --------------------------------------------------------------------- CLI */

const mode = process.argv.slice(2).find((a) => a.startsWith('--')) || '--build';
const html = readFileSync(SRC, 'utf8');
const tokens = tokenize(html);

// Self-check: the tokenizer must be lossless. If it is not, every element
// range below is suspect and the build would silently corrupt the output.
if (tokens.map((t) => t.v).join('') !== html) {
  console.error('FATAL: tokenizer is not lossless â€” refusing to build.');
  process.exit(1);
}

const { els, owner } = indexDocument(tokens);
const units = buildUnits(tokens, els, owner);

if (!existsSync(T_DIR)) mkdirSync(T_DIR, { recursive: true });

// Inner text of every prose-bearing placeholder is translatable in its own
// right. It is composed into sentences at substitution time.
const fragments = [...new Set(
  units.flatMap((u) => u.placeholders.map((p) => p.text)).filter(isProse),
)].sort();

if (mode === '--fragments') {
  console.log(fragments.length + ' fragment keys inside placeholders:');
  fragments.forEach((t) => console.log('  ' + JSON.stringify(t)));
  process.exit(0);
}

if (mode === '--debug') {
  const counts = {};
  const kinds = {};
  for (const u of units) kinds[u.kind] = (kinds[u.kind] || 0) + 1;
  for (const el of els) counts[el.name] = (counts[el.name] || 0) + 1;
  console.log(`tokens ${tokens.length}   elements ${els.length}   units ${units.length}`);
  console.log('by kind :', JSON.stringify(kinds));
  console.log('top tags:', Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([k, v]) => `${k}:${v}`).join('  '));
  const withPh = units.filter((u) => phCount(u.template)).length;
  console.log(`units with {{n}} placeholders: ${withPh}`);
  console.log('\nlongest units:');
  [...new Map(units.map((u) => [u.key, u])).values()]
    .sort((a, b) => b.key.length - a.key.length).slice(0, 5)
    .forEach((u) => console.log(`  [${String(u.template.length).padStart(4)}] ${u.key.slice(0, 130)}`));
  console.log('\nsample with placeholders:');
  [...new Map(units.map((u) => [u.key, u])).values()]
    .filter((u) => phCount(u.template)).slice(0, 5)
    .forEach((u) => console.log(`  ${u.key.slice(0, 160)}`));
  process.exit(0);
}

if (mode === '--audit-ph') {
  // Authoritative: read the tag from the placeholder HTML captured during
  // extraction, not a guess from the shape of the key.
  const tags = new Map();
  const rows = [];
  for (const u of units) {
    if (!phCount(u.template)) continue;
    const resolved = u.placeholders.map((p) => {
      const m = p.html.match(/^<([a-zA-Z][\w-]*)/);
      return m ? m[1].toLowerCase() : '?';
    });
    for (const t of resolved) tags.set(t, (tags.get(t) || 0) + 1);
    rows.push({ key: u.key, resolved });
  }

  console.log('jednostek z markerami : ' + rows.length);
  console.log('');
  console.log('--- co reprezentuja markery ---');
  for (const [t, c] of [...tags].sort((a, b) => b[1] - a[1])) {
    console.log('  ' + String(c).padStart(4) + '  <' + t + '>');
  }

  // A marker standing for <small> or a text-bearing wrapper means the unit should
  // have been split by endsWithProseChild(): its text would otherwise be sealed
  // inside a hole the translator cannot edit.
  const TEXT_BEARING = new Set(['small', 'b', 'em', 'dt', 'dd']);
  const bad = rows.filter((r) => r.resolved.some((t) => TEXT_BEARING.has(t)));
  console.log('');
  console.log('--- markery dla elementow nosiacych wlasny tekst ---');
  console.log('  ' + bad.length + (bad.length ? '  (POTENCJALNY BUG)' : '  (brak — poprawnie)'));
  bad.slice(0, 10).forEach((r) => console.log('   ! ' + r.key.slice(0, 68) + '  ->  ' + r.resolved.join(', ')));

  const out = resolve(root, 'index.pl.html');
  const leak = existsSync(out) ? (readFileSync(out, 'utf8').match(/\{\d+\}/g) || []).length : null;
  console.log('');
  console.log('--- pozostalosci {n} w index.pl.html ---');
  console.log('  ' + (leak === null ? 'brak pliku wynikowego' : leak + (leak ? '  (BUDOWANIE POWINNO BYC BLOKADANE)' : '  (poprawnie)')));
  process.exit(bad.length ? 1 : 0);
}

if (mode === '--extract') {
  const p = resolve(T_DIR, 'en.json');
  const prev = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
  const next = {};
  for (const u of units) next[u.key] = prev[u.key] ?? u.key;
  for (const f of fragments) if (!(f in next)) next[f] = prev[f] ?? f;
  writeFileSync(p, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log(`translations/en.json â€” ${Object.keys(next).length} units ` +
    `(${new Set(units.map((u) => u.key)).size} unique, ` +
    `${units.filter((u) => phCount(u.template)).length} with {{n}})`);
  process.exit(0);
}

const langs = readdirSync(T_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace(/\.json$/, ''));

if (mode === '--check') {
  const used = new Set([...units.map((u) => u.key), ...fragments]);
  let bad = 0;
  for (const lang of langs) {
    const d = JSON.parse(readFileSync(join(T_DIR, `${lang}.json`), 'utf8'));
    const missing = [...used].filter((k) => !(k in d));
    const empty = [...used].filter((k) => d[k] === '' || d[k] == null);
    const badPh = [...used].filter((k) => d[k] && phCount(d[k]) !== phCount(k));
    const orphan = Object.keys(d).filter((k) => !used.has(k));
    console.log(`\n${lang}: ${Object.keys(d).length} keys`);
    if (missing.length) { console.log(`  âťŚ missing   ${missing.length}`); missing.slice(0, 5).forEach((k) => console.log(`     - ${k.slice(0, 90)}`)); bad++; }
    if (empty.length)   { console.log(`  âťŚ empty     ${empty.length}`); empty.slice(0, 5).forEach((k) => console.log(`     - ${k.slice(0, 90)}`)); bad++; }
    if (badPh.length)   { console.log(`  âťŚ placeholder mismatch ${badPh.length}`); badPh.slice(0, 5).forEach((k) => console.log(`     - ${k.slice(0, 90)}`)); bad++; }
    if (orphan.length)  { console.log(`  âš ď¸Ź  orphan    ${orphan.length} (English source changed)`); orphan.slice(0, 5).forEach((k) => console.log(`     ~ ${k.slice(0, 90)}`)); }
    if (!missing.length && !empty.length && !badPh.length) console.log('  âś… complete');
  }
  if (!langs.length) console.log('no translation files yet');
  process.exit(bad ? 1 : 0);
}

const enDict = JSON.parse(readFileSync(resolve(T_DIR, 'en.json'), 'utf8'));

for (const lang of langs) {
  const dict = JSON.parse(readFileSync(join(T_DIR, `${lang}.json`), 'utf8'));
  const tr = (u) => dict[u.key] ?? enDict[u.key] ?? u.key;
  // Inner text of placeholders, resolved once. A fragment with no entry keeps
  // its original text — that is how identifiers and numbers survive translation.
  const frag = {};
  for (const f of fragments) frag[f] = dict[f] ?? enDict[f] ?? f;

  // One token index can host an element unit, a text unit and attribute units
  // simultaneously (e.g. <p title="â€¦">), so bucket units by index.
  const byIdx = new Map();
  for (const u of units) {
    if (!byIdx.has(u.openIdx)) byIdx.set(u.openIdx, []);
    byIdx.get(u.openIdx).push(u);
  }

  let done = 0, missed = 0;
  for (const u of units) { if (dict[u.key] != null) done++; else missed++; }

  // A surviving {n} means a translator dropped a placeholder. Catch it here:
  // the file would otherwise ship with visible "{0}" markers in the UI.
  const problems = [];

  let out = '';
  for (let i = 0; i < tokens.length; i++) {
    const bucket = byIdx.get(i);
    if (!bucket) { out += tokens[i].v; continue; }

    let tagSrc = tokens[i].v;
    for (const a of bucket) if (a.kind === 'attr') tagSrc = setAttr(tagSrc, a.attr, encodeEnt(tr(a)));

    const el = bucket.find((u) => u.kind === 'element');
    const tx = bucket.find((u) => u.kind === 'text');

    if (tx) { out += replaceText(tagSrc, encodeEnt(tr(tx))); continue; }
    if (el) {
      out += tagSrc;
      const inner = applyTemplate(el.template, el.placeholders, tr(el), frag);
      const bad = phProblem(el.key, tr(el), inner);
      if (bad) problems.push(bad);
      out += inner;
      i = el.closeIdx;
      out += tokens[el.closeIdx] ? tokens[el.closeIdx].v : '';
      continue;
    }
    out += tagSrc;
  }

  out = out.replace(/<html lang="en"/, `<html lang="${lang}"`);
  out = fixLangSwitch(out, lang);

  if (problems.length) {
    console.error(`FATAL: ${problems.length} unresolved {n} placeholder(s)`);
    problems.slice(0, 12).forEach((p) => console.error(p));
    console.error('Refusing to write a file with visible markers.');
    process.exit(1);
  }

  writeFileSync(resolve(root, `index.${lang}.html`), out, 'utf8');
  console.log(`index.${lang}.html  ${(Buffer.byteLength(out, 'utf8') / 1024).toFixed(1)} KB   ` +
    `translated ${done}/${done + missed}` + (missed ? `   âš ď¸Ź  ${missed} fell back to English` : ''));
}
