# Enterprise Automation Interface System

**Tłumaczenie polskie.** Wersja kanoniczna, po której pracuje się i którą czytają
agenci, to [`README.md`](README.md).

Ciemny, wysoko-gęsty design system do interfejsów infrastruktury, monitoringu
i automatyzacji. Zawiera dokumentacyjny board, warstwę tokenów, adaptery pod
najpopularniejsze stacki oraz instrukcje dla agentów.

| Plik | Do czego |
|---|---|
| `index.html` | Board dokumentacyjny — wersja angielska, źródło prawdy |
| `index.pl.html` | Board dokumentacyjny — wersja polska, generowana |
| `tokens/` | Oba motywy: `semantics-dark.css` + `semantics-light.css` |
| `AGENTS.md` | Zasady dla agentów budujących interfejsy |
| `DEPLOYING.md` | Jak przenieć system do projektu klienta |
| `tokens/` | Warstwa tokenów (generowana z `index.html`) |
| `adapters/` | Adaptery: HSL dla shadcn/ui, preset Tailwind |
| `translations/` | Pliki tłumaczeń + instrukcja i18n |
| `tools/` | Generatory i walidatory |

Przełącznik `EN | PL` w lewym railu przełącza wersje.

---

## 0. Board w dwóch językach

```
index.html             angielski — edytowany ręcznie, ŹRÓDŁO PRAWDY
index.pl.html          polski   — generowany, nie edytuj ręcznie
translations/en.json   manifest jednostek
translations/pl.json   tłumaczenia
```

```bash
node tools/build-i18n.mjs --check    # pokrycie + zgodność placeholderów
node tools/build-i18n.mjs --build    # -> index.pl.html
```

Jednostką tłumaczenia jest **cały element**, nie fragment zdania — polski zmienia
szyk, więc łamane kawałki dają bzdury. Elementy inline (np. `<code>`) dostają
znaczniki `{0}`, `{1}`, które tłumacz przestawia dowolnie.

**Nigdy nie tłumaczy się:** nazwy tokenów (`--bg-surface`), klasy Tailwinda
(`bg-surface-2`), nazwy atrybutów (`aria-label`). Kod zostaje po angielsku.

**Zawsze tłumaczy się:** teksty w interfejsie, komunikaty, `<title>`, meta
description oraz wartości `aria-label` i `placeholder` (nazwy atrybutów — nie).

Pełna instrukcja, w tym dodanie trzeciego języka:
[`translations/README.md`](translations/README.md).

---

## 1. Zanim zaczniesz — czy ten system pasuje?

Ten system jest zoptymalizowany pod **gęsty interfejs operacyjny**, gdzie użytkownik
monitoruje, diagnozuje i reaguje. Ciemne tło wynika z pracy w słabo oświetlonych
pomieszczeniach i obok terminala. Wysoka gęstość wynika z potrzeby widzenia
pełnego stanu systemu na jednym ekranie.

| Przypadek | Pasuje? |
|---|---|
| Dashboard, panel admina, narzędzie monitoringowe | **Tak — to główny cel** |
| Aplikacja z dużą ilością danych, tabel, statusów | **Tak** |
| Kokpit operatora, NOC, centrum alarmowe | **Tak** |
| Aplikacja SaaS z formularzami i listami | **Tak, z umiarem** |
| Landing page, strona marketingowa, blog | **Nie** — za dużo gęstości, za mało białego tła |
| Czytelnik dokumentacji, tutorial | **Nie** — zbyt niski kontrast dla długiego tekstu |
| Sklep, checkout, onboarding klienta | **Nie** — ton i gęstość nie pasują |

Jeśli projekt nie pasuje do pierwszych czterech wierszy, **nie używaj tego systemu
na siłę**. Ciemne tokeny na stronie marketingowej wyglądają jak błąd, nie jak
decyzja projektowa. Każdy system ma swój zakres — ta granica jest częścią systemu.

---

