# AGENTS.md — Enterprise Automation Design System

**Tłumaczenie polskie — wersja niekanoniczna.** Plikiem, którego używają agenci
kodujący, jest [`AGENTS.md`](AGENTS.md). Przy rozjazdzie między tą wersją a
angielską **wygra `AGENTS.md`**.

> Ten plik jest dla Ciebie. Jeśli coś jest niejasne po polsku, popraw tłumaczenie —
> ale **nigdy** nie edytuj go zamiast kanonicznej wersji. Zmiany w regułach
> wprowadza się w `AGENTS.md`, a potem przenosi tutaj.

Zasady dla agentów kodujących interfejsy w oparciu o **Enterprise Automation
Interface System v3.2.0**. Ten plik jest instrukcją wykonawczą: mówi, co wolno,
co jest obowiązkowe i jak wygląda każdy komponent.

> **Dokumentacja wizualna:** `index.html` — board referencyjny (Figma-ready).
> Ten plik jest jego skróconą, wykonawczą wersją. Gdy są sprzeczne, **wygra
> board** — i zgłoś rozjazd.
>
> **Instalacja i kolejność kroków:** `README.md` sekcja 2. Ten plik zakłada, że
> tokeny są już zainstalowane i projekt się kompiluje.

---

## 1. Czym jest ten system

Ciemny, wysoko-gęsty interfejs do **zautomatyzowanej infrastruktury**: monitoring,
diagnostyka, orkiestracja. Użytkownik nie przegląda — on nadzoruje. Stąd wynikają
trzy decyzje, których nie łamj:

1. **Dark mode domyślnie.** Narzędzia używane są w słabo oświetlonych NOC-ach.
2. **Duża gęstość.** 13.5–15px tekstu na rytmie 8px. Operator chce informacji na
   ekranie, nie „powietrza".
3. **Kolor jest sygnałem, nie dekoracją.** W interfejsie z alertami kolor niesie
   znaczenie — dlatego jego użycie jest ograniczone do ról semantycznych.

**Nie jest to** system do landing page'ów marketingowych, bloga czy e-commerce.
Tam `--bg-canvas` i gęstość nie mają sensu — jeśli projekt jest marketingowy,
powiedz o tym, zamiast na siłę wtłaczać ten system.

---

## 2. Instalacja w nowym projekcie

Wybierz **jedną** ścieżkę. Nie mieszaj.

### Ścieżka A — Czysty CSS (niezależna od stacku, ~30 s)

Skopiuj `tokens/` do projektu i zaimportuj raz:

```css
@import './tokens/index.css';
```

Dostajesz 73 prymitywy + 64 semantyki + 8 tokenów motion. Używasz ich tak:

```html
<div class="panel" style="background: var(--bg-surface); border: 1px solid var(--border-subtle)">
```

### Ścieżka B — Tailwind

Wymaga Tailwind v3 lub nowszego oraz `darkMode: ['class']`.

Skopiuj `tokens/` oraz `adapters/tailwind-preset.ts`, potem w `tailwind.config.ts`:

```ts
import ds from './adapters/tailwind-preset'

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: { ...ds } },   // <- merge, nie nadpisuj reszty
}
```

Otrzymujesz klasy: `bg-surface-2`, `text-content-secondary`, `text-brand-text`,
`bg-danger-solid`, `rounded-md`, `shadow-ds-4`, `duration-base`, `ease-standard`.

### Ścieżka C — Tailwind + shadcn/ui

Jak B, plus w `globals.css` **zastąp** blok `.dark { ... }` zawartością
`adapters/shadcn-dark.css`.

> ⚠️ **shadcn oczekuje tripletów HSL, nie hex.** `tailwind.config.ts` ma już
> `'hsl(var(--primary))'`. Wklejenie `#1f6feb` daje `hsl(#1f6feb)` — niepoprawny
> kolor, który po cichu spada na przezroczystość/czerń. Dlatego istnieje adapter.
> **Nigdy nie wklejaj hex do zmiennych shadcn.**

