# Enterprise Automation Interface System

A dark, high-density design system for infrastructure, monitoring and automation
interfaces. Ships with a documentation board, a token layer, adapters for the common
stacks, and instructions for agents.

**English** · [Polski](README.pl.md)

| File | Purpose |
|---|---|
| `index.html` | Documentation board — English, source of truth |
| `index.pl.html` | Documentation board — Polish, generated |
| `AGENTS.md` | Rules for agents building interfaces |
| `tokens/` | Token layer (generated from `index.html`) |
| `adapters/` | Adapters: HSL for shadcn/ui, Tailwind preset |
| `translations/` | Translation files + i18n instructions |
| `tools/` | Generators and validators |

The `EN | PL` switch in the left rail moves between board versions.

---

## 0. The board in two languages

```
index.html             English — hand-edited, THE SOURCE OF TRUTH
index.pl.html          Polish  — generated; never edit by hand
translations/en.json   unit manifest
translations/pl.json   translations
```

```bash
node tools/build-i18n.mjs --check    # coverage + placeholder integrity
node tools/build-i18n.mjs --build    # -> index.pl.html
```

The translation unit is the **whole element**, never a sentence fragment — Polish
reorders and declines, so fragments translated in isolation produce broken sentences.
Inline elements (e.g. `<code>`) get `{0}`, `{1}` markers the translator may place
freely.

**Never translated:** token names (`--bg-surface`), Tailwind classes
(`bg-surface-2`), attribute names (`aria-label`). Code stays English.

**Always translated:** interface text, messages, `<title>`, meta description, and the
values of `aria-label` and `placeholder` (the names — not).

Full instructions, including adding a third language:
[`translations/README.md`](translations/README.md).

---

## 1. Before you start — does this system fit?

This system is optimised for a **dense operational interface** where the user monitors,
diagnoses and reacts. The dark background comes from working in dimly lit rooms and
beside a terminal. The high density comes from needing the full system state on one
screen.

| Case | Fits? |
|---|---|
| Dashboard, admin panel, monitoring tool | **Yes — this is the primary target** |
| Application with heavy data, tables, statuses | **Yes** |
| Operator cockpit, NOC, alarm centre | **Yes** |
| SaaS application with forms and lists | **Yes, with restraint** |
| Landing page, marketing site, blog | **No** — far too dense, not enough light surface |
| Documentation reader, tutorial | **No** — contrast too low for long-form text |
| Store, checkout, customer onboarding | **No** — tone and density do not fit |

If the project does not match the first four rows, **do not force this system onto
it**. Dark tokens on a marketing page read as a defect, not a design decision. Every
system has a boundary, and that boundary is part of the system.

---

## 2. Step order

Work through these in sequence. Each step has a checkpoint — verify it before moving on.

```
0  Context and version control      git init, .gitignore, first commit
1  Project initialisation           framework, lint, typecheck, dev server
2  Design system installation       tokens + adapter + smoke test
3  Wire up agent instructions       AGENTS.md in the project repo
4  First screen                     one component, all states
5  Verification loop                lint + typecheck + build + test
```

### Step 0 — Context and version control

**Always do this before the first line of code.** Without git there is no meaningful
review, which means bugs ship instead of being caught in a pull request.

```bash
mkdir my-project && cd my-project
git init
```

Fill in `.gitignore` **before** the first commit. A framework template (below) already
covers `node_modules`, `.next`, `dist`, `.env` and build artefacts. Check that no
secrets are among what you are committing.

> `.env` never enters the repo. `.env.example` files do, because they document
> required variables without revealing values.

**Checkpoint:** `git status` shows only what you intended. `.env` is not listed.

### Step 1 — Project initialisation

**If the project already exists, skip this step** and go to step 2.

#### Choosing a framework

First establish whether the company or team **already has an agreed standard**. If so,
use it — team consistency is worth more than any choice in this table.

| Need | Choice | Initialisation |
|---|---|---|
| Client-rendered app, panel, dashboard | React + Vite | `npm create vite@latest . -- --template react-ts` |
| Server rendering, SEO, API routes | React + Next.js | `npx create-next-app@latest . --typescript --tailwind --eslint --app` |
| Vue application | Vue + Vite | `npm create vue@latest` |
| Universal rendering in Vue | Nuxt | `npx nuxi@latest init .` |
| Svelte application | SvelteKit | `npx sv create .` |
| Static content, blog, documentation | Astro | `npm create astro@latest` |
| No build step, single file, prototype | Plain HTML + CSS | edit `index.html` |

