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
const NUM = (q, ans, o = {}) => ({ kind: 'num', q, ans: Math.round(Number(ans) * 1e6) / 1e6, ...o });
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

/* Tizedes és negatív számok szövegesen (magyar tizedesvessző, ezres tagolás) */
const trim = n => Math.round(n * 1e6) / 1e6;
const numTxt = n => { n = trim(n); const [i, f] = String(Math.abs(n)).split('.'); return (n < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + (f ? ',' + f : ''); };
const fixd = (n, k) => (n < 0 ? '−' : '') + Math.abs(n).toFixed(k).replace('.', ',');
const par = n => (n < 0 ? `(${numTxt(n)})` : numTxt(n));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => a / gcd(a, b) * b;
const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const divisors = n => { const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };
const vx = '<span class="vx">x</span>';
const mix = (w, n, d) => `<span class="mix">${w}${fr(n, d)}</span>`;

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
  return NUM(Q(`${x} × ${y} = ?`), a * b, { hint: `${x} × ${y} = ${a * b}. A szorzás sorrendje felcserélhető: ${y} × ${x} is ${a * b}.` }); };
const mulLevel = (name, tables, bmax = 10) => ({ name, gen: () => MUL(pick(tables), rnd(1, bmax)) });
mod({
  slug: 'szorzotabla', title: 'Szorzótábla gyakorló', short: 'Szorzótábla', group: 'szamolas', glyph: '6 × 7', hue: 2,
  desc: 'Szorzótábla gyakorlás az 1-estől a 20-asig. Válaszd ki, melyik táblákat szeretnéd gyakorolni.',
  seo: 'A szorzótábla gyakorlása 2–4. osztályban. Kezdheted a könnyebb 2-es, 5-ös és 10-es táblával, majd jöhet a többi tábla. A hiányzó tényezős feladatok az osztás előkészítésére is jók. A válaszok után azonnal látod, jól számoltál-e.',
  levels: [
    mulLevel('2-es, 5-ös és 10-es tábla', [2, 5, 10]),
    mulLevel('1–5-ös tábla', [1, 2, 3, 4, 5]),
    mulLevel('6–10-es tábla', [6, 7, 8, 9, 10]),
    mulLevel('Vegyes: 1–10-es tábla', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    { name: 'Hiányzó tényező', gen: () => { const a = rnd(2, 10), b = rnd(1, 10);
      return NUM(Q(Math.random() < .5 ? `${a} × ${slot()} = ${a * b}` : `${slot()} × ${a} = ${a * b}`), b, { hint: `${a * b} : ${a} = ${b}, mert ${a} × ${b} = ${a * b}.` }); } },
    mulLevel('Nagyobb táblák: 11–20', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  ]
});

/* ---- Osztás ---- */
const DIV = (d, k) => NUM(Q(`${d * k} : ${d} = ?`), k, { hint: `${d} × ${k} = ${d * k}, ezért ${d * k} : ${d} = ${k}.` });
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
        { hint: `${d} × ${k} = ${d * k}, és ${n} − ${d * k} = ${r}. Tehát ${n} : ${d} = ${k}, maradék ${r}.` }); } },
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
    { name: 'Szorzás egyjegyű szorzóval', gen: () => { const a = rnd(12, 399), b = rnd(2, 9); return WR(a, '×', b, a * b, `${a} × ${b} = ${a * b}. Szorozd meg egyesével a számjegyeket, jobbról kezdve.`); } },
    { name: 'Szorzás kétjegyű szorzóval', gen: () => { const a = rnd(12, 99), b = rnd(11, 60); return WR(a, '×', b, a * b, `${a} × ${b} = ${a * b}. Előbb a tízesekkel, aztán az egyesekkel szorozz, végül add össze.`); } },
    { name: 'Osztás egyjegyű osztóval', gen: () => { const d = rnd(2, 9), k = rnd(12, Math.floor(999 / d)); return NUM(Q(`${d * k} : ${d} = ?`, 'Számolj írásban, a füzetedben.'), k, { hint: `${d} × ${k} = ${d * k}, ezért ${d * k} : ${d} = ${k}.` }); } },
    { name: 'Maradékos osztás írásban', gen: () => { const d = rnd(3, 9), k = rnd(12, Math.floor(900 / d)), r = rnd(1, d - 1), n = d * k + r; const ar = Math.random() < .5;
      return NUM(Q(`${n} : ${d}`, ar ? 'Mennyi a maradék?' : 'Mennyi a hányados?'), ar ? r : k, { hint: `${d} × ${k} = ${d * k}, és ${n} − ${d * k} = ${r}. Tehát ${n} : ${d} = ${k}, maradék ${r}.` }); } }
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
    return WP(`Egy dobozban ${b} ${nom} van. ${a} dobozban hány darab van összesen?`, a * b, `${a} × ${b} = ${a * b}`); },
  div: () => { const [, acc] = pick(ITEMS), n = pick(NAMES), k = rnd(2, 9), q = rnd(2, 9);
    return WP(`${n} ${k * q} ${acc} szétosztott ${k} gyerek között egyenlően. Hány darabot kapott egy gyerek?`, q, `${k * q} : ${k} = ${q}`); },
  price: () => { const [nom] = pick(ITEMS), p = rnd(2, 20) * 10, a = rnd(2, 9);
    return WP(`Egy ${nom} ${p} Ft-ba kerül. Hány forintba kerül ${a} darab?`, p * a, `${a} × ${p} = ${p * a}`); },
  two1: () => { const [nom] = pick(ITEMS), n = pick(NAMES), a = rnd(2, 6), b = rnd(3, 9), c = rnd(1, a * b - 1);
    return WP(`Egy dobozban ${b} ${nom} van. ${n} ${a} dobozt vett, és ${c} darabot elajándékozott. Hány darab maradt neki?`, a * b - c, `${a} × ${b} − ${c} = ${a * b - c}`); },
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
      return NUM(Q(`Mennyi ${art(base)} ${fmt(base)} ${fr(n, d)} része?`), n * k, { hint: `Egy ${FRAC_ALONE[d]} rész ${base} : ${d} = ${k}. Ebből ${n} darab: ${n} × ${k} = ${n * k}.` }); } },
    { name: 'Hány ' + 'negyed, harmad… van egy egészben?', gen: () => { const d = rnd(3, 10), w = rnd(2, 5);
      return NUM(Q(`Hány ${FRAC_ALONE[d]} van ${w} egészben?`), d * w, { hint: `Egy egészben ${d} darab ${FRAC_ALONE[d]} van, ${w} egészben ${w} × ${d} = ${d * w}.` }); } },
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
        : NUM(Q(`Egy ${a} ${fmt(pa)} Ft. Mennyibe kerül ${k} darab?`), pa * k, { unit: 'Ft', hint: `${k} × ${fmt(pa)} = ${fmt(pa * k)} Ft.` }); } }
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
    { name: 'Téglalap és négyzet kerülete', gen: () => { if (Math.random() < .35) { const a = rnd(2, 12); return NUM(Q(rectSVG(a, a, sideTxt(a), sideTxt(a)), 'Mennyi a négyzet kerülete?'), 4 * a, { unit: 'cm', hint: `4 × ${a} = ${4 * a} cm.` }); }
      let a, b; do { a = rnd(3, 14); b = rnd(2, 10); } while (a === b);
      return NUM(Q(rectSVG(a, b, sideTxt(a), sideTxt(b)), 'Mennyi a téglalap kerülete?'), 2 * (a + b), { unit: 'cm', hint: `2 × (${a} + ${b}) = 2 × ${a + b} = ${2 * (a + b)} cm.` }); } },
    { name: 'Háromszög kerülete', gen: () => { const a = rnd(3, 12), b = rnd(3, 12), c = rnd(Math.abs(a - b) + 1, a + b - 1);
      return NUM(Q(triSVG(a, b, c), 'Mennyi a háromszög kerülete?'), a + b + c, { unit: 'cm', hint: `${a} + ${b} + ${c} = ${a + b + c} cm.` }); } },
    { name: 'Terület: négyzetek számolása', gen: () => { const cols = rnd(2, 7), rows = rnd(2, 5); const L = Math.random() < .5 && cols > 3 && rows > 2;
      const cells = Array.from({ length: rows }, () => Array(cols).fill(true));
      if (L) { const cw = rnd(1, cols - 2), ch = rnd(1, rows - 1); for (let y = 0; y < ch; y++) for (let x = cols - cw; x < cols; x++) cells[y][x] = false; }
      const n = cells.flat().filter(Boolean).length;
      return NUM(Q(gridSVG(cells), 'Egy négyzet 1 cm². Mennyi az alakzat területe?'), n, { unit: 'cm²', hint: `Számold meg a színes négyzeteket: ${n} darab, így a terület ${n} cm².` }); } },
    { name: 'Terület számolása képlettel', gen: () => { const a = rnd(2, 12), b = rnd(2, 12); const sq = Math.random() < .3; const B = sq ? a : b;
      return NUM(Q(sq ? `Egy négyzet oldala ${a} cm.` : `Egy téglalap oldalai ${a} cm és ${b} cm.`, 'Mennyi a területe?'), a * B, { unit: 'cm²', hint: `Terület = hosszúság × szélesség = ${a} × ${B} = ${a * B} cm².` }); } },
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
  const p = arr[0] * arr[1]; return NUM(Q(dice(arr), 'Mennyi a két dobott szám szorzata?'), p, { hint: `${arr[0]} × ${arr[1]} = ${p}.` }); };
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
      return Math.random() < .5 ? NUM(Q(`${par(b)} × ${par(c)} = ?`), b * c, { hint: h + ` ${par(b)} × ${par(c)} = ${numTxt(b * c)}.` })
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
      if (Math.random() < .5) { const n = rnd(11, 999); return NUM(Q(`${fixd(n / 100, 2)} × ${f} = ?`), n * f / 100, { hint: `${f}-zel szorozva a tizedesvessző ${String(f).length - 1} hellyel jobbra csúszik. Az eredmény ${numTxt(n * f / 100)}.` }); }
      const n = rnd(1, 9999); return NUM(Q(`${numTxt(n)} : ${f} = ?`), n / f, { hint: `${f}-zel osztva a tizedesvessző ${String(f).length - 1} hellyel balra csúszik. Az eredmény ${numTxt(n / f)}.` }); } },
    { name: 'Szorzás egész számmal', dec: true, gen: () => { const k = rnd(2, 9); const sc = pick([10, 100]); const a = sc === 10 ? rnd(11, 99) : rnd(101, 399);
      return NUM(Q(`${fixd(a / sc, sc === 10 ? 1 : 2)} × ${k} = ?`), a * k / sc, { hint: `Szorozz úgy, mintha nem lenne tizedesvessző (${a} × ${k} = ${a * k}), aztán tedd vissza a vesszőt. Az eredmény ${numTxt(a * k / sc)}.` }); } },
    { name: 'Osztás egész számmal', dec: true, gen: () => { const d = rnd(2, 9), r = rnd(11, 399); const dividend = r * d;
      return NUM(Q(`${fixd(dividend / 100, 2).replace(/,?0+$/, '')} : ${d} = ?`), r / 100, { hint: `Osztás után az eredmény ${numTxt(r / 100)}, mert ${numTxt(r / 100)} × ${d} = ${numTxt(dividend / 100)}.` }); } },
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
      return NUM(Q(`${fr(n, d)} = ${fr('?', d * k)}`, `Bővítsd ${k}-${[2, 3, 4, 5, 6][k - 2] ? ['vel', 'mal', 'gyel', 'tel', 'tal'][k - 2] : 'val'}.`), n * k, { hint: `A számlálót és a nevezőt is ${k} számmal szorozzuk: ${n}×${k} = ${n * k}, ${d}×${k} = ${d * k}.` }); } },
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
      return NUM(Q(`${k} × ${fr(n, d)} = ${fr('?', d)}`), n * k, { hint: `A számlálót szorozzuk: ${k} × ${n} = ${n * k}, a nevező marad ${d}.` }); } },
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
      return NUM(Q(`Mennyi ${b} ${o[0]}%-a?`), pctOf(o[0], b), { hint: `${o[0]}% = ${o[0]}/100, tehát ${b} × ${o[0]} : 100 = ${pctOf(o[0], b)}.` }); } },
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
    { name: 'Négyzetszámok', gen: () => { const n = rnd(2, 20); return NUM(Q(`${sup(n, 2)} = ?`), n * n, { hint: `${n} × ${n} = ${n * n}.` }); } },
    { name: 'Négyzetgyök', gen: () => { const n = rnd(2, 20); return NUM(Q(`√${n * n} = ?`), n, { hint: `${n}² = ${n * n}, ezért √${n * n} = ${n}.` }); } },
    { name: 'Köbszámok', gen: () => { const n = rnd(2, 10); return NUM(Q(`${sup(n, 3)} = ?`), n ** 3, { hint: `${n} × ${n} × ${n} = ${n ** 3}.` }); } },
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
      return NUM(Q(`Írd fel a ${d} többszöröseit. Melyik az első olyan, ami nagyobb, mint ${m}?`), r, { hint: `${m} : ${d} = ${Math.floor(m / d)} maradék ${m % d}, tehát ${Math.floor(m / d) + 1} × ${d} = ${r}.` }); } },
    { name: 'Legnagyobb közös osztó (LNKO)', gen: () => { let x, y; do { x = rnd(2, 9); y = rnd(2, 9); } while (x === y || gcd(x, y) !== 1); const g = rnd(2, 12);
      return NUM(Q(`Mennyi ${g * x} és ${g * y} legnagyobb közös osztója?`), g, { hint: `Osztók: ${g * x}-é ${divisors(g * x).join(', ')}; ${g * y}-é ${divisors(g * y).join(', ')}. A legnagyobb közös: ${g}.` }); } },
    { name: 'Legkisebb közös többszörös (LKKT)', gen: () => { let a, b; do { a = rnd(2, 12); b = rnd(2, 12); } while (a === b || lcm(a, b) > 90);
      return NUM(Q(`Mennyi ${a} és ${b} legkisebb közös többszöröse?`), lcm(a, b), { hint: `A ${a} többszörösei és a ${b} többszörösei közül az első közös: ${lcm(a, b)}.` }); } },
    { name: 'Prímtényezős felbontás', gen: () => { let n; do { n = rnd(8, 100); } while (isPrime(n)); const f = factorize(n);
      return NUM(Q(`Hány prímszám szorzata a ${n}?`, 'Az ismétlődő tényezőket is számold külön.'), f.length, { hint: `${n} = ${f.join(' × ')}, ez ${f.length} tényező.` }); } }
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
    { name: 'a × x = b', gen: () => { const x = rnd(2, 12), a = rnd(2, 9); return NUM(Q(`${a} × ${vx} = ${a * x}`, 'Mennyi x?'), x, { hint: `Mindkét oldalt elosztjuk ${a} számmal: x = ${a * x} : ${a} = ${x}.` }); } },
    { name: 'x − a = b és a − x = b', gen: () => { const x = rnd(3, 30), a = rnd(2, 20);
      return Math.random() < .5 ? NUM(Q(`${vx} − ${a} = ${x}`, 'Mennyi x?'), x + a, { hint: `Mindkét oldalhoz hozzáadunk ${art(a)} ${a} számot: x = ${x} + ${a} = ${x + a}.` })
        : NUM(Q(`${x + a} − ${vx} = ${a}`, 'Mennyi x?'), x, { hint: `x = ${x + a} − ${a} = ${x}.` }); } },
    { name: 'Kétlépéses: a × x + b = c', gen: () => { const x = rnd(1, 12), a = rnd(2, 9), b = rnd(1, 20); const plus = Math.random() < .6;
      return plus ? NUM(Q(`${a} × ${vx} + ${b} = ${a * x + b}`, 'Mennyi x?'), x, { hint: `Először kivonunk ${art(b)} ${b} számot: ${a}x = ${a * x}. Aztán osztunk ${a} számmal: x = ${x}.` })
        : NUM(Q(`${a} × ${vx} − ${b} = ${a * x - b}`, 'Mennyi x?'), x, { hint: `Először hozzáadunk ${art(b)} ${b} számot: ${a}x = ${a * x}. Aztán osztunk ${a} számmal: x = ${x}.` }); } },
    { name: 'Zárójeles egyenletek', gen: () => { const x = rnd(2, 12), a = rnd(2, 6), b = rnd(1, 8); const plus = Math.random() < .5;
      return plus ? NUM(Q(`${a} × (${vx} + ${b}) = ${a * (x + b)}`, 'Mennyi x?'), x, { hint: `Osztunk ${a} számmal: x + ${b} = ${x + b}, ebből x = ${x}.` })
        : NUM(Q(`${a} × (${vx} − ${b}) = ${a * (x - b > 0 ? x - b : 1)}`, 'Mennyi x?'), (x - b > 0 ? x - b : 1) + b, { hint: `Osztunk ${a} számmal, aztán hozzáadunk ${art(b)} ${b} számot.` }); } },
    { name: 'Szöveges egyenletek', gen: () => { const a = rnd(2, 9), x = rnd(2, 15), b = rnd(1, 20); const plus = Math.random() < .6;
      return NUM(Q(`Gondoltam egy számra. Megszoroztam ${MULW[a]}, majd ${plus ? 'a szorzathoz hozzáadtam' : 'a szorzatból kivontam'} ${art(b)} ${b} számot. Az eredmény ${a * x + (plus ? b : -b)} lett. Melyik számra gondoltam?`), x, { hint: `${a}x ${plus ? '+' : '−'} ${b} = ${a * x + (plus ? b : -b)}, ebből x = ${x}.` }); } },
    { name: 'Negatív megoldások', neg: true, gen: () => { const x = -rnd(1, 15), a = rnd(2, 9); const t = rnd(0, 1);
      return t === 0 ? NUM(Q(`${vx} + ${a + 5} = ${x + a + 5}`, 'Mennyi x?'), x, { hint: `x = ${numTxt(x + a + 5)} − ${a + 5} = ${numTxt(x)}.` })
        : NUM(Q(`${a} × ${vx} = ${numTxt(a * x)}`, 'Mennyi x?'), x, { hint: `x = ${numTxt(a * x)} : ${a} = ${numTxt(x)}.` }); } }
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
    { name: 'Egyenlő szárú háromszög', gen: () => { if (Math.random() < .5) { const b = rnd(2, 8) * 10; return NUM(Q(`Egy egyenlő szárú háromszög alapon fekvő szögei ${b}°-osak. Mekkora a szárszöge?`), 180 - 2 * b, { unit: '°', hint: `180° − 2 × ${b}° = ${180 - 2 * b}°.` }); }
      const t = rnd(2, 15) * 10; return NUM(Q(`Egy egyenlő szárú háromszög szárszöge ${t}°. Mekkora az alapon fekvő szögek egyike?`), (180 - t) / 2, { unit: '°', hint: `(180° − ${t}°) : 2 = ${(180 - t) / 2}°.` }); } },
    { name: 'Négyszög szögei', gen: () => { const a = rnd(60, 120), b = rnd(60, 120), c = rnd(60, 120);
      return NUM(Q(`Egy négyszög három szöge ${a}°, ${b}° és ${c}°. Mekkora a negyedik szöge?`, 'A négyszög belső szögeinek összege 360°.'), 360 - a - b - c, { unit: '°', hint: `360° − ${a}° − ${b}° − ${c}° = ${360 - a - b - c}°.` }); } },
    { name: 'Mellékszög és csúcsszög', gen: () => { const a = rnd(2, 17) * 10; const csucs = Math.random() < .5;
      return NUM(Q(`Két egyenes metszi egymást, az egyik szög ${a}°. Mekkora ${csucs ? 'a csúcsszöge' : 'a mellékszöge'}?`), csucs ? a : 180 - a, { unit: '°', hint: csucs ? 'A csúcsszögek egyenlők.' : `A mellékszögek összege 180°: 180° − ${a}° = ${180 - a}°.` }); } },
    { name: 'Sokszögek belső szögeinek összege', gen: () => { const n = rnd(5, 10);
      return NUM(Q(`Mennyi egy ${MS[n]} belső szögeinek összege?`), (n - 2) * 180, { unit: '°', hint: `(${n} − 2) × 180° = ${(n - 2) * 180}°.` }); } },
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
      return NUM(Q(useD ? `Egy kör átmérője ${2 * r} cm.` : `Egy kör sugara ${r} cm.`, 'Mennyi a kerülete? (π ≈ 3,14)'), 2 * r * 3.14, { unit: 'cm', hint: `K = 2 × r × π = 2 × ${r} × 3,14 = ${numTxt(2 * r * 3.14)} cm.` }); } },
    { name: 'Kör területe (π ≈ 3,14)', dec: true, gen: () => { const r = rnd(1, 10);
      return NUM(Q(`Egy kör sugara ${r} cm.`, 'Mennyi a területe? (π ≈ 3,14)'), r * r * 3.14, { unit: 'cm²', hint: `T = r² × π = ${r}² × 3,14 = ${numTxt(r * r * 3.14)} cm².` }); } },
    { name: 'Kocka térfogata és felszíne', gen: () => { const a = rnd(2, 10); const v = Math.random() < .5;
      return NUM(Q(`Egy kocka éle ${a} cm.`, v ? 'Mennyi a térfogata?' : 'Mennyi a felszíne?'), v ? a ** 3 : 6 * a * a, { unit: v ? 'cm³' : 'cm²', hint: v ? `V = a³ = ${a}³ = ${a ** 3} cm³.` : `A = 6 × a² = 6 × ${a * a} = ${6 * a * a} cm².` }); } },
    { name: 'Téglatest térfogata', gen: () => { const a = rnd(2, 12), b = rnd(2, 10), c = rnd(2, 9);
      return NUM(Q(boxSVG(a, b, c), 'Mennyi a téglatest térfogata?'), a * b * c, { unit: 'cm³', hint: `V = a × b × c = ${a} × ${b} × ${c} = ${a * b * c} cm³.` }); } },
    { name: 'Téglatest felszíne', gen: () => { const a = rnd(2, 10), b = rnd(2, 10), c = rnd(2, 9);
      return NUM(Q(boxSVG(a, b, c), 'Mennyi a téglatest felszíne?'), 2 * (a * b + b * c + a * c), { unit: 'cm²', hint: `A = 2 × (ab + bc + ac) = 2 × (${a * b} + ${b * c} + ${a * c}) = ${2 * (a * b + b * c + a * c)} cm².` }); } },
    { name: 'Térfogat mértékegységei', gen: () => { const o = pick([[1, 'dm³', 'l', 1, 'Az 1 dm³ éppen 1 liter.'], [1000, 'cm³', 'l', 1, '1 l = 1000 cm³.'], [1000, 'dm³', 'm³', 1, '1 m³ = 1000 dm³.'], [1000, 'cm³', 'dm³', 1, '1 dm³ = 1000 cm³.']]); const down = Math.random() < .5; const n = rnd(2, 9);
      return down ? NUM(Q(`${n} ${o[2]} = ? ${o[1]}`), n * o[0], { unit: o[1], hint: o[4] + ` ${n} ${o[2]} = ${fmt(n * o[0])} ${o[1]}.` }) : NUM(Q(`${fmt(n * o[0])} ${o[1]} = ? ${o[2]}`), n, { unit: o[2], hint: o[4] + ` ${fmt(n * o[0])} ${o[1]} = ${n} ${o[2]}.` }); } },
    { name: 'Hiányzó él', gen: () => { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9);
      return NUM(Q(`Egy téglatest térfogata ${a * b * c} cm³, két éle ${a} cm és ${b} cm.`, 'Mekkora a harmadik éle?'), c, { unit: 'cm', hint: `${a * b * c} : (${a} × ${b}) = ${a * b * c} : ${a * b} = ${c} cm.` }); } }
  ]
});

