(()=>{
'use strict';
/* ---------- Segédfüggvények ---------- */
const $ = (s, r = document) => r.querySelector(s);
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = rnd(0, i); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => (n < 0 ? '−' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/* a / az névelő a kimondott szám első hangja szerint */
const art = n => {
  n = Math.abs(n);
  if (n >= 1000) return Math.floor(n / 1000) === 1 ? 'az' : art(Math.floor(n / 1000));
  if (n < 10) return (n === 1 || n === 5) ? 'az' : 'a';
  if (n < 100) return Math.floor(n / 10) === 5 ? 'az' : 'a';
  return Math.floor(n / 100) === 5 ? 'az' : 'a';
};
const fr = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const Q = (main, sub) => `<div class="big${main.replace(/<[^>]*>/g, '').length > 46 ? ' txt' : ''}">${main}</div>${sub ? `<div class="sub">${sub}</div>` : ''}`;
const slot = t => `<span class="slot">${t === undefined ? '?' : t}</span>`;

/* Kérdéstípusok: num = számbillentyűzet, choice = választógombok */
const NUM = (q, ans, o = {}) => ({ kind: 'num', q, ans: Number(ans), ...o });
const CH = (q, correct, wrongs, o = {}) => {
  const norm = x => (typeof x === 'object' ? x : { v: String(x), h: esc(String(x)) });
  const c = norm(correct);
  const seen = new Set([c.v]);
  const w = [];
  for (const x of wrongs.map(norm)) if (!seen.has(x.v)) { seen.add(x.v); w.push(x); }
  return { kind: 'choice', q, ans: c.v, choices: shuffle([c, ...w.slice(0, 3)]), ansLabel: c.h, ...o };
};
const CMP = (q, a, b, o = {}) => {
  const s = a < b ? '<' : a > b ? '>' : '=';
  return { kind: 'choice', q, ans: s, cmp: true, ansLabel: s,
    choices: [{ v: '<', h: '&lt;', t: 'kisebb' }, { v: '=', h: '=', t: 'egyenlő' }, { v: '>', h: '&gt;', t: 'nagyobb' }], ...o };
};
const digitShuffle = n => {
  const d = String(n).split('');
  for (let k = 0; k < 20; k++) { const s = shuffle(d); if (s[0] !== '0') return Number(s.join('')); }
  return n;
};

/* Modulok gyűjtője */
const MODS = [];
const GROUPS = [
  { id: 'szamolas', name: 'Számolás' },
  { id: 'szamok', name: 'Számok és törtek' },
  { id: 'meres', name: 'Idő, pénz, mértékegységek' },
  { id: 'forma', name: 'Alakzatok és kocka' }
];
const mod = def => MODS.push(def);

/* ================= SZÁMOLÁS ================= */

/* ---- Összeadás és kivonás ---- */
const AS = (a, op, b, r, hint) => NUM(Q(`${fmt(a)} ${op} ${fmt(b)} = ?`), r, { hint: hint || `${fmt(a)} ${op} ${fmt(b)} = ${fmt(r)}` });
const addsub = f => () => (Math.random() < .5 ? f.add() : f.sub());
const noCross = (a, b) => (a % 10) + (b % 10) < 10;
mod({
  slug: 'osszeadas-kivonas', title: 'Összeadás és kivonás gyakorló', short: 'Összeadás, kivonás', group: 'szamolas', glyph: '3 + 4', hue: 1,
  desc: 'Összeadás és kivonás 10-es, 20-as, 100-as és 1000-es számkörben. Tízesátlépéssel és hiányzó számos feladatokkal.',
  seo: 'Az összeadás és kivonás gyakorlása 1–3. osztályban a 10-es számkörtől a 1000-es számkörig. A feladatok fokozatosan nehezednek: először tízesátlépés nélkül, majd tízesátlépéssel számolhatsz, a hiányzó számos feladatok pedig a fejszámolást és az ellenőrzést is gyakoroltatják.',
  levels: [
    { name: '10-es számkör', gen: addsub({
      add: () => { const a = rnd(0, 10), b = rnd(0, 10 - a); return AS(a, '+', b, a + b); },
      sub: () => { const a = rnd(1, 10), b = rnd(0, a); return AS(a, '−', b, a - b); } }) },
    { name: '20-as számkör, tízesátlépés nélkül', gen: addsub({
      add: () => { let a, b; do { a = rnd(2, 18); b = rnd(1, 20 - a); } while (a < 10 ? a + b > 10 : (a % 10) + b > 9 && a + b !== 20); return AS(a, '+', b, a + b); },
      sub: () => { let a, b; do { a = rnd(5, 20); b = rnd(1, a - 1); } while (a <= 10 ? false : !(b === 10 || (a < 20 && b <= a % 10))); return AS(a, '−', b, a - b); } }) },
    { name: '20-as számkör, tízesátlépéssel', gen: addsub({
      add: () => { const a = rnd(2, 9), b = rnd(10 - a + 1, 9); return AS(a, '+', b, a + b, `${a} + ${10 - a} = 10, és még ${b - (10 - a)}: ${a + b}.`); },
      sub: () => { const a = rnd(11, 18), b = rnd((a % 10) + 1, 9); return AS(a, '−', b, a - b, `${a} − ${a % 10} = 10, és még ${b - (a % 10)} kell elvenni: ${a - b}.`); } }) },
    { name: '100-as számkör, tízesátlépés nélkül', gen: addsub({
      add: () => { let a, b; do { a = rnd(10, 90); b = rnd(1, 100 - a); } while (!noCross(a, b)); return AS(a, '+', b, a + b); },
      sub: () => { let a, b; do { a = rnd(11, 99); b = rnd(1, a - 1); } while ((b % 10) > (a % 10)); return AS(a, '−', b, a - b); } }) },
    { name: '100-as számkör, tízesátlépéssel', gen: addsub({
      add: () => { let a, b; do { a = rnd(11, 89); b = rnd(2, 100 - a); } while (noCross(a, b)); return AS(a, '+', b, a + b); },
      sub: () => { let a, b; do { a = rnd(21, 100); b = rnd(2, a - 1); } while ((b % 10) <= (a % 10)); return AS(a, '−', b, a - b); } }) },
    { name: 'Hiányzó szám', gen: () => {
      const mx = pick([20, 100]); const a = rnd(2, mx - 2), b = rnd(1, mx - a), c = a + b; const t = rnd(0, 3);
      const h = `Ellenőrizd: ${a} + ${b} = ${c}.`;
      if (t === 0) return NUM(Q(`${a} + ${slot()} = ${c}`), b, { hint: h });
      if (t === 1) return NUM(Q(`${slot()} + ${b} = ${c}`), a, { hint: h });
      if (t === 2) return NUM(Q(`${c} − ${slot()} = ${a}`), b, { hint: h });
      return NUM(Q(`${slot()} − ${b} = ${a}`), c, { hint: h }); } },
    { name: '1000-es számkör, kerek számokkal', gen: addsub({
      add: () => { const a = rnd(1, 90) * 10, b = rnd(1, Math.floor((1000 - a) / 10)) * 10; return AS(a, '+', b, a + b); },
      sub: () => { const a = rnd(2, 100) * 10, b = rnd(1, a / 10 - 1) * 10; return AS(a, '−', b, a - b); } }) }
  ]
});

/* ---- Szorzótábla ---- */
const MUL = (a, b) => { const [x, y] = Math.random() < .5 ? [a, b] : [b, a];
  return NUM(Q(`${x} · ${y} = ?`), a * b, { hint: `${x} · ${y} = ${a * b}. A szorzás sorrendje felcserélhető: ${y} · ${x} is ${a * b}.` }); };
const mulLevel = (name, tables, bmax = 10) => ({ name, gen: () => MUL(pick(tables), rnd(1, bmax)) });
mod({
  slug: 'szorzotabla', title: 'Szorzótábla gyakorló', short: 'Szorzótábla', group: 'szamolas', glyph: '6 · 7', hue: 2,
  desc: 'Szorzótábla gyakorlás az 1-estől a 20-asig. Válaszd ki, melyik táblákat szeretnéd gyakorolni.',
  seo: 'A szorzótábla gyakorlása 2–4. osztályban. Kezdheted a könnyebb 2-es, 5-ös és 10-es táblával, majd jöhet a többi tábla. A hiányzó tényezős feladatok az osztás előkészítésére is jók. A válaszok után azonnal látod, jól számoltál-e.',
  levels: [
    mulLevel('2-es, 5-ös és 10-es tábla', [2, 5, 10]),
    mulLevel('1–5-ös tábla', [1, 2, 3, 4, 5]),
    mulLevel('6–10-es tábla', [6, 7, 8, 9, 10]),
    mulLevel('Vegyes: 1–10-es tábla', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    { name: 'Hiányzó tényező', gen: () => { const a = rnd(2, 10), b = rnd(1, 10);
      return NUM(Q(Math.random() < .5 ? `${a} · ${slot()} = ${a * b}` : `${slot()} · ${a} = ${a * b}`), b, { hint: `${a * b} : ${a} = ${b}, mert ${a} · ${b} = ${a * b}.` }); } },
    mulLevel('Nagyobb táblák: 11–20', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  ]
});

/* ---- Osztás ---- */
const DIV = (d, k) => NUM(Q(`${d * k} : ${d} = ?`), k, { hint: `${d} · ${k} = ${d * k}, ezért ${d * k} : ${d} = ${k}.` });
mod({
  slug: 'osztas', title: 'Osztás gyakorló', short: 'Osztás', group: 'szamolas', glyph: '42 : 6', hue: 3,
  desc: 'Osztás gyakorlása a szorzótábla alapján, maradék nélkül és maradékkal.',
  seo: 'Az osztás a szorzótábla párja: aki jól tudja a szorzótáblát, az osztásban is gyorsan számol. A gyakorló maradék nélküli és maradékos osztást is tartalmaz, nagyobb számokkal is.',
  levels: [
    { name: '2-vel, 5-tel és 10-zel osztás', gen: () => DIV(pick([2, 5, 10]), rnd(1, 10)) },
    { name: 'Osztás 2–5-tel', gen: () => DIV(pick([2, 3, 4, 5]), rnd(1, 10)) },
    { name: 'Osztás 6–10-zel', gen: () => DIV(pick([6, 7, 8, 9, 10]), rnd(1, 10)) },
    { name: 'Vegyes: 2–10-zel osztás', gen: () => DIV(rnd(2, 10), rnd(1, 10)) },
    { name: 'Maradékos osztás', gen: () => {
      const d = rnd(2, 9), k = rnd(1, 9), r = rnd(1, d - 1), n = d * k + r;
      const askRem = Math.random() < .5;
      return NUM(Q(`${n} : ${d}`, askRem ? 'Mennyi a maradék?' : 'Mennyi a hányados?'), askRem ? r : k,
        { hint: `${d} · ${k} = ${d * k}, és ${n} − ${d * k} = ${r}. Tehát ${n} : ${d} = ${k}, maradék ${r}.` }); } },
    { name: 'Nagyobb számok (kétjegyű osztandó)', gen: () => { const d = rnd(2, 9), k = rnd(Math.ceil(10 / d), Math.floor(99 / d)); return DIV(d, k); } }
  ]
});

/* ---- Írásbeli műveletek ---- */
const dg = s => String(s).split('').map(c => `<span class="dg">${c}</span>`).join('');
const vert = (a, op, b) => `<div class="vert" role="img" aria-label="${a} ${op} ${b}"><div class="vr"><span class="vo"></span>${dg(a)}</div><div class="vr"><span class="vo">${op}</span>${dg(b)}</div><div class="vl"></div><div class="vr"><span class="vo"></span><span class="dg q">?</span></div></div>`;
const WR = (a, op, b, r, hint) => NUM(Q(vert(fmt(a).replace(/ /g, ''), op, String(b)), 'Számolj írásban, a füzetedben, és írd be az eredményt.'), r, { hint });
const digitsOf = n => String(n).split('').map(Number);
const carries = (a, b) => { let c = 0, k = 0; const x = digitsOf(a).reverse(), y = digitsOf(b).reverse(); for (let i = 0; i < Math.max(x.length, y.length); i++) { const s = (x[i] || 0) + (y[i] || 0) + c; c = s >= 10 ? 1 : 0; k += c; } return k; };
const borrows = (a, b) => { let c = 0, k = 0; const x = digitsOf(a).reverse(), y = digitsOf(b).reverse(); for (let i = 0; i < x.length; i++) { const s = x[i] - c - (y[i] || 0); c = s < 0 ? 1 : 0; k += c; } return k; };
const wrHint = 'Jobbról balra haladj, oszloponként. Az átvitelt (vagy kölcsönvételt) ne felejtsd el. ';
mod({
  slug: 'irasbeli-muveletek', title: 'Írásbeli műveletek gyakorló', short: 'Írásbeli műveletek', group: 'szamolas', glyph: '+ 256', hue: 4,
  desc: 'Írásbeli összeadás, kivonás, szorzás és osztás oszlopokba írva, lépésről lépésre.',
  seo: 'Írásbeli összeadás, kivonás, szorzás és osztás gyakorlása 3–4. osztályban. A műveletek oszlopokba rendezve látszanak, a kapott eredményt egyszerűen beírhatod. Átvitel nélküli és átvitelt igénylő feladatok is vannak.',
  levels: [
    { name: 'Összeadás átvitel nélkül', gen: () => { const x = [rnd(1, 8), rnd(0, 8), rnd(0, 8)], y = x.map(d => rnd(0, 9 - d)); y[0] = rnd(1, 9 - x[0]);
      const a = Number(x.join('')), b = Number(y.join('')); return WR(a, '+', b, a + b, wrHint + `${a} + ${b} = ${a + b}`); } },
    { name: 'Összeadás átvitellel', gen: () => { let a, b; do { a = rnd(120, 899); b = rnd(120, 899); } while (carries(a, b) < 1); return WR(a, '+', b, a + b, wrHint + `${a} + ${b} = ${a + b}`); } },
    { name: 'Négyjegyű számok összeadása', gen: () => { const a = rnd(1000, 6999), b = rnd(1000, 9999 - a); return WR(a, '+', b, a + b, wrHint + `${a} + ${b} = ${a + b}`); } },
    { name: 'Kivonás kölcsönvétel nélkül', gen: () => { const x = [rnd(2, 9), rnd(1, 9), rnd(1, 9)], y = x.map(d => rnd(0, d)); y[0] = Math.min(y[0], x[0] - 1);
      const a = Number(x.join('')), b = Number(y.join('')); return WR(a, '−', b, a - b, wrHint + `${a} − ${b} = ${a - b}`); } },
    { name: 'Kivonás kölcsönvétellel', gen: () => { let a, b; do { a = rnd(300, 999); b = rnd(101, a - 1); } while (borrows(a, b) < 1); return WR(a, '−', b, a - b, wrHint + `${a} − ${b} = ${a - b}`); } },
    { name: 'Szorzás egyjegyű szorzóval', gen: () => { const a = rnd(12, 399), b = rnd(2, 9); return WR(a, '×', b, a * b, `${a} · ${b} = ${a * b}. Szorozd meg egyesével a számjegyeket, jobbról kezdve.`); } },
    { name: 'Szorzás kétjegyű szorzóval', gen: () => { const a = rnd(12, 99), b = rnd(11, 60); return WR(a, '×', b, a * b, `${a} · ${b} = ${a * b}. Előbb a tízesekkel, aztán az egyesekkel szorozz, végül add össze.`); } },
    { name: 'Osztás egyjegyű osztóval', gen: () => { const d = rnd(2, 9), k = rnd(12, Math.floor(999 / d)); return NUM(Q(`${d * k} : ${d} = ?`, 'Számolj írásban, a füzetedben.'), k, { hint: `${d} · ${k} = ${d * k}, ezért ${d * k} : ${d} = ${k}.` }); } },
    { name: 'Maradékos osztás írásban', gen: () => { const d = rnd(3, 9), k = rnd(12, Math.floor(900 / d)), r = rnd(1, d - 1), n = d * k + r; const ar = Math.random() < .5;
      return NUM(Q(`${n} : ${d}`, ar ? 'Mennyi a maradék?' : 'Mennyi a hányados?'), ar ? r : k, { hint: `${d} · ${k} = ${d * k}, és ${n} − ${d * k} = ${r}. Tehát ${n} : ${d} = ${k}, maradék ${r}.` }); } }
  ]
});

/* ---- Szöveges feladatok ---- */
const ITEMS = [['alma', 'almát'], ['körte', 'körtét'], ['matrica', 'matricát'], ['golyó', 'golyót'], ['kártya', 'kártyát'], ['könyv', 'könyvet'], ['ceruza', 'ceruzát'], ['toll', 'tollat'], ['virág', 'virágot'], ['labda', 'labdát'], ['gomb', 'gombot'], ['süti', 'sütit']];
const NAMES = ['Anna', 'Bence', 'Dóri', 'Máté', 'Zsófi', 'Levente', 'Lili', 'Péter', 'Réka', 'Marci'];
const WP = (text, ans, calc) => NUM(Q(text), ans, { unit: '', hint: `Számolás: ${calc}` });
const wpf = {
  add: mx => { const [, acc] = pick(ITEMS), n = pick(NAMES), a = rnd(3, mx - 3), b = rnd(2, mx - a);
    return WP(`${n} ${a} ${acc} gyűjtött. Kapott még ${b} darabot. Hány darabja van most összesen?`, a + b, `${a} + ${b} = ${a + b}`); },
  sub: mx => { const [, acc] = pick(ITEMS), n = pick(NAMES), a = rnd(5, mx), b = rnd(2, a - 1);
    return WP(`${n} ${a} ${acc} vásárolt. Elajándékozott közülük ${b} darabot. Hány darab maradt neki?`, a - b, `${a} − ${b} = ${a - b}`); },
  more: mx => { const [, acc] = pick(ITEMS), [n1, n2] = shuffle(NAMES), a = rnd(3, mx - 5), b = rnd(2, mx - a);
    return WP(`${n1} ${a} ${acc} gyűjtött. ${n2} ${b} darabbal többet gyűjtött. Hány darabot gyűjtött ${n2}?`, a + b, `${a} + ${b} = ${a + b}`); },
  less: mx => { const [, acc] = pick(ITEMS), [n1, n2] = shuffle(NAMES), a = rnd(6, mx), b = rnd(2, a - 2);
    return WP(`${n1} ${a} ${acc} gyűjtött. ${n2} ${b} darabbal kevesebbet gyűjtött. Hány darabot gyűjtött ${n2}?`, a - b, `${a} − ${b} = ${a - b}`); },
  mul: () => { const [nom] = pick(ITEMS), a = rnd(2, 9), b = rnd(2, 10);
    return WP(`Egy dobozban ${b} ${nom} van. ${a} dobozban hány darab van összesen?`, a * b, `${a} · ${b} = ${a * b}`); },
  div: () => { const [, acc] = pick(ITEMS), n = pick(NAMES), k = rnd(2, 9), q = rnd(2, 9);
    return WP(`${n} ${k * q} ${acc} szétosztott ${k} gyerek között egyenlően. Hány darabot kapott egy gyerek?`, q, `${k * q} : ${k} = ${q}`); },
  price: () => { const [nom] = pick(ITEMS), p = rnd(2, 20) * 10, a = rnd(2, 9);
    return WP(`Egy ${nom} ${p} Ft-ba kerül. Hány forintba kerül ${a} darab?`, p * a, `${a} · ${p} = ${p * a}`); },
  two1: () => { const [nom] = pick(ITEMS), n = pick(NAMES), a = rnd(2, 6), b = rnd(3, 9), c = rnd(1, a * b - 1);
    return WP(`Egy dobozban ${b} ${nom} van. ${n} ${a} dobozt vett, és ${c} darabot elajándékozott. Hány darab maradt neki?`, a * b - c, `${a} · ${b} − ${c} = ${a * b - c}`); },
  two2: () => { const [nom] = pick(ITEMS), b = rnd(5, 20), c = rnd(5, 20), a = rnd(b + c + 5, 90);
    return WP(`A boltban ${a} ${nom} volt. Reggel ${b} darabot eladtak, délután még ${c} darabot. Hány darab maradt?`, a - b - c, `${a} − ${b} − ${c} = ${a - b - c}`); },
  two3: () => { const [, acc] = pick(ITEMS), [n1, n2] = shuffle(NAMES), a = rnd(5, 30), b = rnd(2, 15);
    return WP(`${n1} ${a} ${acc} gyűjtött, ${n2} pedig ${b} darabbal többet. Hány darabot gyűjtöttek együtt?`, a + a + b, `${a} + (${a} + ${b}) = ${a + a + b}`); }
};
mod({
  slug: 'szoveges-feladatok', title: 'Szöveges feladatok gyakorló', short: 'Szöveges feladatok', group: 'szamolas', glyph: '?', hue: 3,
  desc: 'Szöveges feladatok összeadással, kivonással, szorzással, osztással és kétlépéses számolással.',
  seo: 'A szöveges feladatok megoldása alsó tagozaton az egyik legnehezebb rész. A gyakorló egyszerű, hétköznapi helyzeteket ad: gyűjtés, vásárlás, szétosztás, bolti ár. Olvasd el figyelmesen a szöveget, gondold végig, milyen műveletre van szükség, és írd be a végeredményt.',
  levels: [
    { name: 'Összeadás és kivonás 20-ig', gen: () => pick([wpf.add, wpf.sub, wpf.more, wpf.less])(20) },
    { name: 'Összeadás és kivonás 100-ig', gen: () => pick([wpf.add, wpf.sub, wpf.more, wpf.less])(100) },
    { name: 'Szorzás és osztás', gen: () => pick([wpf.mul, wpf.div, wpf.price])() },
    { name: 'Kétlépéses feladatok', gen: () => pick([wpf.two1, wpf.two2, wpf.two3])() },
    { name: 'Vegyes feladatok', gen: () => pick([wpf.add, wpf.sub, wpf.more, wpf.less, wpf.mul, wpf.div, wpf.price, wpf.two1, wpf.two2, wpf.two3])(100) }
  ]
});

/* ================= SZÁMOK ================= */

/* ---- Összehasonlítás ---- */
const cmpNums = mx => () => {
  const a = rnd(0, mx); const t = Math.random(); let b;
  if (t < .2) b = a; else if (t < .5 && a > 9) b = digitShuffle(a); else b = rnd(0, mx);
  return CMP(Q(`${fmt(a)} ${slot()} ${fmt(b)}`, 'Melyik jel illik a két szám közé?'), a, b,
    { hint: `${fmt(a)} ${a < b ? 'kisebb' : a > b ? 'nagyobb' : 'egyenlő'}, mint ${fmt(b)}: ${fmt(a)} ${a < b ? '&lt;' : a > b ? '&gt;' : '='} ${fmt(b)}.` });
};
mod({
  slug: 'szamok-osszehasonlitasa', title: 'Számok összehasonlítása gyakorló', short: 'Összehasonlítás', group: 'szamok', glyph: '5 &lt; 9', hue: 2,
  desc: 'Melyik szám a nagyobb? Kisebb, nagyobb vagy egyenlő jel (<, >, =) 20-as, 100-as, 1000-es és 10 000-es számkörben.',
  seo: 'A <, > és = jelek használata az egyik első nagy lépés a számok világában. A gyakorló 20-ig, 100-ig, 1000-ig és 10 000-ig kérdezi a számokat, a végén pedig műveletek eredményét kell összehasonlítani.',
  levels: [
    { name: '20-as számkör', gen: cmpNums(20) },
    { name: '100-as számkör', gen: cmpNums(100) },
    { name: '1000-es számkör', gen: cmpNums(1000) },
    { name: '10 000-es számkör', gen: cmpNums(10000) },
    { name: 'Műveletek összehasonlítása', gen: () => {
      const a = rnd(2, 15), b = rnd(2, 15), c = rnd(5, 25); let d = rnd(1, c - 1);
      if (Math.random() < .25 && a + b < c) d = c - (a + b);
      const v = a + b, w = c - d;
      return CMP(Q(`${a} + ${b} ${slot()} ${c} − ${d}`, 'Számold ki mindkét oldalt, aztán hasonlítsd össze.'), v, w, { hint: `${a} + ${b} = ${v}, és ${c} − ${d} = ${w}. Tehát ${v} ${v < w ? '&lt;' : v > w ? '&gt;' : '='} ${w}.` }); } }
  ]
});

/* ---- Szomszédok és sorozatok ---- */
const seqChips = (arr, missing) => `<div class="chips">${arr.map((v, i) => `<span class="chip ${i === missing ? 'hole' : ''}">${i === missing ? '?' : fmt(v)}</span>`).join('')}</div>`;
const mkSeq = (steps, desc) => () => {
  const st = pick(steps), len = 6; const sign = desc && Math.random() < .5 ? -1 : 1; const total = st * (len - 1);
  let start = sign > 0 ? rnd(0, 40) : total + rnd(0, 30); if (st >= 20) start = sign > 0 ? rnd(0, 5) * st : total + rnd(0, 3) * st;
  const arr = Array.from({ length: len }, (_, i) => start + sign * st * i); const m = rnd(1, len - 1);
  return NUM(Q(seqChips(arr, m), 'Melyik szám hiányzik a sorozatból?'), arr[m], { hint: `A lépésköz ${st}, a sorozat ${sign > 0 ? 'nő' : 'csökken'}. A hiányzó szám: ${arr[m]}.` });
};
mod({
  slug: 'szomszedok-sorozatok', title: 'Számszomszédok és számsorozatok gyakorló', short: 'Szomszédok, sorozatok', group: 'szamok', glyph: '4 5 6', hue: 1,
  desc: 'Melyik szám jön előtte, utána, melyik van két szám között? Számsorozatok folytatása és hiányzó számok keresése.',
  seo: 'A szomszédos számok, a tízes szomszédok és a számsorozatok a számfogalom alapjai. A gyakorló előre és hátra is számoltat, különböző lépésközökkel, és megkeresteti a sorozat szabályát.',
  levels: [
    { name: 'Előző és következő szám', gen: () => { const n = rnd(1, 99), nx = Math.random() < .5;
      return NUM(Q(nx ? `Melyik szám következik ${fmt(n)} után?` : `Melyik szám van ${fmt(n)} előtt?`), nx ? n + 1 : n - 1, { hint: `${nx ? 'Egyet hozzáadunk' : 'Egyet elveszünk'}: ${nx ? n + 1 : n - 1}.` }); } },
    { name: 'Két szám között', gen: () => { const n = rnd(2, 998); return NUM(Q(`Melyik szám van ${fmt(n - 1)} és ${fmt(n + 1)} között?`), n, { hint: `${n - 1}, ${n}, ${n + 1}: a középső szám ${n}.` }); } },
    { name: 'Tízes szomszédok', gen: () => { let k; do { k = rnd(11, 99); } while (k % 10 === 0); const lo = Math.random() < .5; const base = k - (k % 10);
      return NUM(Q(`${lo ? 'Alsó' : 'Felső'} tízes szomszédja: ${fmt(k)}`, 'Melyik kerek tízes ez?'), lo ? base : base + 10, { hint: `${k} a ${base} és a ${base + 10} között van.` }); } },
    { name: 'Sorozatok: növekvő', gen: mkSeq([1, 2, 3, 5, 10], false) },
    { name: 'Sorozatok: nagyobb lépés, csökkenő is', gen: mkSeq([4, 6, 7, 8, 9, 20, 25, 50, 100], true) },
    { name: 'Mennyi a lépésköz?', gen: () => { const st = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 25, 50, 100]); const sign = Math.random() < .3 ? -1 : 1; const start = sign > 0 ? rnd(0, 20) : st * 6 + rnd(0, 20);
      const arr = Array.from({ length: 5 }, (_, i) => start + sign * st * i);
      return NUM(Q(seqChips(arr, -1), `Mennyivel ${sign > 0 ? 'nő' : 'csökken'} a sorozat egy lépésben?`), st, { hint: `${arr[0]} és ${arr[1]} között a különbség ${st}.` }); } }
  ]
});

/* ---- Kerekítés, páros-páratlan ---- */
const roundTo = (n, p) => Math.round((n + 1e-9) / p) * p;
const rndQ = (p, mn, mx) => () => { let n; do { n = rnd(mn, mx); } while (n % p === 0);
  const name = p === 10 ? 'tízesre' : p === 100 ? 'százasra' : 'ezresre'; const r = roundTo(n, p);
  return NUM(Q(`Kerekítsd ${name}: ${fmt(n)}`), r, { hint: `${p === 10 ? 'Az egyesek' : p === 100 ? 'A tízesek' : 'A százasok'} helyén álló számjegyet nézd: ha 5 vagy több, felfelé kerekítünk, ha kevesebb, lefelé. ${fmt(n)} ≈ ${fmt(r)}.` }); };
const parQ = mx => () => { const n = rnd(1, mx); const ev = n % 2 === 0;
  return CH(Q(`${fmt(n)}`, 'Páros vagy páratlan szám?'), ev ? 'Páros' : 'Páratlan', [ev ? 'Páratlan' : 'Páros'], { hint: `Az utolsó számjegy ${n % 10}, ezért a szám ${ev ? 'páros' : 'páratlan'}. Páros szám az, amelyik 0, 2, 4, 6 vagy 8-ra végződik.` }); };
mod({
  slug: 'kerekites-paros-paratlan', title: 'Kerekítés, páros és páratlan számok gyakorló', short: 'Kerekítés, páros-páratlan', group: 'szamok', glyph: '≈ 50', hue: 4,
  desc: 'Páros vagy páratlan? Kerekítés tízesre, százasra és ezresre.',
  seo: 'Páros és páratlan számok felismerése, valamint kerekítés tízesre, százasra és ezresre. A kerekítés szabálya: ha a következő számjegy 5 vagy nagyobb, felfelé, ha kisebb, lefelé kerekítünk.',
  levels: [
    { name: 'Páros vagy páratlan? (100-ig)', gen: parQ(100) },
    { name: 'Páros vagy páratlan? (1000-ig)', gen: parQ(1000) },
    { name: 'Kerekítés tízesre (100-ig)', gen: rndQ(10, 11, 99) },
    { name: 'Kerekítés tízesre (1000-ig)', gen: rndQ(10, 101, 999) },
    { name: 'Kerekítés százasra', gen: rndQ(100, 101, 999) },
    { name: 'Kerekítés ezresre', gen: rndQ(1000, 1001, 9999) },
    { name: 'Vegyesen', gen: () => pick([rndQ(10, 11, 999), rndQ(100, 101, 9999), rndQ(1000, 1001, 9999), parQ(1000)])() }
  ]
});

/* ---- Római számok ---- */
const toRoman = n => { const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of t) while (n >= v) { s += r; n -= v; } return s; };
const romHint = 'I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Ha kisebb áll a nagyobb előtt, kivonjuk (IV = 4).';
const toRomQ = mx => () => { const n = rnd(1, mx); const w = [n - 1, n + 1, n + 5, n - 5, n + 10, n - 10, n + 2, n - 2, n + 4].filter(x => x > 0 && x <= 3999).map(toRoman);
  return CH(Q(fmt(n), 'Melyik a római szám?'), toRoman(n), shuffle(w), { hint: `${n} = ${toRoman(n)}. ` + romHint }); };
const fromRomQ = mx => () => { const n = rnd(1, mx); return NUM(Q(toRoman(n), 'Hány ez arab számmal?'), n, { hint: `${toRoman(n)} = ${n}. ` + romHint }); };
mod({
  slug: 'romai-szamok', title: 'Római számok gyakorló', short: 'Római számok', group: 'szamok', glyph: 'XIV', hue: 2,
  desc: 'Római számok olvasása és írása 20-ig, 100-ig és 1000 fölött is.',
  seo: 'A római számok az órákon, a könyvek fejezeteinél és a századok jelölésénél bukkannak fel. A gyakorló 20-ig, 100-ig és nagyobb számokra is segít megtanulni az I, V, X, L, C, D és M jelek használatát.',
  levels: [
    { name: 'Arab szám → római szám (20-ig)', gen: toRomQ(20) },
    { name: 'Római szám → arab szám (20-ig)', gen: fromRomQ(20) },
    { name: 'Oda-vissza 100-ig', gen: () => (Math.random() < .5 ? toRomQ(100) : fromRomQ(100))() },
    { name: 'Oda-vissza 3999-ig', gen: () => (Math.random() < .5 ? toRomQ(3999) : fromRomQ(3999))() }
  ]
});

/* ---- Törtek ---- */
const UNIT = [, , 'fele', 'harmada', 'negyede', 'ötöde', 'hatoda', 'hetede', 'nyolcada', 'kilencede', 'tizede'];
const FRAC_ALONE = [, , 'fél', 'harmad', 'negyed', 'ötöd', 'hatod', 'heted', 'nyolcad', 'kilenced', 'tized'];
const pieSVG = (n, d, bar) => {
  if (bar) { const w = 200 / d; let s = ''; for (let i = 0; i < d; i++) s += `<rect x="${5 + i * w}" y="10" width="${w}" height="46" class="${i < n ? 'on' : 'off'}"/>`; return `<svg class="fvis" viewBox="0 0 210 66" role="img" aria-label="${n}/${d}">${s}</svg>`; }
  let s = '';
  for (let i = 0; i < d; i++) { const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / d;
    const p = a => `${(60 + 52 * Math.cos(a)).toFixed(2)} ${(60 + 52 * Math.sin(a)).toFixed(2)}`;
    s += `<path d="M60 60 L${p(a0)} A52 52 0 0 1 ${p(a1)} Z" class="${i < n ? 'on' : 'off'}"/>`; }
  return `<svg class="fvis" viewBox="0 0 120 120" role="img" aria-label="${n}/${d}">${s}</svg>`;
};
mod({
  slug: 'tortek', title: 'Törtek gyakorló', short: 'Törtek', group: 'szamok', glyph: fr(3, 4), hue: 3,
  desc: 'Törtek felismerése ábráról, törtrész kiszámítása, törtek összehasonlítása, összeadása és kivonása.',
  seo: 'A törtek 3–4. osztályban jönnek elő: fele, harmada, negyede. A gyakorló ábrákkal kezd, majd a törtrész kiszámításával, a törtek összehasonlításával és az azonos nevezőjű törtek összeadásával folytatja.',
  levels: [
    { name: 'Törtek felismerése ábráról', gen: () => { const d = rnd(2, 8), n = rnd(1, d - 1);
      return CH(Q(pieSVG(n, d, Math.random() < .4), 'A színes rész hányad része az egésznek?'), { v: n + '/' + d, h: fr(n, d) },
        [{ v: (d - n) + '/' + d, h: fr(d - n, d) }, { v: n + '/' + (d + 1), h: fr(n, d + 1) }, { v: Math.min(n + 1, d - 1) + '/' + d, h: fr(Math.min(n + 1, d - 1), d) }, { v: (d + 1 - n) + '/' + (d + 1), h: fr(d + 1 - n, d + 1) }],
        { hint: `Az egész ${d} egyenlő részre van osztva, ebből ${n} színes: ${n}/${d}.` }); } },
    { name: 'Törtrész kiszámítása: fele, harmada, negyede…', gen: () => { const d = rnd(2, 10), k = rnd(1, 10), n = d * k;
      return NUM(Q(`Mennyi ${art(n)} ${fmt(n)} ${UNIT[d]}?`), k, { hint: `Osszuk ${d} egyenlő részre: ${n} : ${d} = ${k}.` }); } },
    { name: 'Több törtrész (pl. háromnegyed)', gen: () => { const d = rnd(3, 10), n = rnd(2, d - 1), k = rnd(1, 10), base = d * k;
      return NUM(Q(`Mennyi ${art(base)} ${fmt(base)} ${fr(n, d)} része?`), n * k, { hint: `Egy ${FRAC_ALONE[d]} rész ${base} : ${d} = ${k}. Ebből ${n} darab: ${n} · ${k} = ${n * k}.` }); } },
    { name: 'Hány ' + 'negyed, harmad… van egy egészben?', gen: () => { const d = rnd(3, 10), w = rnd(2, 5);
      return NUM(Q(`Hány ${FRAC_ALONE[d]} van ${w} egészben?`), d * w, { hint: `Egy egészben ${d} darab ${FRAC_ALONE[d]} van, ${w} egészben ${w} · ${d} = ${d * w}.` }); } },
    { name: 'Törtek összehasonlítása', gen: () => { const same = Math.random() < .6; let a, b, c, d;
      if (same) { d = c = rnd(3, 12); a = rnd(1, d - 1); b = Math.random() < .2 ? a : rnd(1, d - 1); }
      else { a = b = rnd(1, 5); c = rnd(a + 1, 12); d = rnd(a + 1, 12); }
      const v1 = a / c, v2 = b / d;
      return CMP(Q(`${fr(a, c)} ${slot()} ${fr(b, d)}`, 'Melyik jel illik közéjük?'), v1, v2,
        { hint: same ? 'Azonos nevezőnél az a tört a nagyobb, amelyiknek nagyobb a számlálója.' : 'Azonos számlálónál az a tört a nagyobb, amelyiknek kisebb a nevezője (nagyobb egy rész).' }); } },
    { name: 'Azonos nevezőjű törtek összeadása, kivonása', gen: () => { const d = rnd(4, 12), add = Math.random() < .5; let a, b;
      if (add) { a = rnd(1, d - 2); b = rnd(1, d - 1 - a); } else { a = rnd(2, d - 1); b = rnd(1, a - 1); }
      const r = add ? a + b : a - b;
      return NUM(Q(`${fr(a, d)} ${add ? '+' : '−'} ${fr(b, d)} = ${fr('?', d)}`, 'Melyik szám hiányzik a számlálóból?'), r, { hint: `A nevező marad ${d}, a számlálókat ${add ? 'összeadjuk' : 'kivonjuk'}: ${a} ${add ? '+' : '−'} ${b} = ${r}.` }); } }
  ]
});

/* ================= IDŐ, PÉNZ, MÉRTÉKEGYSÉGEK ================= */

/* ---- Óra leolvasása ---- */
const clockSVG = (h, m, size = 220) => {
  let t = '';
  for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, big = i % 5 === 0, r1 = big ? 86 : 91, r2 = 96;
    t += `<line x1="${(100 + r1 * Math.sin(a)).toFixed(1)}" y1="${(100 - r1 * Math.cos(a)).toFixed(1)}" x2="${(100 + r2 * Math.sin(a)).toFixed(1)}" y2="${(100 - r2 * Math.cos(a)).toFixed(1)}" class="${big ? 'tb' : 'ts'}"/>`; }
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; t += `<text x="${(100 + 73 * Math.sin(a)).toFixed(1)}" y="${(100 - 73 * Math.cos(a) + 6).toFixed(1)}" text-anchor="middle" class="tn">${i}</text>`; }
  const ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
  const hand = (a, l, c) => `<line x1="100" y1="100" x2="${(100 + l * Math.sin(a)).toFixed(1)}" y2="${(100 - l * Math.cos(a)).toFixed(1)}" class="${c}"/>`;
  return `<svg class="clock" style="width:${size}px;max-width:100%" viewBox="0 0 200 200" role="img" aria-label="Analóg óra"><circle cx="100" cy="100" r="98" class="cf"/>${t}${hand(ha, 40, 'hh')}${hand(ma, 60, 'mh')}<circle cx="100" cy="100" r="5" class="cc"/></svg>`;
};
const hm = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
const timeWords = (h, m) => { const nx = h % 12 + 1; if (m === 0) return `${h} óra`; if (m === 30) return `fél ${nx}`; if (m === 15) return `negyed ${nx}`; if (m === 45) return `háromnegyed ${nx}`; return `${h} óra ${m} perc`; };
const randTime = lv => { const h = rnd(1, 12); let m;
  if (lv === 1) m = 0; else if (lv === 2) m = pick([0, 30]); else if (lv === 3) m = pick([0, 15, 30, 45]); else if (lv === 4) m = rnd(0, 11) * 5; else m = rnd(0, 59);
  return [h, m]; };