W `tailwind.config.ts` dodaj też tokeny statusów:

```ts
colors: {
  success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
  warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
  info:    { DEFAULT: 'hsl(var(--info))',    foreground: 'hsl(var(--info-foreground))' },
}
```

---

## 3. Siedem twardych reguł

Złamanie którejkolwiek = PR (pull request) odrzucony. Bez wyjątków.

### R1 — Nigdy nie hardkoduj wartości

```tsx
// ❌ BŁĘD
<div className="bg-[#121922] text-[#C3CEDA] p-[13px] rounded-[7px]" />

// ✅ DOBRZE
<div className="bg-surface text-content-secondary p-3 rounded-md" />
```

Dotyczy: kolorów, odstępów, promieni, rozmiarów tekstu, czasów animacji.
Jeśli system nie ma tokenu, którego potrzebujesz — **to jest zgłoszenie do
systemu, nie lokalna decyzja.** Zaproponuj token, nie obejście.

### R2 — Maksymalnie jeden `<Button variant="primary">` na ekranie

Nie dwa obok siebie. Nie jeden na sekcję. Jeden **w polu widzenia operatora**.
Wszystkie pozostałe akcje schodzą w dół: `secondary` → `ghost` → link tekstowy.

### R3 — Kolor nigdy nie jest jedynym nośnikiem stanu

Każdy status = **kolor + ikona + słowo** (lub kolor + kropka + słowo).
Około 1 na 12 mężczyzn ma zaburzenie widzenia barw. Operatorzy nie są wyjątkiem.

```tsx
// ❌ BŁĄD — czytelnik ekranowy: "czerwone"
<span className="bg-danger-solid w-2 h-2 rounded-full" />

// ✅ DOBRZE
<Badge variant="danger"><span className="badge-dot" />Failing</Badge>
```

### R4 — Kontrast: 4.5:1 na tekst, 3:1 na obramowanie kontrolki

Zmierzone wartości tego systemu (nie zgaduj — są w `adapters/shadcn-dark.css`):

| Zastosowanie | Token | Kontrast |
|---|---|---|
| Treść, nagłówki | `--content-primary` | 16.6:1 |
| Treść wtórna, komórki tabel | `--content-secondary` | 11.1:1 |
| Opisy, pomocniczy | `--content-tertiary` | 6.9:1 |
| Tylko 24px+ lub dekoracyjnie | `--content-quaternary` | 4.1:1 ⚠️ |
| Link | `--content-link` | 8.35:1 |
| Biały na brand | `--brand` tło | 4.63:1 |
| **Biały na czerwonym wypełnieniu** | **`--danger-solid`** | **5.22:1** |
| Obramowanie spoczynkowe kontrolki | `--input` / `--border-control` | 4.3:1 |

> 🛑 **Dwie pułapki w tym systemie:**
> 1. `--danger` (`#de4040`) z białym tekstem = **4.27:1 — NIE przechodzi AA.**
>    Do wypełnień z jasnym tekstem użyj `--danger-solid` (`#c93434`).
> 2. `--border-default` (`#27333f`) vs canvas = **1.5:1 — nie spełnia 3:1.**
>    Na obramowanie spoczynkowe kontrolek użyj `--border-control` (`#6b7b8d`).

### R5 — Widoczny fokus klawiaturowy, nigdy nie usuwaj

```tsx
// ❌ outline-none bez zamiennika
<button className="outline-none" />

// ✅
<button className="focus-visible:outline focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-brand" />
```

Każdy workflow musi być wykonalny bez myszy. Używaj natywnych `<button>`,
`<a>`, `<input>` — nie `<div onClick>`.

