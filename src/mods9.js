/* ================= KÉMIA (7–8. osztály): elemek, atom, képletek és egyenletek =================
   Minden feladat fix, ellenőrzött adatokból áll (vegyjelek, rendszámok, tömegszámok, kiegyenlített egyenletek). */
GROUPS.push({ id: 'kemia', name: 'Kémia' });
{
/* [név, vegyjel, rendszám, tömegszám, típus (f: fém, n: nemfém, g: nemesgáz), latin név (ha a vegyjel abból ered)] */
const EL = [
  ['hidrogén', 'H', 1, 1, 'n'], ['hélium', 'He', 2, 4, 'g'], ['lítium', 'Li', 3, 7, 'f'], ['berillium', 'Be', 4, 9, 'f'], ['bór', 'B', 5, 11, ''],
  ['szén', 'C', 6, 12, 'n'], ['nitrogén', 'N', 7, 14, 'n'], ['oxigén', 'O', 8, 16, 'n'], ['fluor', 'F', 9, 19, 'n'], ['neon', 'Ne', 10, 20, 'g'],
  ['nátrium', 'Na', 11, 23, 'f', 'natrium'], ['magnézium', 'Mg', 12, 24, 'f'], ['alumínium', 'Al', 13, 27, 'f'], ['szilícium', 'Si', 14, 28, ''], ['foszfor', 'P', 15, 31, 'n'],
  ['kén', 'S', 16, 32, 'n'], ['klór', 'Cl', 17, 35, 'n'], ['argon', 'Ar', 18, 40, 'g'], ['kálium', 'K', 19, 39, 'f', 'kalium'], ['kalcium', 'Ca', 20, 40, 'f']
];
const EX = [
  ['vas', 'Fe', 26, 0, 'f', 'ferrum'], ['réz', 'Cu', 29, 0, 'f', 'cuprum'], ['cink', 'Zn', 30, 0, 'f'], ['ezüst', 'Ag', 47, 0, 'f', 'argentum'], ['ón', 'Sn', 50, 0, 'f', 'stannum'],
  ['arany', 'Au', 79, 0, 'f', 'aurum'], ['higany', 'Hg', 80, 0, 'f', 'hydrargyrum'], ['ólom', 'Pb', 82, 0, 'f', 'plumbum'], ['jód', 'I', 53, 0, 'n'], ['bróm', 'Br', 35, 0, 'n']
];
const ALL = [...EL, ...EX], FIRST10 = EL.slice(0, 10), LATIN = ALL.filter(e => e[5]);
const TYPE = { f: 'fém', n: 'nemfém', g: 'nemesgáz' };
const sym = s => `<span class="vj">${s}</span>`;
const oth = (pool, e, k, f) => shuffle(pool.filter(x => x !== e)).slice(0, k).map(f);
const ch2 = (q, good, pool, e, f, o) => CH(q, f(e), oth(pool, e, 3, f), o);
const latinNote = e => (e[5] ? ` (a latin név: ${e[5]})` : '');
/* képlet: számjegy a betű vagy zárójel után alsó index */
const fm = s => s.replace(/([A-Za-z)])(\d+)/g, '$1<sub>$2</sub>');
const az = w => (/^[aáeéiíoóöőuúüű]/i.test(w) ? 'az' : 'a');
const Az = w => (/^[aáeéiíoóöőuúüű]/i.test(w) ? 'Az' : 'A');
/* névelő képlet vagy vegyjel elé: a betűk kiejtése szerint (en, o, es, ef... → az) */
const azF = f => `${/^[AEFILMNORSUX]/.test(f) ? 'Az' : 'A'} ${f}`;
const sup = (s, c) => `${s}<sup>${c}</sup>`;