const timeWrongs = (h, m) => { const set = [[m / 5 || 12, h * 5 % 60], [h % 12 + 1, m], [h === 1 ? 12 : h - 1, m], [h, (m + 5) % 60], [h, (m + 55) % 60], [h, (m + 15) % 60], [h, (m + 30) % 60], [h % 12 + 1, (m + 30) % 60]];
  return set.filter(([a, b]) => Number.isInteger(a) && Number.isInteger(b) && !(a === h && b === m)).map(([a, b]) => [a, b]); };
const clockQ = lv => () => { const [h, m] = randTime(lv); const ws = shuffle(timeWrongs(h, m)).map(([a, b]) => hm(a, b));
  return CH(Q(clockSVG(h, m), 'Mennyi az idő?'), hm(h, m), ws, { hint: `Az óramutató (rövid) a ${h}-esnél van, a percmutató (hosszú) ${m === 0 ? 'a 12-esnél' : `a ${m / 5 | 0}-es szám körül, ${m} perc`}. Az idő ${hm(h, m)} (${timeWords(h, m)}).` }); };
mod({
  slug: 'ora-leolvasas', title: 'Óra leolvasása gyakorló', short: 'Óra leolvasása', group: 'meres', glyph: '', hue: 1, icon: 'clock',
  desc: 'Analóg óra leolvasása egész órától a percre pontos időig.',
  seo: 'Az analóg óra leolvasása 1–3. osztályban: egész óra, fél, negyed és háromnegyed, öt percenként, végül percre pontosan. A rövid mutató az órát, a hosszú mutató a percet jelzi.',
  levels: [
    { name: 'Egész órák', gen: clockQ(1) },
    { name: 'Egész és fél órák', gen: clockQ(2) },
    { name: 'Negyed, fél, háromnegyed', gen: clockQ(3) },
    { name: 'Öt perces pontossággal', gen: clockQ(4) },
    { name: 'Percre pontosan', gen: clockQ(5) },
    { name: 'Melyik óra mutatja? (idő → óra)', gen: () => { const [h, m] = randTime(4); const ws = shuffle(timeWrongs(h, m)).slice(0, 3);
      const ch = x => ({ v: hm(x[0], x[1]), h: clockSVG(x[0], x[1], 120) });
      return CH(Q(`<span class="digital">${hm(h, m)}</span>`, 'Melyik óra mutatja ezt az időt?'), ch([h, m]), ws.map(ch), { grid: true, hint: `${hm(h, m)}: a rövid mutató a ${h}-esnél, a hosszú mutató a ${m / 5}-es számnál áll (${m} perc).` }); } }
  ]
});