## 2. Kolejność kroków

Wykonuj po kolei. Każdy krok ma punkt kontrolny — sprawdź go przed przejściem dalej.

```
0  Kontekst i kontrola wersji        git init, .gitignore, pierwszy commit
1  Inicjalizacja projektu            framework, lint, typecheck, dev server
2  Instalacja design systemu         tokeny + adapter + smoke test
3  Podpięcie instrukcji dla agentów  AGENTS.md w repo projektu
4  Pierwszy ekran                    jeden komponent, wszystkie stany
5  Pętla weryfikacji                 lint + typecheck + build + test
```

### Krok 0 — Kontekst i kontrola wersji

**Rób to zawsze przed pierwszą linią kodu.** Bez gita nie ma sensownego review,
co oznacza, że błędy wychodzą na produkcję zamiast być wychwycone w PR.

```bash
mkdir my-project && cd my-project
git init
```

Uzupełnij `.gitignore` **przed** pierwszym commitem. Użycie szablonu zależnego od
frameworku (poniżej) obejmuje `node_modules`, `.next`, `dist`, `.env` i pliki
zbudowane. Sprawdź, czy sekretów nie ma w tym, cocommitujesz.

> `.env` nigdy nie trafia do repo. Pliki `.env.example` — tak, bo dokumentują
> wymagane zmienne bez ujawniania wartości.

**Punkt kontrolny:** `git status` pokazuje tylko to, co chcesz. `.env` nie jest na liście.

### Krok 1 — Inicjalizacja projektu

**Jeśli projekt już istnieje, pomiń ten krok** i przejdź do kroku 2.

#### Wybór frameworka

Najpierw ustal, czy w firmie lub zespole **jest już uzgodniony standard**. Jeśli tak,
użyj go — spójność zespołu jest wartościowsza niż dowolny wybór z tej tabeli.

| Potrzeba | Wybór | Inicjalizacja |
|---|---|---|
| Aplikacja z renderowaniem po stronie klienta, panel, dashboard | React + Vite | `npm create vite@latest . -- --template react-ts` |
| Rendering po stronie serwera, SEO, trasy API | React + Next.js | `npx create-next-app@latest . --typescript --tailwind --eslint --app` |
| Aplikacja Vue | Vue + Vite | `npm create vue@latest` |
| Universal rendering w Vue | Nuxt | `npx nuxi@latest init .` |
| Aplikacja Svelte | SvelteKit | `npx sv create .` |
| Treść statyczna, blog, dokumentacja | Astro | `npm create astro@latest` |
| Bez build stepu, jeden plik, prototyp | Czysty HTML + CSS | edytuj `index.html` |

Ten design system **nie zależy od frameworka** — `tokens/` to zwykły CSS.
Wybór frameworka nie wpływa na to, czy system pasuje.

Po inicjalizacji **sprawdź, czy szkielet działa, zanim dodasz cokolwiek z tego
systemu**:

```bash
npm run dev      # serwer startuje, strona się ładuje
npm run build    # build przechodzi bez błędów
```

Jeśli cokolwiek nie działa teraz, nie zdiagnozujesz tego po dodaniu tokenów.
Napraw szkielet najpierw.

**Punkt kontrolny:** pusta strona renderuje się poprawnie, `build` przechodzi.

### Krok 2 — Instalacja design systemu

Skopiuj `tokens/` i `adapters/` do repo projektu. Wybierz **jedną** ścieżkę —
adaptery nie łączą się ze sobą.

#### A · Czysty CSS — dowolny stack

```css
/* app/globals.css lub src/styles.css */
@import './tokens/index.css';
```

Dostajesz 73 prymitywy, 64 semantyki i 8 tokenów motion. Działa wszędzie, gdzie
czyta się CSS.

#### B · Tailwind

```ts
// tailwind.config.ts
import ds from './adapters/tailwind-preset'

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: { ...ds } },   // merge — nie nadpisuj istniejącej konfiguracji
}
```