mod({
  slug: 'elemek-vegyjelek', title: 'Elemek és vegyjelek gyakorló', short: 'Elemek és vegyjelek', group: 'kemia', glyph: 'Na Fe', hue: 3, grades: [7, 8],
  desc: 'Gyakorold az elemek nevét és vegyjelét, a rendszámot, a fémeket és nemfémeket a 7–8. osztályos kémiához.',
  seo: 'Az Elemek és vegyjelek gyakorló a hetedik és nyolcadik osztályos kémia alapjait gyakoroltatja: az első húsz elem és a leggyakoribb fémek nevét és vegyjelét, a latin eredetű jeleket (Na, K, Fe, Cu, Ag, Au, Hg, Pb, Sn), az elemek sorszámát a periódusos rendszerben, valamint azt, hogy egy elem fém, nemfém vagy nemesgáz. Rövid, azonnali visszajelzéssel és nyomtatható munkalappal, ingyen, regisztráció nélkül.',
  levels: [
    { name: 'Az első 10 elem: névből vegyjel', gen: () => { const e = pick(FIRST10); return ch2(Q(esc(e[0]), 'Melyik a vegyjele?'), e, FIRST10, e, x => ({ v: x[1], h: sym(x[1]) }), { hint: `${e[0]}: ${e[1]}.` }); } },
    { name: 'Az első 20 elem: vegyjelből név', gen: () => { const e = pick(EL); return ch2(Q(sym(e[1]), 'Melyik elem vegyjele ez?'), e, EL, e, x => ({ v: x[0], h: esc(x[0]) }), { hint: `${e[1]}: ${e[0]}.` }); } },
    { name: 'Névből vegyjel (az első 20 elem)', gen: () => { const e = pick(EL); return ch2(Q(esc(e[0]), 'Melyik a vegyjele?'), e, EL, e, x => ({ v: x[1], h: sym(x[1]) }), { hint: `${e[0]}: ${e[1]}${latinNote(e)}.` }); } },
    { name: 'Gyakori fémek és nemfémek', gen: () => { const e = pick(ALL.filter(x => x[2] > 20 || Math.random() < .25)), toSym = Math.random() < .5; return toSym ? ch2(Q(esc(e[0]), 'Melyik a vegyjele?'), e, ALL, e, x => ({ v: x[1], h: sym(x[1]) }), { hint: `${e[0]}: ${e[1]}${latinNote(e)}.` }) : ch2(Q(sym(e[1]), 'Melyik elem vegyjele ez?'), e, ALL, e, x => ({ v: x[0], h: esc(x[0]) }), { hint: `${e[1]}: ${e[0]}${latinNote(e)}.` }); } },
    { name: 'Latin eredetű vegyjelek', gen: () => { const e = pick(LATIN); return Math.random() < .5 ? ch2(Q(esc(e[0]), `Melyik a vegyjele? (latin név: ${e[5]})`), e, LATIN, e, x => ({ v: x[1], h: sym(x[1]) }), { hint: `${e[0]}: ${e[1]}, a latin ${e[5]} névből.` }) : ch2(Q(sym(e[1]), 'Melyik elem vegyjele ez?'), e, LATIN, e, x => ({ v: x[0], h: esc(x[0]) }), { hint: `${e[1]}: ${e[0]}, a latin ${e[5]} névből.` }); } },
    { name: 'Rendszám: hányadik elem?', gen: () => { const e = pick(EL), up = Math.random() < .5; return up ? CH(Q(`${e[2]}.`, 'Melyik elem a periódusos rendszer ezen a helyén?'), { v: e[0], h: esc(e[0]) }, oth(EL, e, 3, x => ({ v: x[0], h: esc(x[0]) })), { hint: `${e[2]}. elem: ${e[0]} (${e[1]}).` }) : NUM(Q(`${esc(e[0])} (${sym(e[1])})`, 'Mennyi a rendszáma?'), e[2], { hint: `${Az(e[0])} ${e[0]} rendszáma ${e[2]}, tehát a periódusos rendszer ${e[2]}. eleme.` }); } },
    { name: 'Fém, nemfém vagy nemesgáz?', gen: () => { const e = pick(ALL.filter(x => x[4])); return CH(Q(`${esc(e[0])} (${sym(e[1])})`, 'Fém, nemfém vagy nemesgáz?'), { v: TYPE[e[4]], h: TYPE[e[4]] }, Object.values(TYPE).filter(t => t !== TYPE[e[4]]), { hint: `${Az(e[0])} ${e[0]} ${TYPE[e[4]]}.` }); } }
  ]
});

