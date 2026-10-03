/* ================= FELSŐS TANANYAG (5–8. osztály) ================= */

/* ---- Negatív számok (egész számok) ---- */
const nline = mark => {
  const lo = -10, hi = 10, x = v => 20 + (v - lo) * 14; let t = '';
  for (let v = lo; v <= hi; v++) { t += `<line x1="${x(v)}" y1="34" x2="${x(v)}" y2="${v === 0 ? 52 : 46}" class="${v === 0 ? 'nz' : 'nt'}"/>`; if (v !== mark && v % 2 === 0) t += `<text x="${x(v)}" y="66" text-anchor="middle" class="nl">${v < 0 ? '−' + (-v) : v}</text>`; }
  return `<svg class="nline" viewBox="0 0 320 76" role="img" aria-label="Számegyenes"><line x1="10" y1="40" x2="310" y2="40" class="nax"/>${t}<path d="M${x(mark)} 36 l-7 -17 h14 z" class="narr"/></svg>`;
};
const SGN_H = 'Azonos előjelű számokat összeadunk, és az előjel marad. Különböző előjelűeknél a nagyobb abszolút értékből kivonjuk a kisebbet, az előjel a nagyobb abszolút értékű számé.';
mod({
  slug: 'negativ-szamok', title: 'Negatív számok gyakorló', short: 'Negatív számok', group: 'szamok', glyph: '−7', hue: 2, grades: [5, 7],
  desc: 'Egész számok a számegyenesen, összehasonlítás, ellentett, abszolút érték, műveletek negatív számokkal.',
  seo: 'A negatív számok az 5–6. osztályban jelennek meg. A gyakorló a számegyenestől indul, majd az összehasonlításon, az ellentetten és az abszolút értéken keresztül eljut az összeadásig, kivonásig, szorzásig és osztásig negatív számokkal. A hőmérsékletes szöveges feladatok a hétköznapi használatot mutatják.',
  levels: [
    { name: 'Számegyenes', neg: true, gen: () => { const m = rnd(-9, 9);
      return NUM(Q(nline(m), 'Melyik számot jelöli a nyíl?'), m, { hint: `A nyíl a nullától ${Math.abs(m)} lépésre van ${m < 0 ? 'balra' : m > 0 ? 'jobbra' : '(a nulla maga)'}, ezért a szám ${numTxt(m)}.` }); } },
    { name: 'Összehasonlítás', neg: true, gen: () => { let a, b; do { a = rnd(-20, 20); b = rnd(-20, 20); } while (a === b && Math.random() < .8);
      return CMP(Q(`${numTxt(a)} ${slot()} ${numTxt(b)}`, 'Melyik jel illik a két szám közé?'), a, b, { hint: 'A számegyenesen a jobbra álló szám a nagyobb. A negatív számok közül az a nagyobb, amelyik közelebb van a nullához.' }); } },
    { name: 'Ellentett és abszolút érték', neg: true, gen: () => { const n = rnd(1, 20) * (Math.random() < .5 ? -1 : 1), t = rnd(0, 2);
      if (t === 0) return NUM(Q(`Mennyi ${numTxt(n)} ellentettje?`), -n, { hint: `Az ellentett az ellenkező előjelű szám: ${numTxt(-n)}.` });
      if (t === 1) return NUM(Q(`|${numTxt(n)}| = ?`, 'Az abszolút érték a szám távolsága a nullától.'), Math.abs(n), { hint: `A ${numTxt(n)} ${Math.abs(n)} egységre van a nullától, ezért |${numTxt(n)}| = ${Math.abs(n)}.` });
      return NUM(Q(`Hány egységre van a ${numTxt(n)} a nullától?`), Math.abs(n), { hint: `Az abszolút érték: ${Math.abs(n)}.` }); } },
    { name: 'Összeadás', neg: true, gen: () => { let a, b; do { a = rnd(-15, 15); b = rnd(-15, 15); } while (a >= 0 && b >= 0);
      return NUM(Q(`${numTxt(a)} + ${par(b)} = ?`), a + b, { hint: SGN_H + ` Itt az eredmény ${numTxt(a + b)}.` }); } },
    { name: 'Kivonás', neg: true, gen: () => { const a = rnd(-15, 15), b = rnd(-15, 15);
      return NUM(Q(`${numTxt(a)} − ${par(b)} = ?`), a - b, { hint: `A kivonás egy szám ellentettjének hozzáadása: ${numTxt(a)} − ${par(b)} = ${numTxt(a)} + ${par(-b)} = ${numTxt(a - b)}.` }); } },
    { name: 'Szorzás és osztás', neg: true, gen: () => { const b = pick([-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]), c = pick([-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
      const h = 'Azonos előjelű számok szorzata és hányadosa pozitív, különböző előjelűeké negatív.';
      return Math.random() < .5 ? NUM(Q(`${par(b)} · ${par(c)} = ?`), b * c, { hint: h + ` ${par(b)} · ${par(c)} = ${numTxt(b * c)}.` })
        : NUM(Q(`${par(b * c)} : ${par(b)} = ?`), c, { hint: h + ` ${par(b * c)} : ${par(b)} = ${numTxt(c)}.` }); } },
    { name: 'Több művelet együtt', neg: true, gen: () => { const a = rnd(-12, 12), b = rnd(-12, 12), c = rnd(-12, 12); const op = pick(['+', '−']);
      const r = op === '+' ? a + b - c : a - b - c; const t = op === '+' ? `${numTxt(a)} + ${par(b)} − ${par(c)}` : `${numTxt(a)} − ${par(b)} − ${par(c)}`;
      return NUM(Q(`${t} = ?`, 'Balról jobbra haladva számolj.'), r, { hint: `Lépésenként: az eredmény ${numTxt(r)}.` }); } },
    { name: 'Hőmérséklet (szöveges)', neg: true, unitless: true, gen: () => { const t0 = rnd(-12, 8), d = rnd(3, 14), up = Math.random() < .5;
      return NUM(Q(`Reggel ${numTxt(t0)} °C volt, délre ${d} fokkal ${up ? 'emelkedett' : 'csökkent'} a hőmérséklet. Hány °C lett?`), up ? t0 + d : t0 - d, { unit: '°C', hint: `${numTxt(t0)} ${up ? '+' : '−'} ${d} = ${numTxt(up ? t0 + d : t0 - d)} °C.` }); } }
  ]
});

/* ---- Tizedes törtek ---- */
const DECF = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 8], [3, 8], [1, 20], [3, 20], [7, 20], [1, 25], [3, 25], [1, 50]];
mod({
  slug: 'tizedes-tortek', title: 'Tizedes törtek gyakorló', short: 'Tizedes törtek', group: 'szamok', glyph: '3,5', hue: 1, grades: [4, 7],
  desc: 'Tizedes törtek összehasonlítása, kerekítése, összeadása, kivonása, szorzása, osztása és átváltása törtté.',
  seo: 'A tizedes törtek a 4. osztálytól fontosak: pénz, mértékek, mérések. A gyakorló az összehasonlítástól és a kerekítéstől a négy alapműveletig, a 10-zel, 100-zal és 1000-rel való szorzásig és osztásig, valamint a törtek tizedes tört alakjáig mindent gyakoroltat. A válaszokat tizedesvesszővel kell beírni.',
  levels: [
    { name: 'Összehasonlítás', dec: true, gen: () => { const a1 = rnd(11, 99), same = Math.random() < .2, b2 = same ? a1 * 10 : rnd(110, 999);
      const ta = fixd(a1 / 10, 1), tb = fixd(b2 / 100, 2); return CMP(Q(`${ta} ${slot()} ${tb}`, 'Melyik jel illik a két szám közé?'), a1 * 10, b2, { hint: `Egészítsd ki ugyanannyi tizedesjegyre: ${fixd(a1 / 10, 2)} és ${tb}. Utána hasonlítsd össze.` }); } },
    { name: 'Kerekítés', dec: true, gen: () => { const n = rnd(101, 2999); const w = Math.random() < .5;
      const r = w ? Math.floor((n + 50) / 100) : Math.floor((n + 5) / 10) / 10;
      return NUM(Q(`Kerekítsd ${w ? 'egészre' : 'tizedre'}: ${fixd(n / 100, 2)}`), r, { hint: `${w ? 'A tizedesjegyet' : 'A századokat'} nézd: ha 5 vagy több, felfelé kerekítünk. Az eredmény ${numTxt(r)}.` }); } },
    { name: 'Összeadás, kivonás tizedekkel', dec: true, gen: () => { const a = rnd(11, 99), b = rnd(11, 99); const add = Math.random() < .5; const [x, y] = add || a >= b ? [a, b] : [b, a];
      return NUM(Q(`${fixd(x / 10, 1)} ${add ? '+' : '−'} ${fixd(y / 10, 1)} = ?`), (add ? x + y : x - y) / 10, { hint: `Írd egymás alá a tizedesvesszőket. Az eredmény ${numTxt((add ? x + y : x - y) / 10)}.` }); } },
    { name: 'Összeadás, kivonás századokkal', dec: true, gen: () => { const a = rnd(101, 999), b = rnd(101, 999); const add = Math.random() < .5; const [x, y] = add || a >= b ? [a, b] : [b, a];
      return NUM(Q(`${fixd(x / 100, 2)} ${add ? '+' : '−'} ${fixd(y / 100, 2)} = ?`), (add ? x + y : x - y) / 100, { hint: `Tizedesvesszőt tizedesvessző alá írva számolj. Az eredmény ${numTxt((add ? x + y : x - y) / 100)}.` }); } },
    { name: 'Szorzás és osztás 10-zel, 100-zal, 1000-rel', dec: true, gen: () => { const f = pick([10, 100, 1000]);
      if (Math.random() < .5) { const n = rnd(11, 999); return NUM(Q(`${fixd(n / 100, 2)} · ${f} = ?`), n * f / 100, { hint: `${f}-zel szorozva a tizedesvessző ${String(f).length - 1} hellyel jobbra csúszik. Az eredmény ${numTxt(n * f / 100)}.` }); }
      const n = rnd(1, 9999); return NUM(Q(`${numTxt(n)} : ${f} = ?`), n / f, { hint: `${f}-zel osztva a tizedesvessző ${String(f).length - 1} hellyel balra csúszik. Az eredmény ${numTxt(n / f)}.` }); } },
    { name: 'Szorzás egész számmal', dec: true, gen: () => { const k = rnd(2, 9); const sc = pick([10, 100]); const a = sc === 10 ? rnd(11, 99) : rnd(101, 399);
      return NUM(Q(`${fixd(a / sc, sc === 10 ? 1 : 2)} · ${k} = ?`), a * k / sc, { hint: `Szorozz úgy, mintha nem lenne tizedesvessző (${a} · ${k} = ${a * k}), aztán tedd vissza a vesszőt. Az eredmény ${numTxt(a * k / sc)}.` }); } },
    { name: 'Osztás egész számmal', dec: true, gen: () => { const d = rnd(2, 9), r = rnd(11, 399); const dividend = r * d;
      return NUM(Q(`${fixd(dividend / 100, 2).replace(/,?0+$/, '')} : ${d} = ?`), r / 100, { hint: `Osztás után az eredmény ${numTxt(r / 100)}, mert ${numTxt(r / 100)} · ${d} = ${numTxt(dividend / 100)}.` }); } },
    { name: 'Tört és tizedes tört', dec: true, gen: () => { if (Math.random() < .7) { const [n, d] = pick(DECF);
        return NUM(Q(`${fr(n, d)} = ? (tizedes tört)`), n / d, { hint: `${n} : ${d} = ${numTxt(n / d)}.` }); }
      const k = pick([10, 100]), n = k === 10 ? rnd(1, 9) : rnd(1, 99);
      return NUM(Q(`${fixd(n / k, k === 10 ? 1 : 2)} = ${fr('?', k)}`), n, { hint: `${fixd(n / k, k === 10 ? 1 : 2)} = ${n}/${k}.` }); } }
  ]
});