/* ---- Pénz ---- */
const COINS = [5, 10, 20, 50, 100, 200], NOTES = [500, 1000, 2000, 5000, 10000, 20000];
const coinSVG = v => { const s = 30 + Math.log2(v) * 3.2; return `<svg class="mny" width="${s.toFixed(0)}" height="${s.toFixed(0)}" viewBox="0 0 60 60" role="img" aria-label="${v} forintos érme"><circle cx="30" cy="30" r="28" class="${v < 50 ? 'c1' : 'c2'}"/><circle cx="30" cy="30" r="22" class="cin"/><text x="30" y="36" text-anchor="middle" class="ct">${v}</text></svg>`; };
const noteSVG = v => `<svg class="mny note n${NOTES.indexOf(v) % 6}" width="104" height="56" viewBox="0 0 104 56" role="img" aria-label="${fmt(v)} forintos bankjegy"><rect x="1" y="1" width="102" height="54" rx="6" class="nb"/><rect x="6" y="6" width="92" height="44" rx="3" class="nbi"/><text x="52" y="34" text-anchor="middle" class="nt">${fmt(v)}</text><text x="52" y="46" text-anchor="middle" class="nf">Ft</text></svg>`;
const tray = items => `<div class="tray">${items.map(v => (v < 500 ? coinSVG(v) : noteSVG(v))).join('')}</div>`;
const sumQ = pool => () => { const n = rnd(2, 5); const items = Array.from({ length: n }, () => pick(pool)).sort((a, b) => b - a); const s = items.reduce((x, y) => x + y, 0);
  return NUM(Q(tray(items), 'Mennyi pénz van összesen?'), s, { unit: 'Ft', hint: `${items.map(fmt).join(' + ')} = ${fmt(s)} Ft.` }); };
