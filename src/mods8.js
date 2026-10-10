/* ================= KÉPES FELADATOK: olvasás nélkül, elsősöknek (és az óvodából érkezőknek) =================
   A kérdés képekből és számokból áll: számlálás, szám és mennyiség, több/kevesebb, formák, minták, párosítás, kakukktojás.
   A rövid utasítást a szülő felolvashatja, de a feladatok többsége szöveg nélkül is érthető. */
GROUPS.unshift({ id: 'kepes', name: 'Képes feladatok (olvasás nélkül)' });
{
const OBJ = ['🍎', '🍌', '🍓', '⭐', '🐟', '🐞', '🎈', '🚗', '🌸', '🍪', '🐶', '⚽', '🍇', '🐥', '🧸'];
const rep = (e, n) => Array(n).fill(e).join('');
const rows = (e, n) => (n <= 5 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)]).map(k => `<div>${rep(e, k)}</div>`).join('');
const cnt = (e, n) => `<div class="cnts" role="img" aria-label="Képek, számold meg őket">${rows(e, n)}</div>`;
const small = (e, n) => `<span class="mini">${(n <= 5 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)]).map(k => `<span>${rep(e, k)}</span>`).join('')}</span>`;
const nearNums = (n, lo, hi) => { const s = new Set([n]); let k = 0; while (s.size < 4 && k++ < 50) { const x = n + pick([-2, -1, 1, 2]); if (x >= lo && x <= hi) s.add(x); } return [...s].filter(x => x !== n); };
const SUB = 'Számold meg, hány van!';

const SHAPES = ['🔴', '🟦', '🔺', '⭐', '❤️', '🟩', '🟡', '🔷', '🔶', '🟣', '🟠', '🟤'];
const PAIRS = [['🐶', '🦴'], ['🐝', '🍯'], ['🐱', '🥛'], ['🐒', '🍌'], ['🐰', '🥕'], ['🦷', '🪥'], ['🔑', '🚪'], ['🌧️', '☔'], ['⚽', '🥅'], ['🐮', '🥛'], ['🚗', '⛽'], ['🐔', '🥚']];
const PAIRN = { '🦴': 'csont', '🍯': 'méz', '🥛': 'tej', '🍌': 'banán', '🥕': 'répa', '🪥': 'fogkefe', '🚪': 'ajtó', '☔': 'esernyő', '🥅': 'kapu', '⛽': 'benzinkút', '🥚': 'tojás' };
const CATS = [['gyümölcs', ['🍎', '🍌', '🍓', '🍇', '🍐', '🍊']], ['állat', ['🐶', '🐱', '🐰', '🐻', '🐸', '🐷']], ['jármű', ['🚗', '🚌', '🚲', '🚂', '✈️', '🚢']], ['étel', ['🍕', '🍔', '🍟', '🍪', '🍩', '🧀']], ['virág és fa', ['🌸', '🌻', '🌷', '🌳', '🌲', '🍀']]];
const emo = (e, cls = '') => `<div class="big emo${cls}">${e}</div>`;

const countLv = (lo, hi) => () => { const e = pick(OBJ), n = rnd(lo, hi); return CH(Q(cnt(e, n), SUB), String(n), nearNums(n, 1, 10).map(String), { hint: `${n} darab van. Számold meg egyesével: ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}.` }); };

