# -*- coding: utf-8 -*-
"""Egyedi bevezető szöveg és gyakori kérdések egyes gyakorlókhoz (slug -> {'text': [bekezdések], 'faq': [(kérdés, válasz)]}).
A többi gyakorlóhoz a build általános kérdéseket generál."""
MODSEO = {
"elemek-vegyjelek": {
 "text": ["A kémia első lépése az elemek és vegyjeleik megtanulása. Ez a gyakorló az első húsz elemmel kezdődik (a hidrogéntől a kalciumig), majd kiterjed a gyakori fémekre és a latin eredetű jelekre (Na, K, Fe, Cu, Ag, Au, Hg, Pb, Sn) is.",
          "Rövid, azonnali visszajelzéssel segít abban, hogy a vegyjelek magától előjöjjenek. Napi 5–10 perc elég, a hibásan megválaszolt elemeket a Hibáim gyakorlása funkció később újra felteszi."],
 "faq": [("Melyik osztályban tanulják az elemek vegyjeleit?", "A magyar iskolákban a kémia általában hetedik osztályban kezdődik, ekkor tanulják meg az első elemek nevét és vegyjelét. A pontos beosztás iskolánként és tankönyvenként eltérhet."),
         ("Miért latin eredetű néhány vegyjel?", "Egyes elemek jelét a latin nevükből képezték, ezért nem egyezik a magyar névvel: a nátrium Na (natrium), a kálium K (kalium), a vas Fe (ferrum), a réz Cu (cuprum), az ezüst Ag (argentum), az arany Au (aurum), a higany Hg (hydrargyrum), az ólom Pb (plumbum), az ón Sn (stannum)."),
         ("Hogyan lehet könnyen megtanulni a vegyjeleket?", "Érdemes kis csoportokban, tíz elemenként haladni, és a nehezebb, latin eredetű jeleket külön ismételni. A gyakorló szintjei ezt a sorrendet követik.")]},
"atom-felepitese": {
 "text": ["Az atom három részecskéből áll: pozitív töltésű protonból és semleges neutronból az atommagban, valamint negatív töltésű elektronból az elektronburokban. A gyakorló a részecskék töltésével és helyével kezdődik, majd a rendszám és a tömegszám segítségével számolásra is visszavezeti az anyagot.",
          "Megtanulhatod, hogyan lehet kiszámolni egy atom protonjainak, elektronjainak és neutronjainak számát, és hogyan változik az elektronszám az ionokban."],
 "faq": [("Hogyan számoljuk ki a neutronok számát?", "A neutronok száma a tömegszám és a rendszám különbsége. Például a szén tömegszáma 12, rendszáma 6, ezért 12 − 6 = 6 neutronja van."),
         ("Mit mutat meg a rendszám?", "A rendszám a protonok száma az atommagban. A semleges atomban ugyanennyi az elektron is."),
         ("Hány elektronja van egy ionnak?", "Pozitív ionnál az atom elektronokat adott le, ezért a rendszámnál kevesebb az elektron (Na⁺: 11 − 1 = 10). Negatív ionnál elektronokat vett fel, ezért több (Cl⁻: 17 + 1 = 18).")]},
"kepletek-egyenletek": {
 "text": ["A kémiai képlet megmutatja, mely elemek hány atomja alkot egy molekulát: a H₂O két hidrogén- és egy oxigénatomot jelent. A gyakorló a képletek olvasásával kezdődik, majd a leggyakoribb vegyületek nevét és képletét, az elemek és vegyületek megkülönböztetését gyakoroltatja.",
          "A későbbi szinteken a reakcióegyenletek rendezése következik: a cél, hogy a nyíl mindkét oldalán ugyanannyi atom legyen minden elemből."],
 "faq": [("Mit jelent az alsó index a képletben?", "Az alsó index azt mutatja meg, hogy az előtte álló elemből hány atom van a molekulában. A CO₂-ben egy szén- és két oxigénatom van."),
         ("Mi a különbség az index és az együttható között?", "Az alsó index a molekulán belüli atomszámot adja meg, az együttható (a képlet előtti szám) pedig azt, hogy hány molekula vesz részt a reakcióban. A 2 H₂O két vízmolekulát jelent, összesen négy hidrogén- és két oxigénatommal."),
         ("Hogyan rendezzünk egy reakcióegyenletet?", "Számold meg minden elem atomjait a nyíl két oldalán, majd az együtthatók változtatásával (a képleteket nem módosítva) egyenlítsd ki őket. A végén ellenőrizd újra minden elemet.")]},
"beturako": {
 "text": ["A Betűrakó kis betűkockákból építi fel a szavakat: a hiányzó betűket kell a helyükre rakni. A feladványok képről, rövid magyarázatból vagy mondatból derülnek ki, a nehezebb szinteken a j–ly, az ékezetek és a hosszú szavak a téma.",
          "A magyar kétjegyű betűk (cs, sz, gy, ly, ny, ty, zs, dz, dzs) egy kockát alkotnak, ezért a helyesírás is jól gyakorolható. Nincs időkorlát, nincs büntetés, és hang sincs: ha elrontod, megmutatjuk a helyes szót."],
 "faq": [("Kinek való a Betűrakó?", "Elsőtől hatodik osztályig szól: az elsősök képes szavakkal és egy-két hiányzó betűvel kezdhetnek, a nagyobbak a j–ly, az ékezetek és a hosszú szavak szintjén gyakorolhatnak."),
         ("Mit gyakorol a gyerek a Betűrakóval?", "A szavak helyes leírását, a szókincset és a magyar hangok betűjeleit, például a j–ly különbséget és a hosszú-rövid magánhangzókat."),
         ("Van büntetés, ha rosszul válaszol?", "Nincs. Hibás válasz után az oldal megmutatja a helyes szót, és a feladat a Hibáim gyakorlása részbe kerül, hogy később újra próbálkozhasson."),
         ("Ki lehet nyomtatni a Betűrakó feladatait?", "Igen, a munkalap-készítővel hiányzó betűs feladatlap nyomtatható megoldókulccsal.")]},
"kepes-feladatok": {
 "text": ["A Képes feladatok az olvasni még nem tudó vagy most tanuló elsősöknek készültek. A kérdések képekből és számokból állnak: tárgyak megszámolása, számok és mennyiségek párosítása, több és kevesebb, formák felismerése, minták folytatása, összetartozó képek és kakukktojás keresése.",
          "A rövid utasítást a szülő felolvashatja, a feladatok többsége szöveg nélkül is érthető. Hang nélkül, büntetés nélkül, játékosan gyakorolhat a gyerek."],
 "faq": [("Hány éves kortól használható?", "Az óvoda végétől, első osztályban pedig különösen jól jön, amikor a gyerek még nem olvas folyékonyan. A szülő vagy egy testvér felolvashatja a rövid utasítást."),
         ("Mit tanul a gyerek a Képes feladatokkal?", "Számlálást 10-ig, a szám és a mennyiség kapcsolatát, a több–kevesebb fogalmát, formák és minták felismerését, valamint csoportosítást és párosítást."),
         ("Kell hozzá olvasni?", "A feladatok többsége nem igényel olvasást, mert képek és számok szerepelnek bennük. A rövid utasítás felolvasható."),
         ("Van hozzá nyomtatható munkalap?", "Igen, a munkalap-készítőben a Képes feladatok is nyomtathatók, megoldókulccsal.")]},
}
