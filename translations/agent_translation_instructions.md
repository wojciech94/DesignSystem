# Instrukcja lokalizacji EN → PL dla Enterprise Automation

## Cel

Tłumacz treści tak, aby polska wersja brzmiała jak tekst napisany od początku przez polskiego projektanta UX/UI, autora dokumentacji produktu lub dokumentacji technicznej.

Nie wykonuj tłumaczenia słowo w słowo. Najpierw zrozum znaczenie i intencję, następnie napisz je naturalnie po polsku.

## Priorytety

Podczas tłumaczenia stosuj następującą kolejność priorytetów:

1. Zachowanie znaczenia i intencji autora.
2. Naturalność języka polskiego.
3. Spójność z glosariuszem projektu.
4. Poprawna terminologia UX/UI i techniczna.
5. Podobieństwo struktury do angielskiego.

Nie poświęcaj punktów 1–4 tylko po to, aby zachować angielski szyk zdania.

## Tłumacz znaczenie, nie słowa

Jeżeli dosłowne tłumaczenie brzmi nienaturalnie, przebuduj całe zdanie.

Przykład:

ŹLE:
"Progressive disclosure over completeness" → "Stopniowe ujawnianie zamiast kompletności"

LEPIEJ:
"Stopniowe ujawnianie informacji zamiast pokazywania wszystkiego naraz"

ŹLE:
"Expensive detail lives behind an explicit interaction."

LEPIEJ:
"Rozbudowane szczegóły pokazuj dopiero po wykonaniu przez użytkownika jawnej interakcji."

ŹLE:
"Show the decision-critical surface first."

LEPIEJ:
"Najpierw pokaż informacje kluczowe dla podjęcia decyzji."

## Kontekst jest ważniejszy niż pojedyncze słowo

Przed tłumaczeniem określ, czym jest dany tekst:

- nagłówkiem,
- etykietą UI,
- opisem komponentu,
- instrukcją dla projektanta,
- instrukcją dla programisty,
- opisem stanu,
- nazwą techniczną,
- tekstem pomocniczym,
- częścią dłuższego zdania.

To samo słowo może mieć różne tłumaczenia zależnie od kontekstu.

Przykład:
"surface" może oznaczać "powierzchnię", "warstwę" albo "tło". Nie wybieraj automatycznie jednego tłumaczenia we wszystkich miejscach.

## Unikaj kalk językowych

Nie twórz polskich zdań przez mechaniczne podstawianie polskich słów za angielskie.

Szczególnie unikaj konstrukcji takich jak:

- "żyje za..."
- "walczy o uwagę"
- "rządzi oprogramowaniem"
- "korzeń aplikacji"
- "drabina głębokości"
- "kontrakt interakcji"
- "miara akapitu"
- "maksymalne wyróżnienie w display"

Jeżeli powstaje taka konstrukcja, przepisz całe zdanie po polsku.

## Terminologia techniczna

Nie tłumacz na siłę terminów, które są standardem w branży lub nazwami technicznymi.

W zależności od kontekstu pozostaw:

- WCAG
- CSS
- UI
- UX
- API
- JSON
- token
- pipeline
- hover
- focus
- modal
- dashboard
- checkbox
- radio
- select
- breakpoint
- viewport

Nie używaj anglicyzmu tylko dlatego, że występuje w oryginale. Jeśli istnieje naturalny polski odpowiednik, użyj go zgodnie z glosariuszem.

## Placeholdery — zasada bezwzględna

Placeholdery takie jak:

{0}
{1}
{2}

są częścią mechanizmu aplikacji.

MUSISZ:

- zachować każdy placeholder,
- zachować jego numer,
- nie tłumaczyć go,
- nie zastępować przykładową treścią,
- nie usuwać go.

Możesz zmienić jego pozycję w polskim zdaniu, jeśli wymaga tego naturalna składnia.

Po zakończeniu pracy automatycznie sprawdź, czy zestaw placeholderów w tłumaczeniu jest identyczny z oryginałem.

## Struktura JSON

Jeżeli tłumaczysz plik JSON:

- nie zmieniaj kluczy,
- nie tłumacz kluczy,
- nie usuwaj wpisów,
- nie dodawaj wpisów bez wyraźnej potrzeby,
- nie zmieniaj typów wartości,
- zmieniaj wyłącznie wartości przeznaczone do lokalizacji.

Po zakończeniu sprawdź poprawność składni JSON.

## Nazwy własne

Nie tłumacz automatycznie nazw produktów, systemów, technologii, komponentów ani nazw własnych.

"Enterprise Automation Interface System" może być oficjalną nazwą własną. Nie zakładaj automatycznie, że należy ją tłumaczyć.

## Spójność terminologii

Korzystaj z dołączonego glosariusza jako nadrzędnego źródła terminologii.

Jeżeli glosariusz podaje preferowane tłumaczenie, stosuj je konsekwentnie, chyba że kontekst jednoznacznie wymaga innego znaczenia.

Jeżeli brakuje terminu w glosariuszu:

1. wybierz naturalne polskie tłumaczenie,
2. uwzględnij kontekst UX/UI,
3. nie twórz kalki językowej,
4. użyj nowego terminu konsekwentnie w całym pliku.

## Kontrola jakości

Po tłumaczeniu wykonaj drugi przebieg.

Sprawdź:

1. Czy wszystkie klucze są zachowane?
2. Czy liczba wpisów się zgadza?
3. Czy nie pojawiły się nowe klucze?
4. Czy wszystkie placeholdery są zachowane?
5. Czy JSON jest poprawny?
6. Czy tekst brzmi naturalnie po polsku?
7. Czy nie ma kalk językowych?
8. Czy terminologia jest spójna?
9. Czy nazwy techniczne i własne nie zostały niepotrzebnie przetłumaczone?
10. Czy nagłówki brzmią jak polska dokumentacja UX/UI?

Jeżeli znajdziesz kalkę, popraw całe zdanie, a nie tylko pojedyncze słowo.

## Test końcowy

Przeczytaj polską wersję bez patrzenia na angielski.

Zadaj sobie pytanie:

"Czy polski użytkownik uznałby ten tekst za napisany pierwotnie po polsku?"

Jeżeli odpowiedź brzmi "nie", popraw tekst.

Najważniejsza zasada:

ENGLISH DESIGN DOCUMENTATION → NATURAL POLISH DESIGN DOCUMENTATION

a nie:

ENGLISH SENTENCE → POLISH WORD SUBSTITUTION.