/* ---- Évfolyam-ajánlás a korábbi gyakorlókhoz ---- */
const GRADES = { 'osszeadas-kivonas': [1, 3], 'szorzotabla': [2, 4], 'osztas': [2, 4], 'irasbeli-muveletek': [3, 5], 'szoveges-feladatok': [1, 5], 'szamok-osszehasonlitasa': [1, 3], 'szomszedok-sorozatok': [1, 3], 'kerekites-paros-paratlan': [2, 4], 'romai-szamok': [3, 6], 'tortek': [3, 5], 'ora-leolvasas': [1, 3], 'penz-szamolas': [1, 4], 'mertekegysegek': [2, 6], 'geometria': [1, 6], 'dobokocka': [1, 3] };
MODS.forEach(m => { if (!m.grades) m.grades = GRADES[m.slug] || [1, 8]; });

/* ================= MAGYAR NYELV ÉS HELYESÍRÁS ================= */
GROUPS.push({ id: 'nyelv', name: 'Magyar nyelv és helyesírás' });
const wq = (word, sub) => Q(`<span class="wd">${word}</span>`, sub);
const hole = (word, part) => { const i = word.indexOf(part); return esc(word.slice(0, i)) + `<span class="slot">?</span>` + esc(word.slice(i + part.length)); };

