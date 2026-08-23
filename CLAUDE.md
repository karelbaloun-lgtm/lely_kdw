# KDW-lely — Bestellformular Einbaumaterial

Karel je stavební koordinátor (KDW) pro instalace dojicích robotů Lely. Tento
projekt je objednávkový formulář na instalační spotřební materiál, který
montéři (Baloun Karel-LAD, Kmet Jaroslav-LAG, Rötzer Florian-LAK, Sury
Jakub-LAJ, Hofmann Fabian-LDV) používají k objednávání materiálu od Würth.

Komunikace s Karlem probíhá česky, obsah katalogu (názvy položek, skupin,
formulář samotný) je německy — montéři jsou v Německu/Rakousku.

## Soubory v této složce

- **KDW-lely.html** — hlavní webový formulář. Jeden samostatný HTML soubor
  (žádné externí závislosti), fotky položek jsou zabalené uvnitř jako
  base64. Otevírá se přímo v prohlížeči (na mobilu i PC).
- **index.html** — identická kopie KDW-lely.html, jen přejmenovaná pro
  nasazení na Netlify (Netlify automaticky servíruje `index.html` jako
  hlavní stránku). Je potřeba ji po každé úpravě znovu zkopírovat/vytvořit
  z KDW-lely.html.
- **KDW-lely.xlsx** — Excel verze katalogu, slouží jako JEDINÝ ZDROJ PRAVDY
  pro data položek (viz níže "Single source of truth"). Listy:
  `Grundmaterial`, `Würth Schrauben & Kleinteile`, `Legende Techniker`.
- **generate_html.py** — skript, který přegeneruje ITEMS/PEOPLE pole v
  KDW-lely.html přímo z KDW-lely.xlsx. Fotky (IMAGES pole) se nedotýká —
  spároje je podle čísla artiklu s tím, co už v HTML bylo. Použití:
  `python3 generate_html.py KDW-lely.xlsx KDW-lely.html`
- **Vyřazeno.xlsx** — log vyřazených položek (2 listy: Grundmaterial, Würth),
  sloupce: Artikelnummer | Artikelbezeichnung | Einheit | zusätzliche
  Infos | Datum vyřazení.
- **navíc.xlsx** — seznam položek nalezených v Karlově `Projekt.xlsx`, které
  (zatím) nejsou v našem katalogu — čeká na jeho rozhodnutí, co přidat.
- **KDW_alt.xlsx** — archiv starších listů, které se dnes nepoužívají.

## Single source of truth — jak dělat změny v katalogu

**Excel (KDW-lely.xlsx) je řídicí dokument.** Postup při každé změně
katalogu (přidání/odebrání/přejmenování/přesun položky):

1. Uprav `KDW-lely.xlsx` (přidej/uprav/smaž řádek, případně skupinovou
   hlavičku — hlavička skupiny = řádek, kde je sloupec A [Artikelnummer]
   prázdný a sloupec B [Artikelbezeichnung] obsahuje název skupiny).
2. Spusť `python3 generate_html.py KDW-lely.xlsx KDW-lely.html` — tím se
   ITEMS pole v HTML přegeneruje z Excelu a fotky se automaticky přenesou
   podle čísla artiklu.
3. Pokud položka nemá fotku a Karel ji poslal, přidej ji ručně do HTML
   (viz "Fotky" níže) — Excel nemá sloupec na fotky.
4. Zkopíruj výsledný KDW-lely.html do index.html.
5. Uprav datum "Letzte Aktualisierung" v hlavičce HTML na dnešní datum —
   **po KAŽDÉ změně** (to je trvalé pravidlo od Karla).

Výjimka: pokud jde JEN o přidání/výměnu fotky u existující položky (beze
změny čísla/názvu), stačí upravit HTML — do Excelu se fotky neukládají.

## Vyřazování položek

Když se položka/skupina vyřazuje z katalogu, NIKDY jen nesmazat. Vždy:
1. Smazat z Excelu i HTML.
2. Zapsat do `Vyřazeno.xlsx`, do listu odpovídajícího zdrojovému listu
   (Grundmaterial/Würth), s dnešním datem.

Výjimka: pokud Karel výslovně řekne "smaž, nevyřazuj" (bez logování),
položku jen smazat bez zápisu do Vyřazeno.xlsx.

## Nové položky bez zadané skupiny

Pokud Karel zadá novou položku a neřekne, do jaké skupiny patří, přidej ji
do skupiny **"I-Flow"** v Grundmaterial (dokud neřekne jinak).

## Fotky

- Zdrojové fotky bývají v této složce (Karel je tam nahraje) — po přidání
  do HTML je smazat ze složky.
- Zpracování: PIL → convert RGB → resize (delší strana ≤480px, LANCZOS) →
  uložit jako JPEG quality 72 → base64 → `data:image/jpeg;base64,...`.
- Nové fotky se VŽDY přidávají na KONEC pole `const IMAGES = [...]` v HTML,
  nikdy na začátek — vložení na začátek posune indexy všech existujících
  fotek a rozbije je.
- Zdrojové soubory bývají různě podivné (AVIF uložené jako .jpg, WebP bez
  přípony) — `PIL.Image.open()` si s tím poradí i přes špatnou příponu.
- Fotky produktů lze stahovat i přímo z Würth eshopu (Claude in Chrome):
  otevřít stránku produktu, najít `img.js-socialshare-media` (src vede na
  `media.witglobal.net`), screenshot, oříznout černé pozadí přes PIL
  (grayscale threshold + `getbbox()`).

## Bezpečnostní pravidlo — GitHub / API klíče

Karel chtěl propojit projekt s GitHubem (jako u projektů KIN/Schichten) a
jednou omylem poslal do chatu GitHub personal access token. **Nikdy
nepoužívat/neukládat API klíče, tokeny ani hesla poslané v konverzaci** —
to je pevné bezpečnostní pravidlo, ne technické omezení. Pokud chce Karel
push na GitHub, musí to udělat sám (nebo přes lokální Claude Code se svým
vlastním `gh auth login`), ne přes tuto/žádnou chatovou session.

## Nasazení (Netlify)

Plán: Karel nahrává `index.html` ručně přes Netlify Drop (app.netlify.com/
drop nebo účet zdarma) — žádný build proces, žádný GitHub potřeba. Po
každé aktualizaci katalogu mu připravit čerstvý index.html.

## E-mailová objednávka (v HTML)

Formulář generuje mailto: odkaz (čistý text, nelze formátovat tučně).
Aktuální formát těla e-mailu:
```
BESTELLUNG EINBAUMATERIAL
Einbauer: ...
Lagerort: ...
Kostenstelle: ...
Datum: ...

LIEFERADRESSE:
Heimadresse (LAGERORT)   [nebo: Lely Center Wernberg / adresa]

Artikel:

GRUNDMATERIAL:
- ...
------------------------------------------
WÜRTH SCHRAUBEN & KLEINTEILE:
- ...
```
Volba doručení (Heimadresse / Lely Center Wernberg) se zobrazí jako modální
okno po kliknutí na "Bestellung per E-Mail senden".

Formulář si přes localStorage pamatuje posledně vybraného montéra
(klíč `kdw_last_einbauer`) — funguje spolehlivě na hostované doméně,
u lokálně otevřeného souboru (file://) může být nespolehlivé na mobilu.
