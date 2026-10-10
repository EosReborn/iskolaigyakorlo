/* ================= BŐVÍTÉS: új, játékos szintek a meglévő gyakorlókhoz =================
   A régi szintek nem változnak, az újak a végükre kerülnek, így a mentett eredmények megmaradnak. */
{
const addLv = (slug, ...lv) => MODS.find(m => m.slug === slug).levels.push(...lv);
const INS = { 2: '2-vel', 3: '3-mal', 4: '4-gyel', 5: '5-tel', 6: '6-tal', 7: '7-tel', 8: '8-cal', 9: '9-cel', 10: '10-zel' };
const TF = (stmt, ok, hint, sub) => CH(Q(stmt, sub || 'Igaz vagy hamis?'), ok ? 'Igaz' : 'Hamis', [ok ? 'Hamis' : 'Igaz'], { hint });
const off = (r, ds, min = 0) => { let v, k = 0; do { v = r + pick(ds); k++; } while ((v === r || v < min) && k < 60); return v === r ? r + 1 : v; };
const farW = r => { const s = new Set(), base = Math.max(100, Math.round(r * .3 / 10) * 10); let t = 0;
  while (s.size < 3 && t++ < 80) { const v = r + (rnd(1, 3) * base + rnd(0, 5) * 10) * (Math.random() < .5 ? -1 : 1); if (v > 0 && v !== r) s.add(v); }
  return [...s]; };
const numObj = n => ({ v: String(n), h: fmt(n) });
const cap = w => w[0].toUpperCase() + w.slice(1);
const dedupe = a => [...new Set(a)];

/* ---------- Összeadás és kivonás ---------- */
const story1 = () => { const k = rnd(0, 3), a = rnd(30, 60), b = rnd(10, 30), c = rnd(5, 25);
  if (k === 0) return NUM(Q(`A kalóz ládájában ${a} aranyérme volt. Talált még ${b} aranyérmét, de a viharban elveszített ${c} darabot. Hány aranyérméje maradt?`), a + b - c, { hint: `${a} + ${b} − ${c} = ${a + b - c}` });
  if (k === 1) return NUM(Q(`A buszon ${a} utas ül. A megállóban ${c} utas leszáll, ${b} utas felszáll. Hány utas ül a buszon?`), a - c + b, { hint: `${a} − ${c} + ${b} = ${a - c + b}` });
  if (k === 2) return NUM(Q(`A könyvtárban ${a} mesekönyv volt a polcon. Kikölcsönöztek ${c} könyvet, és visszahoztak ${b} könyvet. Hány könyv van most a polcon?`), a - c + b, { hint: `${a} − ${c} + ${b} = ${a - c + b}` });
  return NUM(Q(`Az űrhajóban ${a} liter víz van. A legénység ${c} litert elhasznál, de ${b} litert újrahasznosít. Hány liter víz lesz az űrhajóban?`), a - c + b, { hint: `${a} − ${c} + ${b} = ${a - c + b}` }); };
const eqObj = () => { const add = Math.random() < .5, a = rnd(12, 80), b = rnd(5, add ? Math.min(40, 99 - a) : Math.min(40, a - 1)); return { a, b, add, r: add ? a + b : a - b }; };
const eqStr = (e, r) => `${e.a} ${e.add ? '+' : '−'} ${e.b} = ${r}`;
addLv('osszeadas-kivonas',
  { name: 'Kalandos történetek', gen: story1 },
  { name: 'Igaz vagy hamis?', gen: () => { const e = eqObj(), ok = Math.random() < .5, shown = ok ? e.r : off(e.r, [-10, -1, 1, 10, -2, 2, -20], 0);
    return TF(eqStr(e, shown), ok, `Helyesen: ${eqStr(e, e.r)}.`); } },
  { name: 'Hibakereső', gen: () => { let es, strs; do { es = [eqObj(), eqObj(), eqObj(), eqObj()]; strs = es.map(e => eqStr(e, e.r)); } while (new Set(strs).size < 4);
    const bad = eqStr(es[0], off(es[0].r, [-10, -1, 1, 10, -2, 2], 0));
    return CH(Q('Melyik egyenlőség hibás?', 'Három igaz, egy hibás.'), bad, strs.slice(1), { hint: `A hibásat így kell javítani: ${strs[0]}.` }); } });

/* ---------- Szorzótábla ---------- */
addLv('szorzotabla',
  { name: 'Melyik szám van a táblában?', gen: () => { const n = rnd(3, 9), c = n * rnd(2, 10), ws = [];
    for (let t = 0; ws.length < 3 && t < 60; t++) { const v = n * rnd(2, 10) + pick([1, -1, 2, -2]); if (v % n && v > 0 && !ws.includes(v)) ws.push(v); }
    return CH(Q(`Melyik szám szerepel ${art(n)} ${n}-${({ 1: 'es', 2: 'es', 3: 'as', 4: 'es', 5: 'ös', 6: 'os', 7: 'es', 8: 'as', 9: 'es' })[n]} szorzótáblában?`), String(c), ws.map(String), { hint: `${n} × ${c / n} = ${c}, ezért ${c} benne van a táblában.` }); } },
  { name: 'Szorzós történetek', gen: () => { const a = rnd(3, 9), b = rnd(3, 10), k = rnd(0, 3);
    const t = [`Egy teremben ${a} sor van, minden sorban ${b} szék áll. Hány szék van a teremben?`, `A cukrász ${a} tálcára ${b}-${b} süteményt tett. Hány sütemény van összesen?`,
      `Az űrhajón ${a} ablak van, minden ablaknál ${b} lámpa ég. Hány lámpa ég összesen?`, `A sárkány ${a} napon át minden nap ${b} aranyérmét gyűjt. Hány aranyérméje lett?`][k];
    return NUM(Q(t), a * b, { hint: `${a} × ${b} = ${a * b}` }); } },
  { name: 'Igaz vagy hamis?', gen: () => { const a = rnd(3, 12), b = rnd(3, 12), r = a * b, ok = Math.random() < .5, s = ok ? r : off(r, [-a, a, -b, b, 1, -1, 10, -10], 1);
    return TF(`${a} × ${b} = ${s}`, ok, `${a} × ${b} = ${r}.`); } });

/* ---------- Osztás ---------- */
addLv('osztas',
  { name: 'Igazságos osztozkodás', gen: () => { const k = rnd(2, 9), q = rnd(2, 10), n = k * q, i = rnd(0, 3);
    const t = [`${n} gumicukrot szétosztanak ${k} gyerek között egyenlően. Hány gumicukrot kap egy gyerek?`, `A tanár ${n} színes ceruzát oszt szét ${k} csoport között egyenlően. Hány ceruza jut egy csoportra?`,
      `A pék ${n} zsemlét tesz ${k} kosárba egyenlően. Hány zsemle kerül egy kosárba?`, `${n} utas száll be ${k} egyforma kisbuszba. Hány utas ül egy kisbuszban?`][i];
    return NUM(Q(t), q, { hint: `${n} : ${k} = ${q}` }); } },
  { name: 'Gondoltam egy számra', gen: () => { const d = rnd(2, 9), q = rnd(2, 10);
    return Math.random() < .5 ? NUM(Q(`Gondoltam egy számra. Elosztottam ${INS[d]}, és ${q} lett az eredmény. Mire gondoltam?`), d * q, { hint: `Visszafelé: ${q} × ${d} = ${d * q}.` })
      : NUM(Q(`Gondoltam egy számra. Megszoroztam ${INS[d]}, és ${d * q} lett az eredmény. Mire gondoltam?`), q, { hint: `Visszafelé: ${d * q} : ${d} = ${q}.` }); } });

/* ---------- Írásbeli műveletek ---------- */
addLv('irasbeli-muveletek',
  { name: 'Becslés: melyik lehet jó?', gen: () => { const t = rnd(0, 2); let a, b, r, op;
    if (t === 0) { a = rnd(120, 899); b = rnd(120, 899); r = a + b; op = '+'; } else if (t === 1) { a = rnd(500, 999); b = rnd(100, a - 100); r = a - b; op = '−'; } else { a = rnd(12, 99); b = rnd(2, 9); r = a * b; op = '×'; }
    return CH(Q(`${a} ${op} ${b} = ?`, 'Becsüld meg: melyik eredmény lehet a helyes?'), numObj(r), farW(r).map(numObj), { hint: `Kerekítve számolj: az eredmény ${fmt(r)}.` }); } },
  { name: 'Hiányzó számjegy', gen: () => { const add = Math.random() < .5; let a, b, c;
    if (add) { a = rnd(100, 899); b = rnd(100, 899); c = a + b; } else { a = rnd(300, 999); b = rnd(100, a - 100); c = a - b; }
    const parts = [String(a), String(b), String(c)], w = rnd(0, 2), i = rnd(0, parts[w].length - 1), d = parts[w][i];
    parts[w] = parts[w].slice(0, i) + '§' + parts[w].slice(i + 1);
    const html = `${parts[0]} ${add ? '+' : '−'} ${parts[1]} = ${parts[2]}`.replace('§', slot());
    return NUM(Q(html, 'Melyik számjegy hiányzik?'), Number(d), { hint: `A teljes művelet: ${a} ${add ? '+' : '−'} ${b} = ${c}.` }); } });

/* ---------- Szöveges feladatok ---------- */
addLv('szoveges-feladatok',
  { name: 'Bolti kalandok', gen: () => { const it = pick(['füzet', 'ceruza', 'radír', 'matrica', 'lufi']), p = rnd(5, 30) * 10, n = rnd(2, 5), tot = p * n; let paid = Math.ceil(tot / 500) * 500; if (paid === tot) paid += 500;
    return NUM(Q(`Egy ${it} ${p} forintba kerül. Veszel belőle ${n} darabot, és ${paid} forintot adsz a pénztárosnak. Hány forint a visszajáró?`), paid - tot, { hint: `${n} × ${p} = ${tot}, és ${paid} − ${tot} = ${paid - tot}.` }); } },
  { name: 'Kirándulás és hétköznapok', gen: () => { const k = rnd(0, 3);
    if (k === 0) { const a = rnd(3, 8), b = rnd(18, 30), c = rnd(2, 15); return NUM(Q(`Az iskola ${a} osztályába osztályonként ${b} gyerek jár. Közülük ${c} gyerek beteg. Hány gyerek jár az iskolába?`), a * b - c, { hint: `${a} × ${b} − ${c} = ${a * b - c}` }); }
    if (k === 1) { const b = rnd(20, 50), m = rnd(2, 8); return NUM(Q(`A kirándulásra ${b * m} gyerek megy. Egy buszon ${b} fő fér el. Hány busz kell, ha mindegyik megtelik?`), m, { hint: `${b * m} : ${b} = ${m}` }); }
    if (k === 2) { const b = rnd(10, 45); return NUM(Q(`Egy héten át minden nap ${b} percet gyakorolsz. Hány percet gyakoroltál összesen?`), 7 * b, { hint: `7 × ${b} = ${7 * b}` }); }
    const a = rnd(200, 400), b = rnd(40, 90), c = rnd(20, 60); return NUM(Q(`A boltban ${a} üveg üdítő volt. Reggel ${b} üveget, délután ${c} üveget adtak el. Hány üveg maradt?`), a - b - c, { hint: `${a} − ${b} − ${c} = ${a - b - c}` }); } });

/* ---------- Számok összehasonlítása ---------- */
addLv('szamok-osszehasonlitasa',
  { name: 'Legnagyobb és legkisebb', gen: () => { const sc = pick([1, 10, 100]), set = new Set(); while (set.size < 4) set.add(rnd(10, 99) * sc + (sc > 1 ? rnd(0, sc - 1) : 0));
    const ns = [...set], big = Math.random() < .5, c = big ? Math.max(...ns) : Math.min(...ns);
    return CH(Q(`Melyik a ${big ? 'legnagyobb' : 'legkisebb'} szám?`), numObj(c), ns.filter(x => x !== c).map(numObj), { hint: `Sorrendben: ${[...ns].sort((x, y) => x - y).map(fmt).join(' < ')}.` }); } },
  { name: 'Melyik szám van közöttük?', gen: () => { const s = pick([1, 10, 100]), a = rnd(10, 90) * s, g = rnd(3, 9), b = a + g * s, c = a + rnd(1, g - 1) * s;
    return CH(Q(`Melyik szám van ${fmt(a)} és ${fmt(b)} között?`), numObj(c), dedupe([a - s * rnd(1, 3), b + s * rnd(1, 3), pick([a, b])]).map(numObj), { hint: `${fmt(a)} < ${fmt(c)} < ${fmt(b)}` }); } });

/* ---------- Szomszédok, sorozatok ---------- */
const seqOf = (len, d, s) => Array.from({ length: len }, (_, i) => s + i * d);
addLv('szomszedok-sorozatok',
  { name: 'Melyik nem illik közé?', gen: () => { const d = pick([2, 3, 4, 5, 10]) * (Math.random() < .3 ? -1 : 1), s = d < 0 ? rnd(40, 90) : rnd(1, 40), seq = seqOf(5, d, s), i = rnd(1, 3), bad = seq[i] + pick([1, -1]), shown = [...seq]; shown[i] = bad;
    return CH(Q(shown.join(', '), 'Melyik szám nem illik a sorozatba?'), String(bad), seq.filter((_, j) => j !== i).slice(0, 3).map(String), { hint: `A sorozat lépésköze ${Math.abs(d)}, ide ${seq[i]} kellene.` }); } },
  { name: 'Hiányzó szám a sorozatban', gen: () => { const d = rnd(2, 9) * (Math.random() < .3 ? -1 : 1), s = d < 0 ? rnd(50, 90) : rnd(1, 40), seq = seqOf(6, d, s), i = rnd(1, 4), a = seq[i];
    return NUM(Q(seq.map((x, j) => (j === i ? slot() : x)).join(', ')), a, { hint: `A lépésköz ${Math.abs(d)}, ezért a hiányzó szám ${a}.` }); } });

/* ---------- Kerekítés, páros-páratlan ---------- */
addLv('kerekites-paros-paratlan',
  { name: 'Melyik szám lesz...?', gen: () => { const s = pick([10, 100]), T = rnd(5, 99) * s, h = s / 2 - 1, c = T + pick([-1, 1]) * rnd(1, h), ws = [];
    for (let t = 0; ws.length < 3 && t < 60; t++) { const v = T + pick([-1, 1]) * rnd(s / 2 + 1, s + s / 2); if (v > 0 && !ws.includes(v) && v !== c) ws.push(v); }
    return CH(Q(`Melyik szám lesz ${fmt(T)}, ha ${s === 10 ? 'tízesre' : 'százasra'} kerekíted?`), numObj(c), ws.map(numObj), { hint: `${fmt(c)} ${s === 10 ? 'tízesre' : 'százasra'} kerekítve ${fmt(T)}.` }); } },
  { name: 'Páros vagy páratlan lesz?', gen: () => { const a = rnd(10, 99), b = rnd(10, 99), t = rnd(0, 2), r = t === 0 ? a + b : t === 1 ? a * b : Math.abs(a - b), op = ['+', '×', '−'][t];
    return CH(Q(`${Math.max(a, b)} ${op} ${Math.min(a, b)}`, 'Páros vagy páratlan lesz az eredmény?'), r % 2 ? 'páratlan' : 'páros', [r % 2 ? 'páros' : 'páratlan'], { hint: `Az eredmény ${fmt(r)}, ez ${r % 2 ? 'páratlan' : 'páros'}.` }); } });

/* ---------- Római számok ---------- */
const ROMT = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const toRom = n => { let s = ''; for (const [v, r] of ROMT) while (n >= v) { s += r; n -= v; } return s; };
const addRom = n => { let s = ''; for (const [v, r] of ROMT.filter(x => x[1].length === 1)) while (n >= v) { s += r; n -= v; } return s; };
addLv('romai-szamok',
  { name: 'Melyik írásmód helyes?', gen: () => { const n = pick([4, 9, 14, 19, 24, 29, 34, 39, 40, 44, 49, 90, 94, 99, 400, 449, 490, 900]), c = toRom(n), sw = c.length > 1 ? c.slice(0, -2) + c.slice(-1) + c.slice(-2, -1) : c;
    const ws = dedupe([addRom(n), toRom(n + 1), toRom(n - 1), sw]).filter(x => x !== c);
    return CH(Q(`Melyik ${art(n)} ${n} helyes római száma?`), c, ws, { hint: `${n} = ${c}. Kisebb jel a nagyobb előtt kivonást jelent.` }); } },
  { name: 'Számolás római számokkal', gen: () => { const a = rnd(2, 30), b = rnd(1, 20), add = Math.random() < .6, x = add ? a : a + b, r = add ? a + b : a;
    return NUM(Q(`${toRom(x)} ${add ? '+' : '−'} ${toRom(b)} = ?`, 'Az eredményt arab számmal írd be.'), add ? a + b : a, { hint: `${x} ${add ? '+' : '−'} ${b} = ${add ? a + b : a}.` }); } });

/* ---------- Törtek ---------- */
const FD = [2, 3, 4, 5, 6, 8, 10];
addLv('tortek',
  { name: 'Törtrészek a mindennapokban', gen: () => { const d = pick(FD), k = rnd(1, d - 1), m = rnd(2, 10), tot = d * m, left = tot - k * m, i = rnd(0, 2);
    const t = [`Egy ${tot} szeletes pizza ${fr(k, d)} részét megették. Hány szelet maradt?`, `${cap(art(tot))} ${tot} oldalas könyvből ${fr(k, d)} részt elolvastál. Hány oldal van hátra?`, `${cap(art(tot))} ${tot} fős osztály ${fr(k, d)} része kirándulni ment. Hány gyerek maradt itthon?`][i];
    return NUM(Q(t), left, { hint: `${tot} : ${d} = ${m}, ${k} × ${m} = ${k * m}, és ${tot} − ${k * m} = ${left}.` }); } },
  { name: 'Igaz vagy hamis törtek', gen: () => { let a, b, c, d; if (Math.random() < .5) { a = rnd(1, 3); c = a; b = rnd(a + 1, 9); do { d = rnd(a + 1, 9); } while (d === b); } else { b = rnd(4, 10); d = b; a = rnd(1, b - 1); do { c = rnd(1, b - 1); } while (c === a); }
    const lt = Math.random() < .5, truth = lt ? a / b < c / d : a / b > c / d;
    return TF(`${fr(a, b)} ${lt ? '&lt;' : '&gt;'} ${fr(c, d)}`, truth, `Azonos számlálónál a kisebb nevezőjű tört nagyobb, azonos nevezőnél a nagyobb számlálójú tört nagyobb.`); } });

/* ---------- Óra leolvasása ---------- */
addLv('ora-leolvasas',
  { name: 'Mennyi idő telt el?', gen: () => { const h = rnd(1, 9), dur = rnd(1, 3), k = rnd(0, 2);
    if (k === 0) return NUM(Q(`Az óra ${h} órát mutat. Hány órát mutat ${dur} óra múlva?`), h + dur, { hint: `${h} + ${dur} = ${h + dur}` });
    if (k === 1) return NUM(Q(`A film ${h} órakor kezdődik, és ${dur} órán át tart. Hány órakor ér véget?`), h + dur, { hint: `${h} + ${dur} = ${h + dur}` });
    return NUM(Q(`Az iskola ${h} órakor kezdődik, és ${h + dur} órakor ér véget. Hány órát tart?`), dur, { hint: `${h + dur} − ${h} = ${dur}` }); } },
  { name: 'Órák, percek, másodpercek', gen: () => { const n = rnd(2, 5), pool = [['Hány perc 1 óra?', 60], ['Hány perc fél óra?', 30], ['Hány perc negyed óra?', 15], ['Hány perc háromnegyed óra?', 45], ['Hány másodpercből áll egy perc?', 60], ['Hány órából áll egy nap?', 24], ['Hány napból áll egy hét?', 7],
      [`Hány perc ${n} óra?`, 60 * n], [`Hány óra ${60 * n} perc?`, n], ['Hány perc kétszer fél óra?', 60]], p = pick(pool);
    return NUM(Q(p[0]), p[1], { hint: `A helyes válasz: ${p[1]}.` }); } });

/* ---------- Pénz ---------- */
addLv('penz-szamolas',
  { name: 'Piaci kaland', gen: () => { const sets = [['zsemle', 'kifli', 'perec'], ['alma', 'körte', 'szilva'], ['radír', 'ceruza', 'toll'], ['lufi', 'matrica', 'gumicukor']], s = pick(sets), p = s.map(() => rnd(2, 20) * 10);
    return NUM(Q(`A piacon egy ${s[0]} ${p[0]} Ft, egy ${s[1]} ${p[1]} Ft, egy ${s[2]} ${p[2]} Ft. Hány forintba kerül mindhárom együtt?`), p[0] + p[1] + p[2], { hint: `${p[0]} + ${p[1]} + ${p[2]} = ${p[0] + p[1] + p[2]}` }); } },
  { name: 'Legkevesebb érmével', gen: () => { let amt = rnd(2, 79) * 5, n = 0, rest = amt; for (const c of [200, 100, 50, 20, 10, 5]) { n += Math.floor(rest / c); rest %= c; }
    return NUM(Q(`Legalább hány érmével tudsz kifizetni ${amt} forintot?`, 'Az érmék: 5, 10, 20, 50, 100, 200 Ft.'), n, { hint: `Mindig a lehető legnagyobb érmét használd. Így ${n} érme kell.` }); } });

/* ---------- Mértékegységek ---------- */
const UNITS = [{ k: 'h', u: [['km', 1e6], ['m', 1000], ['dm', 100], ['cm', 10], ['mm', 1]] }, { k: 't', u: [['t', 1e6], ['kg', 1000], ['dkg', 10], ['g', 1]] }, { k: 'v', u: [['l', 1000], ['dl', 100], ['cl', 10], ['ml', 1]] }];
const SENSE = [['Egy ceruza hossza', '18 cm', ['18 mm', '18 m', '18 km']], ['Egy szoba magassága', '3 m', ['3 cm', '3 km', '30 m']], ['A Balaton hossza', '78 km', ['78 m', '78 cm', '780 km']], ['Egy tojás tömege', '60 g', ['60 kg', '60 t', '6 g']], ['Egy felnőtt ember tömege', '70 kg', ['70 g', '70 t', '700 kg']],
  ['Egy teáskanál tartalma', '5 ml', ['5 l', '5 dl', '50 l']], ['Egy pohár víz', '2 dl', ['2 l', '2 ml', '20 l']], ['Egy fürdőkád tartalma', '150 l', ['150 ml', '150 dl', '15 000 l']], ['Egy tanítási óra hossza', '45 perc', ['45 óra', '45 másodperc', '45 nap']],
  ['Az iskolatáska tömege', '4 kg', ['4 g', '4 t', '40 kg']], ['Egy lépésed hossza', '70 cm', ['70 mm', '70 m', '7 km']], ['Egy autó tömege', '1200 kg', ['1200 g', '1200 t', '12 kg']], ['Egy focipálya hossza', '100 m', ['100 cm', '100 km', '10 mm']], ['Egy üveg üdítő', '1,5 l', ['1,5 ml', '1,5 dl', '150 l']]];
addLv('mertekegysegek',
  { name: 'Melyik a nagyobb?', gen: () => { let g, x, y; do { g = pick(UNITS); [x, y] = shuffle(g.u).slice(0, 2); } while (Math.max(x[1] / y[1], y[1] / x[1]) > 1000); const v1 = rnd(2, 50), tgt = v1 * x[1], base = Math.max(1, Math.round(tgt / y[1]));
    const v2 = Math.max(1, base + pick([-2, -1, 0, 0, 1, 2]) * Math.max(1, Math.round(base / 20))), t1 = `${fmt(v1)} ${x[0]}`, t2 = `${fmt(v2)} ${y[0]}`, c1 = v1 * x[1], c2 = v2 * y[1];
    const ans = c1 === c2 ? 'Egyenlők' : c1 > c2 ? t1 : t2;
    return CH(Q('Melyik a nagyobb?'), ans, ['Egyenlők', t1, t2], { hint: `Váltsd át ugyanarra a mértékegységre: ${t1} és ${t2}.` }); } },
  { name: 'Mennyi lehet?', gen: () => { const s = pick(SENSE); return CH(Q(`${s[0]} körülbelül:`), s[1], s[2], { hint: `Gondold végig, mennyi a valóságban: ${s[1]}.` }); } });

/* ---------- Geometria ---------- */
const SHP = { 'négyzet': '4 egyenlő oldala és 4 derékszöge van', 'téglalap': '4 derékszöge van, a szemközti oldalai egyenlők, de nem mind', 'háromszög': '3 oldala és 3 csúcsa van', 'kör': 'nincs csúcsa és nincs oldala, minden pontja egyforma messze van a középponttól',
  'ötszög': '5 oldala és 5 csúcsa van', 'hatszög': '6 oldala és 6 csúcsa van', 'rombusz': '4 egyenlő oldala van, de a szögei nem derékszögek', 'trapéz': '4 oldala van, és pontosan két oldala párhuzamos' };
const RA = { 'négyzet': 'a négyzetre', 'téglalap': 'a téglalapra', 'háromszög': 'a háromszögre', 'kör': 'a körre', 'ötszög': 'az ötszögre', 'hatszög': 'a hatszögre', 'rombusz': 'a rombuszra', 'trapéz': 'a trapézra' };
const CONFL = { 'négyzet': ['téglalap', 'rombusz'], 'téglalap': ['négyzet'], 'rombusz': ['négyzet'] };
const GFACT = [['A négyzetnek négy egyenlő oldala van.', 1], ['Minden téglalap négyzet.', 0], ['A háromszögnek három csúcsa van.', 1], ['A hatszögnek hét oldala van.', 0], ['Minden négyzet téglalap is.', 1], ['A téglalap szemközti oldalai egyenlők.', 1], ['Az ötszögnek öt csúcsa van.', 1],
  ['A rombusz minden szöge derékszög.', 0], ['A háromszög szögeinek összege 360 fok.', 0], ['A kör minden pontja egyforma messze van a középponttól.', 1], ['A négyzet területe az oldal kétszerese.', 0], ['A négyzet kerülete négyszer akkora, mint az oldala.', 1]];
addLv('geometria',
  { name: 'Melyik alakzat vagyok?', gen: () => { const names = Object.keys(SHP), a = pick(names), others = names.filter(x => x !== a && !(CONFL[a] || []).includes(x));
    if (Math.random() < .5) return CH(Q(`Melyik állítás igaz ${RA[a]}?`), SHP[a], shuffle(others).slice(0, 3).map(x => SHP[x]), { hint: `${a}: ${SHP[a]}.` });
    return CH(Q('Melyik alakzatról van szó?', `Ez az alakzat: ${SHP[a]}.`), a, shuffle(others).slice(0, 3), { hint: `${a}: ${SHP[a]}.` }); } },
  { name: 'Kerítés és szőnyeg', gen: () => { const b = rnd(2, 12), a = rnd(b + 1, 16);
    return Math.random() < .5 ? NUM(Q(`Egy ${a} m hosszú és ${b} m széles kertet kerítéssel veszünk körbe. Hány méter kerítés kell?`), 2 * (a + b), { hint: `2 × (${a} + ${b}) = ${2 * (a + b)}` })
      : NUM(Q(`Egy ${a} m hosszú és ${b} m széles szoba padlóját szőnyeggel borítjuk. Hány négyzetméter szőnyeg kell?`), a * b, { hint: `${a} × ${b} = ${a * b}` }); } },
  { name: 'Igaz vagy hamis alakzatok', gen: () => { const [s, ok] = pick(GFACT); return TF(esc(s), !!ok, ok ? 'Ez igaz állítás.' : 'Ez hamis állítás.'); } });

/* ---------- Dobókocka ---------- */
addLv('dobokocka',
  { name: 'Szemben lévő oldalak', gen: () => { const x = rnd(1, 6), k = rnd(0, 3);
    if (k === 0) return NUM(Q(`A dobókocka szemben lévő oldalain a pöttyök összege mindig 7. Ha felül ${x} pötty van, hány pötty van alul?`), 7 - x, { hint: `7 − ${x} = ${7 - x}` });
    if (k === 1) return NUM(Q(`A dobókocka egyik oldalán ${x} pötty van. Hány pötty van a vele szemközti oldalon?`, 'A szemben lévő oldalak összege mindig 7.'), 7 - x, { hint: `7 − ${x} = ${7 - x}` });
    if (k === 2) return NUM(Q(`A dobókocka alján ${x} pötty van. Hány pötty van felül?`, 'A szemben lévő oldalak összege mindig 7.'), 7 - x, { hint: `7 − ${x} = ${7 - x}` });
    const v = [pick([1, 6]), pick([2, 5]), pick([3, 4])], sum = v[0] + v[1] + v[2];
    return NUM(Q(`Egy dobókockán három oldal látszik: ${v.join(', ')} pötty. Hány pötty van összesen a három eltakart oldalon?`, 'Az összes oldal pöttyeinek összege 21.'), 21 - sum, { hint: `21 − (${v.join(' + ')}) = ${21 - sum}` }); } },
  { name: 'Hányféleképpen?', gen: () => { const s = rnd(2, 12), n = 6 - Math.abs(s - 7), combos = []; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === s) combos.push(`${i}+${j}`);
    return NUM(Q(`Két dobókockával hányféleképpen lehet a dobott számok összege ${s}?`, 'A két kocka különbözik: az 1 és 2 más, mint a 2 és 1.'), n, { hint: `Lehetőségek: ${combos.join(', ')}. Ez ${n} féleképpen lehet.` }); } },
  { name: 'Melyik nem dobható?', gen: () => { const bad = pick([1, 13, 14, 15]), ok = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 3);
    return CH(Q('Melyik szám NEM lehet két dobókocka összege?'), String(bad), ok.map(String), { hint: 'Két kockával legalább 2, legfeljebb 12 az összeg.' }); } });