W klasach `root` dodaj `class="dark"`. Kolory są zwykłymi wartościami CSS, więc
przełącznik motywu działa bez konfiguracji Tailwinda.

#### C · Tailwind + shadcn/ui

Jak B, plus w `globals.css` **zastąp** blok `.dark { … }` zawartością
`adapters/shadcn-dark.css`, a w `tailwind.config.ts` dodaj tokeny statusów:

```ts
colors: {
  success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
  warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
  info:    { DEFAULT: 'hsl(var(--info))',    foreground: 'hsl(var(--info-foreground))' },
}
```

> ⚠️ **shadcn/ui oczekuje tripletów HSL, nie wartości hex.** Jego `tailwind.config.ts`
> zawiera już `'hsl(var(--primary))'`. Wklejenie hex daje `hsl(#1f6feb)` —
> niepoprawny kolor, który przeglądarka odrzuca po cichu i element zostaje bez tła.
> Dlatego istnieje osobny adapter. **Nigdy nie wklejaj hex do zmiennych shadcn.**

#### Smoke test — sprawdź instalację zanim zaczniesz budować

Wstaw tymczasowo na stronę startową. Test używa **wyłącznie zmiennych**, bo to
jedyna rzecz, którą zainstalowałeś w tym kroku:

```html
<div style="background:var(--bg-canvas); color:var(--text-primary);
            font-family:system-ui,sans-serif; padding:40px; min-height:100vh">

  <h1 style="color:var(--text-primary)">Design system</h1>
  <p style="color:var(--text-secondary)">Tekst wtórny — jasnoszary</p>
  <p style="color:var(--text-tertiary)">Tekst pomocniczy — wyraźnie ciemniejszy</p>

  <div style="display:flex; gap:12px; margin-top:24px">
    <div style="background:var(--accent); color:#fff; padding:10px 18px;
                border-radius:var(--r-sm)">Główna akcja</div>
    <div style="background:var(--bg-surface-2); border:1px solid var(--border-control);
                padding:10px 18px; border-radius:var(--r-sm)">Kontrolka</div>
    <div style="background:var(--danger-bg); color:var(--danger-text);
                border:1px solid var(--danger-bd); padding:10px 18px;
                border-radius:var(--r-sm)">Błąd</div>
  </div>
</div>
```

Trzy rzeczy muszą być prawdziwe: tło jest ciemne, trzy poziomy tekstu różnią się
jasnością, elementy akcji mają wypełnienie. Jeśli cokolwiek jest czarne albo bez
tła — zmienna się nie załadowała; sprawdź ścieżkę do `tokens/index.css`.

**Obramowanie kontrolki jest tu celowo jasne** (`--border-control`). Na ciemnym
tle zwykłe obramowanie jest prawie niewidoczne — to jeden z dwóch przypadków
opisanych w sekcji 3.

> Ten test sprawdza **warstwę tokenów**, nie komponenty. Klas takich jak `.btn`
> jeszcze nie ma — komponenty tworzysz dopiero w kroku 4, na podstawie
> przepisów w `AGENTS.md` sekcja 5.

> Gotowy, uruchamialny plik: `examples/smoke-test.html`. Zawiera dokładnie ten
> sam fragment z angielskimi etykietami — różnica jest kosmetyczna, bo test
> sprawdza tokeny, a nie treść. Jeśli zmieniasz jeden, zmień drugi.

**Punkt kontrolny:** smoke test renderuje się poprawnie, konsola bez błędów.

**Zatwierdź instalację osobnym commitem.** Dzięki temu widać, co dokładnie
dodał design system, a co jest zmianą aplikacji.

### Krok 3 — Podpięcie instrukcji dla agentów

Skopiuj `AGENTS.md` do repo projektu. To instrukcja, którą czyta agent kodujący
(Cline, OpenCode, Claude Code, Cursor i podobne).