/* ---- j vagy ly ---- */
const LY = ['hely', 'lyuk', 'folyó', 'golyó', 'király', 'bagoly', 'pehely', 'kehely', 'ölyv', 'gödölye', 'fogoly', 'tengely', 'hólyag', 'selyem', 'mályva', 'gally', 'gólya', 'olyan', 'milyen', 'ilyen', 'mely', 'folyik', 'hüvelyk', 'mérgely'].filter(w => w !== 'mérgely');
const JJ = ['játék', 'jég', 'jó', 'ajtó', 'majom', 'bajusz', 'ajándék', 'fej', 'sajt', 'hajó', 'rajz', 'tojás', 'fájdalom', 'hajnal', 'béka'.replace('béka', 'baj'), 'nyájas', 'tej', 'kéz'.replace('kéz', 'ejt'), 'rejt', 'fejlődik', 'lajhár', 'fájl', 'sujtás'].filter(w => w !== 'sujtás' && w !== 'fájl');
const lyWord = () => pick([...LY, ...JJ]);
const lyAns = w => (LY.includes(w) ? 'ly' : 'j');
const swapLy = w => (LY.includes(w) ? w.replace('ly', 'j') : w.replace('j', 'ly'));
mod({
  slug: 'j-ly-helyesiras', title: 'J vagy LY helyesírás gyakorló', short: 'J vagy LY', group: 'nyelv', glyph: 'j / ly', hue: 2, grades: [2, 5],
  desc: 'Melyik betű hiányzik a szóból: j vagy ly? Pótold a hiányzó betűt, és válaszd ki a helyes írásmódot.',
  seo: 'A j és az ly hangot azonos módon ejtjük, ezért a helyesírását szavanként meg kell tanulni. A gyakorló gyakori szavakat ad: hely, folyó, gólya, játék, ajtó, hajó. Először a hiányzó betűt pótolod, később a két írásmód közül kell a helyeset kiválasztanod.',
  levels: [
    { name: 'Hiányzó betű pótlása', gen: () => { const w = lyWord(), a = lyAns(w), part = a;
      return CH(Q(`<span class="wd">${hole(w, part)}</span>`, 'Melyik betű vagy betűpár hiányzik: j vagy ly?'), a, [a === 'ly' ? 'j' : 'ly'], { hint: `A szó helyesen: ${w}.` }); } },
    { name: 'Melyik a helyes írásmód?', gen: () => { const w = lyWord(), bad = swapLy(w);
      return CH(Q('Melyik szó van helyesen leírva?'), w, [bad], { hint: `A helyes írásmód: ${w}.` }); } },
    { name: 'Gyors kör: vegyes szavak', gen: () => { const w = lyWord(), a = lyAns(w);
      return Math.random() < .5 ? CH(Q(`<span class="wd">${hole(w, a)}</span>`, 'j vagy ly?'), a, [a === 'ly' ? 'j' : 'ly'], { hint: `A szó helyesen: ${w}.` })
        : CH(Q('Melyik szó van helyesen leírva?'), w, [swapLy(w)], { hint: `A helyes írásmód: ${w}.` }); } }
  ]
});

