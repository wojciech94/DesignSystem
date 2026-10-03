# AGENTS.md — Enterprise Automation Design System

Rules for agents building interfaces on **Enterprise Automation Interface System v3.2.0**.
This file is the executable version: what is allowed, what is mandatory, and how every
component looks.

> **Visual documentation:** `index.html` — the reference board (Figma-ready).
> This file is its condensed, executable form. Where they disagree, **the board wins** —
> and report the drift.
>
> **Installation and step order:** `README.md` section 2. This file assumes the tokens
> are already installed and the project builds.
>
> **Translations:** `index.html` is the source of truth and `index.pl.html` is
> generated — never edit the generated file. Before translating or changing any
> Polish text, read `translations/agent_translation_instructions.md` and treat
> `translations/enterprise_automation_glossary_pl.md` as the terminology source
> of truth. Verify with `node tools/build-i18n.mjs --check` and
> `node tools/lint-glossary.mjs`.
> `translations/pl.json` is maintained by a human — do not modify it without
> explicit permission.
>
> *Polish edition: `AGENTS.pl.md`. This file is canonical.*

---

## 1. What this system is

A dark, high-density interface for **automated infrastructure**: monitoring,
diagnostics, orchestration. The user is not browsing — they are supervising. Three
decisions follow, and you do not break them:

1. **Dark mode by default.** These tools are used in poorly lit operations rooms.
2. **High density.** 13.5–15px body text on an 8px internal rhythm. The operator wants
   information on screen, not air.
3. **Colour is a signal, not decoration.** In an alerting surface colour carries
   meaning — which is why its use is confined to semantic roles.

**This is not** a system for marketing landing pages, blogs or e-commerce. `--bg-canvas`
and the density make no sense there — if the project is marketing, say so instead of
forcing this system onto it.

---

## 2. Installing in a new project

Pick **one** path. Do not mix them.

### Path A — Plain CSS (stack-agnostic, ~30 s)

Copy `tokens/` into the project and import once:

```css
@import './tokens/index.css';
```

You get 73 primitives + 64 semantics + 8 motion tokens. Use them like this:

```html
<div class="panel" style="background: var(--bg-surface); border: 1px solid var(--border-subtle)">
```

### Path B — Tailwind

Requires Tailwind v3 or newer plus `darkMode: ['class']`.

Copy `tokens/` and `adapters/tailwind-preset.ts`, then in `tailwind.config.ts`:

```ts
import ds from './adapters/tailwind-preset'

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: { ...ds } },   // <- merge; do not overwrite what is already there
}
```

You get classes: `bg-surface-2`, `text-content-secondary`, `text-brand-text`,
`bg-danger-solid`, `rounded-md`, `shadow-ds-4`, `duration-base`, `ease-standard`.

### Path C — Tailwind + shadcn/ui

As B, plus **replace** the `.dark { … }` block in `globals.css` with the contents of
`adapters/shadcn-dark.css`.

> ⚠️ **shadcn expects HSL triplets, not hex.** Its `tailwind.config.ts` already
> contains `'hsl(var(--primary))'`. Pasting `#1f6feb` yields `hsl(#1f6feb)` — an invalid
> colour that silently falls back to transparent/black. That is why this adapter
> exists. **Never paste hex into shadcn variables.**

Also add the status tokens in `tailwind.config.ts`:

```ts
colors: {
  success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
  warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
  info:    { DEFAULT: 'hsl(var(--info))',    foreground: 'hsl(var(--info-foreground))' },
}
```

---

## 3. Seven hard rules

Breaking any of these = the pull request is rejected. No exceptions.

### R1 — Never hard-code a value

```tsx
// ❌ WRONG
<div className="bg-[#121922] text-[#C3CEDA] p-[13px] rounded-[7px]" />

// ✅ RIGHT
<div className="bg-surface text-content-secondary p-3 rounded-md" />
```

Applies to: colours, spacing, radii, font sizes, animation durations.
If the system lacks a token you need — **that is a proposal to the system, not a local
decision.** Propose the token, do not work around it.

### R2 — At most one `<Button variant="primary">` per screen

Not two side by side. Not one per section. One **in the operator's field of view**.
Everything else steps down: `secondary` → `ghost` → text link.

### R3 — Colour is never the only carrier of state

Every status = **colour + icon + word** (or colour + dot + word).
Roughly 1 in 12 men has a colour vision deficiency. Operators are not exempt.

```tsx
// ❌ WRONG — screen reader announces "red"
<span className="bg-danger-solid w-2 h-2 rounded-full" />

// ✅ RIGHT
<Badge variant="danger"><span className="badge-dot" />Failing</Badge>
```

### R4 — Contrast: 4.5:1 for text, 3:1 for a control border

Measured values for this system (do not guess — see `adapters/shadcn-dark.css`):