/* ================= FELSŐS MATEK ================= */

/* ---------- Negatív számok ---------- */
addLv('negativ-szamok',
  { name: 'Lift a pincébe', neg: true, gen: () => { let s, m, r; do { s = rnd(-3, 6); m = rnd(1, 6) * (Math.random() < .5 ? -1 : 1); r = s + m; } while (r < -4 || r > 10);
    return NUM(Q(`A lift ${s < 0 ? 'a' : art(s)} ${numTxt(s)}. szinten áll (a pincében negatív szintek vannak). ${m > 0 ? `Felmegy ${m} emeletet.` : `Lemegy ${-m} emeletet.`} Hányadik szinten áll most?`), r, { hint: `${par(s)} ${m > 0 ? '+' : '−'} ${Math.abs(m)} = ${par(r)}` }); } },
  { name: 'Számla egyenlege', neg: true, gen: () => { const x = rnd(-6, 6) * 100, y = rnd(1, 9) * 100, plus = Math.random() < .5, r = plus ? x + y : x - y;
    return NUM(Q(`Pisti számláján ${numTxt(x)} Ft van (a negatív szám tartozást jelent). ${plus ? `Befizet ${y} Ft-ot.` : `Kifizet ${y} Ft-ot.`} Mennyi lesz az egyenlege?`), r, { hint: `${par(x)} ${plus ? '+' : '−'} ${y} = ${par(r)}` }); } },
  { name: 'Igaz vagy hamis?', gen: () => { if (Math.random() < .5) { let a, b; do { a = rnd(-20, 20); b = rnd(-20, 20); } while (a === b); const lt = Math.random() < .5;
      return TF(`${numTxt(a)} ${lt ? '&lt;' : '&gt;'} ${numTxt(b)}`, lt ? a < b : a > b, `A számegyenesen a nagyobb szám jobbra áll: ${numTxt(Math.min(a, b))} &lt; ${numTxt(Math.max(a, b))}.`); }
    const a = rnd(-12, 12), b = rnd(-12, 12), r = a - b, ok = Math.random() < .5, s = ok ? r : off(r, [-2, 2, -1, 1, -2 * b || 2], -99);
    return TF(`${par(a)} − ${par(b)} = ${numTxt(s)}`, ok, `Helyesen: ${par(a)} − ${par(b)} = ${numTxt(r)}.`); } });