/* ---- Törtek haladó ---- */
const FP = [[2, 3], [3, 4], [2, 5], [3, 5], [5, 6], [3, 8], [5, 8], [7, 10], [4, 9], [5, 12], [7, 12], [1, 2], [1, 3], [1, 4]];
mod({
  slug: 'tortek-halado', title: 'Törtek haladó gyakorló', short: 'Törtek haladó', group: 'szamok', glyph: fr(2, 3), hue: 3, grades: [5, 7],
  desc: 'Bővítés, egyszerűsítés, közös nevező, törtek összeadása és kivonása, vegyes számok.',
  seo: 'Az 5–6. osztályos törtek témakör gyakorlása: törtek bővítése és egyszerűsítése, összehasonlítás közös nevezőre hozással, összeadás és kivonás azonos és különböző nevezővel, egész számmal való szorzás, vegyes szám és közönséges tört átalakítása.',
  levels: [
    { name: 'Bővítés', gen: () => { const [n, d] = pick(FP), k = rnd(2, 6);
      return NUM(Q(`${fr(n, d)} = ${fr('?', d * k)}`, `Bővítsd ${k}-${[2, 3, 4, 5, 6][k - 2] ? ['vel', 'mal', 'gyel', 'tel', 'tal'][k - 2] : 'val'}.`), n * k, { hint: `A számlálót és a nevezőt is ${k} számmal szorozzuk: ${n}·${k} = ${n * k}, ${d}·${k} = ${d * k}.` }); } },
    { name: 'Egyszerűsítés', gen: () => { const [n, d] = pick(FP), k = rnd(2, 6); const askNum = Math.random() < .6;
      return NUM(Q(askNum ? `${fr(n * k, d * k)} = ${fr('?', d)}` : `${fr(n * k, d * k)} = ${fr(n, '?')}`), askNum ? n : d, { hint: `Mindkettőt ${k} számmal osztjuk: ${n * k} : ${k} = ${n}, ${d * k} : ${k} = ${d}.` }); } },
    { name: 'Legegyszerűbb alak', gen: () => { const [n, d] = pick(FP.filter(x => gcd(x[0], x[1]) === 1)), k = rnd(2, 5);
      const cands = [[n, d + 1], [n + 1, d], [n + 1, d + 1], [Math.max(1, n - 1), d], [n, d + 2]].filter(([a, b]) => a * d !== n * b && a < b + 2);
      const ch = ([a, b]) => ({ v: a + '/' + b, h: fr(a, b) });
      return CH(Q(fr(n * k, d * k), 'Melyik a legegyszerűbb alakja?'), ch([n, d]), shuffle(cands).map(ch), { hint: `A számláló és a nevező legnagyobb közös osztója ${k}, azzal osztunk: ${n * k}/${d * k} = ${n}/${d}.` }); } },
    { name: 'Összehasonlítás közös nevezővel', gen: () => { const pairs = [[2, 3, 3, 4], [3, 5, 5, 8], [1, 2, 2, 4], [2, 3, 4, 6], [3, 4, 5, 6], [4, 5, 7, 9], [5, 6, 3, 4], [1, 3, 2, 5], [3, 8, 2, 5], [5, 12, 3, 8]];
      let [a, b, c, d] = pick(pairs); if (Math.random() < .5) [a, b, c, d] = [c, d, a, b];
      return CMP(Q(`${fr(a, b)} ${slot()} ${fr(c, d)}`, 'Melyik jel illik közéjük?'), a * d, c * b, { hint: `Közös nevező: ${b * d}. ${fr(a * d, b * d)} és ${fr(c * b, b * d)}.` }); } },
    { name: 'Összeadás, kivonás (azonos nevező)', gen: () => { const d = rnd(4, 12), add = Math.random() < .55; let a, b;
      if (add) { a = rnd(2, d - 1); b = rnd(2, d - 1); } else { a = rnd(3, d - 1); b = rnd(1, a - 1); }
      return NUM(Q(`${fr(a, d)} ${add ? '+' : '−'} ${fr(b, d)} = ${fr('?', d)}`), add ? a + b : a - b, { hint: `A nevező marad ${d}, a számlálókat összeadjuk/kivonjuk: ${a} ${add ? '+' : '−'} ${b} = ${add ? a + b : a - b}.` }); } },
    { name: 'Összeadás, kivonás (különböző nevező)', gen: () => { const ds = [2, 3, 4, 5, 6, 8, 10, 12]; let d1, d2; do { d1 = pick(ds); d2 = pick(ds); } while (d1 === d2 || lcm(d1, d2) > 24);
      const D = lcm(d1, d2); let n1 = rnd(1, d1 - 1), n2 = rnd(1, d2 - 1); const add = Math.random() < .55; let v1 = n1 * D / d1, v2 = n2 * D / d2;
      if (!add && v1 < v2) { [n1, n2] = [n2, n1]; [d1, d2] = [d2, d1]; [v1, v2] = [v2, v1]; }
      if (!add && v1 === v2) { v1 += 0; n1 = Math.min(n1 + 1, d1 - 1); v1 = n1 * D / d1; if (v1 <= v2) { v1 = v2 + 1; n1 = v1 * d1 / D; if (!Number.isInteger(n1)) { add_fix: { n1 = d1 - 1; v1 = n1 * D / d1; } } } }
      const r = add ? v1 + v2 : v1 - v2;
      return NUM(Q(`${fr(n1, d1)} ${add ? '+' : '−'} ${fr(n2, d2)} = ${fr('?', D)}`), r, { hint: `Közös nevező: ${D}. ${fr(v1, D)} ${add ? '+' : '−'} ${fr(v2, D)} = ${fr(r, D)}.` }); } },
    { name: 'Tört szorzása egész számmal', gen: () => { const [n, d] = pick(FP), k = rnd(2, 8);
      return NUM(Q(`${k} · ${fr(n, d)} = ${fr('?', d)}`), n * k, { hint: `A számlálót szorozzuk: ${k} · ${n} = ${n * k}, a nevező marad ${d}.` }); } },
    { name: 'Vegyes szám és közönséges tört', gen: () => { const d = rnd(2, 9), w = rnd(1, 5), n = rnd(1, d - 1);
      return Math.random() < .5 ? NUM(Q(`${mix(w, n, d)} = ${fr('?', d)}`), w * d + n, { hint: `${w} egész = ${fr(w * d, d)}, ehhez még ${n}/${d}: ${fr(w * d + n, d)}.` })
        : NUM(Q(`${fr(w * d + n, d)} = ${w} egész ${fr('?', d)}`), n, { hint: `${w * d + n} : ${d} = ${w}, maradék ${n}, tehát ${w} egész ${n}/${d}.` }); } }
  ]
});