const SHOP = [['füzet', 120], ['toll', 90], ['radír', 60], ['ceruza', 80], ['matrica', 50], ['tábla csoki', 350], ['szendvics', 450], ['alma', 70], ['limonádé', 300], ['jégkrém', 400], ['kifli', 60]];
mod({
  slug: 'penz-szamolas', title: 'Pénz számolás gyakorló', short: 'Pénz számolás', group: 'meres', glyph: '', hue: 4, icon: 'coin',
  desc: 'Forint érmék és bankjegyek összeadása, vásárlás és visszajáró számolása.',
  seo: 'A pénzzel való számolás hétköznapi készség. A gyakorló forint érméket és bankjegyeket mutat, ezek összegét kell kiszámolni. Később vásárlási és visszajáró feladatok is jönnek. A bankjegyek ábrái csak szemléltetésre szolgálnak.',
  levels: [
    { name: 'Érmék (5–200 Ft)', gen: sumQ(COINS) },
    { name: 'Bankjegyek (500–5000 Ft)', gen: sumQ(NOTES.slice(0, 4)) },
    { name: 'Érmék és bankjegyek vegyesen', gen: sumQ([...COINS, 500, 1000, 2000, 5000]) },
    { name: 'Visszajáró', gen: () => { const pay = pick([200, 500, 1000, 2000, 5000]); const cost = rnd(1, pay / 10 - 1) * 10;
      return NUM(Q(`Fizetsz ${fmt(pay)} Ft-tal. A vásárlás ${fmt(cost)} Ft. Mennyi a visszajáró?`), pay - cost, { unit: 'Ft', hint: `${fmt(pay)} − ${fmt(cost)} = ${fmt(pay - cost)} Ft.` }); } },
    { name: 'Mennyibe kerül összesen?', gen: () => { const [a, pa] = pick(SHOP), [b, pb] = pick(SHOP.filter(x => x[0] !== a)); const k = rnd(2, 4);
      return Math.random() < .5
        ? NUM(Q(`Egy ${a} ${fmt(pa)} Ft, egy ${b} ${fmt(pb)} Ft. Mennyibe kerül a kettő együtt?`), pa + pb, { unit: 'Ft', hint: `${fmt(pa)} + ${fmt(pb)} = ${fmt(pa + pb)} Ft.` })
        : NUM(Q(`Egy ${a} ${fmt(pa)} Ft. Mennyibe kerül ${k} darab?`), pa * k, { unit: 'Ft', hint: `${k} · ${fmt(pa)} = ${fmt(pa * k)} Ft.` }); } }
  ]
});