/* ---------- Tizedes törtek ---------- */
addLv('tizedes-tortek',
  { name: 'Piaci vásárlás', dec: true, gen: () => { const it = pick(['alma', 'burgonya', 'körte', 'banán', 'szőlő', 'paradicsom']), p = rnd(3, 30) * 10, w = rnd(3, 40) / 10;
    return NUM(Q(`Egy kilogramm ${it} ${p} forint. Vettél belőle ${numTxt(w)} kilogrammot. Hány forintot fizettél?`), trim(p * w), { hint: `${p} × ${numTxt(w)} = ${numTxt(trim(p * w))}` }); } },
  { name: 'Melyik a legnagyobb?', gen: () => { const set = new Set(); while (set.size < 4) set.add(trim(rnd(1, 199) / pick([10, 100, 100, 1000])));
    const ns = [...set]; const big = Math.random() < .5, c = big ? Math.max(...ns) : Math.min(...ns);
    return CH(Q(`Melyik a ${big ? 'legnagyobb' : 'legkisebb'} szám?`), { v: String(c), h: numTxt(c) }, ns.filter(x => x !== c).map(x => ({ v: String(x), h: numTxt(x) })), { hint: `Sorrendben: ${[...ns].sort((x, y) => x - y).map(numTxt).join(' < ')}.` }); } },
  { name: 'Hiányzó tized', dec: true, gen: () => { const a = rnd(11, 80) / 10, c = a + rnd(2, 60) / 10, d = trim(c - a);
    return Math.random() < .5 ? NUM(Q(`${numTxt(a)} + ${slot()} = ${numTxt(trim(c))}`), d, { hint: `${numTxt(trim(c))} − ${numTxt(a)} = ${numTxt(d)}` }) : NUM(Q(`${numTxt(trim(c))} − ${slot()} = ${numTxt(a)}`), d, { hint: `${numTxt(trim(c))} − ${numTxt(a)} = ${numTxt(d)}` }); } });