/* ---- Százalékszámítás ---- */
const pctOf = (p, b) => p * b / 100;
mod({
  slug: 'szazalekszamitas', title: 'Százalékszámítás gyakorló', short: 'Százalékszámítás', group: 'szamok', glyph: '25%', hue: 4, grades: [6, 8],
  desc: 'Százalékérték, alap és százalékláb számítása, kedvezmények, árváltozások, átváltás törtté és tizedes törtté.',
  seo: 'A százalékszámítás 6–8. osztályban az egyik legfontosabb téma: a boltban, az akciókban, a kamatoknál találkozunk vele. A gyakorló az egyszerű 50%, 25%, 10% számításoktól a kedvezményeken és áremeléseken át a visszafelé számolásig (az alap meghatározásáig) vezet.',
  levels: [
    { name: '50%, 25%, 10% és 1%', gen: () => { const o = pick([[50, [20, 40, 60, 80, 100, 200]], [25, [20, 40, 80, 100, 200]], [10, [30, 50, 80, 100, 250, 400]], [1, [100, 200, 500, 1000]], [75, [20, 40, 80, 100]], [20, [25, 50, 100, 150]]]); const b = pick(o[1]);
      return NUM(Q(`Mennyi ${b} ${o[0]}%-a?`), pctOf(o[0], b), { hint: `${o[0]}% = ${o[0]}/100, tehát ${b} · ${o[0]} : 100 = ${pctOf(o[0], b)}.` }); } },
    { name: 'Tetszőleges százalék', gen: () => { const p = pick([5, 15, 30, 35, 40, 45, 60, 65, 80, 90]), b = rnd(1, 20) * 20;
      return NUM(Q(`Mennyi ${b} ${p}%-a?`), pctOf(p, b), { hint: `Előbb az 1%-ot számold ki: ${b} : 100 = ${numTxt(b / 100)}, ezt szorozd ${p} százalékkal: ${pctOf(p, b)}.` }); } },
    { name: 'Hány százalék?', gen: () => { const p = pick([5, 10, 20, 25, 30, 40, 50, 60, 75, 80]), b = rnd(1, 10) * 20, part = pctOf(p, b);
      return NUM(Q(Math.random() < .5 ? `Egy osztály létszáma ${b}, ebből ${part} fő fiú. Hány százalék a fiúk aránya?` : `Egy ${fmt(b * 100)} forintos termék ára ${fmt(part * 100)} forinttal csökkent. Hány százalékos volt a csökkenés?`), p, { unit: '%', hint: `${part} : ${b} = ${numTxt(part / b)}, ezt százzal szorozva ${p}%.` }); } },
    { name: 'Kedvezmény', gen: () => { const price = rnd(10, 100) * 100, p = pick([10, 20, 25, 30, 40, 50]);
      return NUM(Q(`Egy ${fmt(price)} Ft-os termék ára ${p}%-kal csökken. Mennyibe kerül akciósan?`), price * (100 - p) / 100, { unit: 'Ft', hint: `A kedvezmény ${fmt(pctOf(p, price))} Ft, az új ár ${fmt(price)} − ${fmt(pctOf(p, price))} = ${fmt(price * (100 - p) / 100)} Ft.` }); } },
    { name: 'Mennyi az egész?', gen: () => { const p = pick([5, 10, 20, 25, 40, 50, 75]), whole = rnd(2, 20) * 20, part = pctOf(p, whole);
      return NUM(Q(`Egy szám ${p}%-a ${part}. Melyik ez a szám?`), whole, { hint: `Ha a ${p}% = ${part}, akkor az 1% = ${numTxt(part / p)}, a 100% pedig ${whole}.` }); } },
    { name: 'Átváltás: tört, tizedes tört, százalék', dec: true, gen: () => { const t = rnd(0, 2);
      if (t === 0) { const n = rnd(1, 99); return NUM(Q(`${fixd(n / 100, 2)} = ? %`), n, { hint: `Szorozd a tizedes törtet 100-zal: ${n}%.` }); }
      if (t === 1) { const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [7, 10], [3, 20], [9, 20], [1, 25], [7, 25], [3, 50]]); return NUM(Q(`${fr(n, d)} = ? %`), n / d * 100, { hint: `${n} : ${d} = ${numTxt(n / d)}, százzal szorozva ${numTxt(n / d * 100)}%.` }); }
      const p = rnd(1, 99); return NUM(Q(`${p}% = ? (tizedes tört)`), p / 100, { hint: `Osszuk 100-zal: ${numTxt(p / 100)}.` }); } },
    { name: 'Növekedés és csökkenés', gen: () => { const price = rnd(10, 100) * 100, p = pick([10, 20, 25, 30, 50]), up = Math.random() < .5;
      return NUM(Q(`Egy telefon ára ${fmt(price)} Ft volt. ${p}%-kal ${up ? 'drágább' : 'olcsóbb'} lett. Mennyi az új ára?`), price * (100 + (up ? p : -p)) / 100, { unit: 'Ft', hint: `A változás ${fmt(pctOf(p, price))} Ft, az új ár ${fmt(price * (100 + (up ? p : -p)) / 100)} Ft.` }); } }
  ]
});