/* ---- Mértékegységek ---- */
const UN = {
  dmcm: ['dm', 'cm', 10], mdm: ['m', 'dm', 10], mcm: ['m', 'cm', 100], cmmm: ['cm', 'mm', 10], kmm: ['km', 'm', 1000],
  kgg: ['kg', 'g', 1000], dkgg: ['dkg', 'g', 10], kgdkg: ['kg', 'dkg', 100], tkg: ['t', 'kg', 1000],
  ldl: ['l', 'dl', 10], dlcl: ['dl', 'cl', 10], lcl: ['l', 'cl', 100], dlml: ['dl', 'ml', 100], lml: ['l', 'ml', 1000],
  ohp: ['óra', 'perc', 60], pmp: ['perc', 'mp', 60], nap: ['nap', 'óra', 24], het: ['hét', 'nap', 7]
};
const convQ = keys => () => { const [big, small, f] = UN[pick(keys)]; const down = Math.random() < .55;
  const n = rnd(1, f >= 1000 ? 9 : f >= 100 ? 12 : f === 60 ? 5 : 9);
  return down ? NUM(Q(`${n} ${big} = ${slot()} ${small}`), n * f, { unit: small, hint: `1 ${big} = ${fmt(f)} ${small}, ezért ${n} ${big} = ${fmt(n * f)} ${small}.` })
    : NUM(Q(`${fmt(n * f)} ${small} = ${slot()} ${big}`), n, { unit: big, hint: `${fmt(f)} ${small} = 1 ${big}, ezért ${fmt(n * f)} ${small} = ${n} ${big}.` }); };