/* ---- Hosszú és rövid magánhangzók ---- */
const LONGV = [['híd', 'hid'], ['víz', 'viz'], ['tűz', 'tüz'], ['kéz', 'kez'], ['szív', 'sziv'], ['kút', 'kut'], ['út', 'ut'], ['fű', 'fu'], ['hős', 'hös'], ['kő', 'kö'], ['nyúl', 'nyul'], ['bútor', 'butor'], ['papír', 'papir'], ['hónap', 'honap'], ['szőnyeg', 'szönyeg'], ['fűrész', 'fürész'], ['hűtő', 'hütő'], ['szék', 'szek'], ['kérdés', 'kerdés'], ['tábla', 'tabla'], ['mókus', 'mokus'], ['cipő', 'cipö'], ['erdő', 'erdö'], ['fürdő', 'fürdö'], ['tető', 'tetö'], ['répa', 'repa'], ['szőlő', 'szölö'], ['tündér', 'tunder'], ['könnyű', 'könnyü'], ['kávé', 'kave']];
const longBad = pair => { const [c, w] = pair; const a = [w]; const variants = { 'í': 'i', 'ú': 'u', 'ű': 'ü', 'ő': 'ö', 'é': 'e', 'ó': 'o', 'á': 'a', 'i': 'í', 'u': 'ú', 'ü': 'ű', 'ö': 'ő' };
  for (let i = 0; i < c.length; i++) if (variants[c[i]]) { const v = c.slice(0, i) + variants[c[i]] + c.slice(i + 1); if (v !== c && !a.includes(v)) a.push(v); } return a; };
mod({
  slug: 'hosszu-rovid-hangok', title: 'Hosszú és rövid magánhangzók gyakorló', short: 'Hosszú-rövid hangok', group: 'nyelv', glyph: 'ő ö', hue: 1, grades: [1, 4],
  desc: 'Ékezetes betűk helyesírása: i vagy í, u vagy ú, ö vagy ő, ü vagy ű. Válaszd ki a helyesen leírt szót.',
  seo: 'A magyar nyelvben a magánhangzók hosszúsága megváltoztatja a szó írását és gyakran az értelmét is. A gyakorló gyakori szavakat ad (híd, víz, tűz, kéz, erdő), és azt kéri, hogy válaszd ki a helyes írásmódot.',
  levels: [
    { name: 'Két írásmód közül', gen: () => { const p = pick(LONGV); return CH(Q('Melyik szó van helyesen leírva?'), p[0], [p[1]], { hint: `A helyes írásmód: ${p[0]}.` }); } },
    { name: 'Négy írásmód közül', gen: () => { const p = pick(LONGV); return CH(Q('Melyik szó van helyesen leírva?'), p[0], longBad(p).slice(0, 3), { hint: `A helyes írásmód: ${p[0]}.` }); } },
    { name: 'Hiányzó ékezet pótlása', gen: () => { const p = pick(LONGV); const c = p[0]; const idx = [...c].findIndex((ch, i) => 'íúűőéóá'.includes(ch) && ch !== p[1][i]); const i = idx < 0 ? [...c].findIndex(ch => 'íúűőéóá'.includes(ch)) : idx;
      const shown = esc(c.slice(0, i)) + '<span class="slot">?</span>' + esc(c.slice(i + 1)); const right = c[i], short = p[1][i] || c[i];
      return CH(Q(`<span class="wd">${shown}</span>`, 'Melyik betű kerül a helyére?'), right, [short, 'ö', 'u', 'i', 'o', 'ü', 'e'].filter(x => x !== right).slice(0, 3), { hint: `A szó helyesen: ${c}.` }); } }
  ]
});

/* ---- Szótagolás, ABC ---- */
const SZOTAGSZO = ['alma', 'ablak', 'kutya', 'iskola', 'tanító', 'virág', 'asztal', 'tó', 'ház', 'madár', 'csillag', 'bicikli', 'repülőgép', 'csokoládé', 'palacsinta', 'tavasz', 'könyv', 'szék', 'mosoly', 'testvér', 'határozat', 'szív', 'cica', 'játék', 'eper', 'körte', 'egér', 'elefánt', 'banán', 'kenyér', 'számítógép', 'televízió', 'uszoda', 'tükör', 'fagylalt', 'ceruza', 'radír', 'füzet', 'nyúl', 'zsiráf'];
const VOW = 'aáeéiíoóöőuúüű';
const syl = w => [...w].filter(c => VOW.includes(c)).length;
const HUABC = ['a', 'b', 'c', 'cs', 'd', 'dz', 'dzs', 'e', 'f', 'g', 'gy', 'h', 'i', 'j', 'k', 'l', 'ly', 'm', 'n', 'ny', 'o', 'ö', 'p', 'q', 'r', 's', 'sz', 't', 'ty', 'u', 'ü', 'v', 'w', 'x', 'y', 'z', 'zs'];
const BASE = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ő': 'ö', 'ú': 'u', 'ű': 'ü' };
const huTok = w => { w = w.toLowerCase(); const r = []; for (let i = 0; i < w.length;) { let t = w.slice(i, i + 3); if (!HUABC.includes(t)) t = w.slice(i, i + 2); if (!HUABC.includes(t)) t = w[i]; r.push(BASE[t] || t); i += t.length; } return r; };
const huCmp = (a, b) => { const x = huTok(a), y = huTok(b); for (let i = 0; i < Math.min(x.length, y.length); i++) { const d = HUABC.indexOf(x[i]) - HUABC.indexOf(y[i]); if (d) return d; } return x.length - y.length; };
const ABCSZO = ['alma', 'barack', 'cica', 'csillag', 'dinnye', 'eper', 'fa', 'gomba', 'gyerek', 'hal', 'iskola', 'játék', 'kutya', 'labda', 'lyuk', 'madár', 'nap', 'nyúl', 'oroszlán', 'ősz', 'pók', 'róka', 'sál', 'szék', 'tó', 'tyúk', 'uszoda', 'ünnep', 'vonat', 'zebra', 'zsiráf', 'kenyér', 'béka', 'ház', 'egér', 'ló', 'macska', 'napló', 'ceruza', 'táska'];
mod({
  slug: 'szotagolas-abc', title: 'Szótagolás és ABC-sorrend gyakorló', short: 'Szótagolás, ABC', group: 'nyelv', glyph: 'A–Z', hue: 3, grades: [1, 3],
  desc: 'Hány szótagú a szó? Melyik szó van elöl az ábécében? Szavak sorba rendezése a magyar ábécé szerint.',
  seo: 'Magyarul a szótagok száma megegyezik a szóban lévő magánhangzók számával. Az ábécé-sorrend ismerete a szótárhasználathoz és a rendezéshez kell. A gyakorló a szótagszámlálással és a szavak ábécé szerinti rendezésével indul, a kétjegyű betűk (cs, gy, ly, ny, sz, ty, zs) is a helyükön szerepelnek.',
  levels: [
    { name: 'Hány szótagú a szó?', gen: () => { const w = pick(SZOTAGSZO.filter(x => syl(x) <= 3)); return NUM(wq(esc(w), 'Hány szótagból áll a szó?'), syl(w), { hint: `Minden magánhangzó egy szótagot ad. A szó: ${w}, ${syl(w)} szótag.` }); } },
    { name: 'Hosszabb szavak szótagolása', gen: () => { const w = pick(SZOTAGSZO.filter(x => syl(x) >= 3)); return NUM(wq(esc(w), 'Hány szótagból áll a szó?'), syl(w), { hint: `Minden magánhangzó egy szótagot ad: ${syl(w)} szótag.` }); } },
    { name: 'Melyik van legelöl az ábécében?', gen: () => { const ws = shuffle(ABCSZO).slice(0, 4).sort(huCmp); return CH(Q('Melyik szó áll legelöl az ábécé szerinti sorrendben?'), ws[0], ws.slice(1), { hint: `Az ábécé szerint ez a sorrend: ${ws.join(', ')}.` }); } },
    { name: 'Melyik van legvégén?', gen: () => { const ws = shuffle(ABCSZO).slice(0, 4).sort(huCmp); return CH(Q('Melyik szó áll leghátul az ábécé szerinti sorrendben?'), ws[3], ws.slice(0, 3), { hint: `Az ábécé szerint ez a sorrend: ${ws.join(', ')}.` }); } },
    { name: 'Hányadik helyen áll a szó?', gen: () => { const ws = shuffle(ABCSZO).slice(0, 4).sort(huCmp); const k = rnd(0, 3);
      return NUM(Q(ws.map(esc).sort(() => Math.random() - .5).map(x => `<span class="wd">${x}</span>`).join(' '), `Ha ábécé szerint sorba rakod a szavakat, hányadik helyen áll ez: <b>${esc(ws[k])}</b>?`), k + 1, { hint: `A sorrend: ${ws.join(', ')}.` }); } }
  ]
});