/* ---- Hatványok és gyökök ---- */
const sup = (b, e) => `${b}<sup>${e}</sup>`;
mod({
  slug: 'hatvanyok-gyokok', title: 'Hatványok és négyzetgyök gyakorló', short: 'Hatványok, gyökök', group: 'szamok', glyph: 'x²', hue: 1, grades: [7, 8],
  desc: 'Négyzetszámok, köbszámok, hatványok, négyzetgyök, kitevő keresése és műveletek hatványokkal.',
  seo: 'A hatványozás és a négyzetgyökvonás a 7–8. osztály alapja. A gyakorló a négyzetszámokkal és a köbszámokkal indul, majd a hatványok kiszámítása, a kitevő megkeresése és a négyzetgyök becslése következik.',
  levels: [
    { name: 'Négyzetszámok', gen: () => { const n = rnd(2, 20); return NUM(Q(`${sup(n, 2)} = ?`), n * n, { hint: `${n} · ${n} = ${n * n}.` }); } },
    { name: 'Négyzetgyök', gen: () => { const n = rnd(2, 20); return NUM(Q(`√${n * n} = ?`), n, { hint: `${n}² = ${n * n}, ezért √${n * n} = ${n}.` }); } },
    { name: 'Köbszámok', gen: () => { const n = rnd(2, 10); return NUM(Q(`${sup(n, 3)} = ?`), n ** 3, { hint: `${n} · ${n} · ${n} = ${n ** 3}.` }); } },
    { name: 'Hatványok kiszámítása', gen: () => { const o = pick([[2, 2, 10], [3, 2, 5], [4, 2, 4], [5, 2, 4], [10, 2, 6]]); const e = rnd(o[1], o[2]);
      return NUM(Q(`${sup(o[0], e)} = ?`), o[0] ** e, { hint: `${o[0]}-t ${e}-szer szorozzuk önmagával: ${fmt(o[0] ** e)}.` }); } },
    { name: 'Mekkora a kitevő?', gen: () => { const o = pick([[2, 2, 10], [3, 2, 5], [5, 2, 4], [10, 2, 6]]); const e = rnd(o[1], o[2]);
      return NUM(Q(`${sup(o[0], slot())} = ${fmt(o[0] ** e)}`), e, { hint: `${o[0]}-t ${e}-szer kell önmagával szorozni, hogy ${fmt(o[0] ** e)} legyen.` }); } },
    { name: 'Műveletek hatványokkal', gen: () => { const a = rnd(2, 9), b = rnd(2, 9), t = rnd(0, 3);
      if (t === 0) return NUM(Q(`${sup(a, 2)} + ${sup(b, 2)} = ?`), a * a + b * b, { hint: `${a * a} + ${b * b} = ${a * a + b * b}.` });
      if (t === 1) { const hi = Math.max(a, b), lo = Math.min(a, b); return NUM(Q(`${sup(hi, 2)} − ${sup(lo, 2)} = ?`), hi * hi - lo * lo, { hint: `${hi * hi} − ${lo * lo} = ${hi * hi - lo * lo}.` }); }
      if (t === 2) { const c = rnd(2, 5); return NUM(Q(`${sup(c, 3)} + ${a} = ?`), c ** 3 + a, { hint: `${c ** 3} + ${a} = ${c ** 3 + a}.` }); }
      return NUM(Q(`√${a * a} + √${b * b} = ?`), a + b, { hint: `${a} + ${b} = ${a + b}.` }); } },
    { name: 'Négyzetgyök becslése', gen: () => { const n = rnd(3, 15), d = rnd(-(n - 2), n - 2), x = n * n + d;
      return NUM(Q(`√${x}`, 'Melyik egész számhoz van a legközelebb?'), n, { hint: `${n}² = ${n * n}, ez van a legközelebb ${x}-hoz, ezért √${x} ≈ ${n}.` }); } }
  ]
});