mod({
  slug: 'mertekegysegek', title: 'Mértékegységek átváltása gyakorló', short: 'Mértékegységek', group: 'meres', glyph: 'cm', hue: 2,
  desc: 'Hosszúság, tömeg, űrtartalom és idő mértékegységeinek átváltása.',
  seo: 'Mértékegységek átváltása: hosszúság (mm, cm, dm, m, km), tömeg (g, dkg, kg, t), űrtartalom (ml, cl, dl, l) és idő (mp, perc, óra, nap, hét). Minden feladat után megmutatjuk az átváltás szabályát is.',
  levels: [
    { name: 'Hosszúság: m, dm, cm', gen: convQ(['dmcm', 'mdm', 'mcm']) },
    { name: 'Hosszúság: cm, mm, km', gen: convQ(['cmmm', 'kmm', 'mcm']) },
    { name: 'Tömeg: g, dkg, kg, t', gen: convQ(['kgg', 'dkgg', 'kgdkg', 'tkg']) },
    { name: 'Űrtartalom: ml, cl, dl, l', gen: convQ(['ldl', 'dlcl', 'dlml', 'lml', 'lcl']) },
    { name: 'Idő', gen: convQ(['ohp', 'pmp', 'nap', 'het']) },
    { name: 'Összetett mennyiségek', gen: () => { const t = pick(['m cm', 'kg g', 'km m', 'l dl']);
      if (t === 'm cm') { const a = rnd(1, 9), b = rnd(1, 99); return NUM(Q(`${a} m ${b} cm = ${slot()} cm`), a * 100 + b, { unit: 'cm', hint: `${a} m = ${a * 100} cm, ehhez még ${b} cm: ${a * 100 + b} cm.` }); }
      if (t === 'kg g') { const a = rnd(1, 9), b = rnd(1, 9) * 50; return NUM(Q(`${a} kg ${b} g = ${slot()} g`), a * 1000 + b, { unit: 'g', hint: `${a} kg = ${fmt(a * 1000)} g, ehhez még ${b} g: ${fmt(a * 1000 + b)} g.` }); }
      if (t === 'km m') { const a = rnd(1, 9), b = rnd(1, 9) * 100; return NUM(Q(`${a} km ${b} m = ${slot()} m`), a * 1000 + b, { unit: 'm', hint: `${a} km = ${fmt(a * 1000)} m, ehhez még ${b} m: ${fmt(a * 1000 + b)} m.` }); }
      const a = rnd(1, 9), b = rnd(1, 9); return NUM(Q(`${a} l ${b} dl = ${slot()} dl`), a * 10 + b, { unit: 'dl', hint: `${a} l = ${a * 10} dl, ehhez még ${b} dl: ${a * 10 + b} dl.` }); } }
  ]
});

/* ================= ALAKZATOK ÉS KOCKA ================= */

/* ---- Geometria ---- */
const regular = (n, r, cx = 60, cy = 62) => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
const SHAPES = {
  'négyzet': { sides: 4, svg: '<rect x="24" y="24" width="72" height="72"/>' },
  'téglalap': { sides: 4, svg: '<rect x="10" y="34" width="100" height="52"/>' },
  'háromszög': { sides: 3, svg: '<polygon points="60,16 106,100 14,100"/>' },
  'kör': { sides: 0, svg: '<circle cx="60" cy="60" r="44"/>' },
  'ötszög': { sides: 5, svg: `<polygon points="${regular(5, 48)}"/>` },
  'hatszög': { sides: 6, svg: `<polygon points="${regular(6, 48, 60, 60)}"/>` },
  'rombusz': { sides: 4, svg: '<polygon points="60,22 108,60 60,98 12,60"/>' },
  'trapéz': { sides: 4, svg: '<polygon points="34,30 86,30 110,92 10,92"/>' },
  'paralelogramma': { sides: 4, svg: '<polygon points="36,30 112,30 84,90 8,90"/>' }
};
const shapeSVG = n => `<svg class="shape" viewBox="0 0 120 120" role="img" aria-label="Síkidom">${SHAPES[n].svg}</svg>`;
const SHAPE_HINT = { 'négyzet': 'A négyzetnek 4 egyenlő oldala és 4 derékszöge van.', 'téglalap': 'A téglalapnak 4 derékszöge van, a szemközti oldalai egyenlők.', 'háromszög': 'A háromszögnek 3 oldala és 3 csúcsa van.', 'kör': 'A kör kerek, nincs oldala és csúcsa.', 'ötszög': 'Az ötszögnek 5 oldala van.', 'hatszög': 'A hatszögnek 6 oldala van.', 'rombusz': 'A rombusz mind a 4 oldala egyenlő, de a szögei nem derékszögek.', 'trapéz': 'A trapéznek két párhuzamos oldala van.', 'paralelogramma': 'A paralelogramma szemközti oldalai párhuzamosak.' };
const shapeQ = names => () => { const n = pick(names); return CH(Q(shapeSVG(n), 'Mi a neve ennek a síkidomnak?'), n, shuffle(names.filter(x => x !== n)), { hint: SHAPE_HINT[n] }); };
const rectSVG = (a, b, la, lb, extra = '') => { const k = Math.min(180 / a, 100 / b), w = a * k, h = b * k, x = (240 - w) / 2, y = (140 - h) / 2;
  return `<svg class="shape wide" viewBox="0 0 240 140" role="img" aria-label="Téglalap ${a} cm és ${b} cm oldalakkal"><rect x="${x}" y="${y}" width="${w}" height="${h}"/>${extra}<text x="120" y="${y - 6}" text-anchor="middle" class="dim">${la}</text><text x="${x - 8}" y="70" text-anchor="end" class="dim">${lb}</text></svg>`; };
const triSVG = (a, b, c) => `<svg class="shape wide" viewBox="0 0 240 150" role="img" aria-label="Háromszög ${a}, ${b} és ${c} cm oldalakkal"><polygon points="120,16 220,130 20,130"/><text x="50" y="68" text-anchor="end" class="dim">${a} cm</text><text x="196" y="68" text-anchor="start" class="dim">${b} cm</text><text x="120" y="148" text-anchor="middle" class="dim">${c} cm</text></svg>`;
const gridSVG = cells => { const rows = cells.length, cols = cells[0].length, s = Math.min(34, Math.floor(260 / cols), Math.floor(170 / rows)), W = cols * s + 4, H = rows * s + 4;
  let r = ''; cells.forEach((row, y) => row.forEach((on, x) => { r += `<rect x="${2 + x * s}" y="${2 + y * s}" width="${s}" height="${s}" class="${on ? 'cell on' : 'cell'}"/>`; }));
  return `<svg class="grid" style="width:${W}px;max-width:100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="Négyzetrács">${r}</svg>`; };
const sideTxt = (x, u = 'cm') => `${x} ${u}`;
mod({
  slug: 'geometria', title: 'Geometria gyakorló', short: 'Geometria', group: 'forma', glyph: '', hue: 3, icon: 'shape',
  desc: 'Síkidomok felismerése, oldalak és csúcsok számolása, kerület és terület kiszámítása.',
  seo: 'Geometria alsó tagozaton: síkidomok felismerése (négyzet, téglalap, háromszög, kör, ötszög, hatszög, rombusz, trapéz, paralelogramma), oldalak és csúcsok megszámolása, a kerület és a terület kiszámítása négyzetrácson és képlettel.',
  levels: [
    { name: 'Síkidomok felismerése', gen: shapeQ(['négyzet', 'téglalap', 'háromszög', 'kör']) },
    { name: 'Több síkidom', gen: shapeQ(Object.keys(SHAPES)) },
    { name: 'Hány oldala, hány csúcsa van?', gen: () => { const n = pick(Object.keys(SHAPES).filter(x => x !== 'kör')); const v = SHAPES[n].sides; const wh = Math.random() < .5;
      return NUM(Q(shapeSVG(n), wh ? 'Hány oldala van?' : 'Hány csúcsa van?'), v, { hint: `Ez egy ${n}: ${v} oldala és ${v} csúcsa van.` }); } },
    { name: 'Téglalap és négyzet kerülete', gen: () => { if (Math.random() < .35) { const a = rnd(2, 12); return NUM(Q(rectSVG(a, a, sideTxt(a), sideTxt(a)), 'Mennyi a négyzet kerülete?'), 4 * a, { unit: 'cm', hint: `4 · ${a} = ${4 * a} cm.` }); }
      let a, b; do { a = rnd(3, 14); b = rnd(2, 10); } while (a === b);
      return NUM(Q(rectSVG(a, b, sideTxt(a), sideTxt(b)), 'Mennyi a téglalap kerülete?'), 2 * (a + b), { unit: 'cm', hint: `2 · (${a} + ${b}) = 2 · ${a + b} = ${2 * (a + b)} cm.` }); } },
    { name: 'Háromszög kerülete', gen: () => { const a = rnd(3, 12), b = rnd(3, 12), c = rnd(Math.abs(a - b) + 1, a + b - 1);
      return NUM(Q(triSVG(a, b, c), 'Mennyi a háromszög kerülete?'), a + b + c, { unit: 'cm', hint: `${a} + ${b} + ${c} = ${a + b + c} cm.` }); } },
    { name: 'Terület: négyzetek számolása', gen: () => { const cols = rnd(2, 7), rows = rnd(2, 5); const L = Math.random() < .5 && cols > 3 && rows > 2;
      const cells = Array.from({ length: rows }, () => Array(cols).fill(true));
      if (L) { const cw = rnd(1, cols - 2), ch = rnd(1, rows - 1); for (let y = 0; y < ch; y++) for (let x = cols - cw; x < cols; x++) cells[y][x] = false; }
      const n = cells.flat().filter(Boolean).length;
      return NUM(Q(gridSVG(cells), 'Egy négyzet 1 cm². Mennyi az alakzat területe?'), n, { unit: 'cm²', hint: `Számold meg a színes négyzeteket: ${n} darab, így a terület ${n} cm².` }); } },
    { name: 'Terület számolása képlettel', gen: () => { const a = rnd(2, 12), b = rnd(2, 12); const sq = Math.random() < .3; const B = sq ? a : b;
      return NUM(Q(sq ? `Egy négyzet oldala ${a} cm.` : `Egy téglalap oldalai ${a} cm és ${b} cm.`, 'Mennyi a területe?'), a * B, { unit: 'cm²', hint: `Terület = hosszúság · szélesség = ${a} · ${B} = ${a * B} cm².` }); } },
    { name: 'Hiányzó oldal kiszámítása', gen: () => { const a = rnd(3, 12), b = rnd(2, 10);
      return Math.random() < .5
        ? NUM(Q(`Egy téglalap területe ${a * b} cm², az egyik oldala ${a} cm.`, 'Mekkora a másik oldala?'), b, { unit: 'cm', hint: `${a * b} : ${a} = ${b} cm.` })
        : NUM(Q(`Egy téglalap kerülete ${2 * (a + b)} cm, az egyik oldala ${a} cm.`, 'Mekkora a másik oldala?'), b, { unit: 'cm', hint: `A két oldal összege ${2 * (a + b)} : 2 = ${a + b} cm, ebből ${a + b} − ${a} = ${b} cm.` }); } }
  ]
});