mod({
  slug: 'atom-felepitese', title: 'Az atom felépítése gyakorló', short: 'Az atom felépítése', group: 'kemia', glyph: '<span>p<sup>+</sup> e<sup>−</sup></span>', hue: 1, grades: [7, 8],
  desc: 'Proton, neutron, elektron, rendszám, tömegszám és ionok: gyakorold az atom felépítését számolós és választós feladatokkal.',
  seo: 'Az atom felépítése gyakorló a hetedik és nyolcadik osztályos kémia egyik fő témáját gyakoroltatja: a részecskék töltését és helyét, a protonok és az elektronok számát, a neutronok kiszámítását a tömegszámból és a rendszámból, valamint az ionok elektronszámát. A feladatok az első húsz elem adataira épülnek, azonnali visszajelzéssel, ingyen, regisztráció nélkül.',
  levels: [
    { name: 'Részecskék és töltésük', gen: () => { const P = [['proton', 'pozitív (+)'], ['neutron', 'semleges (0)'], ['elektron', 'negatív (−)']], t = pick(P), form = rnd(0, 1);
      return form ? CH(Q(esc(t[0]), 'Milyen a töltése?'), { v: t[1], h: t[1] }, P.filter(x => x !== t).map(x => ({ v: x[1], h: x[1] })).concat([]), { hint: `${Az(t[0])} ${t[0]} töltése: ${t[1]}.` }) : CH(Q(`<span class="el">${esc(t[1])}</span>`, 'Melyik részecske töltése ez?'), t[0], P.filter(x => x !== t).map(x => x[0]), { hint: `${t[1]} töltésű ${az(t[0])} ${t[0]}.` }); } },
    { name: 'Hol vannak a részecskék?', gen: () => { const P = [['proton', 'az atommagban'], ['neutron', 'az atommagban'], ['elektron', 'az elektronburokban']], t = pick(P); return CH(Q(esc(t[0]), 'Hol található az atomban?'), { v: t[1], h: t[1] }, ['az atommagban', 'az elektronburokban'].filter(x => x !== t[1]).map(x => ({ v: x, h: x })).concat([{ v: 'az atomon kívül', h: 'az atomon kívül' }]), { hint: `${Az(t[0])} ${t[0]} ${t[1]} található.` }); } },
    { name: 'Hány protonja és elektronja van?', gen: () => { const e = pick(EL), p = Math.random() < .5; return NUM(Q(`${esc(e[0])} (${sym(e[1])}), rendszáma ${e[2]}`, p ? 'Hány protonja van az atomnak?' : 'Hány elektronja van a semleges atomnak?'), e[2], { hint: `A rendszám megmutatja a protonok számát, és a semleges atomban ugyanannyi az elektron: ${e[2]}.` }); } },
    { name: 'Hány neutronja van?', gen: () => { const e = pick(EL), n = e[3] - e[2]; return NUM(Q(`${esc(e[0])} (${sym(e[1])}): rendszám ${e[2]}, tömegszám ${e[3]}`, 'Hány neutronja van?'), n, { hint: `neutronok száma = tömegszám − rendszám = ${e[3]} − ${e[2]} = ${n}.` }); } },
    { name: 'Tömegszám a részecskékből', gen: () => { const e = pick(EL), n = e[3] - e[2]; return NUM(Q(`${e[2]} proton és ${n} neutron`, 'Mennyi a tömegszám?'), e[3], { hint: `tömegszám = protonok + neutronok = ${e[2]} + ${n} = ${e[3]}.` }); } },
    { name: 'Ionok elektronszáma', gen: () => { const I = [['Na', '+', 11], ['K', '+', 19], ['Li', '+', 3], ['Mg', '2+', 12], ['Ca', '2+', 20], ['Al', '3+', 13], ['Cl', '−', 17], ['F', '−', 9], ['O', '2−', 8], ['S', '2−', 16]], [s, c, z] = pick(I), q = c.length === 1 ? 1 : +c[0], pos = !c.includes('−'), e = pos ? z - q : z + q;
      return NUM(Q(sup(s, c), 'Hány elektronja van ennek az ionnak?'), e, { hint: pos ? `${s}: ${z} elektron, ${q} elektront leadott, így ${z} − ${q} = ${e}.` : `${s}: ${z} elektron, ${q} elektront felvett, így ${z} + ${q} = ${e}.` }); } }
  ]
});

/* képletek: [név, képlet, típus (e: elem, v: vegyület)] */
const FORM = [['víz', 'H2O', 'v'], ['szén-dioxid', 'CO2', 'v'], ['szén-monoxid', 'CO', 'v'], ['nátrium-klorid', 'NaCl', 'v'], ['metán', 'CH4', 'v'], ['ammónia', 'NH3', 'v'], ['hidrogén-klorid (sósav)', 'HCl', 'v'], ['kénsav', 'H2SO4', 'v'],
  ['nátrium-hidroxid', 'NaOH', 'v'], ['kalcium-karbonát (mészkő)', 'CaCO3', 'v'], ['kén-dioxid', 'SO2', 'v'], ['magnézium-oxid', 'MgO', 'v'], ['kalcium-oxid (égetett mész)', 'CaO', 'v'], ['hidrogén-peroxid', 'H2O2', 'v'], ['szőlőcukor', 'C6H12O6', 'v'],
  ['hidrogén (gáz)', 'H2', 'e'], ['oxigén (gáz)', 'O2', 'e'], ['nitrogén (gáz)', 'N2', 'e'], ['klór (gáz)', 'Cl2', 'e'], ['vas', 'Fe', 'e'], ['réz', 'Cu', 'e']];