| Use | Token | Contrast |
|---|---|---|
| Content, headings | `--content-primary` | 16.6:1 |
| Secondary content, table cells | `--content-secondary` | 11.1:1 |
| Descriptions, helper text | `--content-tertiary` | 6.9:1 |
| 24px+ or decorative only | `--content-quaternary` | 4.1:1 ⚠️ |
| Link | `--content-link` | 8.35:1 |
| White on brand fill | `--brand` background | 4.63:1 |
| **White on a red fill** | **`--danger-solid`** | **5.22:1** |
| Resting border of a control | `--input` / `--border-control` | 4.3:1 |

> 🛑 **Two traps in this system:**
> 1. `--danger` (`#de4040`) with white text = **4.27:1 — FAILS AA.**
>    For fills carrying light text use `--danger-solid` (`#c93434`).
> 2. `--border-default` (`#27333f`) against the canvas = **1.5:1 — misses the 3:1 minimum.**
>    For the resting border of controls use `--border-control` (`#6b7b8d`).

### R5 — Visible keyboard focus, never remove it

```tsx
// ❌ outline-none with no replacement
<button className="outline-none" />

// ✅
<button className="focus-visible:outline focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-brand" />
```

Every workflow must be completable without a mouse. Use native `<button>`, `<a>`,
`<input>` — not `<div onClick>`.

### R6 — Animation stays under 300 ms and obeys `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    transition-duration: .001ms !important;
  }
}
```

Allowed: colour, opacity, box-shadow. **Not allowed** in a looping animation:
`transform` (vestibular discomfort risk).

### R7 — Layout survives 200% zoom and 320px width

No fixed heights on text containers. No text baked into images.
No horizontal scroll at 320px.

---

## 4. Building a screen — procedure

Do not start from components. Start from decisions:

1. **What is the operator's job on this screen?** If you cannot state it in one
   sentence, the screen is too wide. Split it.
2. **What is the alarm state?** If the screen shows more than **3 status colours**,
   go back to step 1.
3. **What is the single primary action?** Settle it before writing code (R2).
4. **Which fields are required?** Mark them explicitly. Most are required — do not
   mark the optional ones to "balance it out".
5. **Only then** map to the components below.

---

## 5. Component recipes

Copy directly. Change the `variant` and the copy — not the structure or base classes.

### 5.1 Button

```tsx
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

const button = cva(
  // base — do not touch when adding variants
  'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none ' +
  'font-semibold rounded-sm transition-colors duration-fast ease-standard ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-brand disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // R2: max one 'primary' per screen
        primary:
          'bg-brand text-white shadow-ds-1 ' +
          'hover:bg-brand-hover hover:shadow-ds-2 ' +
          'active:bg-brand-active active:translate-y-px ' +
          'disabled:bg-surface-3 disabled:text-content-disabled disabled:shadow-none',
        secondary:
          'bg-surface-3 text-content-primary border border-line ' +
          'hover:bg-line hover:border-line-strong active:bg-inset ' +
          'disabled:bg-surface disabled:text-content-disabled disabled:border-line-subtle',
        ghost:
          'bg-transparent text-content-secondary hover:bg-surface-3 ' +
          'hover:text-content-primary disabled:text-content-disabled',
        // use 'solid', NOT 'danger' — see R4
        danger:
          'bg-danger-solid text-white shadow-ds-1 hover:bg-danger-solid/90 ' +
          'disabled:bg-surface-3 disabled:text-content-disabled',
      },
      size: {
        sm: 'h-7.5 px-2.75 text-caption rounded-xs',
        md: 'h-9.5 px-4 text-body-sm',
        lg: 'h-11.5 px-5.5 text-body rounded-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

interface Props extends VariantProps<typeof button> {
  loading?: boolean
  label: string                 // mandatory text (R5)
  iconOnly?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant, size, loading, label, iconOnly, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      aria-label={iconOnly ? label : undefined}   // R5: icon-only needs a label
      className={button({ variant, size, ...(iconOnly && 'aspect-square px-0') })}
      {...props}
    >
      {loading
        ? <Loader2 className="animate-spin-fast" aria-hidden />
        : children}
      {loading ? 'Working…' : label}
    </button>
  )
)
Button.displayName = 'Button'
```

**Usage:**

```tsx
<Button label="Create job" iconOnly={false}>            // primary — the only one on screen
<Button variant="secondary" label="Save draft" />
<Button variant="ghost" label="Preview" />
<Button variant="danger" label="Delete 3 pipelines" />  // name what you delete
<Button label="Refresh" iconOnly aria-label="Refresh" />
<Button label="Run now" loading />
```

**Copy rules:**
- Verb first, 1–3 words: "Create job", "Run now", "Save draft".
- **Never** "OK", "Submit", "Yes", "Click here".
- Do not blame the user: "You entered an invalid value" → "That value must be between 1 and 9999".
- A destructive button is **always** paired with a confirmation modal.

### 5.2 Text field

```tsx
<div className="flex flex-col gap-1.5 w-full">
  <label htmlFor="id" className="text-caption font-semibold text-content-secondary">
    Schedule name <span aria-hidden className="text-danger-text">*</span>
  </label>

  <input
    id="id"
    required                                  // R4: mark required fields explicitly
    aria-invalid={!!error || undefined}
    aria-describedby={error ? 'id-err' : 'id-help'}
    className="h-9.5 w-full rounded-sm bg-inset px-3 text-body-sm
               text-content-primary placeholder:text-content-quaternary
               border border-input
               focus:border-brand focus:shadow-ds-focus focus:outline-none
               disabled:bg-surface disabled:text-content-disabled
               disabled:border-line-subtle disabled:cursor-not-allowed
               aria-[invalid=true]:border-danger"
    placeholder="nightly-etl"
  />

  {error
    ? <p id="id-err" role="alert" className="text-sm-caption text-danger-text">{error}</p>
    : <p id="id-help" className="text-sm-caption text-content-quaternary">Lowercase, hyphens instead of spaces.</p>}