/* ---- Osztók, többszörösök, prímszámok ---- */
const DV = { 2: 'vel', 3: 'mal', 4: 'gyel', 5: 'tel', 6: 'tal', 9: 'cel', 10: 'zel' };
const DRULE = { 2: 'Páros számok oszthatók 2-vel (0, 2, 4, 6, 8-ra végződnek).', 3: 'Ha a számjegyek összege osztható 3-mal, a szám is.', 4: 'Ha az utolsó két számjegyből alkotott szám osztható 4-gyel, a szám is.', 5: 'A 0-ra vagy 5-re végződő számok oszthatók 5-tel.', 6: 'Osztható 6-tal, ha 2-vel és 3-mal is osztható.', 9: 'Ha a számjegyek összege osztható 9-cel, a szám is.', 10: 'A 0-ra végződő számok oszthatók 10-zel.' };
const factorize = n => { const f = []; for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; } if (n > 1) f.push(n); return f; };
mod({
  slug: 'oszthatosag-primszamok', title: 'Oszthatóság és prímszámok gyakorló', short: 'Oszthatóság, prímek', group: 'szamok', glyph: '12 | 36', hue: 3, grades: [5, 7],
  desc: 'Oszthatósági szabályok, prímszámok, osztók, többszörösök, legnagyobb közös osztó és legkisebb közös többszörös.',
  seo: 'Az osztók és többszörösök témaköre az 5–6. osztály egyik fontos része. A gyakorló az oszthatósági szabályokat, a prímszámok felismerését, az osztók megszámolását, a többszörösöket, a legnagyobb közös osztót (LNKO), a legkisebb közös többszöröst (LKKT) és a prímtényezős felbontást gyakoroltatja.',
  levels: [
    { name: 'Oszthatósági szabályok', gen: () => { const d = pick([2, 3, 4, 5, 6, 9, 10]), want = Math.random() < .5; let n; do { n = rnd(20, 999); } while ((n % d === 0) !== want);
      return CH(Q(`Osztható-e a ${n} szám ${d}-${DV[d]}?`), want ? 'Igen' : 'Nem', [want ? 'Nem' : 'Igen'], { hint: DRULE[d] }); } },
    { name: 'Prímszám vagy összetett szám?', gen: () => { const want = Math.random() < .45; let n; do { n = rnd(2, 100); } while (isPrime(n) !== want);
      return CH(Q(`${n}`, 'Prímszám vagy összetett szám?'), want ? 'Prímszám' : 'Összetett', [want ? 'Összetett' : 'Prímszám'], { hint: want ? `A ${n}-nek csak két osztója van: 1 és ${n}.` : `A ${n} osztható ${factorize(n)[0]}-${DV[factorize(n)[0]] || 'val'}, ezért összetett.`.replace(/-(\d)val/, '-$1 val') }); } },
    { name: 'Hány osztója van?', gen: () => { const n = rnd(6, 60), dv = divisors(n);
      return NUM(Q(`Hány osztója van a ${n} számnak?`, 'Az 1-et és önmagát is számold.'), dv.length, { hint: `Az osztók: ${dv.join(', ')}.` }); } },
    { name: 'Többszörösök', gen: () => { const d = rnd(3, 12), m = rnd(20, 120), r = (Math.floor(m / d) + 1) * d;
      return NUM(Q(`Írd fel a ${d} többszöröseit. Melyik az első olyan, ami nagyobb, mint ${m}?`), r, { hint: `${m} : ${d} = ${Math.floor(m / d)} maradék ${m % d}, tehát ${Math.floor(m / d) + 1} · ${d} = ${r}.` }); } },
    { name: 'Legnagyobb közös osztó (LNKO)', gen: () => { let x, y; do { x = rnd(2, 9); y = rnd(2, 9); } while (x === y || gcd(x, y) !== 1); const g = rnd(2, 12);
      return NUM(Q(`Mennyi ${g * x} és ${g * y} legnagyobb közös osztója?`), g, { hint: `Osztók: ${g * x}-é ${divisors(g * x).join(', ')}; ${g * y}-é ${divisors(g * y).join(', ')}. A legnagyobb közös: ${g}.` }); } },
    { name: 'Legkisebb közös többszörös (LKKT)', gen: () => { let a, b; do { a = rnd(2, 12); b = rnd(2, 12); } while (a === b || lcm(a, b) > 90);
      return NUM(Q(`Mennyi ${a} és ${b} legkisebb közös többszöröse?`), lcm(a, b), { hint: `A ${a} többszörösei és a ${b} többszörösei közül az első közös: ${lcm(a, b)}.` }); } },
    { name: 'Prímtényezős felbontás', gen: () => { let n; do { n = rnd(8, 100); } while (isPrime(n)); const f = factorize(n);
      return NUM(Q(`Hány prímszám szorzata a ${n}?`, 'Az ismétlődő tényezőket is számold külön.'), f.length, { hint: `${n} = ${f.join(' · ')}, ez ${f.length} tényező.` }); } }
  ]
});