const SIMPLE = FORM.filter(f => ['H2O', 'CO2', 'NaCl', 'CH4', 'NH3', 'HCl', 'CO', 'SO2', 'MgO', 'H2', 'O2', 'N2'].includes(f[1]));
const atoms = f => { const m = {}; for (const x of f.matchAll(/([A-Z][a-z]?)(\d*)/g)) m[x[1]] = (m[x[1]] || 0) + (x[2] ? +x[2] : 1); return m; };
const total = f => Object.values(atoms(f)).reduce((a, b) => a + b, 0);
/* egyenletek: [bal oldal, jobb oldal], tagok: [együttható, képlet] */
const EQ = [[[[2, 'H2'], [1, 'O2']], [[2, 'H2O']]], [[[2, 'Na'], [1, 'Cl2']], [[2, 'NaCl']]], [[[2, 'Mg'], [1, 'O2']], [[2, 'MgO']]], [[[1, 'C'], [1, 'O2']], [[1, 'CO2']]], [[[1, 'N2'], [3, 'H2']], [[2, 'NH3']]],
  [[[1, 'CH4'], [2, 'O2']], [[1, 'CO2'], [2, 'H2O']]], [[[4, 'Fe'], [3, 'O2']], [[2, 'Fe2O3']]], [[[2, 'H2O2']], [[2, 'H2O'], [1, 'O2']]], [[[1, 'CaCO3']], [[1, 'CaO'], [1, 'CO2']]], [[[2, 'Al'], [3, 'Cl2']], [[2, 'AlCl3']]],
  [[[1, 'Zn'], [2, 'HCl']], [[1, 'ZnCl2'], [1, 'H2']]], [[[2, 'Cu'], [1, 'O2']], [[2, 'CuO']]], [[[4, 'Al'], [3, 'O2']], [[2, 'Al2O3']]], [[[2, 'H2O']], [[2, 'H2'], [1, 'O2']]], [[[2, 'Na'], [2, 'H2O']], [[2, 'NaOH'], [1, 'H2']]],
  [[[1, 'NaOH'], [1, 'HCl']], [[1, 'NaCl'], [1, 'H2O']]], [[[2, 'CO'], [1, 'O2']], [[2, 'CO2']]], [[[2, 'SO2'], [1, 'O2']], [[2, 'SO3']]], [[[1, 'S'], [1, 'O2']], [[1, 'SO2']]], [[[1, 'Fe'], [1, 'S']], [[1, 'FeS']]]];
const EQ_C = EQ.filter(e => [...e[0], ...e[1]].some(t => t[0] > 1));
const term = ([c, f], hide) => `${hide ? '<span class="slot">?</span>' : c > 1 ? c : ''}${hide || c > 1 ? '&nbsp;' : ''}${fm(f)}`;
const side = (a, h) => a.map((t, i) => term(t, h === t)).join(' + ');
const eqHTML = (eq, h) => `${side(eq[0], h)} → ${side(eq[1], h)}`;

