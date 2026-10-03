# Deploying to a new client project

How to take this design system into a project that did not ask for it. Written
around **decisions**, because the decisions are the slow part. Copying files takes
minutes; choosing wrong takes weeks to undo.

Two things to internalise before you start:

1. **Port the tokens, not the sizes.** The system is calibrated for a NOC
   operator watching thousands of machines. A client portal is a different user.
   Copying its 13.5 px text and 36 px rows verbatim produces an interface that looks like a
   monitoring tool and was never requested.
2. **Both themes ship.** `data-theme="light"` switches everything; drop the
   attribute and it falls back to dark. Components never name a theme.

---

## Phase 0 — Is this the right base?

Ask who the user is, not what the product is.

| User | Fits? | What you inherit |
|---|---|---|
| Operator, support, SRE | Yes, fully | All of it, including 36 px rows |
| Back-office staff, sales, logistics | Yes, loosened | Tokens + components, 44 px rows |
| End customer on a portal | Yes, with light theme | Tokens + components, 44 px rows |

If the answer is "marketing site", stop. Dark tokens on a marketing
page read as a defect, not a decision.

**Default:** end customers → light theme, 44 px rows, motion only on hover
beyond hover feedback.

---

## Phase 1 — How much do you take?

Three levels. Do not start at the top.

| Level | What | Effort | Gets you |
|---|---|---|---|
| 1 | `tokens/` + `adapters/` | 2 h | Consistent colour, spacing, radii, type across the whole app |
| 2 | Level 1 + the 4 component recipes | 1–2 d | The whole interaction surface |
| 3 | Level 2 + table sizing, motion, a11y contract | 1 wk+ | Worth it only for operational tools |

**Default: Level 2.** Level 1 alone is the highest return per hour in the whole
system — do it first, before deciding anything else.

```bash
cp -r tokens/ adapters/ my-client-app/src/design/
```

Do not copy `index.html`, `AGENTS.md`, `translations/` or `tools/` into the
client repo. Those are documentation about the system, not part of an app.

---

## Phase 2 — Which theme is the default?

Both are ready and contrast-audited (29/29 pairs, `node tools/gen-adapters.mjs`).

| Option | When |
|---|---|
| Light only | Client portal, back-office, anyone outside IT |
| Dark only | Ops tooling, control room |
| Both, light default | Portal with an internal "power" view |

**Default: light.** For a customer portal it is almost always right.

```html
<html lang="pl" data-theme="light">
```

Keep the attribute on `<html>`. Do **not** swap the `:root` and
`:root[data-theme='light']` blocks — that breaks the dark fallback.

Tailwind needs no change between themes: the preset references
`var(--bg-surface)` and friends, so both themes flow through automatically.
shadcn does need the matching adapter block — see `adapters/shadcn-light.css`.

---

## Phase 3 — How big should things be?

This is the decision people skip and then regret.

| Profile | Body | Row height | For |
|---|---|---|---|
| Operational | 13.5–15 px | 36 px | Monitoring, NOC, logs |
| Office | 14–15 px | 40–44 px | Back office, forms, data entry |
| Customer portal | 15–16 px | 44–48 px | Consumer-facing, infrequent use |

**Default: customer portal.** Larger text, roomier rows, more whitespace.

Going roomier means larger text, rows and controls. Large text in
dense UI is worse than small text in a roomy layout.

---

## Phase 4 — Write the project AGENTS.md

**Do not copy this system's `AGENTS.md` wholesale.** It carries sizing
calibrated for a different user, and an agent will apply it literally — producing
a client app that looks like a cockpit.

Write a short project-local file instead:

```markdown
# Design rules — [client] portal

Built on the Enterprise Automation Design System. Tokens live in
src/design/tokens/, components in src/design/components/.

## In scope
R1  no hard-coded values — tokens only
R2  at most one primary action per view
R3  colour is never the only carrier of state (colour + icon + word)
R4  contrast 4.5:1 text, 3:1 control borders
R5  visible keyboard focus, never remove it
R7  survives 200% zoom and 320 px

## Deliberately out of scope
Sizing from the base system: 13.5 px body, 36 px rows, tabular figures
everywhere. This portal targets customers, so: 15 px body, 44 px rows,
tabular figures only in numeric columns.
The motion budget applies to hover feedback only — no entrance animations.
```

Explicitly listing what does **not** apply is the whole point. Without it, an
agent optimises for internal consistency and produces the wrong product.

---

## Phase 5 — Where does the code live?

| Option | When | Cost |
|---|---|---|
| Copy into `src/design/` | One client, wants to own it | Fork drift, but that is often what the client is paying for |
| npm package | Several clients, one owner | Publishing overhead |
| git submodule | Several clients, shared ownership | Submodules confuse most tooling |
| Copy + a version note | One client | The pragmatic default |

**Default: copy into `src/design/`, and record the version in a comment.**

```css
/* Copied from Enterprise Automation Design System v3.2.0 (MIT).
   Do not sync blindly — see DEPLOYING.md phase 6. */
```

Copying is the right default because the client usually *wants* to diverge. They
will ask for changes, and a vendored copy is easier to change than a dependency.

---

## Phase 6 — What happens when the client wants a change?

The failure mode to avoid: every client request becomes an edit in the design
system, and the next client gets the previous client's requirements.

| Request | Where it goes |
|---|---|
| "Make this button pink" | Client project only. Never back into the system. |
| "Our brand colour is X" | Client project's `:root` override, documented |
| "We need a new component" | Upstream as a proposal — genuinely generic? Add it |
| "Our rows are too tight" | Client project, per Phase 3 |

**Rule: changes flow upstream only when they are not client-specific.** If you
cannot explain the change without naming the client, it stays local.

This is what keeps the system usable for the next project. Merging every client
request back is how a design system dies.

---

## Phase 7 — Build in this order

1. **Layout and navigation** — empty shell, tokens substituted
2. **One page end to end** with real data, even if only half-finished
3. **Button, Text field** — the two you will use most
4. **Statuses** — Badge plus the semantic colours
5. **Tables and lists** — the sizing decisions land here
6. **States** — empty, loading, error, success
7. **Accessibility pass** — keyboard, contrast, screen reader

Step 2 is the one people skip. A half-finished vertical slice beats a finished
horizontal one: it exposes the real problems before you have built everything on
top of a wrong assumption.

---

## Phase 8 — Before you hand it over

```bash
npm run lint && npm run typecheck && npm run build
```

Plus three checks no automated tool performs:

- **Tab through the whole app.** Logical order, no traps, visible focus.
- **Zoom to 200%.** Nothing clips, nothing overlaps.
- **Both themes.** Toggle `data-theme` and read a dense screen in each. If the
  light theme was never looked at, it does not work yet.

If the client added colours outside the system, re-audit them:

```bash
node tools/gen-adapters.mjs    # exits non-zero if any pair falls below AA
```

---

## Checklist you can hand to someone else

- [ ] Phase 0 answered: who is the user, which size profile
- [ ] Phase 1 chosen: tokens only, or tokens + components
- [ ] Phase 2 answered: which theme is default
- [ ] `data-theme` attribute set on `<html>`
- [ ] Phase 3 written down: body size, row height
- [ ] Phase 4 done: project AGENTS.md lists rules **and** exclusions
- [ ] Phase 5 done: code vendored, version recorded
- [ ] Phase 6 agreed with the client: who owns divergence
- [ ] One vertical slice built with real data
- [ ] Both themes visually checked
- [ ] Keyboard, 200 % zoom, contrast verified