</div>
```

**Validation rules — the order matters:**
1. Validate **on blur**, not on every keystroke.
2. After the first error, validate again **live** (the operator now knows the field
   is being checked).
3. Message = **what happened + what to do**: "Must be lowercase. Use hyphens instead of spaces."
4. Never a placeholder as the label — it disappears exactly when the operator needs
   to check the expected format.
5. The error must be linked via `aria-describedby`, not merely placed beneath.

### 5.3 Badge

```tsx
type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

const tone: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-content-secondary border-line',
  success: 'bg-success-surface text-success-text border-success-border',
  warning: 'bg-warning-surface text-warning-text border-warning-border',
  danger:  'bg-danger-surface  text-danger-text  border-danger-border',
  info:    'bg-info-surface    text-info-text    border-info-border',
  brand:   'bg-brand-subtle    text-brand-text   border-brand-border',
}

// R3: the dot is mandatory, not optional
export const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1.5 h-5.5 px-2
                   rounded-xs text-sm-caption font-semibold border
                   ${tone[tone]}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
    {children}
  </span>
)
```

- The word is always present — "Degraded", not "Performance degraded".
- `solid` (full fill) **at most one per screen**. Two means neither is an alarm.
- Never animate a badge into place. A status change cross-fades in 260ms, nothing else.

### 5.4 Nav item

```tsx
<a
  href="/pipelines"
  aria-current={isActive ? 'page' : undefined}
  className={cn(
    'relative flex items-center gap-2.5 h-9.5 px-2.5 rounded-sm text-body-sm',
    'transition-colors duration-fast',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    isActive
      ? 'bg-brand-subtle text-content-primary font-semibold border border-brand-border'
      : 'text-content-secondary hover:bg-surface-3 hover:text-content-primary'
  )}