/* ---- Szófajok ---- */
const FONEV = ['asztal', 'kutya', 'iskola', 'kenyér', 'tó', 'ember', 'ház', 'könyv', 'alma', 'madár', 'füzet', 'autó', 'kert', 'tanár'];
const MELLEK = ['nagy', 'piros', 'gyors', 'kedves', 'magas', 'hideg', 'kerek', 'okos', 'édes', 'kicsi', 'szép', 'zöld', 'vidám'];
const IGE = ['fut', 'ír', 'olvas', 'alszik', 'nevet', 'főz', 'rajzol', 'ugrik', 'énekel', 'játszik', 'tanul', 'számol', 'mosdik', 'eszik'];
const SZAMNEV = ['három', 'hét', 'tíz', 'húsz', 'száz', 'ötödik', 'kettő', 'kilenc'];
const POS = { főnév: FONEV, melléknév: MELLEK, ige: IGE, számnév: SZAMNEV };
mod({
  slug: 'szofajok', title: 'Szófajok gyakorló', short: 'Szófajok', group: 'nyelv', glyph: 'ige', hue: 4, grades: [3, 6],
  desc: 'Főnév, melléknév, ige, számnév: ismerd fel a szavak szófaját.',
  seo: 'A főnév a dolgok nevét adja meg (asztal, kutya), a melléknév a tulajdonságot (nagy, piros), az ige a cselekvést (fut, olvas), a számnév pedig a mennyiséget (három, húsz). A gyakorló szavakat mutat, és azt kéri, hogy ismerd fel a szófajukat.',
  levels: [
    { name: 'Főnév vagy ige?', gen: () => { const t = pick(['főnév', 'ige']), o = t === 'főnév' ? 'ige' : 'főnév'; const w = pick(POS[t]); return CH(wq(esc(w), 'Milyen szófajú ez a szó?'), t, [o], { hint: `A(z) ${w} ${t}: ${t === 'ige' ? 'cselekvést jelent' : 'dolgot, élőlényt nevez meg'}.` }); } },
    { name: 'Főnév, melléknév vagy ige?', gen: () => { const t = pick(['főnév', 'melléknév', 'ige']); const w = pick(POS[t]); return CH(wq(esc(w), 'Milyen szófajú ez a szó?'), t, ['főnév', 'melléknév', 'ige'].filter(x => x !== t), { hint: `A(z) ${w} ${t}.` }); } },
    { name: 'Melyik szó a ...?', gen: () => { const t = pick(['főnév', 'melléknév', 'ige']); const w = pick(POS[t]); const others = shuffle(['főnév', 'melléknév', 'ige'].filter(x => x !== t)).map(x => pick(POS[x]));
      return CH(Q(`Melyik szó ${t}?`), w, others.concat(pick(POS[['főnév', 'melléknév', 'ige'].filter(x => x !== t)[0]])), { hint: `A(z) ${w} ${t}.` }); } },
    { name: 'Négy szófaj: számnévvel', gen: () => { const t = pick(['főnév', 'melléknév', 'ige', 'számnév']); const w = pick(POS[t]); return CH(wq(esc(w), 'Milyen szófajú ez a szó?'), t, ['főnév', 'melléknév', 'ige', 'számnév'].filter(x => x !== t), { hint: `A(z) ${w} ${t}.` }); } }
  ]
});

/* ---- Mondatfajták ---- */
const MONDAT = {
  kijelentő: ['Süt a nap.', 'A kutya az udvaron alszik.', 'Holnap iskolába megyek.', 'Anya süteményt sütött.', 'A madarak délre repülnek.', 'Szeretem a nyarat.', 'Reggel korán keltem.'],
  kérdő: ['Hová mész?', 'Szereted a csokit?', 'Mikor jössz haza?', 'Ki ette meg a süteményt?', 'Hány óra van?', 'Van kedved játszani?', 'Hol van a táskám?'],
  felkiáltó: ['Milyen szép ez a virág!', 'Hurrá, nyertünk!', 'De hideg van!', 'Jaj, de fáj!', 'Milyen nagy a hó!', 'Ez fantasztikus!'],
  felszólító: ['Gyere ide!', 'Írd le a leckét.', 'Nyisd ki az ablakot!', 'Ne fuss a folyosón!', 'Hozz egy pohár vizet.', 'Pakold el a játékokat!'],
  óhajtó: ['Bárcsak itt lennél!', 'Bárcsak esne az eső.', 'Bárcsak tudnék repülni!', 'Bárcsak ne lenne még vége a nyárnak.']
};
const MT = ['kijelentő', 'kérdő', 'felkiáltó', 'felszólító'];
mod({
  slug: 'mondatfajtak', title: 'Mondatfajták gyakorló', short: 'Mondatfajták', group: 'nyelv', glyph: '?!', hue: 2, grades: [2, 5],
  desc: 'Kijelentő, kérdő, felkiáltó, felszólító és óhajtó mondat felismerése.',
  seo: 'A mondatok célja szerint kijelentő, kérdő, felkiáltó, felszólító és óhajtó mondatokat különböztetünk meg. A gyakorló rövid mondatokat mutat, és azt kéri, hogy válaszd ki a mondat fajtáját, vagy a mondat végére a megfelelő írásjelet.',
  levels: [
    { name: 'Kijelentő vagy kérdő?', gen: () => { const t = pick(['kijelentő', 'kérdő']); const s = pick(MONDAT[t]); return CH(Q(`<span class="wd">${esc(s)}</span>`, 'Milyen mondat ez?'), t, [t === 'kijelentő' ? 'kérdő' : 'kijelentő'], { hint: `Ez ${t} mondat.` }); } },
    { name: 'Négy mondatfajta', gen: () => { const t = pick(MT); const s = pick(MONDAT[t]); return CH(Q(`<span class="wd">${esc(s)}</span>`, 'Milyen mondat ez?'), t, MT.filter(x => x !== t), { hint: `Ez ${t} mondat.` }); } },
    { name: 'Az írásjel pótlása', gen: () => { const t = pick(['kijelentő', 'kérdő', 'felkiáltó']); const s = pick(MONDAT[t]); const stem = s.slice(0, -1); const right = s.slice(-1);
      return CH(Q(`<span class="wd">${esc(stem)}<span class="slot">?</span></span>`, 'Melyik írásjel kerül a mondat végére?'), right, ['.', '?', '!'].filter(x => x !== right), { hint: `A mondat így helyes: ${s}` }); } },
    { name: 'Óhajtó mondatokkal', gen: () => { const all = [...MT, 'óhajtó']; const t = pick(all); const s = pick(MONDAT[t]); return CH(Q(`<span class="wd">${esc(s)}</span>`, 'Milyen mondat ez?'), t, all.filter(x => x !== t), { hint: `Ez ${t} mondat.` }); } }
  ]
});

/* ---- Toldalékok: -val/-vel ---- */
const VAL = [['kéz', 'kézzel', 'kézvel', 'kézval', 'kézzal'], ['ház', 'házzal', 'házval', 'házvel', 'házzel'], ['ló', 'lóval', 'lóvel', 'lóal', 'lóel'], ['szem', 'szemmel', 'szemvel', 'szemval', 'szemmal'], ['toll', 'tollal', 'tollel', 'tollval', 'tollvel'], ['alma', 'almával', 'almavel', 'almaval', 'almával'.replace('á', 'e')],
  ['kutya', 'kutyával', 'kutyavel', 'kutyaval', 'kutyával'.replace('á', 'é')], ['tű', 'tűvel', 'tűval', 'tűél', 'tűvél'], ['cipő', 'cipővel', 'cipőval', 'cipőel', 'cipővál'], ['ceruza', 'ceruzával', 'ceruzavel', 'ceruzaval', 'ceruzével'], ['kés', 'késsel', 'késvel', 'késsal', 'késval'], ['labda', 'labdával', 'labdavel', 'labdaval', 'labdével'],
  ['zöld', 'zölddel', 'zöldvel', 'zöldal', 'zöldel'.replace('zöldel', 'zöldvel')], ['víz', 'vízzel', 'vízvel', 'vízzal', 'vízval'], ['barát', 'baráttal', 'barátval', 'barátvel', 'barátal'], ['tavasz', 'tavasszal', 'tavaszval', 'tavaszvel', 'tavaszal'], ['szék', 'székkel', 'székvel', 'székal', 'székval']];
mod({
  slug: 'toldalekok-val-vel', title: 'Toldalékok gyakorló (-val, -vel)', short: 'Toldalékok', group: 'nyelv', glyph: '-val', hue: 3, grades: [3, 6],
  desc: 'A -val és a -vel rag helyes alakja: kézzel, tollal, tűvel, almával.',
  seo: 'A -val és a -vel rag első hangja hasonul a szó végéhez (kéz + vel = kézzel), magánhangzóra végződő szavaknál pedig a v megmarad (tű + vel = tűvel). A gyakorló szavakat ad, és a helyes alakot kell kiválasztanod.',
  levels: [
    { name: 'Melyik alak a helyes?', gen: () => { const r = pick(VAL); const wr = shuffle(r.slice(2).filter(x => x !== r[1])).slice(0, 3); return CH(Q(`<span class="wd">${esc(r[0])} + -val / -vel</span>`, 'Melyik alak helyes?'), r[1], wr, { hint: `A helyes alak: ${r[1]}.` }); } },
    { name: 'Egy lépésben: melyik szó helyes?', gen: () => { const r = pick(VAL); return CH(Q(`Melyik szó van helyesen leírva?`), r[1], shuffle(r.slice(2).filter(x => x !== r[1])).slice(0, 1), { hint: `A helyes alak: ${r[1]}.` }); } }
  ]
});