/* ---- Egyenletek ---- */
const MULW = { 2: 'kettővel', 3: 'hárommal', 4: 'néggyel', 5: 'öttel', 6: 'hattal', 7: 'héttel', 8: 'nyolccal', 9: 'kilenccal' };
mod({
  slug: 'egyenletek', title: 'Egyenletek gyakorló', short: 'Egyenletek', group: 'szamok', glyph: 'x + 3', hue: 2, grades: [6, 8],
  desc: 'Egyszerű és kétlépéses egyenletek megoldása a mérleg-elvvel, szöveges feladatokkal.',
  seo: 'Az egyenletmegoldás 6–8. osztályban a mérleg-elv megértésével kezdődik: azt kell tenni az egyenlet mindkét oldalán, hogy megkapjuk x értékét. A gyakorló az egyszerű összeadásos és szorzásos egyenletektől a kétlépéses és zárójeles egyenletekig, negatív megoldásokig és szöveges feladatokig vezet.',
  levels: [
    { name: 'x + a = b', gen: () => { const x = rnd(1, 25), a = rnd(2, 25); return NUM(Q(`${vx} + ${a} = ${x + a}`, 'Mennyi x?'), x, { hint: `Mindkét oldalból kivonunk ${art(a)} ${a} számot: x = ${x + a} − ${a} = ${x}.` }); } },
    { name: 'a · x = b', gen: () => { const x = rnd(2, 12), a = rnd(2, 9); return NUM(Q(`${a} · ${vx} = ${a * x}`, 'Mennyi x?'), x, { hint: `Mindkét oldalt elosztjuk ${a} számmal: x = ${a * x} : ${a} = ${x}.` }); } },
    { name: 'x − a = b és a − x = b', gen: () => { const x = rnd(3, 30), a = rnd(2, 20);
      return Math.random() < .5 ? NUM(Q(`${vx} − ${a} = ${x}`, 'Mennyi x?'), x + a, { hint: `Mindkét oldalhoz hozzáadunk ${art(a)} ${a} számot: x = ${x} + ${a} = ${x + a}.` })
        : NUM(Q(`${x + a} − ${vx} = ${a}`, 'Mennyi x?'), x, { hint: `x = ${x + a} − ${a} = ${x}.` }); } },
    { name: 'Kétlépéses: a · x + b = c', gen: () => { const x = rnd(1, 12), a = rnd(2, 9), b = rnd(1, 20); const plus = Math.random() < .6;
      return plus ? NUM(Q(`${a} · ${vx} + ${b} = ${a * x + b}`, 'Mennyi x?'), x, { hint: `Először kivonunk ${art(b)} ${b} számot: ${a}x = ${a * x}. Aztán osztunk ${a} számmal: x = ${x}.` })
        : NUM(Q(`${a} · ${vx} − ${b} = ${a * x - b}`, 'Mennyi x?'), x, { hint: `Először hozzáadunk ${art(b)} ${b} számot: ${a}x = ${a * x}. Aztán osztunk ${a} számmal: x = ${x}.` }); } },
    { name: 'Zárójeles egyenletek', gen: () => { const x = rnd(2, 12), a = rnd(2, 6), b = rnd(1, 8); const plus = Math.random() < .5;
      return plus ? NUM(Q(`${a} · (${vx} + ${b}) = ${a * (x + b)}`, 'Mennyi x?'), x, { hint: `Osztunk ${a} számmal: x + ${b} = ${x + b}, ebből x = ${x}.` })
        : NUM(Q(`${a} · (${vx} − ${b}) = ${a * (x - b > 0 ? x - b : 1)}`, 'Mennyi x?'), (x - b > 0 ? x - b : 1) + b, { hint: `Osztunk ${a} számmal, aztán hozzáadunk ${art(b)} ${b} számot.` }); } },
    { name: 'Szöveges egyenletek', gen: () => { const a = rnd(2, 9), x = rnd(2, 15), b = rnd(1, 20); const plus = Math.random() < .6;
      return NUM(Q(`Gondoltam egy számra. Megszoroztam ${MULW[a]}, majd ${plus ? 'a szorzathoz hozzáadtam' : 'a szorzatból kivontam'} ${art(b)} ${b} számot. Az eredmény ${a * x + (plus ? b : -b)} lett. Melyik számra gondoltam?`), x, { hint: `${a}x ${plus ? '+' : '−'} ${b} = ${a * x + (plus ? b : -b)}, ebből x = ${x}.` }); } },
    { name: 'Negatív megoldások', neg: true, gen: () => { const x = -rnd(1, 15), a = rnd(2, 9); const t = rnd(0, 1);
      return t === 0 ? NUM(Q(`${vx} + ${a + 5} = ${x + a + 5}`, 'Mennyi x?'), x, { hint: `x = ${numTxt(x + a + 5)} − ${a + 5} = ${numTxt(x)}.` })
        : NUM(Q(`${a} · ${vx} = ${numTxt(a * x)}`, 'Mennyi x?'), x, { hint: `x = ${numTxt(a * x)} : ${a} = ${numTxt(x)}.` }); } }
  ]
});