/* ---------- Törtek (haladó) ---------- */
addLv('tortek-halado',
  { name: 'Melyik tört egyenlő vele?', gen: () => { let a, b; do { b = rnd(2, 9); a = rnd(1, b - 1); } while (gcd(a, b) !== 1); const k = rnd(2, 6), n = a * k, d = b * k, o = (x, y) => ({ v: `${x}/${y}`, h: fr(x, y) });
    const cand = [[n + 1, d], [n, d + 1], [n + k, d + k], [n - 1, d]].filter(([x, y]) => x > 0 && x * b !== y * a);
    return CH(Q(`Melyik tört értéke ugyanannyi, mint ${fr(a, b)}?`), o(n, d), cand.slice(0, 3).map(([x, y]) => o(x, y)), { hint: `${fr(a, b)} mindkét részét ${k}-szorosára bővítve ${fr(n, d)} lesz.` }); } },
  { name: 'Zsebpénz-tervezés', gen: () => { const d = pick([4, 5, 6, 8, 10]), k1 = rnd(1, d - 2), k2 = rnd(1, d - 1 - k1), unit = rnd(2, 9) * 10, tot = d * unit, left = tot - (k1 + k2) * unit;
    return NUM(Q(`${cap(art(tot))} ${tot} forintos zsebpénzed ${fr(k1, d)} részét cukorkára, ${fr(k2, d)} részét könyvre költötted. Hány forintod maradt?`), left, { hint: `Egy ${fr(1, d)} rész ${unit} Ft. Elköltöttél ${k1 + k2} részt, maradt ${d - k1 - k2} rész: ${left} Ft.` }); } });