/* ---- Dobókocka ---- */
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const dieSVG = n => `<svg class="die" viewBox="0 0 60 60" role="img" aria-label="Dobókocka: ${n}"><rect x="2" y="2" width="56" height="56" rx="10" class="dbody"/>${PIPS[n].map(p => `<circle cx="${14 + (p % 3) * 16}" cy="${14 + Math.floor(p / 3) * 16}" r="4.6" class="dpip"/>`).join('')}</svg>`;
const dice = arr => `<div class="dice">${arr.map(dieSVG).join('')}</div>`;
const diceQ = (cnt, kind) => () => { const arr = Array.from({ length: cnt }, () => rnd(1, 6));
  if (kind === 'count') return NUM(Q(dice(arr), 'Hány pötty van a kockán?'), arr[0], { hint: `Számold meg a pöttyöket: ${arr[0]}.` });
  if (kind === 'sum') { const s = arr.reduce((x, y) => x + y, 0); return NUM(Q(dice(arr), `Mennyi a dobott pontok összege?`), s, { hint: `${arr.join(' + ')} = ${s}.` }); }
  if (kind === 'diff') { const [a, b] = arr[0] >= arr[1] ? arr : [arr[1], arr[0]]; return NUM(Q(dice([a, b]), 'Mennyivel dobtál többet az elsővel?'), a - b, { hint: `${a} − ${b} = ${a - b}.` }); }
  const p = arr[0] * arr[1]; return NUM(Q(dice(arr), 'Mennyi a két dobott szám szorzata?'), p, { hint: `${arr[0]} · ${arr[1]} = ${p}.` }); };
mod({
  slug: 'dobokocka', title: 'Dobókocka gyakorló', short: 'Dobókocka', group: 'forma', glyph: '', hue: 2, icon: 'die',
  desc: 'Pöttyök számolása, dobott számok összege, különbsége és szorzata. Dobj te is a virtuális kockákkal!',
  seo: 'A dobókocka pöttyeinek számolása segít a számok gyors felismerésében. Először egy kockát nézel, aztán kettőt és hármat, a legnehezebb szinten a dobott számok különbségét és szorzatát is ki kell számolni.',
  extra: 'dice',
  levels: [
    { name: 'Egy kocka: hány pötty?', gen: diceQ(1, 'count') },
    { name: 'Két kocka összege', gen: diceQ(2, 'sum') },
    { name: 'Három kocka összege', gen: diceQ(3, 'sum') },
    { name: 'Két kocka különbsége', gen: diceQ(2, 'diff') },
    { name: 'Két kocka szorzata', gen: diceQ(2, 'mul') }
  ]
});

/* ================= FELÜLET ================= */
const N = 10;                 // kérdések száma egy körben
const SHEET_N = 20;           // kérdések a munkalapon
const PATHMODE = document.documentElement.dataset.path === '1';
const href = slug => (PATHMODE ? (slug ? `/${slug}/` : '/') : (slug ? `#${slug}` : '#'));
const LS = 'iskolai-gyakorlo-v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } },
  set(o) { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { /* nincs tárhely */ } }
};
const bestOf = (slug, i) => ((store.get()[slug] || {})[i]) || 0;
const starsOf = sc => (sc >= 9 ? 3 : sc >= 7 ? 2 : sc >= 5 ? 1 : 0);
const starHTML = n => `<span class="stars" aria-label="${n} csillag a 3-ból">${[0, 1, 2].map(i => `<span class="${i < n ? '' : 'off'}">★</span>`).join('')}</span>`;
const modStars = m => Math.max(0, ...m.levels.map((_, i) => starsOf(bestOf(m.slug, i))));
const isDone = (slug, i) => bestOf(slug, i) > 0;

const S = { view: 'home', mod: null, lvl: 0, cur: null, i: 0, score: 0, input: '', done: false, ok: null, pick: null, hist: [], timer: null, sheet: [], showKey: false };
const ICONS = {
  clock: '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" stroke-width="4"/><path d="M30 14v17l11 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  coin: '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" stroke-width="4"/><text x="30" y="37" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="600" font-size="20" fill="currentColor">Ft</text></svg>',
  shape: '<svg viewBox="0 0 80 60"><polygon points="22,8 42,46 2,46" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><rect x="46" y="22" width="30" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="4"/></svg>',
  die: '<svg viewBox="0 0 60 60"><rect x="6" y="6" width="48" height="48" rx="10" fill="none" stroke="currentColor" stroke-width="4"/><g fill="currentColor"><circle cx="20" cy="20" r="4"/><circle cx="40" cy="20" r="4"/><circle cx="30" cy="30" r="4"/><circle cx="20" cy="40" r="4"/><circle cx="40" cy="40" r="4"/></g></svg>'
};
const glyph = m => (m.icon ? ICONS[m.icon] : m.glyph);
const BRAND = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="5" width="30" height="30" rx="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/><path d="M10 20l6 6 11-13" fill="none" stroke="var(--red)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SITE_NAME = 'Iskolai Gyakorló';
const modBySlug = s => MODS.find(m => m.slug === s);
const ansText = q => (q.kind === 'num' ? `${fmt(q.ans)}${q.unit ? ' ' + q.unit : ''}` : q.ansLabel);

/* ---------- Kérdések ---------- */
function newQ(seen = []) {
  const L = S.mod.levels[S.lvl]; let q, k = 0;
  const used = new Set(seen.map(x => x.q));
  do { q = L.gen(); k++; } while (used.has(q.q) && k < 40);
  return q;
}

/* ---------- Nézetek ---------- */
function homeView() {
  const groups = GROUPS.map(g => `<section class="grp"><h2>${g.name}</h2><div class="cards">${MODS.filter(m => m.group === g.id).map(m =>
    `<a class="card" data-h="${m.hue}" href="${href(m.slug)}"><div class="tile">${glyph(m)}</div><h3>${m.short}</h3><div class="meta"><span>${m.levels.length} szint</span>${modStars(m) ? starHTML(modStars(m)) : ''}</div></a>`).join('')}</div></section>`).join('');
  return `<div class="hero"><h1>Gyakorolj játékosan!</h1><p>Ingyenes matematikai gyakorlók alsó tagozatosoknak: szorzótábla, osztás, törtek, óra, pénz, geometria és még sok más. Regisztráció nélkül, telefonon, tableten és számítógépen is.</p></div>${groups}`;
}

function setupView() {
  const m = S.mod;
  const rows = m.levels.map((L, i) => { const b = bestOf(m.slug, i);
    return `<div class="lv"><div><div class="nm">${i + 1}. ${L.name}</div><div class="st">${b ? `Legjobb eredményed: ${b}/${N} ${starHTML(starsOf(b))}` : 'Még nem próbáltad'}</div></div><div class="acts"><button class="btn sm" data-act="start" data-l="${i}">Gyakorlás</button><button class="btn sm sec" data-act="sheet" data-l="${i}">Munkalap</button></div></div>`; }).join('');
  const rel = MODS.filter(x => x.group === m.group && x !== m).concat(MODS.filter(x => x.group !== m.group)).slice(0, 5).map(x => `<a href="${href(x.slug)}">${x.short}</a>`).join('');
  const roller = m.extra === 'dice' ? `<div class="roller"><button class="btn sm" data-act="roll" data-n="2">Dobj a kockákkal!</button><div class="dice" id="rollout" aria-live="polite">${dieSVG(4)}${dieSVG(2)}</div><div id="rollsum" class="sub"></div></div>` : '';
  return `<div class="setup"><a class="crumb" href="${href('')}">← Minden gyakorló</a><h1>${m.title}</h1><p class="lead">${m.desc}</p>${roller}<h2 class="sr">Szintek</h2><div class="levels">${rows}</div><section class="about"><h2>Mire jó ez a gyakorló?</h2><p>${m.seo}</p></section><nav class="rel" aria-label="További gyakorlók">${rel}</nav></div>`;
}