/* ================= FELÜLET ================= */
const N = 10;                 // kérdések száma egy körben
const SHEET_N = 20;           // kérdések a munkalapon
const DAILY_GOAL = 20;        // napi cél: helyes válaszok
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

/* ---------- Profil: pontok, szintek, sorozat, jelvények (csak a böngészőben tárolva) ---------- */
const todayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yesterdayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return todayStr(d); };
const blankP = () => ({ pts: 0, ok: 0, rounds: 0, perf: 0, days: {}, badges: {}, played: {}, grade: 0, streak: 0, best: 0, last: '' });
const getP = () => Object.assign(blankP(), store.get()._p || {});
const curStreak = p => (p.last === todayStr() || p.last === yesterdayStr() ? p.streak : 0);
const lvlStart = n => 50 * (n - 1) * (n - 1);
const levelOf = pts => Math.floor(Math.sqrt(pts / 50)) + 1;
const TITLES = ['Kezdő', 'Gyakorló', 'Ügyes számoló', 'Számolóbajnok', 'Matekfelfedező', 'Matekmester', 'Matekzseni', 'Matekóriás', 'Legenda'];
const titleOf = l => TITLES[Math.min(l, TITLES.length) - 1];
const count3 = all => MODS.reduce((s, m) => s + m.levels.filter((_, i) => starsOf(((all[m.slug] || {})[i]) || 0) === 3).length, 0);
const BADGES = [
  { id: 'first', g: '1', name: 'Első kör', desc: 'Fejezz be egy kört.', t: p => p.rounds >= 1 },
  { id: 'perf1', g: '10', name: 'Hibátlan', desc: 'Legyen 10 a 10-ből egy körben.', t: p => p.perf >= 1 },
  { id: 'perf5', g: '5×', name: 'Öt hibátlan kör', desc: 'Öt körben legyen minden válaszod helyes.', t: p => p.perf >= 5 },
  { id: 'ok100', g: '100', name: 'Száz helyes válasz', desc: 'Adj összesen 100 helyes választ.', t: p => p.ok >= 100 },
  { id: 'ok500', g: '500', name: 'Ötszáz helyes válasz', desc: 'Adj összesen 500 helyes választ.', t: p => p.ok >= 500 },
  { id: 'ok1000', g: '1000', name: 'Ezer helyes válasz', desc: 'Adj összesen 1000 helyes választ.', t: p => p.ok >= 1000 },
  { id: 'st3', g: '3 nap', name: 'Három napos sorozat', desc: 'Gyakorolj három egymást követő napon.', t: p => p.best >= 3 },
  { id: 'st7', g: '7 nap', name: 'Egy hét', desc: 'Gyakorolj hét egymást követő napon.', t: p => p.best >= 7 },
  { id: 'st30', g: '30 nap', name: 'Egy hónap', desc: 'Gyakorolj harminc egymást követő napon.', t: p => p.best >= 30 },
  { id: 'ex5', g: '5', name: 'Felfedező', desc: 'Próbálj ki 5 különböző gyakorlót.', t: p => Object.keys(p.played).length >= 5 },
  { id: 'ex12', g: '12', name: 'Mindentudó', desc: 'Próbálj ki 12 különböző gyakorlót.', t: p => Object.keys(p.played).length >= 12 },
  { id: 'star10', g: '★10', name: 'Csillagász', desc: 'Szerezz 3 csillagot 10 különböző szinten.', t: (p, a) => count3(a) >= 10 },
  { id: 'star30', g: '★30', name: 'Csillagzápor', desc: 'Szerezz 3 csillagot 30 különböző szinten.', t: (p, a) => count3(a) >= 30 },
  { id: 'pts1000', g: '1000', name: 'Ezer pont', desc: 'Gyűjts 1000 pontot.', t: p => p.pts >= 1000 },
  { id: 'lv5', g: 'Sz. 5', name: 'Ötös szint', desc: 'Érd el az 5. szintet.', t: p => levelOf(p.pts) >= 5 },
  { id: 'big', g: '5–8', name: 'Nagy kihívás', desc: 'Szerezz 3 csillagot egy felsős (5–8. osztályos) gyakorlón.', t: (p, a) => MODS.some(m => m.grades[0] >= 5 && m.levels.some((_, i) => starsOf(((a[m.slug] || {})[i]) || 0) === 3)) },
  { id: 'mul', g: '×', name: 'Szorzótábla-mester', desc: 'Szerezz 3 csillagot a szorzótábla minden szintjén.', t: (p, a) => { const m = MODS.find(x => x.slug === 'szorzotabla'); return !!m && m.levels.every((_, i) => starsOf(((a[m.slug] || {})[i]) || 0) === 3); } }
];
const medal = (g, on) => `<svg class="medal ${on ? 'on' : ''}" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 3h11l5 15H23zM46 3H35l-5 15h11z" class="mrib"/><circle cx="32" cy="38" r="22" class="mcir"/><text x="32" y="${g.length > 4 ? 42 : 44}" text-anchor="middle" class="mtxt" style="font-size:${g.length > 4 ? 12 : g.length > 2 ? 15 : 19}px">${g}</text></svg>`;
const FLAME = '<svg class="flame" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" fill="currentColor"/></svg>';

const S = { view: 'home', mod: null, lvl: 0, cur: null, i: 0, score: 0, input: '', done: false, ok: null, pick: null, hist: [], timer: null, sheet: [], run: 0, maxRun: 0, award: null, askReset: false };
const ICONS = {
  clock: '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" stroke-width="4"/><path d="M30 14v17l11 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  coin: '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" stroke-width="4"/><text x="30" y="37" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="600" font-size="20" fill="currentColor">Ft</text></svg>',
  shape: '<svg viewBox="0 0 80 60"><polygon points="22,8 42,46 2,46" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><rect x="46" y="22" width="30" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="4"/></svg>',
  die: '<svg viewBox="0 0 60 60"><rect x="6" y="6" width="48" height="48" rx="10" fill="none" stroke="currentColor" stroke-width="4"/><g fill="currentColor"><circle cx="20" cy="20" r="4"/><circle cx="40" cy="20" r="4"/><circle cx="30" cy="30" r="4"/><circle cx="20" cy="40" r="4"/><circle cx="40" cy="40" r="4"/></g></svg>'
};
const glyph = m => (m.icon ? ICONS[m.icon] : m.glyph);
const SITE_NAME = 'Iskolai Gyakorló';
const modBySlug = s => MODS.find(m => m.slug === s);
const gradeTxt = m => `${m.grades[0] === m.grades[1] ? m.grades[0] : m.grades[0] + '–' + m.grades[1]}. osztály`;
const ansText = q => (q.kind === 'num' ? `${numTxt(q.ans)}${q.unit ? (q.unit === '°' || q.unit === '%' ? '' : ' ') + q.unit : ''}` : q.ansLabel);
const showIn = s => esc(s.replace('-', '−'));
const parseIn = s => (/^-?\d+(,\d*)?$/.test(s) ? parseFloat(s.replace(',', '.')) : null);

/* ---------- Kérdések ---------- */
function newQ(seen = [], lv = S.lvl) {
  const L = S.mod.levels[lv]; let q, k = 0;
  const used = new Set(seen.map(x => x.q));
  do { q = L.gen(); k++; } while (used.has(q.q) && k < 40);
  if (L.neg) q.neg = true;
  if (L.dec) q.dec = true;
  return q;
}

/* ---------- Nézetek ---------- */
function pstrip() {
  const p = getP(), l = levelOf(p.pts), a = lvlStart(l), b = lvlStart(l + 1), pc = Math.round((p.pts - a) / (b - a) * 100);
  const day = p.days[todayStr()] || 0, cs = curStreak(p), bc = Object.keys(p.badges).length;
  return `<a class="pstrip" href="${href('profil')}" aria-label="Haladásom és jelvények"><div class="pcell"><span class="lab">${l}. szint</span><b>${titleOf(l)}</b><div class="pbar"><i style="width:${pc}%"></i></div><small>${fmt(p.pts)} pont, még ${fmt(b - p.pts)} a következő szintig</small></div><div class="pcell"><span class="lab">Sorozat</span><b class="${cs ? 'hot' : ''}">${FLAME}${cs} nap</b><small>${cs ? 'Gyakorolj ma is!' : 'Kezdj új sorozatot!'}</small></div><div class="pcell"><span class="lab">Mai cél</span><b>${Math.min(day, DAILY_GOAL)}/${DAILY_GOAL}</b><div class="pbar"><i style="width:${Math.min(1, day / DAILY_GOAL) * 100}%"></i></div><small>helyes válasz ma</small></div><div class="pcell"><span class="lab">Jelvények</span><b>${bc}/${BADGES.length}</b><small>Megnézem →</small></div></a>`;
}
function gradePicker() {
  const g = getP().grade, chip = (v, t) => `<button class="gchip" data-act="grade" data-g="${v}" aria-pressed="${g === v}">${t}</button>`;
  return `<div class="gpick" role="group" aria-label="Évfolyam"><span class="gl">Hányadikos vagy?</span><div class="gchips">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => chip(n, n + '.')).join('')}${chip(0, 'Mind')}</div></div>`;
}
const card = m => `<a class="card" data-h="${m.hue}" href="${href(m.slug)}"><div class="tile">${glyph(m)}</div><h3>${m.short}</h3><div class="meta"><span>${gradeTxt(m)}</span>${modStars(m) ? starHTML(modStars(m)) : `<span>${m.levels.length} szint</span>`}</div></a>`;
function homeView() {
  const g = getP().grade, rec = g ? MODS.filter(m => m.grades[0] <= g && g <= m.grades[1]) : [];
  const rest = MODS.filter(m => !rec.includes(m));
  const recHTML = rec.length ? `<section class="grp"><h2>Neked ajánlott: ${g}. osztály</h2><div class="cards">${rec.map(card).join('')}</div></section>` : '';
  const groups = GROUPS.map(gr => { const ms = rest.filter(m => m.group === gr.id); return ms.length ? `<section class="grp"><h2>${rec.length ? gr.name + ' (további)' : gr.name}</h2><div class="cards">${ms.map(card).join('')}</div></section>` : ''; }).join('');
  return `<div class="hero"><h1>Gyakorolj játékosan!</h1><p>Ingyenes gyakorlók 1–8. osztályosoknak: szorzótábla, törtek, százalék, egyenletek, helyesírás, óra, pénz, geometria és még sok más. Regisztráció nélkül, telefonon, tableten és számítógépen is.</p></div>${pstrip()}${gradePicker()}${recHTML}${groups}`;
}