/* ---------- Százalékszámítás ---------- */
addLv('szazalekszamitas',
  { name: 'Osztály és felmérés', gen: () => { let n, p; do { n = pick([20, 25, 30, 40, 50, 60]); p = pick([10, 20, 25, 30, 40, 50, 60, 75, 80]); } while ((n * p) % 100 !== 0);
    const k = rnd(0, 2), t = [`${cap(art(n))} ${n} fős osztály ${p}%-a lány. Hány lány van az osztályban?`, `Egy ${n} lapos kártyapakliból a lapok ${p}%-a piros. Hány piros lap van?`, `${cap(art(n))} ${n} fős közönség ${p}%-a tapsolt. Hány ember tapsolt?`][k];
    return NUM(Q(t), n * p / 100, { hint: `${n} × ${p} : 100 = ${n * p / 100}` }); } },
  { name: 'Melyik ajánlat jobb?', gen: () => { const P = rnd(4, 20) * 500, x = pick([10, 15, 20, 25, 30]), dA = P * x / 100, dB = Math.round((dA + pick([-300, -200, -100, 100, 200, 300])) / 50) * 50;
    const ans = dA === dB ? 'Egyformák' : dA > dB ? 'A ajánlat' : 'B ajánlat';
    return CH(Q(`Egy ${fmt(P)} forintos játékra két kedvezmény van. A: ${x}% kedvezmény. B: ${fmt(dB)} forint kedvezmény. Melyik jobb?`), ans, ['A ajánlat', 'B ajánlat', 'Egyformák'], { hint: `A kedvezmény: ${x}% = ${fmt(dA)} Ft, a másik ${fmt(dB)} Ft.` }); } });