function answerArea() {
  const q = S.cur;
  if (q.kind === 'num') {
    const cls = S.done ? (S.ok ? 'ok' : 'bad') : '';
    const keys = [7, 8, 9, 4, 5, 6, 1, 2, 3].map(k => `<button class="key" data-act="key" data-k="${k}" aria-label="${k}">${k}</button>`).join('');
    const pad = S.done ? '' : `<div class="pad">${keys}<button class="key" data-act="key" data-k="del" aria-label="Törlés"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M13 9l4 6M17 9l-4 6"/></svg></button><button class="key" data-act="key" data-k="0" aria-label="0">0</button><button class="key go" data-act="key" data-k="ok">Kész</button></div>`;
    return `<div class="abox ${cls}" id="abox" aria-live="polite">${S.input ? esc(S.input) : '<span class="ph">…</span>'}${q.unit ? `<span class="unit">${q.unit}</span>` : ''}</div>${pad}`;
  }
  const pics = q.grid ? ' pics' : '';
  const cnt = q.cmp ? ' three' : '';
  return `<div class="opts${cnt}${pics}">${q.choices.map((c, i) => {
    let cls = ''; if (S.done) { if (c.v === q.ans) cls = 'ok'; else if (c.v === S.pick) cls = 'bad'; }
    return `<button class="opt ${cls}" data-act="opt" data-v="${esc(c.v)}" ${S.done ? 'disabled' : ''} aria-label="${q.cmp ? c.t : esc(c.v)}">${c.h}${c.t ? `<small>${c.t}</small>` : ''}</button>`; }).join('')}</div>`;
}
function feedback() {
  if (!S.done) return '';
  const q = S.cur, good = pick(['Szuper!', 'Ügyes vagy!', 'Remek!', 'Pontosan!', 'Nagyszerű!']);
  const last = S.i + 1 >= N;
  return `<div class="fb ${S.ok ? 'ok' : 'bad'}" role="status"><strong>${S.ok ? good : 'Nem egészen.'}</strong><p>${S.ok ? '' : `A helyes válasz: <b>${ansText(q)}</b>. `}${q.hint || ''}</p><button class="btn" data-act="next" id="nextbtn">${last ? 'Eredmény' : 'Tovább'}</button></div>`;
}
function quizView() {
  return `<div class="qbar"><button data-act="quit" aria-label="Kilépés a gyakorlásból">✕ Kilépés</button><span>${S.i + 1} / ${N}</span><span class="stars">★ ${S.score}</span></div><div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="${N}" aria-valuenow="${S.i + (S.done ? 1 : 0)}"><i style="width:${(S.i + (S.done ? 1 : 0)) / N * 100}%"></i></div><div class="qwrap"><div class="qcard">${S.cur.q}</div><div>${answerArea()}${feedback()}</div></div>`;
}
function resultView() {
  const st = starsOf(S.score), wrong = S.hist.filter(h => !h.ok);
  const msg = st === 3 ? 'Kiváló munka!' : st === 2 ? 'Nagyon jó!' : st === 1 ? 'Jó kezdet!' : 'Ne add fel, gyakorolj még!';
  return `<div class="result"><h1>${msg}</h1><div class="bigstars" aria-label="${st} csillag a 3-ból">${[0, 1, 2].map(i => `<span class="${i < st ? '' : 'off'}">★</span>`).join('')}</div><div class="score">${S.score} helyes válasz a ${N}-ből</div><div class="ractions"><button class="btn" data-act="again">Új kör</button><button class="btn sec" data-act="quit">Másik szint</button><a class="btn sec" href="${href('')}">Főoldal</a></div>${wrong.length ? `<h2 style="margin-bottom:10px">Ezeket nézzük meg újra</h2><div class="wrongs">${wrong.map(h => `<div>${h.q.q}<div class="ans">Helyes válasz: ${ansText(h.q)}</div></div>`).join('')}</div>` : ''}</div>`;
}
function sheetView() {
  const m = S.mod, L = m.levels[S.lvl];
  const items = S.sheet.map(q => `<li><div class="sq">${q.q}</div>${q.kind === 'num' ? `<div class="sline">Válasz: <span class="blank"></span> ${q.unit || ''}</div>` : `<div class="sopts">${q.choices.map((c, i) => `<span>${'ABCD'[i]}) ${c.h}</span>`).join('')}</div>`}</li>`).join('');
  const key = S.sheet.map(q => `<li>${q.kind === 'num' ? ansText(q) : `${'ABCD'[q.choices.findIndex(c => c.v === q.ans)]}) ${q.ansLabel}`}</li>`).join('');
  return `<div class="stool noprint"><a class="btn sec sm" href="#" data-act="quit">← Vissza</a><button class="btn sm" data-act="print">Nyomtatás</button><button class="btn sec sm" data-act="newsheet">Új munkalap</button><button class="btn sec sm" data-act="togglekey">${S.showKey ? 'Megoldókulcs elrejtése' : 'Megoldókulcs mutatása'}</button></div><article class="sheet"><div class="shead"><h1>${m.title}</h1><div>Név: ____________________ Dátum: ____________</div><div class="lvn">${S.lvl + 1}. szint: ${L.name}</div></div><ol class="slist">${items}</ol><section class="key-sec" ${S.showKey ? '' : 'hidden'}><h2>Megoldókulcs</h2><ol>${key}</ol></section></article>`;
}

function render() {
  const app = $('#app');
  app.innerHTML = S.view === 'home' ? homeView() : S.view === 'setup' ? setupView() : S.view === 'quiz' ? quizView() : S.view === 'result' ? resultView() : sheetView();
  if (S.view === 'quiz' && S.done && !S.ok) { const b = $('#nextbtn'); if (b) b.focus({ preventScroll: true }); }
  const t = S.mod && S.view !== 'home' ? `${S.mod.title} – ${SITE_NAME}` : `${SITE_NAME} – ingyenes matematika gyakorlók alsósoknak`;
  document.title = t;
}

/* ---------- Működés ---------- */
function startQuiz(l) {
  clearTimeout(S.timer);
  Object.assign(S, { view: 'quiz', lvl: l, i: 0, score: 0, input: '', done: false, ok: null, pick: null, hist: [] });
  S.cur = newQ([]); render(); window.scrollTo(0, 0);
}
function answer(val) {
  if (S.done) return; const q = S.cur; let ok;
  if (q.kind === 'num') { if (S.input === '') return; ok = Number(S.input) === q.ans; } else { S.pick = val; ok = val === q.ans; }
  S.done = true; S.ok = ok; if (ok) S.score++;
  S.hist.push({ q, ok }); render();
  if (ok) S.timer = setTimeout(next, 1100);
}
function next() {
  clearTimeout(S.timer); if (!S.done) return;
  if (S.i + 1 >= N) {
    const all = store.get(); all[S.mod.slug] = all[S.mod.slug] || {};
    if (S.score > (all[S.mod.slug][S.lvl] || 0)) all[S.mod.slug][S.lvl] = S.score; store.set(all);
    S.view = 'result'; render(); window.scrollTo(0, 0); return;
  }
  S.i++; S.cur = newQ(S.hist.map(h => h.q)); S.input = ''; S.done = false; S.ok = null; S.pick = null; render();
}
function makeSheet(l) {
  S.lvl = l; S.sheet = []; S.showKey = false;
  for (let i = 0; i < SHEET_N; i++) S.sheet.push(newQ(S.sheet));
  S.view = 'sheet'; render(); window.scrollTo(0, 0);
}
function keyPress(k) {
  if (S.view !== 'quiz' || S.done || S.cur.kind !== 'num') return;
  if (k === 'del') S.input = S.input.slice(0, -1);
  else if (k === 'ok') return answer();
  else if (S.input.length < 6) S.input = (S.input === '0' ? '' : S.input) + k;
  const b = $('#abox'); if (b) b.innerHTML = (S.input ? esc(S.input) : '<span class="ph">…</span>') + (S.cur.unit ? `<span class="unit">${S.cur.unit}</span>` : '');
}
function rollDice(n) {
  const out = $('#rollout'), sum = $('#rollsum'); if (!out) return; let f = 0, vals = [];
  const tick = () => { vals = Array.from({ length: n }, () => rnd(1, 6)); out.innerHTML = vals.map(dieSVG).join('');
    if (++f < 9) setTimeout(tick, 70); else sum.textContent = `Összesen: ${vals.reduce((a, b) => a + b, 0)}`; };
  sum.textContent = ''; tick();
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'start') startQuiz(+t.dataset.l);
  else if (a === 'sheet') makeSheet(+t.dataset.l);
  else if (a === 'key') keyPress(t.dataset.k);
  else if (a === 'opt') answer(t.dataset.v);
  else if (a === 'next') next();
  else if (a === 'again') startQuiz(S.lvl);
  else if (a === 'quit') { e.preventDefault(); clearTimeout(S.timer); S.view = 'setup'; render(); window.scrollTo(0, 0); }
  else if (a === 'print') window.print();
  else if (a === 'newsheet') makeSheet(S.lvl);
  else if (a === 'togglekey') { S.showKey = !S.showKey; render(); }
  else if (a === 'roll') rollDice(+t.dataset.n);
});
document.addEventListener('keydown', e => {
  if (S.view !== 'quiz' || e.ctrlKey || e.metaKey || e.altKey) return;
  const q = S.cur;
  if (e.key === 'Enter') { e.preventDefault(); if (S.done) next(); else if (q.kind === 'num') answer(); return; }
  if (S.done) return;
  if (q.kind === 'num') {
    if (/^[0-9]$/.test(e.key)) keyPress(e.key); else if (e.key === 'Backspace') { e.preventDefault(); keyPress('del'); }
  } else {
    const map = { '1': 0, '2': 1, '3': 2, '4': 3 }; let c;
    if (q.cmp) { c = { '<': '<', '>': '>', '=': '=' }[e.key]; if (c) answer(c); }
    else if (e.key in map && q.choices[map[e.key]]) answer(q.choices[map[e.key]].v);
  }
});

function route() {
  clearTimeout(S.timer);
  const slug = PATHMODE ? (document.documentElement.dataset.route || '') : decodeURIComponent(location.hash.replace(/^#/, ''));
  const m = modBySlug(slug);
  S.mod = m || null; S.view = m ? 'setup' : 'home'; render();
  if (!PATHMODE) window.scrollTo(0, 0);
}
if (!PATHMODE) window.addEventListener('hashchange', route);
route();

})();