>
  {isActive && <span aria-hidden className="absolute -left-2.5 inset-y-2 w-0.75
                                          rounded-r bg-brand" />}
  <Icon className="w-4 h-4 shrink-0" aria-hidden />
  {label}
  {count != null && <span className="ml-auto font-mono text-overline px-1.5
                                 rounded-xs bg-surface-3 border border-line-subtle">{count}</span>}
</a>
```

- **Exactly one** active item per navigation group.
- The active rail (3px) **does not move on hover** — it marks position, not interaction.
- Disabled: `aria-disabled="true" tabIndex={-1}` **and** the `is-disabled` class.
  `aria-disabled` alone is not enough — the click handler checks the class.

---

## 6. Anti-patterns — caught in code review

| Anti-pattern | Why it is wrong | Instead |
|---|---|---|
| Two `primary` buttons side by side | The operator has no context to choose | One default, the rest `secondary` |
| `bg-[#1a222c]` in JSX | Tokens can no longer be updated in bulk | `bg-surface-2` |
| `outline-none` without `:focus-visible` | Keyboard users are blind | `focus-visible:outline-*` |
| `<div onClick>` | Not focusable, no semantics | `<button>` / `<a>` |
| Placeholder as a label | Vanishes while typing | A visible `<label>` |
| Colour as the only status | Colour sensitivity and CVD | Colour + icon + word |
| `text-[13px]` | Arbitrary value outside the scale | `text-body-sm` |
| Disabled button with no explanation | A dead end for the operator | Show validation errors, or a tooltip |
| Destructive action in an overflow menu | Hides the risk | Named, visible, with confirmation |
| Mixing radius or spacing families | Reads as "unfinished" | One family per surface |
| Looping `transform` animation | Vestibular discomfort | Colour/opacity, under `reduced-motion` |
| `z-index: 9999` | Not in the DS layer scale | The DS-03 scale (0–70) |

---

## 7. Definition of Done

A component or screen is done when **all** of these are true:

- [ ] Zero hard-coded values — tokens only
- [ ] Passed `:focus-visible` by keyboard, top to bottom
- [ ] Screen reader (NVDA / VoiceOver) reads it comprehensibly
- [ ] Contrast computed, not guessed (R4)
- [ ] `prefers-reduced-motion` — transforms removed, colour kept
- [ ] Legible at 200% zoom and at 320px width
- [ ] States: default, hover, focus, active, disabled — all implemented
- [ ] Errors and validation handled and linked via `aria-describedby`
- [ ] `npm run lint && npm run typecheck && npm run build` — zero errors
- [ ] Visual / E2E test for interactive states

---

## 8. Agent modes (personas)

Enter a mode once, in one sentence: *"Act as X"*. A mode changes **perspective and
priorities** — it does not suspend section 3 (the hard rules).

### [Mode: Design System Maintainer]
**Focus:** token coherence, new components, extending the system.
**Rule:** before adding a component, check whether an existing one covers it with a
`variant` change. A new component is the exception, not the default.
**Checklist:**
- Does a component already do this? (variant instead of new)
- Anatomy: fixed part names, unchanged order
- Every new token: primitive → semantic role → application
- A contract change = major release + migration note
- After any change: `node tools/build-tokens.mjs` (the board is the source of truth)

### [Mode: UI Implementer]
**Focus:** component code, variants, states, token integration.
**Rule:** implement from section 5 — do not improvise the structure.
**Checklist:**
- `cva` for variants, never `if/else` in JSX
- `forwardRef` + `displayName` (required by radix/shadcn)
- `aria-busy` when `loading`, `aria-label` when `iconOnly`
- Base classes live in `cva` — variants only append
- Zero `style={{}}` with token values (use classes)

### [Mode: Accessibility Auditor]
**Focus:** WCAG 2.2 AA, contrast, keyboard, screen readers.
**Rule:** contrast is **computed**, not assumed. Document the result.
**Checklist:**
- Every text/background pair computed (script or table in `adapters/shadcn-dark.css`)
- Tab order matches visual order
- `Escape` closes layers; focus returns to the invoking element
- Headings `h1→h4` with no skips, exactly one `h1`
- Statuses announced through `aria-live="polite"`, not by colour alone
- Image without `alt` → decorative case with `aria-hidden`

### [Mode: Data Density Reviewer]
**Focus:** tables, dashboards, metrics — where density is the goal.
**Rule:** density is a feature, but not at the cost of scanning.
**Checklist:**
- `font-variant-numeric: tabular-nums` in every column of figures
- Status on the same row as its resource, not in a distant column
- Max 3 status colours in one viewport
- Row actions: hover **and** context menu (not hover alone)
- Virtualise above ~200 rows

---

## 9. Changing the system

The board (`index.html`) is the **source of truth**. The files in `tokens/` are
generated from it — never edit `tokens/*.css` by hand.

```bash
node tools/build-tokens.mjs    # index.html -> tokens/
node tools/gen-adapters.mjs    # hex -> HSL triplets for shadcn + contrast audit
```

After changing the board:
1. `node tools/build-tokens.mjs`
2. `node tools/gen-adapters.mjs` — read the printed contrast audit
3. Copy the updated `tokens/` and `adapters/` into consuming projects
4. Confirm nothing fell below the AA threshold

---

## 10. Quick reference

```
Canvas          bg-canvas        Primary text    text-content-primary
Surface         bg-surface       Secondary text  text-content-secondary
Nested surface  bg-surface-2     Descriptive     text-content-tertiary
Control         bg-surface-3     Link            text-content-link link
Inset           bg-inset         Code            text-content-code font-mono
Raised          bg-raised        Disabled        text-content-disabled

Action          bg-brand         Info            bg-info-surface / text-info-text
Hover           bg-brand-hover   Success         bg-success-surface / text-success-text
Active          bg-brand-active  Warning         bg-warning-surface / text-warning-text
Text on action  text-white       Danger          bg-danger-surface / text-danger-text
Border          border-input     Destructive     bg-danger-solid text-white

Padding    p-1(4) p-2(8) p-3(12) p-4(16) p-5(20) p-6(24) p-8(32) p-10(40) p-12(48)
Radius     rounded-xs(3) rounded-sm(5) rounded-md(8) rounded-lg(12) rounded-xl(16)
Shadow     shadow-ds-1 … shadow-ds-6, hairline: shadow-ds-hairline
Motion     duration-fast(110) duration-base(160) duration-slow(260) ease-standard
```