Dla narzędzi, które czytają własny plik konfiguracji, dodaj wskaźnik:

```
# .clinerules
Główne instrukcje są w @AGENTS.md.
```

Uzupełnij w `AGENTS.md` sekcję dotyczącą tego konkretnego projektu: stack,
skąd biorą się dane, komendy weryfikacyjne. Sekcje 3–10 są uniwersalne i nie
wymagają zmian.

**Punkt kontrolny:** agent wypisuje plan przed edycją plików i pyta, gdy
spotyka komponent nieopisany w instrukcji.

### Krok 4 — Pierwszy ekran

Nie zaczynaj od layoutu. Zajmij się **jednym** komponentem i doprowadź go do
kompletnego stanu — wtedy reszta to powtarzanie wzorca.

Kolejność, która działa:

1. **Wypisz decyzje na kartce, zanim otworzysz edytor:**
   - Co operator ma zrobić na tym ekranie? (jedno zdanie)
   - Jaki jest stan alarmowy? (jeśli więcej niż 3 kolory statusu — ekran jest za szeroki)
   - Jaka jest jedna akcja główna?
   - Jakie pola są wymagane?
2. **Zbuduj `Button` w pięciu wariantach** zgodnie z przepisem w `AGENTS.md` 5.1.
3. **Sprawdź stany, nie tylko domyślny:** hover, focus klawiaturą, active,
   disabled, loading.
4. **Dopiero teraz** złóż z tego ekran.

Gotowy kod `Button`, `Text field`, `Badge` i `Nav item` jest w `AGENTS.md` sekcja 5 —
kopiuj, nie pisz od nowa.

**Punkt kontrolny:** jeden komponent ma wszystkie stany i przechodzi klawiaturą.

### Krok 5 — Pętla weryfikacji

Uruchamiaj przed każdym commitem, nie na końcu epizodu:

```bash
npm run lint
npm run typecheck
npm run build
```

W projekcie testującym dodaj przeglądarkę — `npm run dev` i ręczna klawiatura
obejmują przypadki, których testy jednostkowe nie złapią. Testy wizualne lub
E2E warto dodać dla stanów interaktywnych, nie dla statycznego tekstu.

**Punkt kontrolny:** zero błędów lint, typecheck i build.

---

## 3. Dwa wąskie gardła dostępności

To nie są opinie o stylu — to zmierzone wartości, które łamią WCAG AA, jeśli
użyjesz „naturalnego" tokenu zamiast właściwego. Opisane w `AGENTS.md` (R4).

| Pułapka | Kontrast | Używaj zamiast tego |
|---|---|---|
| `--danger` `#de4040` + biały tekst | **4.27:1 — nie przechodzi AA** | `--danger-solid` `#c93434` → 5.22:1 |
| `--border-default` `#27333f` vs tło | **1.5:1 — nie spełnia 3:1 dla UI** | `--border-control` `#6b7b8d` → 4.3:1 |

Zmierz kontrast ponownie po każdej zmianie palety:

```bash
node tools/gen-adapters.mjs    # wypisuje audyt kontrastu
```

---

## 4. Użycie przez agentów

`AGENTS.md` zawiera:

- **7 twardych reguł** (R1–R7) — złamanie którejkolwiek odrzuca PR
- **Procedurę budowy ekranu** — 5 kroków przed pierwszą linią kodu
- **Przepisy komponentów** — gotowy kod `Button`, `Text field`, `Badge`, `Nav item`
- **12 anti-patternów** wykrywanych w code review
- **Definition of Done** — 10 punktów kontrolnych
- **4 tryby (personas)**: Design System Maintainer, UI Implementer,
  Accessibility Auditor, Data Density Reviewer

Tryb włącza się jednym zdaniem, np. *„Działaj jako Accessibility Auditor"*.
Pełna lista wywołań: `AGENTS.md` sekcja 8.

---

## 5. Zmiana systemu