mod({
  slug: 'kepes-feladatok', title: 'Képes feladatok elsősöknek', short: 'Képes feladatok', group: 'kepes', glyph: '🍎🍎🍎', hue: 4, grades: [1, 2],
  desc: 'Olvasás nélkül is játszható feladatok: számlálás, szám és mennyiség, több és kevesebb, formák, minták, párosítás és kakukktojás képekkel.',
  seo: 'A Képes feladatok olvasás nélkül is játszható gyakorló a legkisebbeknek: képek alapján kell megszámolni a tárgyakat, párosítani a számot a mennyiséggel, eldönteni, melyik a több, felismerni a formákat, folytatni a mintát, párba állítani a képeket és megtalálni a kakukktojást. Az elsősök a szülő segítsége nélkül is boldogulnak, mert a feladatok emojikkal és számokkal vannak megadva, a rövid szöveget pedig fel lehet olvasni. Ingyenes, hang nélküli, regisztráció nélkül használható.',
  levels: [
    { name: 'Számolás 1–5 képekkel', gen: countLv(1, 5) },
    { name: 'Számolás 6–10 képekkel', gen: countLv(6, 10) },
    { name: 'Szám és mennyiség: melyikből van ennyi?', gen: () => { const e = pick(OBJ), n = rnd(2, 9), ws = nearNums(n, 1, 10).slice(0, 3); return CH(Q(`<div class="big num">${n}</div>`, 'Melyik képen van ennyi?'), { v: String(n), h: small(e, n) }, ws.map(w => ({ v: String(w), h: small(e, w) })), { grid: true, hint: `A szám ${n}, ezért ${n} darab kell: ${rep(e, n)}.` }); } },
    { name: 'Melyik a több? Melyik a kevesebb?', gen: () => { const e = pick(OBJ), a = rnd(1, 9), b = pick([a - 2, a - 1, a + 1, a + 2].filter(x => x >= 1 && x <= 10)), more = Math.random() < .5, win = more ? Math.max(a, b) : Math.min(a, b), lose = win === a ? b : a;
      return CH(Q(emo(more ? '⬆️' : '⬇️'), more ? 'Melyik a több?' : 'Melyik a kevesebb?'), { v: String(win), h: small(e, win) }, [{ v: String(lose), h: small(e, lose) }], { grid: true, hint: `${win} és ${lose} közül a ${more ? 'nagyobb' : 'kisebb'} szám: ${win}.` }); } },
    { name: 'Formák: melyik ugyanolyan?', gen: () => { const ws = shuffle(SHAPES), c = ws[0]; return CH(Q(emo(c), 'Melyik ugyanilyen?'), { v: c, h: `<span class="shp">${c}</span>` }, ws.slice(1, 4).map(w => ({ v: w, h: `<span class="shp">${w}</span>` })), { grid: true, hint: 'Nézd meg jól az alakját és a színét: ugyanilyet keresünk.' }); } },
    { name: 'Folytasd a mintát!', gen: () => { const [x, y, z] = shuffle(SHAPES).slice(0, 3), t = rnd(0, 2), seq = [[x, y, x, y, x, y, x], [x, x, y, x, x, y, x], [x, y, z, x, y, z, x]][t], len = rnd(5, 6), s = seq.slice(0, len), ans = seq[len], pool = shuffle([x, y, z, ...SHAPES].filter(v => v !== ans));
      return CH(Q(`<div class="big emo pat"><span class="seq">${[...s, '❔'].map(v => `<i>${v}</i>`).join('')}</span></div>`, 'Mi jön a kérdőjel helyére?'), { v: ans, h: `<span class="shp">${ans}</span>` }, pool.slice(0, 2).map(w => ({ v: w, h: `<span class="shp">${w}</span>` })), { hint: `A minta ismétlődik: ${seq.slice(0, len + 1).join(' ')}.` }); } },
    { name: 'Mi tartozik össze?', gen: () => { const ps = shuffle(PAIRS), [a, b] = ps[0]; return CH(Q(emo(a), 'Mi tartozik hozzá?'), { v: b, h: `<span class="shp">${b}</span>` }, ps.slice(1, 4).map(p => ({ v: p[1], h: `<span class="shp">${p[1]}</span>` })), { grid: true, hint: `${a} és ${b} összetartozik${PAIRN[b] ? ' (' + PAIRN[b] + ')' : ''}.` }); } },
    { name: 'Kakukktojás: melyik nem illik közéjük?', gen: () => { const cs = shuffle(CATS), [nm, A] = cs[0], B = cs[1][1], odd = pick(B), three = shuffle(A).slice(0, 3), all = shuffle([...three, odd]);
      return CH(Q(emo('❓'), 'Melyik nem illik a többi közé?'), { v: odd, h: `<span class="shp">${odd}</span>` }, three.map(w => ({ v: w, h: `<span class="shp">${w}</span>` })), { grid: true, hint: `A többi mind ${nm}, ez nem az: ${odd}.` }); } }
  ]
});
}
