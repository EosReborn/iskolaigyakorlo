# Iskolai Gyakorló

Statikus oldal, nincs szükség adatbázisra vagy regisztrációra.

## Feltöltés Vercelre
1. A `dist` mappa tartalmát töltsd fel egy GitHub repóba (vagy húzd rá a mappát a Vercelre).
2. Vercel: Framework Preset = Other. A gyökérben lévő `vercel.json` már a `dist` mappát állítja be kimenetnek, build parancs nem kell.
3. Domain: Vercel > Settings > Domains > add meg az iskolaigyakorlo.hu címet, és a Rackhostnál állítsd be a Vercel által kiírt DNS rekordokat.

## Módosítás
- A gyakorlók a `src/mods1.js` és `src/mods2.js` fájlokban vannak, a felület a `src/ui.js`-ben, a kinézet a `src/style.css`-ben.
- Újraépítés: `SITE_URL=https://iskolaigyakorlo.hu python3 build.py` (Node.js és Python 3 kell hozzá). Az eredmény a `dist` mappában lesz.
- Új gyakorló: egy új `mod({...})` blokk, a build automatikusan új oldalt, sitemap-bejegyzést és kártyát készít hozzá.

## Fontos
- Az ingyenes Vercel Hobby csomag nem kereskedelmi használatra való. Hirdetések előtt válts Pro-ra, vagy költöztesd az oldalt kereskedelmi használatot engedő tárhelyre.
- Gyerekeknek szóló oldalon hirdetésnél kapcsold be a gyerekbarát (child-directed) beállításokat.