This design system **does not depend on the framework** — `tokens/` is plain CSS.
The framework choice does not affect whether the system fits.

After initialising, **verify the skeleton works before adding anything from this
system**:

```bash
npm run dev      # server starts, page loads
npm run build    # build passes with no errors
```

If something is broken now, you will not be able to diagnose it after adding tokens.
Fix the skeleton first.

**Checkpoint:** an empty page renders correctly and `build` passes.

### Step 2 — Installing the design system

Copy `tokens/` and `adapters/` into the project repo. Pick **one** path — the adapters
do not compose with each other.

#### A · Plain CSS — any stack

```css
/* app/globals.css or src/styles.css */
@import './tokens/index.css';
```

You get 73 primitives, 64 semantics and 8 motion tokens. Works anywhere CSS is read.

#### B · Tailwind

```ts
// tailwind.config.ts
import ds from './adapters/tailwind-preset'

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: { ...ds } },   // merge — do not overwrite the existing config
}
```

Add `class="dark"` to the root element. Colours are plain CSS values, so a theme
switch works without any Tailwind configuration.

#### C · Tailwind + shadcn/ui

As B, plus **replace** the `.dark { … }` block in `globals.css` with the contents of
`adapters/shadcn-dark.css`, and add the status tokens in `tailwind.config.ts`:

```ts
colors: {
  success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
  warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
  info:    { DEFAULT: 'hsl(var(--info))',    foreground: 'hsl(var(--info-foreground))' },
}
```

> ⚠️ **shadcn/ui expects HSL triplets, not hex.** Its `tailwind.config.ts` already
> contains `'hsl(var(--primary))'`. Pasting hex gives `hsl(#1f6feb)` — an invalid
> colour the browser rejects silently, leaving the element with no background. That
> is why a separate adapter exists. **Never paste hex into shadcn variables.**

#### Smoke test — verify the install before you build

Paste this into the start page temporarily. The test uses **variables only**, because
that is the only thing you installed at this step:

```html
<div style="background:var(--bg-canvas); color:var(--text-primary);
            font-family:system-ui,sans-serif; padding:40px; min-height:100vh">

  <h1 style="color:var(--text-primary)">Design system</h1>
  <p style="color:var(--text-secondary)">Secondary text — light grey</p>
  <p style="color:var(--text-tertiary)">Helper text — clearly darker</p>

  <div style="display:flex; gap:12px; margin-top:24px">
    <div style="background:var(--accent); color:#fff; padding:10px 18px;
                border-radius:var(--r-sm)">Primary action</div>
    <div style="background:var(--bg-surface-2); border:1px solid var(--border-control);
                padding:10px 18px; border-radius:var(--r-sm)">Control</div>
    <div style="background:var(--danger-bg); color:var(--danger-text);
                border:1px solid var(--danger-bd); padding:10px 18px;
                border-radius:var(--r-sm)">Error</div>
  </div>
</div>
```

Three things must be true: the background is dark, the three text levels differ in
brightness, and the action elements have a fill. If anything is black or unfilled, the
variable did not load — check the path to `tokens/index.css`.

**The control border is deliberately light** (`--border-control`). On a dark background
an ordinary border is nearly invisible — this is one of the two cases in section 3.

> This test checks the **token layer**, not components. Classes such as `.btn` do not
> exist yet — you build components at step 4 from the recipes in `AGENTS.md` section 5.

> Runnable file: `examples/smoke-test.html`. It contains exactly this fragment — if you
> change one, change the other.

**Checkpoint:** the smoke test renders correctly, console clean.

**Commit the installation separately.** That makes it obvious what the design system
added and what belongs to the application.

### Step 3 — Wiring up agent instructions

Copy `AGENTS.md` into the project repo. That is the instruction set a coding agent
reads (Cline, OpenCode, Claude Code, Cursor and similar).

For tools that read their own config file, add a pointer:

```
# .clinerules
Main instructions are in @AGENTS.md.
```

Extend `AGENTS.md` with the project-specific section: stack, where data comes from,
verification commands. Sections 3–10 are universal and need no changes.

**Checkpoint:** the agent writes a plan before editing files, and asks when it meets a
component not described in the instructions.