**`index.html` jest źródłem prawdy.** Pliki w `tokens/` są z niego generowane —
ręczna edycja rozjedzie dokumentację z kodem.

```bash
node tools/build-tokens.mjs              # index.html → tokens/
node tools/gen-adapters.mjs              # hex → HSL + audyt kontrastu
node tools/validate-agent-snippets.mjs   # sprawdza klasy w przykładach AGENTS.md
node tools/build-i18n.mjs --check        # pokrycie tłumaczeń
node tools/build-i18n.mjs --build        # generuje index.<lang>.html
```

Workflow po zmianie boardu:

1. `node tools/build-tokens.mjs`
2. `node tools/gen-adapters.mjs` — sprawdź audyt, nic nie może spaść poniżej AA
3. `node tools/build-i18n.mjs --extract` — klucze w `translations/pl.json` wymagają aktualizacji
4. `node tools/validate-agent-snippets.mjs` — zero nierozwiązanych klas
5. `node tools/build-i18n.mjs --check` — zero brakujących kluczy
6. Skopiuj `tokens/` i `adapters/` do repozytoriów, które z tego korzystają

Ostatni skrypt chroni przed błędem, którego nie wyłapie build: klasa Tailwinda,
której preset nie zawiera, **nie psuje kompilacji** — po prostu nic nie robi.
Bez walidacji taki błąd wychodzi dopiero na produkcji.

---

## 6. Struktura tokenów

| Warstwa | Plik | Rola |
|---|---|---|
| 1 · Prymitywy | `tokens/primitives.css` | Surowe wartości: neutral, brand, status, spacing, radius, font |
| 2 · Semantyka | `tokens/semantics-dark.css` | Znaczenie: tła, tekst, obramowania, status, elevation, motion |

Kod aplikacji używa **wyłącznie warstwy 2**. Warstwa 1 służy do budowy warstwy 2
oraz do wykresów. Referencja do prymitywu w kodzie aplikacji to wyjątek
wymagający uzasadnienia — re-grading palety zepsułby ją po cichu.

---

## 7. Motywy

Dostępne są oba motywy i oba są zweryfikowane pod kątem kontrastu —
29 z 29 par przechodzi, sprawdzane przez `node tools/gen-adapters.mjs`, który kończy
się niezerowym kodem, jeśli zmiana palety psuje którą parę.

```html
<html data-theme="light">   jasny
<html data-theme="dark">    ciemny
                            atrybut usunięty → wraca do ciemnego
```

```
:root                     ciemny  (domyślnie, bez atrybutu)
:root[data-theme='light'] jasny   (nadpisuje dzięki specyficzności)
```

Komponenty nigdy nie nazywają motywu, a preset Tailwinda nie wymaga zmian —
odwołuje się do `var(--bg-surface)`, a obie warstwy przez to przechodzą.
Tylko shadcn wymaga podmiany bloku adaptera (`adapters/shadcn-light.css`).

**Jasny motyw to nie odwrócony ciemny.** Trzy rzeczy się różnią celowo:
`--accent-text` jest ciemniejszy niż `--accent` (markowy niebieski spada poniżej
4,5:1 jako tekst na bieli), cienie są płytkie (cień z motywu ciemnego
zamienia się w szarą plamę na bieli), a obramowania kontrolek ciemniejsze
(3:1 na jasnym tle wymaga głębszego szarego niż na ciemnym).

---

## 8. Licencja

MIT. Zob. [`LICENSE`](LICENSE).

Możesz używać, kopiować, modyfikować, scalać, publikować, dystrybuować,
udostępniać i sprzedawać kopie — także komercyjnie. Jedynym obowiązkiem jest
zachowanie noty copyright.

---

## 9. Wersja

3.2.0 · przegląd kwartalny · `index.html` nie ma zależności poza opcjonalnym
Google Fonts, z pełnym fallbackiem na stack systemowy. Weryfikowany w Chromium
przy szerokościach 320 / 800 / 1400 / 1600 px.