/* ---------- Hatványok, gyökök ---------- */
const sup2 = (b, e) => `${b}<sup>${e}</sup>`;
addLv('hatvanyok-gyokok',
  { name: 'Igaz vagy hamis hatvány', gen: () => { const b = rnd(2, 6), e = rnd(2, 4), r = b ** e, ok = Math.random() < .5, s = ok ? r : off(r, [-b, b, -1, 1, 2 * b], 1);
    return TF(`${sup2(b, e)} = ${fmt(s)}`, ok, `${sup2(b, e)} = ${fmt(r)}.`); } },
  { name: 'Melyik a legnagyobb?', gen: () => { let ex; do { const set = new Map(); while (set.size < 4) { const b = rnd(2, 6), e = rnd(2, 5); if (b ** e <= 1000) set.set(`${b}^${e}`, [b, e]); } ex = [...set.values()]; } while (new Set(ex.map(([b, e]) => b ** e)).size < 4);
    const big = Math.random() < .5, tgt = big ? Math.max(...ex.map(([b, e]) => b ** e)) : Math.min(...ex.map(([b, e]) => b ** e)), o = ([b, e]) => ({ v: `${b}^${e}`, h: sup2(b, e) });
    return CH(Q(`Melyik a ${big ? 'legnagyobb' : 'legkisebb'} érték?`), o(ex.find(([b, e]) => b ** e === tgt)), ex.filter(([b, e]) => b ** e !== tgt).map(o), { hint: ex.map(([b, e]) => `${b}^${e} = ${b ** e}`).join(', ') + '.' }); } },
  { name: 'Tízes hatványok', gen: () => { const n = rnd(2, 9); return Math.random() < .5 ? NUM(Q(`${fmt(10 ** n)} = ${sup2(10, slot())}`), n, { hint: `${fmt(10 ** n)} végén ${n} nulla áll.` }) : NUM(Q(`Hány nulla áll ${sup2(10, n)} értékének végén?`), n, { hint: `${sup2(10, n)} = ${fmt(10 ** n)}.` }); } });

/* ---------- Oszthatóság, prímszámok ---------- */
addLv('oszthatosag-primszamok',
  { name: 'Melyik osztható mindkettővel?', gen: () => { let a, b; do { a = rnd(2, 10); b = rnd(2, 10); } while (a === b || lcm(a, b) > 60);
    const l = lcm(a, b), c = l * rnd(1, Math.floor(300 / l)), ws = [];
    for (let t = 0; ws.length < 3 && t < 200; t++) { const v = rnd(20, 300); if (!(v % a === 0 && v % b === 0) && !ws.includes(v) && (v % a === 0 || v % b === 0 || ws.length === 2)) ws.push(v); }
    return CH(Q(`Melyik szám osztható ${INS[a]} és ${INS[b]} is?`), numObj(c), ws.map(numObj), { hint: `A két szám legkisebb közös többszöröse ${l}, ennek többszöröse a ${c}.` }); } },
  { name: 'Hány prímszám van közte?', gen: () => { const lo = rnd(1, 60), hi = lo + rnd(10, 25); let n = 0; for (let i = lo + 1; i < hi; i++) if (isPrime(i)) n++;
    return NUM(Q(`Hány prímszám van ${lo} és ${hi} között?`), n, { hint: `Prímek: ${Array.from({ length: hi - lo - 1 }, (_, i) => lo + 1 + i).filter(isPrime).join(', ') || 'nincs'}.` }); } },
  { name: 'Szám-detektív', gen: () => { for (let tries = 0; tries < 200; tries++) { const n = rnd(12, 99), d = n % 10, t = Math.floor(n / 10), s = d + t;
      const pool = [`páros`.repeat(n % 2 === 0 ? 1 : 0), `páratlan`.repeat(n % 2 ? 1 : 0), ...[3, 4, 5, 6, 7, 9].filter(x => n % x === 0).map(x => `osztható ${INS[x]}`), `a számjegyeinek összege ${s}`, `a tízesek helyén ${t} áll`, `kisebb, mint ${Math.ceil((n + 1) / 10) * 10 + rnd(0, 9)}`, `nagyobb, mint ${Math.floor((n - 1) / 10) * 10 - rnd(0, 9)}`].filter(Boolean);
      const test = c => { const m = [10, 100]; let k = 0, last = 0; for (let v = 10; v < 100; v++) if (c.every(f => f(v))) { k++; last = v; } return k; };
      const fns = {}; const mk = txt => { if (txt === 'páros') return v => v % 2 === 0; if (txt === 'páratlan') return v => v % 2 === 1; let m;
        if ((m = txt.match(/^osztható (\d+)-/))) return v => v % +m[1] === 0; if ((m = txt.match(/összege (\d+)$/))) return v => Math.floor(v / 10) + v % 10 === +m[1]; if ((m = txt.match(/helyén (\d+) áll/))) return v => Math.floor(v / 10) === +m[1];
        if ((m = txt.match(/^kisebb, mint (\d+)/))) return v => v < +m[1]; if ((m = txt.match(/^nagyobb, mint (\d+)/))) return v => v > +m[1]; return () => true; };
      const chosen = [], order = shuffle(pool); for (const txt of order) { chosen.push(txt); if (test(chosen.map(mk)) === 1) break; if (chosen.length >= 4) break; }
      if (test(chosen.map(mk)) === 1 && chosen.length >= 2) return NUM(Q(`Gondoltam egy kétjegyű számra.`, cap(chosen.join('; ')) + '. Melyik számra gondoltam?'), n, { hint: `A feltételeknek csak a ${n} felel meg.` }); }
    return NUM(Q('Mennyi 12 + 12?'), 24); } });