function setupView() {
  const m = S.mod;
  const rows = m.levels.map((L, i) => { const b = bestOf(m.slug, i);
    return `<div class="lv"><div><div class="nm">${i + 1}. ${L.name}</div><div class="st">${b ? `Legjobb eredményed: ${b}/${N} ${starHTML(starsOf(b))}` : 'Még nem próbáltad'}</div></div><div class="acts"><button class="btn sm" data-act="start" data-l="${i}">Gyakorlás</button><button class="btn sm sec" data-act="sheet" data-l="${i}">Munkalap</button></div></div>`; }).join('');
  const rel = MODS.filter(x => x.group === m.group && x !== m).concat(MODS.filter(x => x.group !== m.group)).slice(0, 5).map(x => `<a href="${href(x.slug)}">${x.short}</a>`).join('');
  const roller = m.extra === 'dice' ? `<div class="roller"><button class="btn sm" data-act="roll" data-n="2">Dobj a kockákkal!</button><div class="dice" id="rollout" aria-live="polite">${dieSVG(4)}${dieSVG(2)}</div><div id="rollsum" class="sub"></div></div>` : '';
  return `<div class="setup"><a class="crumb" href="${href('')}">← Minden gyakorló</a><h1>${m.title}</h1><p class="lead">${m.desc}</p><p class="grline">Ajánlott évfolyam: ${gradeTxt(m)}</p>${roller}<h2 class="sr">Szintek</h2><div class="levels">${rows}</div>${m.levels.length > 1 ? `<div class="lv mixrow"><div><div class="nm">Vegyes munkalap</div><div class="st">Minden szintről, könnyebbtől a nehezebbig. A darabszámot a munkalapon állíthatod (10, 20 vagy 30).</div></div><div class="acts"><button class="btn sm sec" data-act="sheet" data-l="-1">Vegyes munkalap</button></div></div>` : ''}<section class="about"><h2>Mire jó ez a gyakorló?</h2><p>${m.seo}</p></section><nav class="rel" aria-label="További gyakorlók">${rel}</nav></div>`;
}

