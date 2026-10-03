# Wielojęzyczność

Board jest dwujęzyczny: `index.html` (angielski, źródło) i `index.pl.html` (polski, generowany).
Przełącznik `EN | PL` w lewym railu to zwykłe linki — nie ma JS, nie ma błysku, każdy plik
działa samodzielnie z `file://`.

Dokumentacja markdownowa używa tego samego wzorca, ale **ręcznie**, bo nie jest generowana
z `index.html`:

| Plik | Rola |
|---|---|
| `README.md` | kanoniczny, angielski |
| `README.pl.md` | tłumaczenie na polski |
| `AGENTS.md` | kanoniczny, angielski — to ten czytają agenci |
| `AGENTS.pl.md` | tłumaczenie na polski, **niekanoniczne** |

Przy rozjeździe zawsze wygrywa plik kanoniczny. Tłumaczenia poprawiaj śmiało; zmiany
w regułach wprowadzaj wyłącznie w `AGENTS.md`.

## Jak to działa (board)

```
index.html                  angielski, edytowany ręcznie — ŹRÓDŁO PRAWDY
translations/en.json        manifest: lista wszystkich jednostek do przetłumaczenia
translations/pl.json        tłumaczenia (klucz = angielski tekst)
tools/build-i18n.mjs        generator
        │
        └──> index.pl.html  generowany, nigdy nie edytowany ręcznie
```

Wpis w `pl.json` ma kluczem **angielski tekst**. Nie używaj kluczy-numerów
(`"a1b2"`) — tłumacz musi widzieć kontekst.

```json
"Never hard-code spacing." : "Nigdy nie hardkoduj odstępów.",
"Create job"               : "Utwórz zadanie"
```

## Jednostka tłumaczenia to element, nie węzeł tekstu

Board miesza prozę z inline'ami:

```html
<p>Product code references <code>--surface-raised</code>, never
   <code>--gray-850</code>. Primitives may change…</p>
```

Rozbij tego na kawałki po węzłach tekstu nigdy nie wolno — polski zmienia szyk
i odmienia, więc fragmenty przetłumaczone niezależnie dają bzdury. Jednostką jest
**cały element**, a każdy element inline dostaje znacznik `{n}`:

```json
"Product code references {0}, never {1}. Primitives may change…"
  : "Kod produktu odwołuje się do {0}, nigdy do {1}. Prymitywy mogą się zmienić…"
```

Tłumacz widzi pełne gramatyczne zdanie **i** widzi, gdzie wstawić `<code>`.
Wolność szyku jest w tym podejściu wbudowana.

Wyjątek: element inline, który niesie własną prozę i po którym zdanie się nie
ciągnie (np. `<small>` z podpisem w komórce), **rozdziela** jednostkę, żeby jego
tekst też był przetłumaczalny:

```html
<dd>Web · Chromium…<small>Desktop-first, 1280px min</small></dd>
```
→ dwie jednostki: `"Web · Chromium…"` i `"Desktop-first, 1280px min"`

## Nigdy nie tłumacz

| Zostaje po angielsku | Dlaczego |
|---|---|
| `--bg-surface`, `--danger-solid` | nazwy tokenów, które piszesz w kodzie |
| `bg-surface-2`, `text-content-primary` | klasy Tailwinda |
| `aria-label`, `role`, `type` | kontrakt HTML/ARIA |

Tłumaczysz **wartości** tych atrybutów (`aria-label="Odśwież"`), nigdy ich nazwy.

W `pl.json` wartość identyczna z kluczem oznacza *celowo nietłumaczone* —
np. `"z-50": "z-50"`, `"AA · 1.4.11": "AA · 1.4.11"`. `--check` traktuje to jako
przetłumaczone.

## Dodanie trzeciego języka

Trzy kroki. Nic więcej nie trzeba zmieniać.

```bash
node tools/build-i18n.mjs --extract     # 1. potwierdź, że manifest jest aktualny
cp translations/pl.json translations/de.json
# 2. przetłumacz w de.json, zostawiając klucze angielskie
node tools/build-i18n.mjs --check       # 3. weryfikacja pokrycia
node tools/build-i18n.mjs --build       #    -> index.de.html
```

Na końcu dopisz `<a>` do przełącznika w `index.html`:

```html
<a href="index.de.html" data-lang="de">DE</a>
```

`href` i `aria-current` przestawia generator per język.

## Zasady językowe — obowiązkowe przed tłumaczeniem