### Step 4 — First screen

Do not start with layout. Take **one** component and bring it to a complete state —
then the rest is repeating the pattern.

An order that works:

1. **Write the decisions down before opening an editor:**
   - What is the operator's job on this screen? (one sentence)
   - What is the alarm state? (more than 3 status colours means the screen is too wide)
   - What is the single primary action?
   - Which fields are required?
2. **Build `Button` in all five variants** per the recipe in `AGENTS.md` 5.1.
3. **Check the states, not just the default:** hover, keyboard focus, active,
   disabled, loading.
4. **Only then** assemble the screen from it.

Finished code for `Button`, `Text field`, `Badge` and `Nav item` is in `AGENTS.md`
section 5 — copy it, do not write it from scratch.

**Checkpoint:** one component has every state and passes by keyboard.

### Step 5 — Verification loop

Run before every commit, not at the end of a sprint:

```bash
npm run lint
npm run typecheck
npm run build
```

In a project that tests in the browser, add `npm run dev` plus manual keyboard use —
these catch cases unit tests do not. Add visual or E2E tests for interactive states,
not for static text.

**Checkpoint:** zero lint, typecheck and build errors.

---

## 3. Two accessibility choke points

These are not style opinions — they are measured values that break WCAG AA if you use
the "natural" token instead of the right one. Documented in `AGENTS.md` (R4).

| Trap | Contrast | Use instead |
|---|---|---|
| `--danger` `#de4040` with white text | **4.27:1 — fails AA** | `--danger-solid` `#c93434` → 5.22:1 |
| `--border-default` `#27333f` vs canvas | **1.5:1 — misses the 3:1 UI minimum** | `--border-control` `#6b7b8d` → 4.3:1 |

Re-measure contrast after any palette change:

```bash
node tools/gen-adapters.mjs    # prints the contrast audit
```

---

## 4. Use by agents

`AGENTS.md` contains:

- **7 hard rules** (R1–R7) — breaking any of them rejects the PR
- **A screen-building procedure** — 5 steps before the first line of code
- **Component recipes** — finished code for `Button`, `Text field`, `Badge`, `Nav item`
- **12 anti-patterns** caught in code review
- **Definition of Done** — 10 checkpoints
- **4 modes (personas)**: Design System Maintainer, UI Implementer,
  Accessibility Auditor, Data Density Reviewer

A mode is entered with one sentence, e.g. *"Act as Accessibility Auditor"*.
Full list of invocations: `AGENTS.md` section 8.

---

## 5. Changing the system

**`index.html` is the source of truth.** The files in `tokens/` are generated from it —
editing them by hand lets the documentation and the code drift apart.

```bash
node tools/build-tokens.mjs              # index.html -> tokens/
node tools/gen-adapters.mjs              # hex -> HSL + contrast audit
node tools/validate-agent-snippets.mjs   # checks classes in AGENTS.md examples
node tools/build-i18n.mjs --check        # translation coverage
node tools/build-i18n.mjs --build        # generates index.<lang>.html
```

Workflow after changing the board:

1. `node tools/build-tokens.mjs`
2. `node tools/gen-adapters.mjs` — read the audit, nothing may fall below AA
3. `node tools/build-i18n.mjs --extract` — keys in `translations/pl.json` now need updating
4. `node tools/validate-agent-snippets.mjs` — zero unresolved classes
5. `node tools/build-i18n.mjs --check` — zero missing keys
6. Copy `tokens/` and `adapters/` into the repositories that consume them

The last script guards against a mistake the build cannot catch: a Tailwind class the
preset does not contain **does not break compilation** — it simply does nothing. Without
validation that mistake only surfaces in production.

---

## 6. Token structure

| Layer | File | Role |
|---|---|---|
| 1 · Primitives | `tokens/primitives.css` | Raw values: neutral, brand, status, spacing, radius, font |
| 2 · Semantics | `tokens/semantics-dark.css` | Meaning: backgrounds, text, borders, status, elevation, motion |

Application code uses **layer 2 only**. Layer 1 exists to build layer 2 and to drive
charts. A reference to a primitive in application code is an exception requiring
justification — a palette re-grade would break it silently.

---

## 7. Version

3.2.0 · quarterly review · `index.html` has no dependencies beyond optional Google
Fonts, with a full system-font fallback. Verified in Chromium at 320 / 800 / 1400 /
1600 px.