mod({
  slug: 'kepletek-egyenletek', title: 'Képletek és egyenletek gyakorló', short: 'Képletek és egyenletek', group: 'kemia', glyph: '<span>H<sub>2</sub>O</span>', hue: 2, grades: [7, 8],
  desc: 'Vegyületek képlete és neve, atomok számlálása, elem és vegyület, reakcióegyenletek rendezése 7–8. osztályosoknak.',
  seo: 'A Képletek és egyenletek gyakorló a kémia hetedik és nyolcadik osztályos anyagát gyakoroltatja: a leggyakoribb vegyületek (víz, szén-dioxid, nátrium-klorid, metán, ammónia, kénsav) nevét és képletét, az atomok megszámolását a képletben, az elemek és vegyületek megkülönböztetését, majd a kémiai egyenletek rendezését: a hiányzó együttható megkeresését és az atomok számolását a nyíl két oldalán. Azonnali visszajelzéssel, ingyen, regisztráció nélkül.',
  levels: [
    { name: 'Elem vagy vegyület?', gen: () => { const f = pick(FORM); return CH(Q(`<span class="fm">${fm(f[1])}</span>`, 'Elem vagy vegyület?'), f[2] === 'e' ? 'elem' : 'vegyület', [f[2] === 'e' ? 'vegyület' : 'elem'], { hint: f[2] === 'e' ? `${azF(f[1])} egyféle atomból áll, ezért elem.` : `${azF(f[1])} többféle elem atomjaiból épül fel, ezért vegyület.` }); } },
    { name: 'Név és képlet: névből képlet', gen: () => { const f = pick(FORM.filter(x => SIMPLE.includes(x))), o = shuffle(FORM.filter(x => x !== f)).slice(0, 3); return CH(Q(esc(f[0]), 'Melyik a képlete?'), { v: f[1], h: fm(f[1]) }, o.map(x => ({ v: x[1], h: fm(x[1]) })), { hint: `${f[0]}: ${fm(f[1])}.` }); } },
    { name: 'Név és képlet: képletből név', gen: () => { const f = pick(FORM), o = shuffle(FORM.filter(x => x !== f)).slice(0, 3); return CH(Q(`<span class="fm">${fm(f[1])}</span>`, 'Melyik anyag képlete ez?'), { v: f[0], h: esc(f[0]) }, o.map(x => ({ v: x[0], h: esc(x[0]) })), { hint: `${fm(f[1])}: ${f[0]}.` }); } },
    { name: 'Hány atom van a képletben?', gen: () => { const f = pick(FORM.filter(x => /\d/.test(x[1]) || /[A-Z][a-z]?[A-Z]/.test(x[1]))), a = atoms(f[1]), el = Object.keys(a), t = Math.random() < .5;
      return t ? NUM(Q(`<span class="fm">${fm(f[1])}</span>`, 'Összesen hány atom van a képletben?'), total(f[1]), { hint: `${fm(f[1])}: ${el.map(k => `${a[k]} ${k}`).join(' + ')}, összesen ${total(f[1])} atom.` }) : (() => { const k = pick(el); return NUM(Q(`<span class="fm">${fm(f[1])}</span>`, `Hány ${k}-atom van a képletben?`), a[k], { hint: `${a[k] === 1 ? 'Alsó index nélkül 1' : 'Az alsó index mutatja: ' + a[k] + ' darab'} ${k}-atom van.` }); })(); } },
    { name: 'Hány atom? Együtthatóval', gen: () => { const f = pick(FORM.filter(x => x[2] === 'v' && /\d/.test(x[1]))), c = rnd(2, 4), a = atoms(f[1]), k = pick(Object.keys(a)); return NUM(Q(`<span class="fm">${c} ${fm(f[1])}</span>`, `Összesen hány ${k}-atom van?`), c * a[k], { hint: `${c} egységben ${c} · ${a[k]} = ${c * a[k]} darab ${k}-atom van.` }); } },
    { name: 'Egyenletrendezés: a hiányzó együttható', gen: () => { const eq = pick(EQ_C), terms = [...eq[0], ...eq[1]].filter(t => t[0] > 1), h = pick(terms);
      return NUM(Q(`<span class="fm">${eqHTML(eq, h)}</span>`, 'Melyik számot kell a kérdőjel helyére írni?'), h[0], { hint: `A kiegyenlített egyenlet: ${eqHTML(eq)}. Mindkét oldalon ugyanannyi atom van.` }); } },
    { name: 'Atomok számolása az egyenletben', gen: () => { const eq = pick(EQ.filter(e => [...e[0], ...e[1]].some(t => t[0] > 1))), side0 = Math.random() < .5, S = eq[side0 ? 0 : 1], els = [...new Set(S.flatMap(t => Object.keys(atoms(t[1]))))], k = pick(els), n = S.reduce((s, t) => s + t[0] * (atoms(t[1])[k] || 0), 0);
      return NUM(Q(`<span class="fm">${eqHTML(eq)}</span>`, `Hány ${k}-atom van a nyíl ${side0 ? 'bal' : 'jobb'} oldalán?`), n, { hint: `Ennyi ${k}-atom van a nyíl ${side0 ? 'bal' : 'jobb'} oldalán: ${n}. Az együtthatót szorozni kell az alsó indexszel.` }); } }
  ]
});
}