| Plik | Rola |
|---|---|
| `agent_translation_instructions.md` | zasady tłumaczenia, priorytety, lista zakazanych kalk |
| `enterprise_automation_glossary_pl.md` | słownik terminologii PL — źródło prawdy dla słów |

Glosariusz jest **plikiem źródłowym**. Nie dubluj go do `glossary.json` —
dwa pliki rozjadłyby się w ciągu tygodnia. Linter parsuje markdown.

## Polecenia

| Polecenie | Działanie |
|---|---|
| `--extract` | regeneruje `en.json` z `index.html` (zachowuje istniejące ręczne edycje) |
| `--check` | brakujące / puste / osierocone klucze + zgodność placeholderów |
| `--build` | generuje `index.<lang>.html` dla każdego pliku poza `en.json` |
| `--debug` | diagnostyka: ile jednostek, z jakich elementów, ile z `{n}` |

| `--fragments` | lista kluczy żyjących wewnątrz placeholderów |
| `--audit-ph` | co reprezentują znaczniki `{n}` i czy któryś z nich chowa tekst |

Osobno, poza generatorem:

```bash
node tools/lint-glossary.mjs    # pl.json wobec glosariusza
```

## `lint-glossary.mjs`

| Wynik | Znaczenie |
|---|---|
| **BŁĄD · ZAKAZ** | w tłumaczeniu pojawiła się forma wyraźnie zabroniona |
| **OSTRZ · TYPO** | liczba z jednostką bez spacji w zdaniu |
| **OSTRZ · BRAK** | techniczny termin powtarza się w kluczach, ale nie ma go w glosariuszu |

Linter **nie blokuje** na ostrzeżeniach — `exit 1` dają tylko zakazy.
Zmiany w `pl.json` wykonuje człowiek, więc linter ma zgłaszać, nie poprawiać.

Czego linter świadomie **nie** sprawdza: spójności terminologii między kluczami.
Każdy angielski ciąg to osobny wpis słownika, więc ten sam termin w dwóch
zdaniach ma prawo brzmieć inaczej („radius” → „promień zaokrąglenia” w nagłówku,
„promień 5 px” w zdaniu). Wczesniejsza wersja lintera próbowała to egzekwować i dała
48 fałszywych alarmów na w pełni zgodnym słowniku.

## Kopie zapasowe słownika

Plik z rezerwą musi mieć rozszerzenie inne niż `.json` (np. `pl_old.json.bak`).
Build skanuje `translations/*.json` i traktuje każdy plik jako osobny język —
`pl_old.json` został wygenerowany jako `index.pl_old.html`.
## Zabezpieczenia

Trzy mechanizmy blokują błędy, których build sam nie zauważy:

1. **Tokenizer jest bezstratny.** Asercja round-trip sprawdza, że
   `tokens.join('') === html`. Gdyby tokenizer gubił token, build odmawia pracy —
   inaczej cicho uszkodziłby plik.
2. **Walidacja placeholderów.** `--check` porównuje liczbę znaczników w kluczu
   i tłumaczeniu; `--build` dodatkowo sprawdza, czy po podstawieniu nie zostały
   `{0}` w widoku. Usunięty, dodany lub pomylony placeholder **zatrzymuje build**.
3. **`--check` zgłasza osierocone klucze.** Zdarzy się, gdy zmienisz angielski
   tekst w `index.html` — stary klucz trzeba przenieść.

## Zmiana tekstu angielskiego po tłumaczeniu

1. Zmień `index.html`.
2. `node tools/build-i18n.mjs --extract` — stare klucze znikną z `en.json`.
3. `node tools/build-i18n.mjs --check` — wskaże, co nie ma tłumaczenia.
4. Przetłumacz brakujące i usuń osierocone wpisy z `pl.json`.

**Nie edytuj `index.pl.html` ręcznie** — następny build to nadpisze.

## Uwagi techniczne

- `lang="pl"` zmienia się automatycznie. To nie kosmetyka: czytniki ekranowe
  używają atrybutu `lang` do wyboru głosu i wymowy.
- Encje HTML są dekodowane przy ekstrakcji (tłumacz widzi `&`, nie `&amp;`)
  i kodowane ponownie przy zapisie.
- `text-transform: uppercase` poprawnie obsługuje polskie znaki diakrytyczne
  (ą→Ą, ć→Ć, ł→Ł), więc nagłówki nadtytułowe nie wymagają zmian.