function answerArea() {
  const q = S.cur;
  if (q.kind === 'num') {
    const cls = S.done ? (S.ok ? 'ok' : 'bad') : '';
    const keys = [7, 8, 9, 4, 5, 6, 1, 2, 3].map(k => `<button class="key" data-act="key" data-k="${k}" aria-label="${k}">${k}</button>`).join('');
    const extra = (q.neg || q.dec) && !S.done ? `<div class="pad-extra">${q.neg ? '<button class="key sm" data-act="key" data-k="neg" aria-label="Mínusz előjel">−</button>' : ''}${q.dec ? '<button class="key sm" data-act="key" data-k="comma" aria-label="Tizedesvessző">,</button>' : ''}</div>` : '';
    const pad = S.done ? '' : `${extra}<div class="pad">${keys}<button class="key" data-act="key" data-k="del" aria-label="Törlés"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M13 9l4 6M17 9l-4 6"/></svg></button><button class="key" data-act="key" data-k="0" aria-label="0">0</button><button class="key go" data-act="key" data-k="ok">Kész</button></div>`;
    return `<div class="abox ${cls}" id="abox" aria-live="polite">${S.input ? showIn(S.input) : '<span class="ph">…</span>'}${q.unit ? `<span class="unit">${q.unit}</span>` : ''}</div>${pad}`;
  }
  const pics = q.grid ? ' pics' : '';
  const cnt = q.cmp ? ' three' : '';
  return `<div class="opts${cnt}${pics}">${q.choices.map(c => {
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
  const st = starsOf(S.score), wrong = S.hist.filter(h => !h.ok), A = S.award;
  const msg = st === 3 ? 'Kiváló munka!' : st === 2 ? 'Nagyon jó!' : st === 1 ? 'Jó kezdet!' : 'Ne add fel, gyakorolj még!';
  const award = A ? `<div class="award"><div class="apts">+${A.pts} pont</div><ul>${A.parts.map(([t, v]) => `<li><span>${t}</span><b>+${v}</b></li>`).join('')}</ul>${A.up ? `<div class="lvup">Szintet léptél: ${A.lvl}. szint, ${titleOf(A.lvl)}!</div>` : ''}<div class="astat"><span class="hot">${FLAME}${A.streak} napos sorozat</span><span>Mai cél: ${Math.min(A.day, DAILY_GOAL)}/${DAILY_GOAL}</span></div></div>${A.nb.length ? `<h2 class="nbh">Új jelvény${A.nb.length > 1 ? 'ek' : ''}!</h2><div class="nbadges">${A.nb.map(b => `<div class="nb">${medal(b.g, true)}<b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div>` : ''}` : '';
  return `<div class="result"><h1>${msg}</h1><div class="bigstars" aria-label="${st} csillag a 3-ból">${[0, 1, 2].map(i => `<span class="${i < st ? '' : 'off'}">★</span>`).join('')}</div><div class="score">${S.score} helyes válasz a ${N}-ből</div>${award}<div class="ractions"><button class="btn" data-act="again">Új kör</button><button class="btn sec" data-act="quit">Másik szint</button><a class="btn sec" href="${href('')}">Főoldal</a></div>${wrong.length ? `<h2 style="margin-bottom:10px">Ezeket nézzük meg újra</h2><div class="wrongs">${wrong.map(h => `<div>${h.q.q}<div class="ans">Helyes válasz: ${ansText(h.q)}</div></div>`).join('')}</div>` : ''}</div>`;
}
function sheetView() {
  const m = S.mod, L = m.levels[Math.max(0, S.lvl)];
  const items = S.sheet.map(q => `<li><div class="sq">${q.q}</div>${q.kind === 'num' ? `<div class="sline">Válasz: <span class="blank"></span> ${q.unit || ''}</div>` : `<div class="sopts">${q.choices.map((c, i) => `<span>${'ABCD'[i]}) ${c.h}</span>`).join('')}</div>`}</li>`).join('');
  return `<div class="stool noprint"><a class="btn sec sm" href="#" data-act="quit">← Vissza</a><button class="btn sm" data-act="print">Nyomtatás</button><button class="btn sec sm" data-act="newsheet">Új munkalap</button><span class="cnt">Feladatok: ${[10, 20, 30].map(n => `<button class="btn sm ${(S.sheetN || SHEET_N) === n ? '' : 'sec'}" data-act="sheetn" data-n="${n}" aria-pressed="${(S.sheetN || SHEET_N) === n}">${n}</button>`).join('')}</span></div><article class="sheet"><div class="shead"><h1>${m.title}</h1><div>Név: ____________________ Dátum: ____________</div><div class="lvn">${S.mix ? 'Vegyes szintek: könnyebbtől a nehezebbig' : `${S.lvl + 1}. szint: ${L.name}`}</div></div><ol class="slist">${items}</ol></article>`;
}
function profileView() {
  const p = getP(), l = levelOf(p.pts), a = lvlStart(l), b = lvlStart(l + 1), pc = Math.round((p.pts - a) / (b - a) * 100), day = p.days[todayStr()] || 0;
  const stat = (v, t) => `<div class="stat"><b>${v}</b><span>${t}</span></div>`;
  const badges = BADGES.map(x => `<div class="bdg ${p.badges[x.id] ? 'got' : ''}">${medal(x.g, !!p.badges[x.id])}<b>${x.name}</b><small>${x.desc}</small>${p.badges[x.id] ? `<em>${p.badges[x.id]}</em>` : ''}</div>`).join('');
  const reset = S.askReset ? `<p class="warn">Biztosan törlöd az összes pontot, jelvényt és eredményt erről az eszközről?</p><div class="ractions"><button class="btn" data-act="resetyes">Igen, törlés</button><button class="btn sec" data-act="resetno">Mégsem</button></div>` : `<button class="btn sec sm" data-act="resetask">Minden adatom törlése</button>`;
  return `<div class="setup"><a class="crumb" href="${href('')}">← Minden gyakorló</a><h1>Haladásom és jelvények</h1><p class="lead">Az eredményeid csak ezen az eszközön, a böngészőben tárolódnak. Nincs fiók és nincs regisztráció.</p><div class="pbig"><div><span class="lab">${l}. szint</span><b>${titleOf(l)}</b></div><div class="pbar"><i style="width:${pc}%"></i></div><small>${fmt(p.pts)} pont, még ${fmt(b - p.pts)} a következő szintig</small></div><div class="stats">${stat(fmt(p.pts), 'pont')}${stat(fmt(p.ok), 'helyes válasz')}${stat(p.rounds, 'befejezett kör')}${stat(p.perf, 'hibátlan kör')}${stat(curStreak(p), 'napos sorozat')}${stat(p.best, 'legjobb sorozat')}${stat(Math.min(day, DAILY_GOAL) + '/' + DAILY_GOAL, 'mai cél')}${stat(Object.keys(p.played).length + '/' + MODS.length, 'kipróbált gyakorló')}</div><h2 class="sech">Jelvények (${Object.keys(p.badges).length}/${BADGES.length})</h2><div class="bgrid">${badges}</div><h2 class="sech">Haladás átvitele másik eszközre</h2><p>Készíts egy kódot, és másold be a másik eszközön ugyanide. A betöltés felülírja az ottani adatokat.</p><textarea id="code" class="code" rows="4" spellcheck="false" aria-label="Mentési kód" placeholder="Ide kerül a kód, vagy ide illeszd be a betöltéshez"></textarea><div class="ractions left"><button class="btn sm" data-act="mkcode">Kód készítése</button><button class="btn sm sec" data-act="copycode">Másolás</button><button class="btn sm sec" data-act="loadcode">Betöltés</button></div><p id="bmsg" class="bmsg" role="status"></p><div class="resetbox">${reset}</div></div>`;
}

function render() {
  const app = $('#app');
  app.innerHTML = S.view === 'home' ? homeView() : S.view === 'setup' ? setupView() : S.view === 'quiz' ? quizView() : S.view === 'result' ? resultView() : S.view === 'profile' ? profileView() : sheetView();
  if (S.view === 'quiz' && S.done && !S.ok) { const b = $('#nextbtn'); if (b) b.focus({ preventScroll: true }); }
  document.title = S.view === 'profile' ? `Haladásom és jelvények – ${SITE_NAME}` : S.mod && S.view !== 'home' ? `${S.mod.title} – ${SITE_NAME}` : `${SITE_NAME} – ingyenes matematika gyakorlók 1–8. osztályosoknak`;
}

/* ---------- Működés ---------- */
function startQuiz(l) {
  clearTimeout(S.timer);
  Object.assign(S, { view: 'quiz', lvl: l, i: 0, score: 0, input: '', done: false, ok: null, pick: null, hist: [], run: 0, maxRun: 0, award: null });
  S.cur = newQ([]); render(); window.scrollTo(0, 0);
}
function answer(val) {
  if (S.done) return; const q = S.cur; let ok;
  if (q.kind === 'num') { const v = parseIn(S.input); if (v === null) return; ok = Math.abs(v - q.ans) < 1e-6; } else { S.pick = val; ok = val === q.ans; }
  S.done = true; S.ok = ok; if (ok) { S.score++; S.run++; S.maxRun = Math.max(S.maxRun, S.run); } else S.run = 0;
  S.hist.push({ q, ok }); render();
  if (ok) S.timer = setTimeout(next, 1100);
}
function finishRound() {
  const all = store.get(), p = Object.assign(blankP(), all._p || {}), slug = S.mod.slug, today = todayStr();
  all[slug] = all[slug] || {}; if (S.score > (all[slug][S.lvl] || 0)) all[slug][S.lvl] = S.score;
  const lvBefore = levelOf(p.pts), dayBefore = p.days[today] || 0, st = starsOf(S.score);
  const parts = [[`${S.score} helyes válasz`, S.score * 10]];
  if (S.score === 10) parts.push(['Hibátlan kör', 50]);
  if (st) parts.push([`${st} csillag`, st * 20]);
  if (S.maxRun >= 5) parts.push([`${S.maxRun} jó válasz egymás után`, 20]);
  p.ok += S.score; p.rounds++; if (S.score === 10) p.perf++; p.played[slug] = 1;
  p.days[today] = dayBefore + S.score;
  if (dayBefore < DAILY_GOAL && p.days[today] >= DAILY_GOAL) parts.push(['Napi cél teljesítve', 30]);
  if (p.last !== today) { p.streak = p.last === yesterdayStr() ? p.streak + 1 : 1; p.last = today; p.best = Math.max(p.best, p.streak); }
  const pts = parts.reduce((s, x) => s + x[1], 0); p.pts += pts;
  Object.keys(p.days).sort().slice(0, -45).forEach(k => delete p.days[k]);
  all._p = p;
  const nb = BADGES.filter(b => !p.badges[b.id] && b.t(p, all)); nb.forEach(b => { p.badges[b.id] = today; });
  store.set(all);
  S.award = { pts, parts, nb, lvl: levelOf(p.pts), up: levelOf(p.pts) > lvBefore, streak: p.streak, day: p.days[today] };
}
function next() {
  clearTimeout(S.timer); if (!S.done) return;
  if (S.i + 1 >= N) { finishRound(); S.view = 'result'; render(); window.scrollTo(0, 0); return; }
  S.i++; S.cur = newQ(S.hist.map(h => h.q)); S.input = ''; S.done = false; S.ok = null; S.pick = null; render();
}
function makeSheet(l) {
  S.lvl = l; S.sheet = []; S.mix = l < 0; const n = S.sheetN || SHEET_N, nl = S.mod.levels.length;
  for (let i = 0; i < n; i++) S.sheet.push(newQ(S.sheet, S.mix ? Math.min(nl - 1, Math.floor(i * nl / n)) : l));
  S.view = 'sheet'; render(); window.scrollTo(0, 0);
}
function keyPress(k) {
  if (S.view !== 'quiz' || S.done || S.cur.kind !== 'num') return;
  if (k === 'del') S.input = S.input.slice(0, -1);
  else if (k === 'ok') return answer();
  else if (k === 'neg') { if (!S.cur.neg) return; S.input = S.input.startsWith('-') ? S.input.slice(1) : '-' + S.input; }
  else if (k === 'comma') { if (!S.cur.dec || S.input.includes(',')) return; S.input += (S.input === '' || S.input === '-') ? '0,' : ','; }
  else if (S.input.length < 9) S.input = (S.input === '0' ? '' : S.input) + k;
  const b = $('#abox'); if (b) b.innerHTML = (S.input ? showIn(S.input) : '<span class="ph">…</span>') + (S.cur.unit ? `<span class="unit">${S.cur.unit}</span>` : '');
}
function rollDice(n) {
  const out = $('#rollout'), sum = $('#rollsum'); if (!out) return; let f = 0, vals = [];
  const tick = () => { vals = Array.from({ length: n }, () => rnd(1, 6)); out.innerHTML = vals.map(dieSVG).join('');
    if (++f < 9) setTimeout(tick, 70); else sum.textContent = `Összesen: ${vals.reduce((a, b) => a + b, 0)}`; };
  sum.textContent = ''; tick();
}
const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = s => JSON.parse(decodeURIComponent(escape(atob(s.trim()))));
function msg(t) { const m = $('#bmsg'); if (m) m.textContent = t; }

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
  else if (a === 'sheetn') { S.sheetN = +t.dataset.n; makeSheet(S.lvl); }
  else if (a === 'roll') rollDice(+t.dataset.n);
  else if (a === 'grade') { const all = store.get(); all._p = Object.assign(blankP(), all._p || {}); all._p.grade = +t.dataset.g; store.set(all); render(); }
  else if (a === 'mkcode') { $('#code').value = enc(store.get()); msg('A kód elkészült. Másold ki, és illeszd be a másik eszközön.'); }
  else if (a === 'copycode') { const c = $('#code'); if (!c.value) c.value = enc(store.get()); c.select(); try { navigator.clipboard.writeText(c.value).then(() => msg('Kimásolva.'), () => msg('Jelöld ki és másold ki a kódot kézzel.')); } catch (er) { msg('Jelöld ki és másold ki a kódot kézzel.'); } }
  else if (a === 'loadcode') { try { const o = dec($('#code').value); if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('rossz'); store.set(o); render(); msg('Betöltve.'); } catch (er) { msg('Ez a kód nem érvényes. Ellenőrizd, hogy a teljes kódot bemásoltad-e.'); } }
  else if (a === 'resetask') { S.askReset = true; render(); }
  else if (a === 'resetno') { S.askReset = false; render(); }
  else if (a === 'resetyes') { store.set({}); S.askReset = false; render(); msg('Az adatok törölve.'); }
});
document.addEventListener('keydown', e => {
  if (S.view !== 'quiz' || e.ctrlKey || e.metaKey || e.altKey) return;
  const q = S.cur;
  if (e.key === 'Enter') { e.preventDefault(); if (S.done) next(); else if (q.kind === 'num') answer(); return; }
  if (S.done) return;
  if (q.kind === 'num') {
    if (/^[0-9]$/.test(e.key)) keyPress(e.key);
    else if (e.key === 'Backspace') { e.preventDefault(); keyPress('del'); }
    else if (e.key === '-') keyPress('neg');
    else if (e.key === ',' || e.key === '.') keyPress('comma');
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
  S.mod = m || null; S.askReset = false;
  S.view = slug === 'profil' ? 'profile' : m ? 'setup' : 'home'; render();
  if (!PATHMODE) window.scrollTo(0, 0);
}
if (!PATHMODE) window.addEventListener('hashchange', route);
route();

})();