/* ---- Szögek és háromszögek ---- */
const angSVG = a => { const cx = 50, cy = 130, L = 100, r = 28, rad = a * Math.PI / 180, ex = cx + L * Math.cos(rad), ey = cy - L * Math.sin(rad);
  const ax = cx + r * Math.cos(rad), ay = cy - r * Math.sin(rad), large = a > 180 ? 1 : 0;
  const arc = a === 180 ? `M${cx + r} ${cy} A${r} ${r} 0 0 0 ${cx - r} ${cy}` : `M${cx + r} ${cy} A${r} ${r} 0 ${large} 0 ${ax.toFixed(1)} ${ay.toFixed(1)}`;
  const sqm = a === 90 ? `<path d="M${cx + 14} ${cy} v-14 h-14" class="asq"/>` : `<path d="${arc}" class="aarc"/>`;
  return `<svg class="angle" viewBox="0 0 170 150" role="img" aria-label="Szög"><line x1="${cx}" y1="${cy}" x2="${cx + L}" y2="${cy}" class="aray"/><line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" class="aray"/>${sqm}</svg>`; };
const ANG_T = { 'hegyesszög': 'A hegyesszög kisebb 90°-nál.', 'derékszög': 'A derékszög pontosan 90°.', 'tompaszög': 'A tompaszög 90° és 180° közötti.', 'egyenesszög': 'Az egyenesszög pontosan 180°.', 'homorúszög': 'A homorú szög 180°-nál nagyobb.' };
const MS = { 5: 'ötszög', 6: 'hatszög', 7: 'hétszög', 8: 'nyolcszög', 9: 'kilencszög', 10: 'tízszög' };
mod({
  slug: 'szogek-haromszogek', title: 'Szögek és háromszögek gyakorló', short: 'Szögek, háromszögek', group: 'forma', glyph: '60°', hue: 1, grades: [5, 8],
  desc: 'Szögfajták, pótszög, kiegészítő szög, háromszögek és négyszögek szögei, sokszögek belső szögei, háromszög-egyenlőtlenség.',
  seo: 'A szögek és a háromszögek a geometria alapjai az 5–8. osztályban. A gyakorló a szögfajták felismerésével kezdődik, majd a pótszög, a kiegészítő szög, a háromszög belső szögeinek összege, a négyszögek és a sokszögek belső szögeinek összege és a háromszög-egyenlőtlenség következik.',
  levels: [
    { name: 'Szögfajták felismerése', gen: () => { const o = pick([['hegyesszög', rnd(15, 75)], ['derékszög', 90], ['tompaszög', rnd(105, 165)], ['egyenesszög', 180], ['homorúszög', rnd(200, 330)]]);
      return CH(Q(angSVG(o[1]), 'Milyen szög ez?'), o[0], shuffle(Object.keys(ANG_T).filter(x => x !== o[0])), { hint: ANG_T[o[0]] }); } },
    { name: 'Pótszög és kiegészítő szög', gen: () => { const sup2 = Math.random() < .5;
      if (sup2) { const a = rnd(10, 85); return NUM(Q(`Mennyi a ${a}°-os szög pótszöge?`, 'A pótszögek összege 90°.'), 90 - a, { unit: '°', hint: `90° − ${a}° = ${90 - a}°.` }); }
      const a = rnd(20, 160); return NUM(Q(`Mennyi a ${a}°-os szög kiegészítő szöge?`, 'A kiegészítő szögek összege 180°.'), 180 - a, { unit: '°', hint: `180° − ${a}° = ${180 - a}°.` }); } },
    { name: 'Háromszög szögei', gen: () => { const a = rnd(20, 100), b = rnd(20, 150 - a);
      return NUM(Q(`Egy háromszög két szöge ${a}° és ${b}°. Mekkora a harmadik szöge?`, 'A háromszög belső szögeinek összege 180°.'), 180 - a - b, { unit: '°', hint: `180° − ${a}° − ${b}° = ${180 - a - b}°.` }); } },
    { name: 'Egyenlő szárú háromszög', gen: () => { if (Math.random() < .5) { const b = rnd(2, 8) * 10; return NUM(Q(`Egy egyenlő szárú háromszög alapon fekvő szögei ${b}°-osak. Mekkora a szárszöge?`), 180 - 2 * b, { unit: '°', hint: `180° − 2 · ${b}° = ${180 - 2 * b}°.` }); }
      const t = rnd(2, 15) * 10; return NUM(Q(`Egy egyenlő szárú háromszög szárszöge ${t}°. Mekkora az alapon fekvő szögek egyike?`), (180 - t) / 2, { unit: '°', hint: `(180° − ${t}°) : 2 = ${(180 - t) / 2}°.` }); } },
    { name: 'Négyszög szögei', gen: () => { const a = rnd(60, 120), b = rnd(60, 120), c = rnd(60, 120);
      return NUM(Q(`Egy négyszög három szöge ${a}°, ${b}° és ${c}°. Mekkora a negyedik szöge?`, 'A négyszög belső szögeinek összege 360°.'), 360 - a - b - c, { unit: '°', hint: `360° − ${a}° − ${b}° − ${c}° = ${360 - a - b - c}°.` }); } },
    { name: 'Mellékszög és csúcsszög', gen: () => { const a = rnd(2, 17) * 10; const csucs = Math.random() < .5;
      return NUM(Q(`Két egyenes metszi egymást, az egyik szög ${a}°. Mekkora ${csucs ? 'a csúcsszöge' : 'a mellékszöge'}?`), csucs ? a : 180 - a, { unit: '°', hint: csucs ? 'A csúcsszögek egyenlők.' : `A mellékszögek összege 180°: 180° − ${a}° = ${180 - a}°.` }); } },
    { name: 'Sokszögek belső szögeinek összege', gen: () => { const n = rnd(5, 10);
      return NUM(Q(`Mennyi egy ${MS[n]} belső szögeinek összege?`), (n - 2) * 180, { unit: '°', hint: `(${n} − 2) · 180° = ${(n - 2) * 180}°.` }); } },
    { name: 'Háromszög-egyenlőtlenség', gen: () => { const ok = Math.random() < .5; let a, b, c;
      do { a = rnd(2, 12); b = rnd(2, 12); c = rnd(2, 20); } while ((a + b > c && a + c > b && b + c > a) !== ok);
      return CH(Q(`${a} cm, ${b} cm, ${c} cm`, 'Szerkeszthető háromszög ezekből az oldalakból?'), ok ? 'Igen' : 'Nem', [ok ? 'Nem' : 'Igen'], { hint: 'Háromszög akkor szerkeszthető, ha bármely két oldal összege nagyobb a harmadiknál.' }); } }
  ]
});

