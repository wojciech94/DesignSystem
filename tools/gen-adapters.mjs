/**
 * Contrast audit for BOTH themes.
 *
 *   node tools/gen-adapters.mjs
 *
 * The light theme was designed against these numbers, so this script is the
 * guard that keeps it honest: if a palette is re-graded and a pair drops below
 * the threshold, it says so instead of shipping.
 *
 * Thresholds: 4.5:1 for text (WCAG 1.4.3), 3:1 for UI components and borders
 * (WCAG 1.4.11). --text-quaternary is checked against 3:1 because it is
 * AA-large by design in both themes.
 */
const lum = (hex) => {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const l1 = lum(a), l2 = lum(b);
  return +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2));
};

const THEMES = {
  dark: {
    surface: '#121922', inset: '#0E141B',
    pairs: [
      ['foreground', '#F6F8FA', '#121922', 4.5],
      ['secondary', '#C3CEDA', '#121922', 4.5],
      ['tertiary', '#94A3B4', '#121922', 4.5],
      ['quaternary (AA-large only)', '#6B7B8D', '#121922', 3.0],
      ['link', '#82B4FF', '#121922', 4.5],
      ['code', '#6EC9E2', '#121922', 4.5],
      ['on accent (white on #1F6FEB)', '#FFFFFF', '#1F6FEB', 4.5],
      ['on danger (white on --danger-solid)', '#FFFFFF', '#C93434', 4.5],
      ['success-text on success-bg', '#63D6A4', '#0B2A20', 4.5],
      ['warning-text on warning-bg', '#F5C563', '#2A2010', 4.5],
      ['danger-text on danger-bg', '#F58E8E', '#2B1414', 4.5],
      ['info-text on info-bg', '#6EC9E2', '#0C2831', 4.5],
      ['border-control on bg-inset', '#6B7B8D', '#0E141B', 3.0],
      ['accent (UI)', '#1F6FEB', '#121922', 3.0],
    ],
  },
  light: {
    surface: '#FFFFFF', inset: '#F4F6F8',
    pairs: [
      ['text-primary', '#0F141A', '#FFFFFF', 4.5],
      ['text-secondary', '#3C4854', '#FFFFFF', 4.5],
      ['text-tertiary', '#5A6773', '#FFFFFF', 4.5],
      ['text-quaternary (AA-large only)', '#6F7B86', '#FFFFFF', 3.0],
      ['text-link', '#1A5FD0', '#FFFFFF', 4.5],
      ['text-code', '#0B6E8C', '#FFFFFF', 4.5],
      ['accent-text', '#1257C4', '#FFFFFF', 4.5],
      ['on accent (white on #1F6FEB)', '#FFFFFF', '#1F6FEB', 4.5],
      ['on danger (white on --danger-solid)', '#FFFFFF', '#C43434', 4.5],
      ['success-text on success-bg', '#0A6B4A', '#E6F6EF', 4.5],
      ['warning-text on warning-bg', '#8A3F07', '#FDF1E1', 4.5],
      ['danger-text on danger-bg', '#B02525', '#FDECEC', 4.5],
      ['info-text on info-bg', '#0A5E75', '#E4F4F8', 4.5],
      ['border-control on bg-inset', '#828B95', '#F4F6F8', 3.0],
      ['accent (UI)', '#1F6FEB', '#FFFFFF', 3.0],
    ],
  },
};

let fails = 0;
for (const [name, theme] of Object.entries(THEMES)) {
  console.log(`\n${'='.repeat(74)}`);
  console.log(`  ${name.toUpperCase()} THEME`);
  console.log('='.repeat(74));
  for (const [label, fg, bg, need] of theme.pairs) {
    const r = ratio(fg, bg);
    const ok = r >= need;
    if (!ok) fails++;
    console.log(
      `${ok ? 'AA  ' : 'FAIL'}  ${String(r).padStart(6)}:1  (min ${need})  ${fg} on ${bg}   ${label}`
    );
  }
}
console.log(`\n${'='.repeat(74)}`);
const total = Object.values(THEMES).reduce((a, t) => a + t.pairs.length, 0);
console.log(`  ${total - fails}/${total} pairs pass   FAIL: ${fails}`);
if (fails) {
  console.log('  A palette re-grade broke a pair. Fix tokens/ before shipping.');
  process.exit(1);
}