### R6 — Animacja trwa max 300 ms i obeyuje `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    transition-duration: .001ms !important;
  }
}
```

Dozwolone: kolor, opacity, box-shadow. **Niedozwolone** w ciągłej animacji:
`transform` (ryzyko dyskomfortu przedsionkowego).

### R7 — Layout przeżywa 200% zoom i 320px szerokości

Zero stałych wysokości dla kontenerów z tekstem. Zero tekstu w obrazkach.
Zero poziomego scrolla na 320px.

---

## 4. Jak zbudować ekran — procedura

Nie zaczynaj od komponentów. Zaczynaj od decyzji:

1. **Jakie jest zadanie operatora?** Jeśli nie umiesz tego napisać jednym
   zdaniem, ekran jest za szeroki. Podziel go.
2. **Jaki jest stan alarmowy?** Jeśli na ekranie jest więcej niż **3 kolory
   statusu**, wróć do pkt 1.
3. **Jaka jest jedna akcja główna?** Ustal ją przed napisaniem kodu (R2).
4. **Które pola są wymagane?** Oznacz jawnie. Większość jest wymagana — nie
   oznaczaj opcjonalnych, żeby „wyrównać".
5. **Dopiero teraz** mapuj na komponenty poniżej.

---

## 5. Recipe komponentów

Kopiuj bezpośrednio. Zmieniaj `variant` i treść, nie strukturę ani klasy bazowe.

### 5.1 Button

```tsx
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