/* ---- Kör és testek ---- */
const boxSVG = (a, b, c) => { const x = 40, y = 52, w = 110, h = 70, dx = 46, dy = -30;
  return `<svg class="shape wide" viewBox="0 0 250 150" role="img" aria-label="Téglatest"><polygon points="${x},${y} ${x + dx},${y + dy} ${x + w + dx},${y + dy} ${x + w},${y}"/><polygon points="${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y + h + dy} ${x + w},${y + h}"/><rect x="${x}" y="${y}" width="${w}" height="${h}"/><text x="${x + w / 2}" y="${y + h + 18}" text-anchor="middle" class="dim">${a} cm</text><text x="${x - 8}" y="${y + h / 2 + 5}" text-anchor="end" class="dim">${c} cm</text><text x="${x + w + dx + 6}" y="${y + dy + 18}" class="dim">${b} cm</text></svg>`; };
mod({
  slug: 'kor-es-testek', title: 'Kör és testek gyakorló', short: 'Kör és testek', group: 'forma', glyph: 'π', hue: 4, grades: [6, 8],
  desc: 'Kör kerülete és területe, kocka és téglatest térfogata és felszíne, térfogategységek.',
  seo: 'A kör kerületének és területének kiszámítása π ≈ 3,14 értékkel, valamint a kocka és a téglatest térfogata és felszíne a 6–8. osztály fontos témái. A gyakorló az űrmértékek átváltását és a hiányzó él kiszámítását is tartalmazza.',
  levels: [
    { name: 'Kör kerülete (π ≈ 3,14)', dec: true, gen: () => { const r = rnd(1, 10), useD = Math.random() < .4;
      return NUM(Q(useD ? `Egy kör átmérője ${2 * r} cm.` : `Egy kör sugara ${r} cm.`, 'Mennyi a kerülete? (π ≈ 3,14)'), 2 * r * 3.14, { unit: 'cm', hint: `K = 2 · r · π = 2 · ${r} · 3,14 = ${numTxt(2 * r * 3.14)} cm.` }); } },
    { name: 'Kör területe (π ≈ 3,14)', dec: true, gen: () => { const r = rnd(1, 10);
      return NUM(Q(`Egy kör sugara ${r} cm.`, 'Mennyi a területe? (π ≈ 3,14)'), r * r * 3.14, { unit: 'cm²', hint: `T = r² · π = ${r}² · 3,14 = ${numTxt(r * r * 3.14)} cm².` }); } },
    { name: 'Kocka térfogata és felszíne', gen: () => { const a = rnd(2, 10); const v = Math.random() < .5;
      return NUM(Q(`Egy kocka éle ${a} cm.`, v ? 'Mennyi a térfogata?' : 'Mennyi a felszíne?'), v ? a ** 3 : 6 * a * a, { unit: v ? 'cm³' : 'cm²', hint: v ? `V = a³ = ${a}³ = ${a ** 3} cm³.` : `A = 6 · a² = 6 · ${a * a} = ${6 * a * a} cm².` }); } },
    { name: 'Téglatest térfogata', gen: () => { const a = rnd(2, 12), b = rnd(2, 10), c = rnd(2, 9);
      return NUM(Q(boxSVG(a, b, c), 'Mennyi a téglatest térfogata?'), a * b * c, { unit: 'cm³', hint: `V = a · b · c = ${a} · ${b} · ${c} = ${a * b * c} cm³.` }); } },
    { name: 'Téglatest felszíne', gen: () => { const a = rnd(2, 10), b = rnd(2, 10), c = rnd(2, 9);
      return NUM(Q(boxSVG(a, b, c), 'Mennyi a téglatest felszíne?'), 2 * (a * b + b * c + a * c), { unit: 'cm²', hint: `A = 2 · (ab + bc + ac) = 2 · (${a * b} + ${b * c} + ${a * c}) = ${2 * (a * b + b * c + a * c)} cm².` }); } },
    { name: 'Térfogat mértékegységei', gen: () => { const o = pick([[1, 'dm³', 'l', 1, 'Az 1 dm³ éppen 1 liter.'], [1000, 'cm³', 'l', 1, '1 l = 1000 cm³.'], [1000, 'dm³', 'm³', 1, '1 m³ = 1000 dm³.'], [1000, 'cm³', 'dm³', 1, '1 dm³ = 1000 cm³.']]); const down = Math.random() < .5; const n = rnd(2, 9);
      return down ? NUM(Q(`${n} ${o[2]} = ? ${o[1]}`), n * o[0], { unit: o[1], hint: o[4] + ` ${n} ${o[2]} = ${fmt(n * o[0])} ${o[1]}.` }) : NUM(Q(`${fmt(n * o[0])} ${o[1]} = ? ${o[2]}`), n, { unit: o[2], hint: o[4] + ` ${fmt(n * o[0])} ${o[1]} = ${n} ${o[2]}.` }); } },
    { name: 'Hiányzó él', gen: () => { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9);
      return NUM(Q(`Egy téglatest térfogata ${a * b * c} cm³, két éle ${a} cm és ${b} cm.`, 'Mekkora a harmadik éle?'), c, { unit: 'cm', hint: `${a * b * c} : (${a} · ${b}) = ${a * b * c} : ${a * b} = ${c} cm.` }); } }
  ]
});

/* ---- Évfolyam-ajánlás a korábbi gyakorlókhoz ---- */
const GRADES = { 'osszeadas-kivonas': [1, 3], 'szorzotabla': [2, 4], 'osztas': [2, 4], 'irasbeli-muveletek': [3, 5], 'szoveges-feladatok': [1, 5], 'szamok-osszehasonlitasa': [1, 3], 'szomszedok-sorozatok': [1, 3], 'kerekites-paros-paratlan': [2, 4], 'romai-szamok': [3, 6], 'tortek': [3, 5], 'ora-leolvasas': [1, 3], 'penz-szamolas': [1, 4], 'mertekegysegek': [2, 6], 'geometria': [1, 6], 'dobokocka': [1, 3] };
MODS.forEach(m => { if (!m.grades) m.grades = GRADES[m.slug] || [1, 8]; });