/* ---------- Egyenletek ---------- */
addLv('egyenletek',
  { name: 'Gondoltam egy számra', gen: () => { const x = rnd(2, 15), a = rnd(2, 9), b = rnd(1, 20), plus = Math.random() < .5, c = plus ? a * x + b : a * x - b;
    return NUM(Q(`Gondoltam egy számra. Megszoroztam ${INS[a]}, ${plus ? 'az eredményhez hozzáadtam' : 'az eredményből elvettem'} ${b} egységet, és ${c} lett. Mire gondoltam?`), x, { hint: `Visszafelé számolj: ${c} ${plus ? '−' : '+'} ${b} = ${a * x}, majd ${a * x} : ${a} = ${x}.` }); } },
  { name: 'Összevonás', gen: () => { const x = rnd(2, 12), a = rnd(2, 8), b = rnd(2, 8), d = rnd(0, 1) ? rnd(1, 15) : 0;
    return NUM(Q(`${a}${vx} + ${b}${vx}${d ? ` + ${d}` : ''} = ${(a + b) * x + d}`, `Mennyi ${vx} értéke?`), x, { hint: `${a}${vx} + ${b}${vx} = ${a + b}${vx}${d ? `, ${(a + b) * x + d} − ${d} = ${(a + b) * x}` : ''}, ezért ${vx} = ${x}.` }); } },
  { name: 'Megoldás-e?', gen: () => { const x = rnd(2, 12), a = rnd(2, 6), b = rnd(1, 15), c = a * x + b, ok = Math.random() < .5, v = ok ? x : off(x, [-2, -1, 1, 2, 3], 1);
    return CH(Q(`${a}${vx} + ${b} = ${c}`, `Igaz vagy hamis: a megoldás ${vx} = ${v}`), ok ? 'Igaz' : 'Hamis', [ok ? 'Hamis' : 'Igaz'], { hint: `Helyettesíts be: ${a} × ${v} + ${b} = ${a * v + b}. Az egyenletben ${c} szerepel.` }); } });

/* ---------- Szögek, háromszögek ---------- */
addLv('szogek-haromszogek',
  { name: 'Az óra mutatói', gen: () => { const h = rnd(1, 11), half = Math.random() < .4; let a;
    if (half) { const diff = Math.abs(30 * h + 15 - 180); a = Math.min(diff, 360 - diff); } else a = Math.min(30 * h, 360 - 30 * h);
    return NUM(Q(`Hány fokos szöget zár be az óra két mutatója ${half ? `${h}:30-kor` : `${h} órakor`}?`, 'Az egész kör 360°, egy óra 30°.'), a, { hint: half ? `A kismutató ${30 * h + 15}°-nál, a nagymutató 180°-nál van.` : `${h} óránál ${30 * h}° vagy ${360 - 30 * h}°, a kisebbik szög: ${a}°.` }); } },
  { name: 'Fordulatok és felezés', gen: () => { const k = rnd(0, 2);
    if (k === 0) { const n = rnd(1, 7); return NUM(Q(`Egy teljes fordulat 360°. Hány fokot fordulsz, ha ${n} negyed fordulatot teszel meg?`), 90 * n, { hint: `${n} × 90° = ${90 * n}°` }); }
    if (k === 1) { const a = rnd(10, 85) * 2; return NUM(Q(`Egy ${a}°-os szöget két egyenlő részre osztunk. Hány fokos lesz az egyik rész?`), a / 2, { hint: `${a} : 2 = ${a / 2}` }); }
    const a = rnd(2, 8) * 10; return NUM(Q(`Egy szög ${a}°-os. Hány fokos a pótszöge (derékszögre egészíti ki)?`), 90 - a, { hint: `90 − ${a} = ${90 - a}` }); } });

/* ---------- Kör és testek ---------- */
addLv('kor-es-testek',
  { name: 'Akvárium', gen: () => { let a, b, c; const D = [10, 20, 25, 30, 40, 50, 60, 80, 100]; do { a = pick(D); b = pick(D); c = pick(D); } while ((a * b * c) % 1000 !== 0 || a * b * c > 500000);
    return NUM(Q(`Egy akvárium belső mérete ${a} cm × ${b} cm × ${c} cm. Hány liter víz fér bele?`, '1 liter = 1000 cm³'), a * b * c / 1000, { hint: `${a} × ${b} × ${c} = ${fmt(a * b * c)} cm³ = ${a * b * c / 1000} liter.` }); } },
  { name: 'Nagyobb kocka', gen: () => { const k = rnd(2, 9), vol = Math.random() < .5;
    return NUM(Q(`Egy kocka minden élét ${k}-szorosára növeljük. Hányszorosára nő a ${vol ? 'térfogata' : 'felszíne'}?`), vol ? k ** 3 : k * k, { hint: vol ? `A térfogat az él köbével nő: ${k}³ = ${k ** 3}.` : `A felszín az él négyzetével nő: ${k}² = ${k * k}.` }); } });

/* ================= MAGYAR NYELV ================= */

/* ---------- j vagy ly ---------- */
const LYS = [['Éjjel a bagoly huhog a fán.', 'bagoly', 'ly'], ['A gólya hosszú lábú madár.', 'gólya', 'ly'], ['Mi a kedvenc játékod?', 'játék', 'j'], ['A hóember szeme két golyó.', 'golyó', 'ly'], ['Télen a folyó is befagy.', 'folyó', 'ly'], ['A király a trónon ül.', 'király', 'ly'],
  ['A hajó lassan úszik a tengeren.', 'hajó', 'j'], ['Anya sajtot tett a kenyérre.', 'sajt', 'j'], ['A kehely tele van vízzel.', 'kehely', 'ly'], ['A tojás a konyhapulton van.', 'tojás', 'j'], ['Az ajtó mögött lépések hallatszanak.', 'ajtó', 'j'], ['A bajusz a bácsi arcán nő.', 'bajusz', 'j'],
  ['A selyem puha és fényes.', 'selyem', 'ly'], ['A buszon minden hely foglalt.', 'hely', 'ly'], ['A tej a hűtőben van.', 'tej', 'j'], ['Az egér a lyukba bújt.', 'lyuk', 'ly'], ['A paplan puha, mint a pehely.', 'pehely', 'ly'], ['A majom a fán ugrál.', 'majom', 'j'],
  ['Milyen szép idő van ma!', 'milyen', 'ly'], ['A születésnapi ajándékot szép papírba csomagoltuk.', 'ajándék', 'j']];
addLv('j-ly-helyesiras',
  { name: 'Mondatkiegészítés', gen: () => { const [s, w, p] = pick(LYS), i = s.indexOf(w), h = hole(w, p);
    return CH(Q(`<span class="wd">${esc(s.slice(0, i))}${h}${esc(s.slice(i + w.length))}</span>`, 'Melyik hiányzik: j vagy ly?'), p, [p === 'ly' ? 'j' : 'ly'], { hint: `A szó helyesen: ${w}.` }); } },
  { name: 'Hibakereső', gen: () => { const bad = lyWord(), good = shuffle([...LY, ...JJ]).filter(x => x !== bad && x !== swapLy(bad)).slice(0, 3), wrong = swapLy(bad);
    return CH(Q('Melyik szót írták el?', 'Három szó helyes, egy hibás.'), wrong, good, { hint: `Helyesen: ${bad}.` }); } });