const button = cva(
  // bazowe — nie ruszaj przy dodawaniu wariantów
  'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none ' +
  'font-semibold rounded-sm transition-colors duration-fast ease-standard ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-brand disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // R2: max jeden 'primary' na ekranie
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
        // Używaj 'solid', NIE 'danger' — patrz R4
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
  label: string                 // obowiązkowy tekst (R5)
  iconOnly?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant, size, loading, label, iconOnly, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      aria-label={iconOnly ? label : undefined}   // R5: ikona-sama wymaga labelu
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

**Użycie:**

```tsx
<Button label="Create job" iconOnly={false}>            // primary — jedyny na ekranie
<Button variant="secondary" label="Save draft" />
<Button variant="ghost" label="Preview" />
<Button variant="danger" label="Delete 3 pipelines" />  // nazwij co kasujesz
<Button label="Refresh" iconOnly aria-label="Refresh" />
<Button label="Run now" loading />
```

**Reguły treści:**
- Czasownik pierwszy, 1–3 słowa: „Create job", „Run now", „Save draft".
- **Nigdy** „OK", „Submit", „Yes", „Click here".
- Nie obwiniaj użytkownika: „You entered an invalid value" → „That value must be between 1 and 9999".
- Przycisk destrukcyjny **zawsze** w modal z potwierdzeniem.

### 5.2 Text field

```tsx
<div className="flex flex-col gap-1.5 w-full">
  <label htmlFor="id" className="text-caption font-semibold text-content-secondary">
    Schedule name <span aria-hidden className="text-danger-text">*</span>
  </label>

  <input
    id="id"
    required                                  // R4: jawnie oznacz wymagane
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

**Reguły walidacji — kolejność ma znaczenie:**
1. Waliduj **on blur**, nie na każde uderzenie klawisza.
2. Po pierwszym błędzie waliduj ponownie **na żywo** (operator już wie, że pole jest sprawdzane).
3. Komunikat = **co się stało + co zrobić**: „Must be lowercase. Use hyphens instead of spaces."
4. Nigdy placeholder jako label — znika dokładnie wtedy, gdy operator go potrzebuje.
5. Błąd musi być zlinkowany przez `aria-describedby`, nie tylko położony obok.

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

// R3: kropka jest wymagana, nie opcjonalna
export const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1.5 h-5.5 px-2
                   rounded-xs text-sm-caption font-semibold border
                   ${tone[tone]}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
    {children}
  </span>
)
```

- Słowo zawsze obecne — „Degraded", nie „Performance degraded".
- `solid` (pełne wypełnienie) **maksymalnie jeden na ekranie**. Dwa = żaden nie alarmuje.
- Nigdy nie animuj badge'a wjazdem. Zmiana statusu = cross-fade 260ms, nic więcej.

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

- **Dokładnie jeden** aktywny element na grupę nawigacji.
- Pasek aktywności (3px) **nie przesuwa się przy hover** — oznacza pozycję, nie interakcję.
- Wyłączony: `aria-disabled="true" tabIndex={-1}` **oraz** klasa `is-disabled`.
  Samo `aria-disabled` nie wystarczy — kod kliknięcia sprawdza klasę.

---

## 6. Anti-patterny — wykrywane w code review

| Anti-pattern | Dlaczego | Zamiast tego |
|---|---|---|
| Dwa `primary` przyciski obok siebie | Operator nie ma kontekstu, by wybrać | Jeden domyślny, reszta `secondary` |
| `bg-[#1a222c]` w JSX | Tokeny nie da się zaktualizować hurtem | `bg-surface-2` |
| `outline-none` bez `:focus-visible` | Keyboard users are blind | `focus-visible:outline-*` |
| `<div onClick>` | Nie fokusowalne, brak semantyki | `<button>` / `<a>` |
| Placeholder jako label | Znika przy wpisywaniu | Widoczny `<label>` |
| Kolor jako jedyny status | Czułość na barwy + daltonizm | Kolor + ikona + słowo |
| `text-[13px]` | Arbitralna wartość poza skalą | `text-body-sm` |
| Wyłączony przycisk bez wyjaśnienia | Ślepa uliczka dla operatora | Pokaż błędy walidacji / tooltip |
| Destructive w menu overflow | Ukrywa ryzyko | Nazwane, widoczne, z potwierdzeniem |
| Mieszanie rodzin radius | Wygląda „na niedokończone" | Jedna rodzina na powierzchni |
| Animacja `transform` w pętli | Dyskomfort przedsionkowy | Kolor/opacity, pod `reduced-motion` |
| `z-index: 9999` | Nie istnieje w warstwie DS | Skala z DS-03 (0–70) |

---

## 7. Definition of Done

Komponent/screen jest gotowy, gdy **wszystkie** są prawdziwe:

- [ ] Zero hardcodowanych wartości — tylko tokeny
- [ ] Przeszedł `:focus-visible` klawiaturą, od góry do dołu
- [ ] Czytelnik ekranowy (NVDA / VoiceOver) czyta to zrozumiale
- [ ] Kontrast policzony, nie zgadnięty (R4)
- [ ] `prefers-reduced-motion` — transform usunięty, kolor zostaje
- [ ] Widoczny przy 200% zoom i przy 320px szerokości
- [ ] Stany: default, hover, focus, active, disabled — wszystkie zaimplementowane
- [ ] Błędy i walidacja obsłużone i zlinkowane przez `aria-describedby`
- [ ] `npm run lint && npm run typecheck && npm run build` — zero błędów
- [ ] Test wizualny / E2E dla stanów interaktywnych

---

## 8. Tryby agentów (personas)

Wchodzisz w tryb jednorazowo, jednym zdaniem: *„Działaj jako X"*.
Tryb zmienia **perspektywę i priorytety**, ale nie znosi sekcji 3 (twardych reguł).

### [Mode: Design System Maintainer]
**Focus:** spójność tokenów, nowe komponenty, rozszerzanie systemu.
**Zasada:** zanim dodasz komponent — sprawdź, czy istniejący nie wystarczy
przez zmianę `variant`. Nowy komponent to wyjątek, nie domyślność.
**Checklista:**
- Czy istnieje już komponent, który to robi? (wariant zamiast nowego)
- Anatomia: stałe nazwy części, kolejność niezmienna
- Każdy nowy token: prymityw → rola semantyczna → zastosowanie
- Zmiana kontraktu = major release + notatka migracyjna
- Po zmianie: `node tools/build-tokens.mjs` (board jest źródłem prawdy)

### [Mode: UI Implementer]
**Focus:** kod komponentu, warianty, stany, integracja z tokenami.
**Zasada:** implementuj z sekcji 5 — nie improwizuj struktury.
**Checklista:**
- `cva` dla wariantów, nigdy `if/else` w JSX
- `forwardRef` + `displayName` (wymagane przez radix/shadcn)
- `aria-busy` przy `loading`, `aria-label` gdy `iconOnly`
- Klasy bazowe w `cva` — warianty tylko dopisują
- Zero `style={{}}` z wartościami z tokenów (używaj klas)

### [Mode: Accessibility Auditor]
**Focus:** WCAG 2.2 AA, kontrast, keyboard, czytniki ekranowe.
**Zasada:** kontrast **liczymy**, nie zakładamy. Udokumentuj wynik.
**Checklista:**
- Każda para tekst/tło policzona (skrypt lub tabela w `adapters/shadcn-dark.css`)
- Kolejność tabulacji = kolejność wizualna
- `Escape` zamyka warstwy; fokus wraca do elementu wywołującego
- Nagłówki `h1→h4` bez przeskoków, dokładnie jeden `h1`
- Statusy ogłaszane przez `aria-live="polite"`, nie przez sam kolor
- Obraz bez `alt` → wyjątek dekoracyjny z `aria-hidden`

### [Mode: Data Density Reviewer]
**Focus:** tabele, dashboardy, metryki — tam, gdzie gęstość jest celem.
**Zasada:** gęstość to funkcja, ale nie kosztem skanowania.
**Checklista:**
- `font-variant-numeric: tabular-nums` w każdej kolumnie liczb
- Status w tym samym wierszu co zasób, nie w osobnej kolumnie daleko
- Maks. 3 kolory statusu w jednym viewportcie
- Row actions: hover **oraz** context menu (nie tylko hover)
- Wirtualizacja powyżej ~200 wierszy

---

## 9. Zmiana systemu

Board (`index.html`) jest **źródłem prawdy**. Tokeny w `tokens/` są z niego
generowane — nigdy nie edytuj `tokens/*.css` ręcznie.

```bash
node tools/build-tokens.mjs    # index.html -> tokens/
node tools/gen-adapters.mjs    # hex -> triplety HSL dla shadcn + audyt kontrastu
```

Po zmianie boardu:
1. `node tools/build-tokens.mjs`
2. `node tools/gen-adapters.mjs` — sprawdź wydrukowany audyt kontrastu
3. Skopiuj zaktualizowane `tokens/` i `adapters/` do projektów
4. Zweryfikuj, że nic nie przeszło poniżej progu AA

---

## 10. Szybka ściąga

```
Tło strony      bg-canvas        Tekst główny    text-content-primary
Powierzchnia    bg-surface       Tekst wtórny    text-content-secondary
Zagnieżdzenie   bg-surface-2     Opisowy         text-content-tertiary
Kontrolka       bg-surface-3     Link            text-content-link link
Wejście         bg-inset         Kod             text-content-code font-mono
Nadzmie         bg-raised        Wyłączony       text-content-disabled

Akcja           bg-brand         Info            bg-info-surface / text-info-text
Hover           bg-brand-hover   Sukces          bg-success-surface / text-success-text
Active          bg-brand-active  Ostrzeżenie     bg-warning-surface / text-warning-text
Tekst na akcji  text-white       Błąd            bg-danger-surface / text-danger-text
Obramowanie     border-input     Niszczyjące     bg-danger-solid text-white

Padding    p-1(4) p-2(8) p-3(12) p-4(16) p-5(20) p-6(24) p-8(32) p-10(40) p-12(48)
Radius     rounded-xs(3) rounded-sm(5) rounded-md(8) rounded-lg(12) rounded-xl(16)
Cien       shadow-ds-1 … shadow-ds-6, hairline: shadow-ds-hairline
Ruch       duration-fast(110) duration-base(160) duration-slow(260) ease-standard
```