/* ---------- Hosszú és rövid magánhangzók ---------- */
addLv('hosszu-rovid-hangok',
  { name: 'Hibakereső', gen: () => { const ps = shuffle(LONGV).slice(0, 4);
    return CH(Q('Melyik szót írták el?', 'Három szó helyes, egy hibás.'), ps[0][1], ps.slice(1).map(p => p[0]), { hint: `Helyesen: ${ps[0][0]}.` }); } });

/* ---------- Szótagolás, ABC ---------- */
const HYPH = ['al-ma', 'ab-lak', 'ku-tya', 'is-ko-la', 'ta-ní-tó', 'vi-rág', 'asz-tal', 'ma-dár', 'csil-lag', 'bi-cik-li', 're-pü-lő-gép', 'cso-ko-lá-dé', 'pa-la-csin-ta', 'ta-vasz', 'mo-soly', 'test-vér', 'já-ték', 'e-per', 'kör-te', 'e-gér', 'e-le-fánt', 'ba-nán', 'ke-nyér'];
addLv('szotagolas-abc',
  { name: 'Melyik szó más?', gen: () => { const g = {}; SZOTAGSZO.forEach(w => { (g[syl(w)] = g[syl(w)] || []).push(w); }); const ks = Object.keys(g).filter(k => g[k].length >= 3), k = pick(ks), ok = Object.keys(g).filter(x => x !== k && g[x].length >= 1), o = pick(ok);
    const odd = pick(g[o]), three = shuffle(g[k]).slice(0, 3);
    return CH(Q('Melyik szó szótagszáma különbözik a többiétől?'), odd, three, { hint: `${odd}: ${syl(odd)} szótag, a többi ${k} szótagú.` }); } },
  { name: 'Szóelválasztás', gen: () => { const hy = pick(HYPH), parts = hy.split('-'), w = parts.join(''), ws = [];
    for (let i = 0; i < parts.length - 1; i++) { for (const dlt of [-1, 1]) { const p = [...parts]; if (dlt === -1 && p[i].length > 1) { p[i + 1] = p[i].slice(-1) + p[i + 1]; p[i] = p[i].slice(0, -1); } else if (dlt === 1 && p[i + 1].length > 1) { p[i] = p[i] + p[i + 1][0]; p[i + 1] = p[i + 1].slice(1); } else continue; ws.push(p.join('-')); } }
    return CH(Q(`<span class="wd">${w}</span>`, 'Melyik a helyes szótagolás?'), hy, dedupe(ws).filter(x => x !== hy).slice(0, 3), { hint: `Helyesen: ${hy}.` }); } });

/* ---------- Szófajok ---------- */
const SZM = [['A piros labda gurul.', 'labda', 'piros', 'gurul'], ['A kis kutya ugat.', 'kutya', 'kis', 'ugat'], ['Az öreg tölgy susog.', 'tölgy', 'öreg', 'susog'], ['A szorgalmas méh dolgozik.', 'méh', 'szorgalmas', 'dolgozik'], ['A hideg szél fúj.', 'szél', 'hideg', 'fúj'],
  ['A boldog gyerek nevet.', 'gyerek', 'boldog', 'nevet'], ['Az éhes oroszlán vadászik.', 'oroszlán', 'éhes', 'vadászik'], ['A magas fa nő.', 'fa', 'magas', 'nő'], ['A finom torta sül.', 'torta', 'finom', 'sül'], ['Az okos róka szalad.', 'róka', 'okos', 'szalad'],
  ['A sötét éjszaka leszáll.', 'éjszaka', 'sötét', 'leszáll'], ['A vidám madár énekel.', 'madár', 'vidám', 'énekel'], ['A friss kenyér illatozik.', 'kenyér', 'friss', 'illatozik']];
addLv('szofajok',
  { name: 'Keresd meg a mondatban!', gen: () => { const m = pick(SZM), c = rnd(1, 3), cat = ['', 'főnév', 'melléknév', 'ige'][c], art0 = m[0].split(' ')[0].toLowerCase();
    const ans = m[c], others = [1, 2, 3].filter(x => x !== c).map(x => m[x]).concat(art0);
    return CH(Q(`<span class="wd">${esc(m[0])}</span>`, `Melyik szó ${cat} a mondatban?`), ans, others.slice(0, 3), { hint: `„${ans}” ${cat}.` }); } });

/* ---------- Mondatfajták ---------- */
addLv('mondatfajtak',
  { name: 'Melyik mondat ilyen?', gen: () => { const all = ['kijelentő', 'kérdő', 'felkiáltó', 'felszólító', 'óhajtó'].filter(t => MONDAT[t] && MONDAT[t].length), t = pick(all), good = pick(MONDAT[t]), others = shuffle(all.filter(x => x !== t)).slice(0, 3).map(x => pick(MONDAT[x]));
    return CH(Q(`Melyik ${t} mondat?`), good, others, { hint: `„${good}” ${t} mondat.` }); } });

/* ---------- Toldalékok: -val/-vel ---------- */
const TOLD = [['Anya ___ vágja a kenyeret.', 'késsel', ['késvel', 'késsal', 'késval']], ['A kisfiú ___ játszik.', 'labdával', ['labdaval', 'labdavel', 'labdával'.replace('á', 'a')]], ['Ceruza helyett ___ is írhatsz.', 'tollal', ['tolval', 'tollval', 'tolal']],
  ['A madarat ___ lehet etetni.', 'magokkal', ['magokal', 'magokval', 'magokvel']], ['A teát ___ édesítem.', 'mézzel', ['mézvel', 'mézel', 'mésszel']], ['Szeretek ___ utazni.', 'vonattal', ['vonatval', 'vonatal', 'vonatel']],
  ['Az útra ___ indultunk.', 'busszal', ['bussal', 'busval', 'bussval']], ['Reggel ___ mosok kezet.', 'szappannal', ['szappanal', 'szappanval', 'szappanel']], ['Esténként ___ játszom.', 'testvéremmel', ['testvéremvel', 'testvéremel', 'testvéremal']],
  ['Süss kalácsot ___!', 'liszttel', ['lisztel', 'lisztvel', 'lisztal']], ['A kávét ___ iszom.', 'tejjel', ['tejvel', 'tejel', 'tejal']], ['A földet ___ ásom fel.', 'ásóval', ['ásóvel', 'ásóal', 'ásoval']]];
addLv('toldalekok-val-vel',
  { name: 'Mondatba illő alak', gen: () => { const [s, c, w] = pick(TOLD); return CH(Q(`<span class="wd">${esc(s)}</span>`, 'Melyik alak illik a pontok helyére?'), c, w.filter(x => x !== c), { hint: `A helyes alak: ${c}.` }); } },
  { name: 'Toldalék-hibakereső', gen: () => { const ps = shuffle(TOLD).slice(0, 4), [, c, w] = ps[0], bad = w.filter(x => x !== c)[0];
    return CH(Q('Melyik szó van hibásan leírva?', 'Három szó helyes, egy hibás.'), bad, ps.slice(1).map(p => p[1]), { hint: `Helyesen: ${c}.` }); } });
}
