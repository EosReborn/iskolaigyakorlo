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
/* toldalék a kimondott szám utolsó szava szerint: nak/nek, hoz/hez/höz */
const numLast = n => { n = Math.abs(n);
  if (n % 10) return ['', 'egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'][n % 10];
  if (n % 100) return ['', 'tíz', 'húsz', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'][n / 10 % 10];
  if (n % 1000) return 'száz';
  return n === 0 ? 'nulla' : 'ezer'; };
const harm = n => { const w = numLast(n); if (w === 'harminc') return 'b';
  const v = w.replace(/[^aáeéiíoóöőuúüű]/g, '').slice(-1); return 'aáoóuú'.includes(v) ? 'b' : 'öőüű'.includes(v) ? 'r' : 'f'; };
const sfxNak = n => harm(n) === 'b' ? 'nak' : 'nek';
const sfxHoz = n => ({ b: 'hoz', f: 'hez', r: 'höz' })[harm(n)];
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
  seo: 'Az összeadás és kivonás gyakorlása 1–3. osztályban a 10-es számkörtől az 1000-es számkörig. A feladatok fokozatosan nehezednek: először tízesátlépés nélkül, majd tízesátlépéssel számolhatsz, a hiányzó számos feladatok pedig a fejszámolást és az ellenőrzést is gyakoroltatják.',
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
    { hint: a === b ? `A két szám egyenlő: ${fmt(a)} = ${fmt(b)}.` : `${fmt(a)} ${a < b ? 'kisebb' : 'nagyobb'}, mint ${fmt(b)}: ${fmt(a)} ${a < b ? '&lt;' : '&gt;'} ${fmt(b)}.` });
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
  seo: 'A szomszédos számok, a tízes szomszédok és a számsorozatok a számfogalom alapjai. A gyakorló előre és hátra is számoltat, különböző lépésközökkel, és a sorozat szabályát is megkerested.',
  levels: [
    { name: 'Előző és következő szám', gen: () => { const n = rnd(1, 99), nx = Math.random() < .5;
      return NUM(Q(nx ? `Melyik szám következik ${fmt(n)} után?` : `Melyik szám van ${fmt(n)} előtt?`), nx ? n + 1 : n - 1, { hint: `${nx ? 'Egyet hozzáadunk' : 'Egyet elveszünk'}: ${nx ? n + 1 : n - 1}.` }); } },
    { name: 'Két szám között', gen: () => { const n = rnd(2, 998); return NUM(Q(`Melyik szám van ${fmt(n - 1)} és ${fmt(n + 1)} között?`), n, { hint: `${n - 1}, ${n}, ${n + 1}: a középső szám ${n}.` }); } },
    { name: 'Tízes szomszédok', gen: () => { let k; do { k = rnd(11, 99); } while (k % 10 === 0); const lo = Math.random() < .5; const base = k - (k % 10);
      return NUM(Q(`${lo ? 'Alsó' : 'Felső'} tízes szomszédja: ${fmt(k)}`, 'Melyik kerek tízes ez?'), lo ? base : base + 10, { hint: `${k} ${base} és ${base + 10} között van.` }); } },
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
const ESX = { 1: 'es', 2: 'es', 3: 'as', 4: 'es', 5: 'ös', 6: 'os', 7: 'es', 8: 'as', 9: 'es', 10: 'es', 11: 'es', 12: 'es' };
const cEs = n => `${n}-${ESX[n]}`;                                  /* 3-as, 5-ös */
const cNel = n => `${n}-${ESX[n]}${ESX[n] === 'as' || ESX[n] === 'os' ? 'nál' : 'nél'}`; /* 3-asnál, 5-ösnél */
const randTime = lv => { const h = rnd(1, 12); let m;
  if (lv === 1) m = 0; else if (lv === 2) m = pick([0, 30]); else if (lv === 3) m = pick([0, 15, 30, 45]); else if (lv === 4) m = rnd(0, 11) * 5; else m = rnd(0, 59);
  return [h, m]; };
const timeWrongs = (h, m) => { const set = [[m / 5 || 12, h * 5 % 60], [h % 12 + 1, m], [h === 1 ? 12 : h - 1, m], [h, (m + 5) % 60], [h, (m + 55) % 60], [h, (m + 15) % 60], [h, (m + 30) % 60], [h % 12 + 1, (m + 30) % 60]];
  return set.filter(([a, b]) => Number.isInteger(a) && Number.isInteger(b) && !(a === h && b === m)).map(([a, b]) => [a, b]); };
const clockQ = lv => () => { const [h, m] = randTime(lv); const ws = shuffle(timeWrongs(h, m)).map(([a, b]) => hm(a, b));
  return CH(Q(clockSVG(h, m), 'Mennyi az idő?'), hm(h, m), ws, { hint: `Az óramutató (rövid) ${art(h)} ${cNel(h)} van, a percmutató (hosszú) ${m === 0 ? 'a ' + cNel(12) : `${art(m / 5 | 0 || 12)} ${cEs(m / 5 | 0 || 12)} szám körül, ${m} perc`}. Az idő ${hm(h, m)} (${timeWords(h, m)}).` }); };
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
      return CH(Q(`<span class="digital">${hm(h, m)}</span>`, 'Melyik óra mutatja ezt az időt?'), ch([h, m]), ws.map(ch), { grid: true, hint: `${hm(h, m)}: a rövid mutató ${art(h)} ${cNel(h)}, a hosszú mutató ${art(m / 5 || 12)} ${cEs(m / 5 || 12)} számnál áll (${m} perc).` }); } }
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
  slug: 'penz-szamolas', title: 'Pénzszámolás gyakorló', short: 'Pénzszámolás', group: 'meres', glyph: '', hue: 4, icon: 'coin',
  desc: 'Forintérmék és bankjegyek összeadása, vásárlás és visszajáró számolása.',
  seo: 'A pénzzel való számolás hétköznapi készség. A gyakorló forintérméket és bankjegyeket mutat, ezek összegét kell kiszámolni. Később vásárlási és visszajáró feladatok is jönnek. A bankjegyek ábrái csak szemléltetésre szolgálnak.',
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
  if (kind === 'diff') { const [a, b] = arr[0] >= arr[1] ? arr : [arr[1], arr[0]]; return NUM(Q(dice([a, b]), 'Mennyivel dobtál többet az első kockával, mint a másodikkal?'), a - b, { hint: `${a} − ${b} = ${a - b}.` }); }
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
      if (t === 1) return NUM(Q(`|${numTxt(n)}| = ?`, 'Az abszolút érték a szám távolsága a nullától.'), Math.abs(n), { hint: `${n < 0 || art(n) === 'a' ? 'A' : 'Az'} ${numTxt(n)} szám ${Math.abs(n)} egységre van a nullától, ezért |${numTxt(n)}| = ${Math.abs(n)}.` });
      return NUM(Q(`Hány egységre van ${n < 0 ? 'a' : art(n)} ${numTxt(n)} a nullától?`), Math.abs(n), { hint: `Az abszolút érték: ${Math.abs(n)}.` }); } },
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
    { name: 'Szorzás és osztás 10-zel, 100-zal, 1000-rel', dec: true, gen: () => { const f = pick([10, 100, 1000]); const FZ = { 10: '10-zel', 100: '100-zal', 1000: '1000-rel' };
      if (Math.random() < .5) { const n = rnd(11, 999); return NUM(Q(`${fixd(n / 100, 2)} × ${f} = ?`), n * f / 100, { hint: `${FZ[f]} szorozva a tizedesvessző ${String(f).length - 1} hellyel jobbra csúszik. Az eredmény ${numTxt(n * f / 100)}.` }); }
      const n = rnd(1, 9999); return NUM(Q(`${numTxt(n)} : ${f} = ?`), n / f, { hint: `${FZ[f]} osztva a tizedesvessző ${String(f).length - 1} hellyel balra csúszik. Az eredmény ${numTxt(n / f)}.` }); } },
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
      const cls = Math.random() < .5, K = cls ? 1 : 100;
      return NUM(Q(cls ? `Egy osztály létszáma ${b}, ebből ${part} fő fiú. Hány százalék a fiúk aránya?` : `Egy ${fmt(b * 100)} forintos termék ára ${fmt(part * 100)} forinttal csökkent. Hány százalékos volt a csökkenés?`), p, { unit: '%', hint: `${fmt(part * K)} : ${fmt(b * K)} = ${numTxt(part / b)}, ezt százzal szorozva ${p}%.` }); } },
    { name: 'Kedvezmény', gen: () => { const price = rnd(10, 100) * 100, p = pick([10, 20, 25, 30, 40, 50]);
      return NUM(Q(`Egy ${fmt(price)} Ft-os termék ára ${p}%-kal csökken. Mennyibe kerül akciósan?`), price * (100 - p) / 100, { unit: 'Ft', hint: `A kedvezmény ${fmt(pctOf(p, price))} Ft, az új ár ${fmt(price)} − ${fmt(pctOf(p, price))} = ${fmt(price * (100 - p) / 100)} Ft.` }); } },
    { name: 'Mennyi az egész?', gen: () => { const p = pick([5, 10, 20, 25, 40, 50, 75]), whole = rnd(2, 20) * 20, part = pctOf(p, whole);
      return NUM(Q(`Egy szám ${p}%-a ${part}. Melyik ez a szám?`), whole, { hint: `Ha ${p}% = ${part}, akkor az 1% = ${numTxt(part / p)}, a 100% pedig ${whole}.` }); } },
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
      return NUM(Q(`${sup(o[0], e)} = ?`), o[0] ** e, { hint: `${Array(e).fill(o[0]).join(' × ')} = ${fmt(o[0] ** e)} (${e} darab ${o[0]} szorzata).` }); } },
    { name: 'Mekkora a kitevő?', gen: () => { const o = pick([[2, 2, 10], [3, 2, 5], [5, 2, 4], [10, 2, 6]]); const e = rnd(o[1], o[2]);
      return NUM(Q(`${sup(o[0], slot())} = ${fmt(o[0] ** e)}`), e, { hint: `A kitevő ${e}, mert ${Array(e).fill(o[0]).join(' × ')} = ${fmt(o[0] ** e)}.` }); } },
    { name: 'Műveletek hatványokkal', gen: () => { const a = rnd(2, 9), b = rnd(2, 9), t = rnd(0, 3);
      if (t === 0) return NUM(Q(`${sup(a, 2)} + ${sup(b, 2)} = ?`), a * a + b * b, { hint: `${a * a} + ${b * b} = ${a * a + b * b}.` });
      if (t === 1) { const hi = Math.max(a, b), lo = Math.min(a, b); return NUM(Q(`${sup(hi, 2)} − ${sup(lo, 2)} = ?`), hi * hi - lo * lo, { hint: `${hi * hi} − ${lo * lo} = ${hi * hi - lo * lo}.` }); }
      if (t === 2) { const c = rnd(2, 5); return NUM(Q(`${sup(c, 3)} + ${a} = ?`), c ** 3 + a, { hint: `${c ** 3} + ${a} = ${c ** 3 + a}.` }); }
      return NUM(Q(`√${a * a} + √${b * b} = ?`), a + b, { hint: `${a} + ${b} = ${a + b}.` }); } },
    { name: 'Négyzetgyök becslése', gen: () => { const n = rnd(3, 15), d = rnd(-(n - 2), n - 2), x = n * n + d;
      return NUM(Q(`√${x}`, 'Melyik egész számhoz van a legközelebb?'), n, { hint: `${n}² = ${n * n}, ez van a legközelebb ${art(x)} ${x}-${sfxHoz(x)}, ezért √${x} ≈ ${n}.` }); } }
  ]
});

/* ---- Osztók, többszörösök, prímszámok ---- */
const DV = { 2: 'vel', 3: 'mal', 7: 'tel', 4: 'gyel', 5: 'tel', 6: 'tal', 9: 'cel', 10: 'zel' };
const DRULE = { 2: 'Páros számok oszthatók 2-vel (0, 2, 4, 6, 8-ra végződnek).', 3: 'Ha a számjegyek összege osztható 3-mal, a szám is.', 4: 'Ha az utolsó két számjegyből alkotott szám osztható 4-gyel, a szám is.', 5: 'A 0-ra vagy 5-re végződő számok oszthatók 5-tel.', 6: 'Osztható 6-tal, ha 2-vel és 3-mal is osztható.', 9: 'Ha a számjegyek összege osztható 9-cel, a szám is.', 10: 'A 0-ra végződő számok oszthatók 10-zel.' };
const factorize = n => { const f = []; for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; } if (n > 1) f.push(n); return f; };
mod({
  slug: 'oszthatosag-primszamok', title: 'Oszthatóság és prímszámok gyakorló', short: 'Oszthatóság, prímek', group: 'szamok', glyph: '12 | 36', hue: 3, grades: [5, 7],
  desc: 'Oszthatósági szabályok, prímszámok, osztók, többszörösök, legnagyobb közös osztó és legkisebb közös többszörös.',
  seo: 'Az osztók és többszörösök témaköre az 5–6. osztály egyik fontos része. A gyakorló az oszthatósági szabályokat, a prímszámok felismerését, az osztók megszámolását, a többszörösöket, a legnagyobb közös osztót (LNKO), a legkisebb közös többszöröst (LKKT) és a prímtényezős felbontást gyakoroltatja.',
  levels: [
    { name: 'Oszthatósági szabályok', gen: () => { const d = pick([2, 3, 4, 5, 6, 9, 10]), want = Math.random() < .5; let n; do { n = rnd(20, 999); } while ((n % d === 0) !== want);
      return CH(Q(`Osztható-e ${art(n)} ${n} szám ${d}-${DV[d]}?`), want ? 'Igen' : 'Nem', [want ? 'Nem' : 'Igen'], { hint: DRULE[d] }); } },
    { name: 'Prímszám vagy összetett szám?', gen: () => { const want = Math.random() < .45; let n; do { n = rnd(2, 100); } while (isPrime(n) !== want);
      return CH(Q(`${n}`, 'Prímszám vagy összetett szám?'), want ? 'Prímszám' : 'Összetett', [want ? 'Összetett' : 'Prímszám'], { hint: want ? `${art(n) === 'az' ? 'Az' : 'A'} ${n}-${sfxNak(n)} csak két osztója van: 1 és ${n}.` : `${art(n) === 'az' ? 'Az' : 'A'} ${n} osztható ${factorize(n)[0]}-${DV[factorize(n)[0]]}, ezért összetett.` }); } },
    { name: 'Hány osztója van?', gen: () => { const n = rnd(6, 60), dv = divisors(n);
      return NUM(Q(`Hány osztója van ${art(n)} ${n} számnak?`, 'Az 1-et és önmagát is számold.'), dv.length, { hint: `Az osztók: ${dv.join(', ')}.` }); } },
    { name: 'Többszörösök', gen: () => { const d = rnd(3, 12), m = rnd(20, 120), r = (Math.floor(m / d) + 1) * d;
      return NUM(Q(`Írd fel ${art(d)} ${d} többszöröseit. Melyik az első olyan, ami nagyobb, mint ${m}?`), r, { hint: `${m} : ${d} = ${Math.floor(m / d)} maradék ${m % d}, tehát ${Math.floor(m / d) + 1} × ${d} = ${r}.` }); } },
    { name: 'Legnagyobb közös osztó (LNKO)', gen: () => { let x, y; do { x = rnd(2, 9); y = rnd(2, 9); } while (x === y || gcd(x, y) !== 1); const g = rnd(2, 12);
      return NUM(Q(`Mennyi ${g * x} és ${g * y} legnagyobb közös osztója?`), g, { hint: `Osztók: ${g * x}-é ${divisors(g * x).join(', ')}; ${g * y}-é ${divisors(g * y).join(', ')}. A legnagyobb közös: ${g}.` }); } },
    { name: 'Legkisebb közös többszörös (LKKT)', gen: () => { let a, b; do { a = rnd(2, 12); b = rnd(2, 12); } while (a === b || lcm(a, b) > 90);
      return NUM(Q(`Mennyi ${a} és ${b} legkisebb közös többszöröse?`), lcm(a, b), { hint: `${art(a) === 'az' ? 'Az' : 'A'} ${a} többszörösei és ${art(b)} ${b} többszörösei közül az első közös: ${lcm(a, b)}.` }); } },
    { name: 'Prímtényezős felbontás', gen: () => { let n; do { n = rnd(8, 100); } while (isPrime(n)); const f = factorize(n);
      return NUM(Q(`Hány prímszám szorzata ${art(n)} ${n}?`, 'Az ismétlődő tényezőket is számold külön.'), f.length, { hint: `${n} = ${f.join(' × ')}, ez ${f.length} tényező.` }); } }
  ]
});

/* ---- Egyenletek ---- */
const MULW = { 2: 'kettővel', 3: 'hárommal', 4: 'néggyel', 5: 'öttel', 6: 'hattal', 7: 'héttel', 8: 'nyolccal', 9: 'kilenccal' };
mod({
  slug: 'egyenletek', title: 'Egyenletek gyakorló', short: 'Egyenletek', group: 'szamok', glyph: 'x + 3', hue: 2, grades: [6, 8],
  desc: 'Egyszerű és kétlépéses egyenletek megoldása a mérlegelvvel, szöveges feladatokkal.',
  seo: 'Az egyenletmegoldás 6–8. osztályban a mérlegelv megértésével kezdődik: azt kell tenni az egyenlet mindkét oldalán, hogy megkapjuk x értékét. A gyakorló az egyszerű összeadásos és szorzásos egyenletektől a kétlépéses és zárójeles egyenletekig, negatív megoldásokig és szöveges feladatokig vezet.',
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
const ANG_T = { 'hegyesszög': 'A hegyesszög kisebb 90°-nál.', 'derékszög': 'A derékszög pontosan 90°.', 'tompaszög': 'A tompaszög 90° és 180° közötti.', 'egyenesszög': 'Az egyenesszög pontosan 180°.', 'homorúszög': 'A homorúszög 180°-nál nagyobb.' };
const MS = { 5: 'ötszög', 6: 'hatszög', 7: 'hétszög', 8: 'nyolcszög', 9: 'kilencszög', 10: 'tízszög' };
mod({
  slug: 'szogek-haromszogek', title: 'Szögek és háromszögek gyakorló', short: 'Szögek, háromszögek', group: 'forma', glyph: '60°', hue: 1, grades: [5, 8],
  desc: 'Szögfajták, pótszög, kiegészítő szög, háromszögek és négyszögek szögei, sokszögek belső szögei, háromszög-egyenlőtlenség.',
  seo: 'A szögek és a háromszögek a geometria alapjai az 5–8. osztályban. A gyakorló a szögfajták felismerésével kezdődik, majd a pótszög, a kiegészítő szög, a háromszög belső szögeinek összege, a négyszögek és a sokszögek belső szögeinek összege és a háromszög-egyenlőtlenség következik.',
  levels: [
    { name: 'Szögfajták felismerése', gen: () => { const o = pick([['hegyesszög', rnd(15, 75)], ['derékszög', 90], ['tompaszög', rnd(105, 165)], ['egyenesszög', 180], ['homorúszög', rnd(200, 330)]]);
      return CH(Q(angSVG(o[1]), 'Milyen szög ez?'), o[0], shuffle(Object.keys(ANG_T).filter(x => x !== o[0])), { hint: ANG_T[o[0]] }); } },
    { name: 'Pótszög és kiegészítő szög', gen: () => { const sup2 = Math.random() < .5;
      if (sup2) { const a = rnd(10, 85); return NUM(Q(`Mennyi ${art(a)} ${a}°-os szög pótszöge?`, 'A pótszögek összege 90°.'), 90 - a, { unit: '°', hint: `90° − ${a}° = ${90 - a}°.` }); }
      const a = rnd(20, 160); return NUM(Q(`Mennyi ${art(a)} ${a}°-os szög kiegészítő szöge?`, 'A kiegészítő szögek összege 180°.'), 180 - a, { unit: '°', hint: `180° − ${a}° = ${180 - a}°.` }); } },
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
const IGE = ['fut', 'tanít', 'olvas', 'alszik', 'kacag', 'főz', 'rajzol', 'ugrik', 'énekel', 'játszik', 'tanul', 'számol', 'mosdik', 'eszik'];
const SZAMNEV = ['három', 'hét', 'tíz', 'húsz', 'száz', 'ötödik', 'kettő', 'kilenc'];
const AZ = w => /^[aáeéiíoóöőuúüű]/i.test(w) ? 'Az' : 'A';
const POS = { főnév: FONEV, melléknév: MELLEK, ige: IGE, számnév: SZAMNEV };
mod({
  slug: 'szofajok', title: 'Szófajok gyakorló', short: 'Szófajok', group: 'nyelv', glyph: 'ige', hue: 4, grades: [3, 6],
  desc: 'Főnév, melléknév, ige, számnév: ismerd fel a szavak szófaját.',
  seo: 'A főnév a dolgok nevét adja meg (asztal, kutya), a melléknév a tulajdonságot (nagy, piros), az ige a cselekvést (fut, olvas), a számnév pedig a mennyiséget (három, húsz). A gyakorló szavakat mutat, és azt kéri, hogy ismerd fel a szófajukat.',
  levels: [
    { name: 'Főnév vagy ige?', gen: () => { const t = pick(['főnév', 'ige']), o = t === 'főnév' ? 'ige' : 'főnév'; const w = pick(POS[t]); return CH(wq(esc(w), 'Milyen szófajú ez a szó?'), t, [o], { hint: `${AZ(w)} ${w} ${t}: ${t === 'ige' ? 'cselekvést jelent' : 'dolgot, élőlényt nevez meg'}.` }); } },
    { name: 'Főnév, melléknév vagy ige?', gen: () => { const t = pick(['főnév', 'melléknév', 'ige']); const w = pick(POS[t]); return CH(wq(esc(w), 'Milyen szófajú ez a szó?'), t, ['főnév', 'melléknév', 'ige'].filter(x => x !== t), { hint: `${AZ(w)} ${w} ${t}.` }); } },
    { name: 'Melyik szó a ...?', gen: () => { const t = pick(['főnév', 'melléknév', 'ige']); const w = pick(POS[t]); const others = shuffle(['főnév', 'melléknév', 'ige'].filter(x => x !== t)).map(x => pick(POS[x]));
      return CH(Q(`Melyik szó ${t}?`), w, others.concat(pick(POS[['főnév', 'melléknév', 'ige'].filter(x => x !== t)[0]])), { hint: `${AZ(w)} ${w} ${t}.` }); } },
    { name: 'Négy szófaj: számnévvel', gen: () => { const t = pick(['főnév', 'melléknév', 'ige', 'számnév']); const w = pick(POS[t]); return CH(wq(esc(w), 'Milyen szófajú ez a szó?'), t, ['főnév', 'melléknév', 'ige', 'számnév'].filter(x => x !== t), { hint: `${AZ(w)} ${w} ${t}.` }); } }
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
      return CH(Q(`<span class="wd">${esc(stem)}<span class="slot">?</span></span>`, `Ez ${t} mondat. Melyik írásjel kerül a végére?`), right, ['.', '?', '!'].filter(x => x !== right), { hint: `A mondat így helyes: ${s}` }); } },
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
    if (k === 0) { const a = rnd(3, 8), b = rnd(18, 30), c = rnd(2, 15); return NUM(Q(`Az iskola ${a} osztályába osztályonként ${b} gyerek jár. Közülük ${c} gyerek beteg. Hány gyerek van az iskolában?`), a * b - c, { hint: `${a} × ${b} − ${c} = ${a * b - c}` }); }
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
    return TF(`${fr(a, b)} ${lt ? '&lt;' : '&gt;'} ${fr(c, d)}`, truth, `Azonos számlálónál a kisebb nevezőjű tört nagyobb, azonos nevezőnél a nagyobb számlálójú.`); } });

/* ---------- Óra leolvasása ---------- */
addLv('ora-leolvasas',
  { name: 'Mennyi idő telt el?', gen: () => { const h = rnd(1, 9), dur = rnd(1, 3), k = rnd(0, 2);
    if (k === 0) return NUM(Q(`Az óra ${h} órát mutat. Hány órát mutat ${dur} óra múlva?`), h + dur, { hint: `${h} + ${dur} = ${h + dur}` });
    if (k === 1) return NUM(Q(`A film ${h} órakor kezdődik, és ${dur} óráig tart. Hány órakor ér véget?`), h + dur, { hint: `${h} + ${dur} = ${h + dur}` });
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
    return NUM(Q(`Két dobókockával hányféleképpen kaphatunk ${s} összeget?`, 'A két kocka különbözik: az 1 és 2 más, mint a 2 és 1.'), n, { hint: `Lehetőségek: ${combos.join(', ')}. Ez ${n} féleképpen lehet.` }); } },
  { name: 'Melyik nem dobható?', gen: () => { const bad = pick([1, 13, 14, 15]), ok = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 3);
    return CH(Q('Melyik szám NEM lehet két dobókocka összege?'), String(bad), ok.map(String), { hint: 'Két kockával legalább 2, legfeljebb 12 az összeg.' }); } });

/* ================= FELSŐS MATEK ================= */

/* ---------- Negatív számok ---------- */
addLv('negativ-szamok',
  { name: 'Lift a pincébe', neg: true, gen: () => { let s, m, r; do { s = rnd(-3, 6); m = rnd(1, 6) * (Math.random() < .5 ? -1 : 1); r = s + m; } while (r < -4 || r > 10);
    return NUM(Q(`A lift ${art(Math.abs(s))} ${numTxt(s)}. szinten áll (a pincében negatív szintek vannak). ${m > 0 ? `Felmegy ${m} emeletet.` : `Lemegy ${-m} emeletet.`} Hányadik szinten áll most?`), r, { hint: `${par(s)} ${m > 0 ? '+' : '−'} ${Math.abs(m)} = ${par(r)}` }); } },
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
      if (test(chosen.map(mk)) === 1 && chosen.length >= 2) return NUM(Q(`Gondoltam egy kétjegyű számra.`, chosen.join('; ') + '. Melyik számra gondoltam?'), n, { hint: `A feltételeknek csak a ${n} felel meg.` }); }
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
    if (k === 0) { const n = rnd(1, 7); return NUM(Q(`Egy teljes fordulat 360°. Hány fokot fordulsz, ha ${n} negyed fordulatot fordulsz?`), 90 * n, { hint: `${n} × 90° = ${90 * n}°` }); }
    if (k === 1) { const a = rnd(10, 85) * 2; return NUM(Q(`Egy ${a}°-os szöget kettéosztunk két egyenlő részre. Hány fokos lesz az egyik rész?`), a / 2, { hint: `${a} : 2 = ${a / 2}` }); }
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
    return CH(Q(`<span class="wd">${esc(m[0])}</span>`, `Melyik szó ${cat} a mondatban?`), ans, others.slice(0, 3), { hint: `A(z) „${ans}" ${cat}.` }); } });

/* ---------- Mondatfajták ---------- */
addLv('mondatfajtak',
  { name: 'Melyik mondat ilyen?', gen: () => { const all = ['kijelentő', 'kérdő', 'felkiáltó', 'felszólító', 'óhajtó'].filter(t => MONDAT[t] && MONDAT[t].length), t = pick(all), good = pick(MONDAT[t]), others = shuffle(all.filter(x => x !== t)).slice(0, 3).map(x => pick(MONDAT[x]));
    return CH(Q(`Melyik ${t} mondat?`), good, others, { hint: `„${good}" ${t} mondat.` }); } });

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

/* ================= KÖRNYEZETISMERET ÉS TERMÉSZETISMERET (1–6. osztály) =================
   Néma, szöveges és választós feladatok az általános iskolai anyagból. Minden állítás az alsó és felső tagozatos tankönyvek szintjét követi. */
GROUPS.push({ id: 'termeszet', name: 'Környezet- és természetismeret' });
{
const az = w => ('aáeéiíoóöőuúüű'.includes(String(w)[0].toLowerCase()) ? 'az' : 'a');
const cap = s => s[0].toUpperCase() + s.slice(1);
const A = w => `${cap(az(w))} ${w}`;
const wdq = (w, sub) => Q(`<span class="wd">${esc(w)}</span>`, sub);
const others = (all, c, n = 3) => shuffle(all.filter(x => x !== c)).slice(0, n);
const CLS = (q, correct, cats, hint) => CH(q, correct, others(cats, correct), { hint });
const TFS = (statements) => () => { const [s, ok, why] = pick(statements); return CH(Q(esc(s), 'Igaz vagy hamis?'), ok ? 'Igaz' : 'Hamis', [ok ? 'Hamis' : 'Igaz'], { hint: why }); };
const mapPairs = obj => Object.entries(obj).flatMap(([cat, items]) => items.map(i => [i, cat]));

/* ---------- Évszakok, hónapok és napok ---------- */
const DAYS = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'];
const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const SEASON_OF = m => ['tél', 'tél', 'tavasz', 'tavasz', 'tavasz', 'nyár', 'nyár', 'nyár', 'ősz', 'ősz', 'ősz', 'tél'][m];
const SEASONS = ['tavasz', 'nyár', 'ősz', 'tél'];
const SEASON_FACTS = {
  tavasz: ['kizöldülnek a fák', 'kinyílnak a tulipánok', 'hazatérnek a fecskék', 'virágzik a cseresznyefa', 'kibújik a hóvirág', 'megolvad a hó, és megindul az élet'],
  nyár: ['nagyon meleg van', 'a gyerekeknek nyári szünetük van', 'a legrövidebbek az éjszakák', 'a gyerekek a strandon fürödnek', 'aratják a búzát', 'sokáig világos van este'],
  ősz: ['hullanak a falevelek', 'szüretelik a szőlőt', 'a fecskék elköltöznek a meleg országokba', 'a diót és a gesztenyét szedik', 'kezdődik a tanév', 'megérnek a gesztenyék és a dió'],
  tél: ['havazik és fagy', 'befagynak a tavak', 'a barna medve téli álmot alszik', 'a legrövidebbek a nappalok', 'szánkózni és korcsolyázni lehet', 'a lombhullató fák csupaszok']
};
const HOLIDAYS = [['a Mikulás napja', 'december'], ['a karácsony', 'december'], ['az újév napja', 'január'], ['az 1848-as forradalom ünnepe', 'március'], ['az államalapítás ünnepe (Szent István napja)', 'augusztus'], ['az 1956-os forradalom ünnepe', 'október'], ['a Márton-nap', 'november'], ['a Mindenszentek ünnepe', 'november']];
mod({
  slug: 'evszakok-honapok', title: 'Évszakok, hónapok és napok gyakorló', short: 'Évszakok, hónapok', group: 'termeszet', glyph: 'hónap', hue: 2, grades: [1, 3],
  desc: 'A hét napjai, a hónapok sorrendje, az évszakok jellemzői, a hónapok hossza és a legfontosabb ünnepek.',
  seo: 'Az évszakok, a hónapok és a hét napjainak ismerete a környezetismeret alapja az első osztályban. A gyakorló játékosan kérdez a napok és hónapok sorrendjéről, arról, melyik hónap melyik évszakhoz tartozik, mi jellemző az egyes évszakokra, hány napos egy hónap, és melyik hónapban vannak a legfontosabb ünnepek.',
  levels: [
    { name: 'A hét napjai', gen: () => { const i = rnd(0, 6), d = DAYS[i], t = rnd(0, 3);
      if (t === 0) return CLS(Q(`Melyik nap jön ${d} után?`), DAYS[(i + 1) % 7], DAYS, `A hét napjai: ${DAYS.join(', ')}. ${cap(d)} után ${DAYS[(i + 1) % 7]} jön.`);
      if (t === 1) return CLS(Q(`Melyik nap van ${d} előtt?`), DAYS[(i + 6) % 7], DAYS, `${cap(d)} előtt ${DAYS[(i + 6) % 7]} van.`);
      if (t === 2) return NUM(Q(`A hét hányadik napja ${az(d)} ${d}?`), i + 1, { hint: `A hét napjai: ${DAYS.map((x, k) => `${k + 1}. ${x}`).join(', ')}.` });
      const w = pick(['szombat', 'vasárnap']); return CLS(Q('Melyik nap van a hétvégén?'), w, [w, ...DAYS.slice(0, 5)], 'A hétvége szombat és vasárnap.'); } },
    { name: 'A hónapok sorrendje', gen: () => { const i = rnd(0, 11), m = MONTHS[i], t = rnd(0, 4);
      if (t === 0) return CLS(Q(`Melyik hónap jön ${m} után?`), MONTHS[(i + 1) % 12], MONTHS, `${cap(m)} után ${MONTHS[(i + 1) % 12]} jön.`);
      if (t === 1) return CLS(Q(`Melyik hónap van ${m} előtt?`), MONTHS[(i + 11) % 12], MONTHS, `${cap(m)} előtt ${MONTHS[(i + 11) % 12]} van.`);
      if (t === 2) return NUM(Q(`Az év hányadik hónapja ${az(m)} ${m}?`), i + 1, { hint: `A hónapok: ${MONTHS.map((x, k) => `${k + 1}. ${x}`).join(', ')}.` });
      if (t === 3) return CLS(Q('Melyik az év első hónapja?'), 'január', MONTHS, 'Az év első hónapja a január.');
      return CLS(Q('Melyik az év utolsó hónapja?'), 'december', MONTHS, 'Az év utolsó hónapja a december.'); } },
    { name: 'Melyik évszak?', gen: () => { const i = rnd(0, 11), m = MONTHS[i], s = SEASON_OF(i);
      return CLS(Q(`Melyik évszakban van ${az(m)} ${m}?`), s, SEASONS, `Tavasz: március, április, május. Nyár: június, július, augusztus. Ősz: szeptember, október, november. Tél: december, január, február. Tehát ${az(m)} ${m} ${s}.`); } },
    { name: 'Mi jellemző az évszakra?', gen: () => { const s = pick(SEASONS), f = pick(SEASON_FACTS[s]);
      return CLS(Q(`Melyik évszakban igaz, hogy ${f}?`), s, SEASONS, `Helyes válasz: ${s}. (${cap(f)}.)`); } },
    { name: 'Hány napos a hónap?', gen: () => { const i = rnd(0, 11), m = MONTHS[i];
      return NUM(Q(`Hány napos ${az(m)} ${m}?`, 'A februárt számold 28 naposnak.'), MDAYS[i], { hint: `${cap(m)} ${MDAYS[i]} napos. Emlékeztető: 30 napos: április, június, szeptember, november; február 28 (szökőévben 29); a többi 31 napos.` }); } },
    { name: 'Ünnepek és nevezetes napok', gen: () => { const [e, m] = pick(HOLIDAYS);
      return CLS(Q(`Melyik hónapban van ${e}?`), m, MONTHS, `${cap(e)} ${m} hónapban van.`); } }
  ]
});

/* ---------- Állatok és élőhelyük ---------- */
const HAZI = ['kutya', 'macska', 'tehén', 'ló', 'disznó', 'birka', 'kecske', 'tyúk', 'kacsa', 'liba', 'szamár', 'pulyka'];
const VAD = ['őz', 'szarvas', 'róka', 'farkas', 'barna medve', 'vaddisznó', 'mókus', 'borz', 'hiúz', 'vidra', 'sas', 'bagoly', 'mezei nyúl', 'hód'];
const YOUNG = [['tehén', 'borjú'], ['ló', 'csikó'], ['birka', 'bárány'], ['kecske', 'gida'], ['disznó', 'malac'], ['tyúk', 'csibe']];
const SOUND = [['kutya', 'ugat'], ['macska', 'nyávog'], ['tehén', 'bőg'], ['ló', 'nyerít'], ['disznó', 'röfög'], ['tyúk', 'kotkodál'], ['kakas', 'kukorékol'], ['béka', 'brekeg'], ['méh', 'zümmög'], ['birka', 'béget'], ['kecske', 'mekeg'], ['kacsa', 'hápog'], ['liba', 'gágog'], ['varjú', 'károg'], ['egér', 'cincog'], ['oroszlán', 'ordít'], ['bagoly', 'huhog']];
const HAB = { 'erdő': ['szarvas', 'őz', 'farkas', 'barna medve', 'vaddisznó', 'mókus', 'bagoly', 'hiúz'], 'tó vagy folyó': ['hód', 'vidra', 'csuka', 'ponty', 'hattyú'], 'tenger': ['delfin', 'bálna', 'cápa', 'rája', 'medúza', 'tengeri csillag'],
  'sivatag': ['teve', 'skorpió', 'dromedár'], 'szavanna': ['oroszlán', 'zsiráf', 'elefánt', 'zebra', 'gepárd', 'strucc'], 'sarkvidék': ['jegesmedve', 'pingvin', 'fóka', 'rozmár', 'rénszarvas'],
  'rét': ['mezei nyúl', 'fürj', 'pacsirta', 'szöcske', 'mezei pocok'], 'esőerdő': ['majom', 'papagáj', 'tukán', 'orángután', 'anakonda'] };
const DIET = { 'növényevő': ['tehén', 'ló', 'mezei nyúl', 'őz', 'szarvas', 'zsiráf', 'elefánt', 'birka', 'kecske', 'zebra'], 'húsevő (ragadozó)': ['oroszlán', 'farkas', 'cápa', 'sas', 'bagoly', 'hiúz', 'krokodil', 'kígyó', 'delfin', 'jegesmedve'], 'mindenevő': ['barna medve', 'disznó', 'vaddisznó', 'varjú'] };
const LEGS = [['kutyának', 'kutya', 4], ['lónak', 'ló', 4], ['tehénnek', 'tehén', 4], ['madárnak', 'madár', 2], ['tyúknak', 'tyúk', 2], ['póknak', 'pók', 8], ['méhnek', 'méh', 6], ['hangyának', 'hangya', 6], ['légynek', 'légy', 6], ['katicabogárnak', 'katicabogár', 6], ['szöcskének', 'szöcske', 6], ['kígyónak', 'kígyó', 0], ['halnak', 'hal', 0], ['gilisztának', 'giliszta', 0]];
const GRP = { 'emlős': ['kutya', 'macska', 'ló', 'tehén', 'delfin', 'bálna', 'denevér', 'mókus', 'barna medve', 'oroszlán'], 'madár': ['sas', 'gólya', 'pingvin', 'strucc', 'bagoly', 'kacsa', 'tyúk', 'fecske'], 'hal': ['ponty', 'csuka', 'cápa', 'harcsa', 'angolna'],
  'hüllő': ['kígyó', 'krokodil', 'teknős', 'gyík'], 'kétéltű': ['béka', 'varangy', 'gőte'], 'rovar': ['méh', 'hangya', 'légy', 'katicabogár', 'szöcske', 'lepke'] };
const GRP_NOTE = { delfin: 'A delfin nem hal, hanem emlős: tüdővel lélegzik, és a kicsinyét szoptatja.', bálna: 'A bálna nem hal, hanem emlős: tüdővel lélegzik, és a kicsinyét szoptatja.', denevér: 'A denevér az egyetlen repülő emlős.', pingvin: 'A pingvin madár, de nem tud repülni.', strucc: 'A strucc madár, de nem tud repülni.', cápa: 'A cápa hal, nem emlős.', teknős: 'A teknős hüllő.' };
mod({
  slug: 'allatok', title: 'Állatok és élőhelyük gyakorló', short: 'Állatok', group: 'termeszet', glyph: 'állat', hue: 3, grades: [1, 5],
  desc: 'Háziállatok és vadon élő állatok, kicsinyeik, hangjuk, élőhelyük, táplálkozásuk és az állatcsoportok.',
  seo: 'Az állatok megismerése a környezetismeret egyik kedvenc témája. A gyakorló rövid kérdésekkel segít megtanulni, melyik háziállat és melyik vadon élő, hogy hívják az állatok kicsinyét, ki hogyan szól, hol él és mit eszik az állat, hány lába van, és melyik állatcsoportba (emlős, madár, hal, hüllő, kétéltű, rovar) tartozik.',
  levels: [
    { name: 'Háziállat vagy vadon élő?', gen: () => { const h = Math.random() < .5, w = pick(h ? HAZI : VAD); return CH(wdq(w, 'Háziállat vagy vadon élő állat?'), h ? 'háziállat' : 'vadon élő', [h ? 'vadon élő' : 'háziállat'], { hint: `${A(w)} ${h ? 'háziállat: az ember tartja' : 'vadon élő állat: a természetben él'}.` }); } },
    { name: 'Kinek a kicsinye?', gen: () => { const [a, y] = pick(YOUNG);
      return Math.random() < .5 ? CLS(Q(`Hogy hívják ${az(a)} ${a} kicsinyét?`), y, YOUNG.map(x => x[1]), `${A(a)} kicsinye: ${y}.`) : CLS(Q(`Melyik állat kicsinye ${az(y)} ${y}?`), a, YOUNG.map(x => x[0]), `${A(y)} a ${a} kicsinye.`); } },
    { name: 'Ki hogyan szól?', gen: () => { const [a, s] = pick(SOUND); return CLS(Q(`Hogyan szól ${az(a)} ${a}?`), s, SOUND.map(x => x[1]), `${A(a)} ${s}.`); } },
    { name: 'Hol él?', gen: () => { const [a, h] = pick(mapPairs(HAB)); return CLS(Q(`Hol él ${az(a)} ${a}?`), h, Object.keys(HAB), `${A(a)} élőhelye: ${h}.`); } },
    { name: 'Mit eszik?', gen: () => { const [a, d] = pick(mapPairs(DIET)); return CLS(Q(`Mit eszik ${az(a)} ${a}?`), d, Object.keys(DIET), `${A(a)} ${d}.`); } },
    { name: 'Hány lába van?', gen: () => { const [dat, nom, n] = pick(LEGS); return NUM(Q(`Hány lába van ${az(dat)} ${dat}?`), n, { hint: n ? `${cap(nom)}: ${n} láb.` : `${cap(nom)}: nincs lába.` }); } },
    { name: 'Melyik állatcsoportba tartozik?', gen: () => { const [a, g] = pick(mapPairs(GRP)); return CLS(Q(`Melyik állatcsoportba tartozik ${az(a)} ${a}?`), g, Object.keys(GRP), GRP_NOTE[a] || `${A(a)} ${g}.`); } },
    { name: 'Melyik nem illik közé?', gen: () => { const t = rnd(0, 3);
      if (t === 0) { const w = pick(VAD), three = shuffle(HAZI).slice(0, 3); return CH(Q('Melyik állat NEM háziállat?'), w, three, { hint: `${A(w)} vadon élő állat, a többi háziállat.` }); }
      const gs = Object.keys(GRP).filter(g => GRP[g].length >= 3), g = pick(gs), og = pick(Object.keys(GRP).filter(x => x !== g)), w = pick(GRP[og]);
      return CH(Q(`Melyik állat NEM ${g}?`), w, shuffle(GRP[g]).slice(0, 3), { hint: `${A(w)} ${og}, a többi ${g}.` }); } }
  ]
});

/* ---------- Növények ---------- */
const GYUM = ['alma', 'körte', 'szilva', 'meggy', 'cseresznye', 'barack', 'szőlő', 'eper', 'málna', 'narancs', 'banán', 'citrom'];
const ZOLD = ['répa', 'burgonya', 'hagyma', 'káposzta', 'uborka', 'paradicsom', 'paprika', 'retek', 'saláta', 'cékla', 'karfiol', 'spenót'];
const PGROUP = { 'fa': ['tölgy', 'bükk', 'fenyő', 'nyír', 'akác', 'juhar', 'hárs', 'fűz'], 'bokor': ['rózsa', 'bodza', 'orgona', 'ribizli', 'mogyoró'], 'lágyszárú növény': ['búza', 'kukorica', 'pipacs', 'százszorszép', 'gyöngyvirág', 'tulipán', 'napraforgó', 'kamilla'] };
const PGROUP_NOTE = { 'fa': 'vastag, fás törzse van, és magasra nő', 'bokor': 'több vékonyabb fás szára van, és alacsonyabb a fánál', 'lágyszárú növény': 'zöld, lágy a szára, nem fásodik' };
const PARTS = { 'gyökér': 'Ez szívja fel a talajból a vizet, és rögzíti a növényt.', 'szár': 'Ez tartja a növényt, és a vizet a levelekhez szállítja.', 'levél': 'Itt készül a növény tápláléka a napfény segítségével.', 'virág': 'Ebből fejlődik ki a termés.', 'termés': 'Ebben van a mag.' };
const EATEN = { 'gyökér': ['répa', 'retek', 'cékla'], 'levél': ['saláta', 'spenót', 'káposzta'], 'virág': ['karfiol', 'brokkoli'], 'termés': ['alma', 'uborka', 'paradicsom', 'paprika', 'szilva', 'barack', 'cseresznye'] };
const LOMB = ['tölgy', 'bükk', 'nyír', 'akác', 'juhar', 'hárs', 'fűz', 'platán'], TU = ['lucfenyő', 'erdeifenyő', 'jegenyefenyő', 'fenyő'];
const FRUIT = [['tölgy', 'makk'], ['bükk', 'bükkmakk'], ['fenyő', 'toboz'], ['mogyoróbokor', 'mogyoró'], ['cseresznyefa', 'cseresznye'], ['almafa', 'alma'], ['szilvafa', 'szilva'], ['diófa', 'dió']];
const PLANT_TF = [['A növények a gyökerükkel szívják fel a vizet.', 1, 'A gyökér szívja fel a vizet és a tápanyagokat a talajból.'], ['A növények a leveleikkel veszik fel a talajból a vizet.', 0, 'A vizet a gyökér szívja fel, nem a levél.'],
  ['A fenyőfák tűlevelűek.', 1, 'A fenyőknek tűlevelük van.'], ['A tölgy termése a toboz.', 0, 'A tölgy termése a makk, a tobozt a fenyő hozza.'], ['A növények a napfény segítségével készítik a táplálékukat.', 1, 'A levélben, a napfény segítségével készül a növény tápláléka.'],
  ['A gyökér a növény legmagasabb része.', 0, 'A gyökér általában a föld alatt van, a szár és a levelek vannak fent.'], ['Minden fa lombhullató.', 0, 'A fenyők örökzöldek, tűleveleiket nem hullatják le egyszerre.'], ['A burgonya a föld alatt fejlődik.', 1, 'A burgonya a földben, a föld alatt képződő gumó.'],
  ['A növényeknek nincs szükségük vízre.', 0, 'A növényeknek víz, fény, levegő és tápanyag kell a növekedéshez.'], ['A búza lágyszárú növény.', 1, 'A búza szára lágy, nem fásodik.'], ['A cseresznye zöldség.', 0, 'A cseresznye gyümölcs.'], ['A rózsa bokor.', 1, 'A rózsának több vékony fás szára van, bokor.'],
  ['A növények szén-dioxidot vesznek fel a levegőből.', 1, 'A levelek a levegő szén-dioxidját veszik fel, és oxigént adnak le.'], ['A virágból fejlődik ki a termés.', 1, 'A termés a virág megporzása után fejlődik ki.'], ['A fák levele mindig tűlevél.', 0, 'A lombos fák levele széles, csak a fenyőké tű alakú.']];
mod({
  slug: 'novenyek', title: 'Növények gyakorló', short: 'Növények', group: 'termeszet', glyph: 'növény', hue: 3, grades: [1, 6],
  desc: 'Gyümölcsök és zöldségek, fák, bokrok, a növények részei, lomb- és tűlevelű fák, fák termései.',
  seo: 'A növényekről szóló feladatok az alsó és a felső tagozatos környezet- és természetismeret fontos részei. A gyakorló gyümölcsöket és zöldségeket, fákat, bokrokat és lágyszárú növényeket különböztet meg, a növény részeinek feladatáról, a lomb- és tűlevelű fákról, a fák terméséről és a növények életéről kérdez.',
  levels: [
    { name: 'Gyümölcs vagy zöldség?', gen: () => { const g = Math.random() < .5, w = pick(g ? GYUM : ZOLD); return CH(wdq(w, 'Gyümölcs vagy zöldség?'), g ? 'gyümölcs' : 'zöldség', [g ? 'zöldség' : 'gyümölcs'], { hint: `${cap(w)}: ${g ? 'gyümölcs' : 'zöldség'}.` }); } },
    { name: 'Fa, bokor vagy lágyszárú?', gen: () => { const [p, g] = pick(mapPairs(PGROUP)); return CLS(wdq(p, 'Fa, bokor vagy lágyszárú növény?'), g, Object.keys(PGROUP), `${A(p)} ${g}: ${PGROUP_NOTE[g]}.`); } },
    { name: 'A növényi részek feladata', gen: () => { const [part, s] = pick(Object.entries(PARTS)); return CLS(Q(`„${s}”`, 'Melyik növényi részről van szó?'), part, Object.keys(PARTS), `${cap(part)}: ${s.charAt(0).toLowerCase() + s.slice(1)}`); } },
    { name: 'Mit eszünk a növényből?', gen: () => { const [v, p] = pick(mapPairs(EATEN)); return CLS(Q(`Melyik növényi részét esszük ${az(v)} ${v}?`), p, Object.keys(EATEN), `${cap(v)}: ${p === 'gyökér' ? 'a gyökerét' : p === 'levél' ? 'a levelét' : p === 'virág' ? 'a virágát' : 'a termését'} esszük.`); } },
    { name: 'Lomblevelű vagy tűlevelű?', gen: () => { const l = Math.random() < .5, f = pick(l ? LOMB : TU); return CH(wdq(f, 'Lomblevelű vagy tűlevelű fa?'), l ? 'lomblevelű' : 'tűlevelű', [l ? 'tűlevelű' : 'lomblevelű'], { hint: `${A(f)} ${l ? 'lomblevelű: széles levelei vannak' : 'tűlevelű: a levele tű alakú'}.` }); } },
    { name: 'Mi a fa termése?', gen: () => { const [f, t] = pick(FRUIT); return CLS(Q(`Mi ${az(f)} ${f} termése?`), t, FRUIT.map(x => x[1]), `${cap(f)} termése: ${t}.`); } },
    { name: 'Igaz vagy hamis?', gen: TFS(PLANT_TF) }
  ]
});

/* ---------- Az emberi test ---------- */
const SENSES = [['látunk', 'szem'], ['hallunk', 'fül'], ['szagolunk', 'orr'], ['ízlelünk', 'nyelv'], ['tapintunk', 'bőr']];
const BODYNUM = [['Hány ujja van egy kezünknek?', 5, 'Egy kezünkön 5 ujjunk van.'], ['Hány ujjunk van összesen a két kezünkön?', 10, '2 × 5 = 10 ujj.'], ['Hány szemünk van?', 2, 'Két szemünk van.'], ['Hány fülünk van?', 2, 'Két fülünk van.'],
  ['Hány orrunk van?', 1, 'Egy orrunk van.'], ['Hány érzékszervünk van?', 5, 'Öt érzékszervünk van: szem, fül, orr, nyelv, bőr.'], ['Hány lábujja van összesen az embernek?', 10, 'Mindkét lábunkon 5-5 lábujj van, összesen 10.'],
  ['Hány tejfoga van a gyereknek, ha mind kinőtt?', 20, 'A tejfogak száma 20.'], ['Hány foga van a felnőttnek, ha mind megvan?', 32, 'A felnőtt fogazat 32 fogból áll.'], ['Hány csontból áll a felnőtt ember csontváza?', 206, 'A felnőtt embernek kb. 206 csontja van.']];
const ORGANS = { 'szív': 'pumpálja a vért a testünkben', 'tüdő': 'ezzel lélegzünk, oxigént veszünk fel', 'gyomor': 'itt kezdődik az étel emésztése', 'agy': 'irányítja a testünket, ezzel gondolkodunk', 'vese': 'kiszűri a vérből a felesleges anyagokat', 'csontváz': 'tartja és védi a testünket', 'izom': 'mozgatja a testrészeinket', 'bőr': 'védi a testünket és érzékel' };
const HEALTHY = ['elegendő vizet iszol', 'sokat mozogsz a szabadban', 'zöldséget és gyümölcsöt eszel', 'naponta kétszer fogat mosol', 'eleget alszol', 'étkezés előtt kezet mosol', 'az időjárásnak megfelelően öltözöl'];
const UNHEALTHY = ['minden nap sok cukros üdítőt iszol', 'késő estig számítógépezel, és keveset alszol', 'sosem mosol fogat', 'csak chipset és édességet eszel', 'egész nap egy helyben ülsz', 'étkezés előtt nem mosol kezet'];
const SYSTEMS = { 'légzőrendszer': ['tüdő', 'légcső', 'gége', 'orrüreg'], 'keringési rendszer': ['szív', 'vér', 'véredény'], 'emésztőrendszer': ['gyomor', 'nyelőcső', 'bélrendszer', 'máj'], 'mozgásrendszer': ['csont', 'izom', 'ízület'], 'idegrendszer': ['agy', 'gerincvelő', 'idegek'], 'kiválasztó rendszer': ['vese', 'húgyhólyag'] };
const BODY_TF = [['A szív vért pumpál.', 1, 'A szív pumpálja a vért a testünkben.'], ['A tüdő az emésztésben vesz részt.', 0, 'A tüdő a légzés szerve, az emésztés a gyomorban és a bélrendszerben történik.'], ['Az agy az idegrendszer központja.', 1, 'Az agy irányítja a testünket.'], ['A bőr a legnagyobb szervünk.', 1, 'A bőr borítja a testünket, ez a legnagyobb szervünk.'],
  ['A vese az emésztést segíti.', 0, 'A vese a vért szűri, és a felesleges anyagokat kiválasztja.'], ['A csontok védik a belső szerveinket.', 1, 'Például a bordák a szívet és a tüdőt védik.'], ['Az izmok mozgatják a testünket.', 1, 'Az izmok összehúzódásával mozgunk.'], ['A hallásért az orr felel.', 0, 'A hallás szerve a fül, az orr a szaglásé.'],
  ['A szemünkkel szagolunk.', 0, 'A szemmel látunk, az orrunkkal szagolunk.'], ['A gyomorban az étel egy része megemésztődik.', 1, 'A gyomor a táplálék emésztésének fontos helye.']];
mod({
  slug: 'emberi-test', title: 'Az emberi test gyakorló', short: 'Az emberi test', group: 'termeszet', glyph: 'test', hue: 4, grades: [1, 6],
  desc: 'Érzékszervek, testrészek, a szervek feladata, egészséges életmód és a szervrendszerek.',
  seo: 'Az emberi test megismerése az első évfolyamtól a hatodikig végigkíséri a környezet- és természetismeretet. A gyakorló az érzékszervekkel, a testrészekkel, a fontos szervek feladatával, az egészséges életmóddal és a szervrendszerekkel foglalkozik, rövid, játékos kérdésekkel.',
  levels: [
    { name: 'Az érzékszerveink', gen: () => { const [v, o] = pick(SENSES); return CLS(Q(`Melyik érzékszervünkkel ${v}?`), o, SENSES.map(x => x[1]), `Az érzékszerveink: szem (látás), fül (hallás), orr (szaglás), nyelv (ízlelés), bőr (tapintás). Helyes válasz: ${o}.`); } },
    { name: 'Hány van belőle?', gen: () => { const [q, n, h] = pick(BODYNUM); return NUM(Q(q), n, { hint: h }); } },
    { name: 'A szerveink feladata', gen: () => { const [o, s] = pick(Object.entries(ORGANS)); return CLS(Q(`„${cap(s)}.”`, 'Melyik szervünkről van szó?'), o, Object.keys(ORGANS), `${A(o)} feladata: ${s}.`); } },
    { name: 'Egészséges életmód', gen: () => { if (Math.random() < .5) { const h = pick(HEALTHY); return CH(Q('Melyik szokás egészséges?', 'Válaszd ki a jót!'), cap(h), shuffle(UNHEALTHY).slice(0, 3).map(cap), { hint: `Egészséges, ha ${h}.` }); }
      const u = pick(UNHEALTHY); return CH(Q('Melyik szokás NEM egészséges?'), cap(u), shuffle(HEALTHY).slice(0, 3).map(cap), { hint: `Nem egészséges, ha ${u}.` }); } },
    { name: 'Szervrendszerek', gen: () => { const [o, s] = pick(mapPairs(SYSTEMS)); return CLS(Q(`Melyik szervrendszerhez tartozik ${az(o)} ${o}?`), s, Object.keys(SYSTEMS), `${A(o)} ${az(s)} ${s} része.`); } },
    { name: 'Igaz vagy hamis?', gen: TFS(BODY_TF) }
  ]
});

/* ---------- Anyagok és halmazállapotok ---------- */
const STATE = { 'szilárd': ['kő', 'fa', 'vas', 'jég', 'papír', 'üveg', 'műanyag', 'cukor', 'só', 'homok'], 'folyékony': ['víz', 'olaj', 'tej', 'méz', 'higany', 'ecet', 'üdítő'], 'légnemű': ['levegő', 'oxigén', 'szén-dioxid', 'vízgőz', 'földgáz', 'hélium'] };
const CHANGES = [['A jég a meleg szobában vízzé válik.', 'olvadás'], ['A víz a fagypont alatt jéggé válik.', 'fagyás'], ['A tócsa kiszárad a napsütésben.', 'párolgás'], ['A hideg ablakon a pára vízcseppekké válik.', 'lecsapódás'], ['A vaj a meleg serpenyőben megolvad.', 'olvadás'],
  ['A nedves ruha megszárad a szárítón.', 'párolgás'], ['A fazékban 100 °C-on bugyborékol a víz.', 'forrás'], ['A téli tó vize megfagy.', 'fagyás'], ['A fürdőszobai tükörre rakódik a vízgőz.', 'lecsapódás'], ['A hógolyó a tenyerünkben megolvad.', 'olvadás']];
const CH_NAMES = ['olvadás', 'fagyás', 'párolgás', 'lecsapódás', 'forrás'];
const TEMPS = [['Hány °C-on fagy meg a víz?', 0, 'A víz fagyáspontja 0 °C.'], ['Hány °C-on olvad a jég?', 0, 'A jég olvadáspontja 0 °C.'], ['Hány °C-on forr a víz?', 100, 'A víz forráspontja 100 °C (normál légnyomáson).']];
const MAGNET = { 'vonzza a mágnes': ['vasszög', 'acélcsavar', 'vas gemkapocs', 'vasreszelék'], 'nem vonzza a mágnes': ['műanyag kanál', 'fa ceruza', 'üvegpohár', 'papír', 'alumíniumfólia', 'rézdrót'] };
const SOLUB = { 'oldódik a vízben': ['cukor', 'só'], 'nem oldódik a vízben': ['homok', 'olaj', 'liszt', 'kréta', 'rizs', 'kavics'] };
const FLOAT = { 'úszik a vízen': ['fa', 'parafa', 'jég', 'olaj', 'üres műanyag palack', 'falevél'], 'elmerül a vízben': ['kő', 'vasszög', 'pénzérme', 'üveggolyó', 'tégla'] };
const METAL = { 'fém': ['vas', 'réz', 'alumínium', 'arany', 'ezüst'], 'nem fém': ['fa', 'üveg', 'műanyag', 'papír', 'kő', 'gumi'] };
mod({
  slug: 'anyagok', title: 'Anyagok és halmazállapotok gyakorló', short: 'Anyagok', group: 'termeszet', glyph: '0 °C', hue: 1, grades: [3, 6],
  desc: 'Szilárd, folyékony és légnemű anyagok, halmazállapot-változások, a víz fagyás- és forráspontja, mágnes, oldódás és úszás.',
  seo: 'Az anyagok tulajdonságai és halmazállapotai a harmadik osztálytól a természetismeret fontos témái. A gyakorló megkérdezi, melyik anyag szilárd, folyékony vagy légnemű, mi a neve a halmazállapot-változásoknak (olvadás, fagyás, párolgás, lecsapódás, forrás), hány fokon fagy és forr a víz, vonzza-e a mágnes, oldódik-e vízben, úszik-e, és fém-e.',
  levels: [
    { name: 'Szilárd, folyékony vagy légnemű?', gen: () => { const [a, s] = pick(mapPairs(STATE)); return CLS(wdq(a, 'Szilárd, folyékony vagy légnemű anyag?'), s, Object.keys(STATE), `${A(a)} ${s} halmazállapotú.`); } },
    { name: 'Halmazállapot-változások', gen: () => { const [e, c] = pick(CHANGES); return CLS(Q(esc(e), 'Mi a neve a változásnak?'), c, CH_NAMES, `Olvadás: szilárdból folyékony. Fagyás: folyékonyból szilárd. Párolgás és forrás: folyékonyból légnemű. Lecsapódás: légneműből folyékony. Ez: ${c}.`); } },
    { name: 'Hány fokon?', gen: () => { const [q, n, h] = pick(TEMPS); return NUM(Q(q), n, { hint: h }); } },
    { name: 'Vonzza a mágnes?', gen: () => { const [a, c] = pick(mapPairs(MAGNET)), y = !c.startsWith('nem'); return CH(wdq(a, 'Vonzza a mágnes?'), y ? 'igen' : 'nem', [y ? 'nem' : 'igen'], { hint: `A mágnes a vasat és az acélt vonzza. ${A(a)}: ${y ? 'igen, vasból vagy acélból van' : 'nem, nem vasból és nem acélból van'}.` }); } },
    { name: 'Oldódik a vízben?', gen: () => { const [a, c] = pick(mapPairs(SOLUB)); return CH(wdq(a, 'Oldódik a vízben?'), c.startsWith('nem') ? 'nem' : 'igen', [c.startsWith('nem') ? 'igen' : 'nem'], { hint: `${A(a)} ${c}.` }); } },
    { name: 'Úszik vagy elmerül?', gen: () => { const [a, c] = pick(mapPairs(FLOAT)); return CH(wdq(a, 'Úszik a vízen, vagy elmerül?'), c.startsWith('úszik') ? 'úszik' : 'elmerül', [c.startsWith('úszik') ? 'elmerül' : 'úszik'], { hint: `${A(a)} ${c}.` }); } },
    { name: 'Fém vagy nem fém?', gen: () => { const [a, c] = pick(mapPairs(METAL)); return CH(wdq(a, 'Fém vagy nem fém?'), c, [c === 'fém' ? 'nem fém' : 'fém'], { hint: `${A(a)} ${c === 'fém' ? 'fém' : 'nem fém'}.` }); } }
  ]
});

/* ---------- Időjárás és a víz ---------- */
const INSTR = [['hőmérő', 'a levegő hőmérsékletét'], ['esőmérő', 'a lehullott csapadék mennyiségét'], ['szélzsák', 'a szél irányát'], ['barométer', 'a légnyomást']];
const WEAR = [['Esik az eső.', 'esernyő', 'Esőben esernyő és gumicsizma való.'], ['Havazik, és nagyon hideg van.', 'meleg kabát, sapka és kesztyű', 'Hidegben meleg ruha kell.'], ['Tűz a nap, és 35 fok van.', 'napszemüveg és nyári sapka', 'Nagy melegben védekezni kell a nap ellen.'], ['Hűvös, szeles őszi idő van.', 'dzseki és hosszú nadrág', 'Hűvös időben vastagabb ruha kell.']];
const WEAR_ALL = ['esernyő', 'meleg kabát, sapka és kesztyű', 'napszemüveg és nyári sapka', 'dzseki és hosszú nadrág', 'fürdőruha'];
const CYCLE = ['párolgás', 'lecsapódás (felhőképződés)', 'csapadék', 'lefolyás'];
mod({
  slug: 'idojaras-viz', title: 'Időjárás és a víz körforgása gyakorló', short: 'Időjárás, víz', group: 'termeszet', glyph: 'felhő', hue: 1, grades: [2, 5],
  desc: 'Időjárási műszerek, öltözködés az időjáráshoz, csapadékfajták, a víz körforgása és hőmérséklet-feladatok.',
  seo: 'Az időjárás és a víz körforgása a második osztálytól visszatérő téma. A gyakorló megkérdezi, melyik műszerrel mérjük az időjárás elemeit, mit vegyünk fel különböző időben, mi számít csapadéknak, hogyan zajlik a víz körforgása, és hőmérséklet-változásos számolási feladatokat is ad.',
  levels: [
    { name: 'Mivel mérjük?', gen: () => { const [i, w] = pick(INSTR); return CLS(Q(`Melyik műszerrel mérjük ${w}?`), i, INSTR.map(x => x[0]), `${cap(az(i))} ${i} ${w} méri.`); } },
    { name: 'Mit vegyél fel?', gen: () => { const [c, w, h] = pick(WEAR); return CLS(Q(esc(c), 'Mit érdemes felvenni vagy elvinni?'), w, WEAR_ALL, h); } },
    { name: 'Csapadék vagy nem?', gen: () => { if (Math.random() < .5) { const c = pick(['eső', 'hó', 'jégeső', 'ónos eső']); return CH(Q('Melyik csapadék?'), c, ['szél', 'napsütés', 'felhő'], { hint: `A csapadék az eső, a hó, a jégeső és az ónos eső. ${A(c)} csapadék.` }); }
      const n = pick(['szél', 'napsütés', 'felhő']); return CH(Q('Melyik NEM csapadék?'), n, ['eső', 'hó', 'jégeső'], { hint: `${A(n)} nem csapadék, mert nem a levegőből lehulló víz.` }); } },
    { name: 'A víz körforgása', gen: () => { const i = rnd(0, 3);
      return CLS(Q(`A víz körforgásában melyik lépés következik a(z) „${CYCLE[i]}” után?`), CYCLE[(i + 1) % 4], CYCLE, `A körforgás: párolgás, lecsapódás (felhőképződés), csapadék, lefolyás, és újra párolgás.`); } },
    { name: 'Hőmérő-feladatok', gen: () => { const a = rnd(2, 15), d = rnd(3, 12), b = a + d, k = rnd(0, 1);
      if (k === 0) return NUM(Q(`Reggel ${a} fok volt. Délre ${b} fok lett.`, 'Hány fokot változott a hőmérséklet?'), b - a, { hint: `${b} − ${a} = ${b - a}.` });
      const x = rnd(8, 18), y = rnd(2, 7); return NUM(Q(`Nappal ${x} fok volt, éjjel ${y} fokkal hidegebb lett.`, 'Hány fok volt éjjel?'), x - y, { hint: `${x} − ${y} = ${x - y}.` }); } }
  ]
});

/* ---------- Élőhelyek és életközösségek ---------- */
const LIVES = { 'erdő': ['tölgy', 'bükk', 'szarvas', 'vaddisznó', 'bagoly', 'mókus'], 'rét': ['pipacs', 'százszorszép', 'mezei nyúl', 'szöcske', 'pacsirta'], 'tó': ['nád', 'tavirózsa', 'csuka', 'ponty', 'vidra', 'hattyú'], 'tenger': ['moszat', 'delfin', 'cápa', 'medúza', 'tengeri csillag'], 'sivatag': ['kaktusz', 'teve', 'skorpió'] };
const FOOD = [['nyúl', 'fű', ['róka', 'bagoly', 'béka']], ['bagoly', 'egér', ['fű', 'tehén', 'tölgy']], ['cinke', 'hernyó', ['fű', 'tehén', 'róka']], ['béka', 'szöcske', ['fű', 'tehén', 'tölgy']], ['kígyó', 'béka', ['fű', 'tölgy', 'szarvas']], ['csuka', 'apró hal', ['fű', 'tölgy', 'szarvas']], ['tehén', 'fű', ['róka', 'hal', 'béka']]];
const CHAINS = [['fű', 'nyúl', 'róka'], ['fű', 'egér', 'bagoly'], ['levél', 'hernyó', 'cinke'], ['fű', 'szöcske', 'béka', 'kígyó'], ['moszat', 'apró hal', 'csuka']];
const ROLE = { 'termelő': ['fű', 'tölgy', 'moszat', 'búza', 'kukorica'], 'fogyasztó': ['nyúl', 'róka', 'bagoly', 'béka', 'szarvas', 'hernyó'], 'lebontó': ['gomba', 'baktérium'] };
mod({
  slug: 'elohelyek', title: 'Élőhelyek és táplálékláncok gyakorló', short: 'Élőhelyek, láncok', group: 'termeszet', glyph: 'erdő', hue: 3, grades: [4, 6],
  desc: 'Melyik élőlény hol él, mivel táplálkozik, táplálékláncok sorrendje, termelők, fogyasztók és lebontók.',
  seo: 'Az élőhelyek és a táplálékláncok a felső tagozatos természetismeret központi témái. A gyakorló megkérdezi, melyik növény vagy állat melyik élőhelyen él, mivel táplálkozik, milyen a helyes táplálékláncsorrend, és hogy az élőlények termelők, fogyasztók vagy lebontók.',
  levels: [
    { name: 'Hol él az élőlény?', gen: () => { const [x, h] = pick(mapPairs(LIVES)); return CLS(Q(`Melyik élőhelyen él ${az(x)} ${x}?`), h, Object.keys(LIVES), `${A(x)} élőhelye: ${h}.`); } },
    { name: 'Mivel táplálkozik?', gen: () => { const [c, f, w] = pick(FOOD); return CH(Q(`Mivel táplálkozik ${az(c)} ${c}?`), f, w, { hint: `${A(c)} táplálékai közé tartozik: ${f}.` }); } },
    { name: 'A tápláléklánc sorrendje', gen: () => { const ch = pick(CHAINS), s = a => a.join(' → '); const wr = []; for (let k = 0; k < 40 && wr.length < 3; k++) { const p = s(shuffle(ch)); if (p !== s(ch) && !wr.includes(p)) wr.push(p); }
      return CH(Q('Melyik a helyes tápláléklánc?', 'A nyíl azt mutatja, ki eszi meg az előzőt.'), s(ch), wr, { hint: `A tápláléklánc: ${s(ch)}. A növény van az elején, mert ő készíti a táplálékát.` }); } },
    { name: 'Termelő, fogyasztó vagy lebontó?', gen: () => { const [x, r] = pick(mapPairs(ROLE)); return CLS(Q(`Melyik csoportba tartozik ${az(x)} ${x}?`, 'Termelő, fogyasztó vagy lebontó?'), r, Object.keys(ROLE), `Termelők: a növények, mert a napfényből maguk készítik a táplálékukat. Fogyasztók: az állatok. Lebontók: a gombák és a baktériumok. ${A(x)}: ${r}.`); } }
  ]
});
}

/* ================= BETŰRAKÓ: szójáték =================
   Egy szóból hiányzó betűkockákat kell a helyükre rakni. A magyar kétjegyű betűk (cs, gy, ly, ny, sz, ty, zs, dz, dzs) egy kockát alkotnak.
   Nincs akasztás és nincs büntetés: ha elrontod, megmutatjuk a helyes szót. Néma játék, hang nélkül. */
{
const HU_TOK = /dzs|cs|dz|gy|ly|ny|sz|ty|zs|./g;
const tok = w => w.match(HU_TOK);
const CONFUSE = { ly: 'j', j: 'ly', 'í': 'i', i: 'í', 'ő': 'ö', 'ö': 'ő', 'ű': 'ü', 'ü': 'ű', 'ú': 'u', u: 'ú', 'ó': 'o', o: 'ó', 'é': 'e', e: 'é', 'á': 'a', a: 'á' };
const CRIT = new Set(['ly', 'j', 'í', 'ú', 'ű', 'ő', 'ö', 'ü', 'ó', 'é', 'á']);
const POOL = ['a', 'e', 'i', 'o', 'u', 'á', 'é', 'k', 'l', 'm', 'n', 'r', 's', 't', 'b', 'd', 'g', 'h', 'v', 'z', 'sz', 'ny', 'gy', 'cs'];

/* hidden: a hiányzó kockák indexei; clue: html (kép vagy szöveg), sub: kérdés alatti segítség */
const WQ = (word, clueHtml, sub, hiddenIdx, hint) => {
  const t = tok(word), hid = [...hiddenIdx].sort((a, b) => a - b), need = hid.map(i => t[i]);
  const extra = []; for (const x of need) { const c = CONFUSE[x]; if (c && !need.includes(c) && !extra.includes(c)) extra.push(c); }
  const pool = shuffle(POOL.filter(x => !need.includes(x) && !extra.includes(x)));
  const bank = shuffle([...need, ...extra, ...pool].slice(0, Math.max(6, need.length + extra.length + 2)));
  const mask = t.map((x, i) => (hid.includes(i) ? '_' : x)).join(' ');
  return { kind: 'word', q: Q(clueHtml, sub), word, tokens: t, hidden: hid, bank, ans: word, ansLabel: word, mask, hint: hint || `A szó: ${word}.` };
};
const pickIdx = (t, n, from = 1) => shuffle(Array.from({ length: t.length - from }, (_, i) => i + from)).slice(0, Math.min(n, t.length - from));
const emo = e => `<div class="big emo" aria-hidden="true">${e}</div>`;

const EMO = [['kutya', '🐶'], ['macska', '🐱'], ['egér', '🐭'], ['béka', '🐸'], ['medve', '🐻'], ['róka', '🦊'], ['tehén', '🐮'], ['ló', '🐴'], ['kacsa', '🦆'], ['bagoly', '🦉'], ['hal', '🐟'], ['méh', '🐝'], ['sün', '🦔'], ['csiga', '🐌'],
  ['elefánt', '🐘'], ['zsiráf', '🦒'], ['oroszlán', '🦁'], ['krokodil', '🐊'], ['teknős', '🐢'], ['kígyó', '🐍'], ['pingvin', '🐧'], ['majom', '🐒'], ['tigris', '🐯'], ['delfin', '🐬'], ['bálna', '🐳'], ['polip', '🐙'], ['rák', '🦀'], ['pók', '🕷️'], ['katica', '🐞'], ['hangya', '🐜'],
  ['alma', '🍎'], ['körte', '🍐'], ['banán', '🍌'], ['szőlő', '🍇'], ['eper', '🍓'], ['cseresznye', '🍒'], ['citrom', '🍋'], ['narancs', '🍊'], ['barack', '🍑'], ['ananász', '🍍'], ['dinnye', '🍉'], ['répa', '🥕'], ['kukorica', '🌽'], ['gomba', '🍄'], ['uborka', '🥒'], ['paradicsom', '🍅'], ['burgonya', '🥔'], ['hagyma', '🧅'], ['brokkoli', '🥦'],
  ['tojás', '🥚'], ['kenyér', '🍞'], ['sajt', '🧀'], ['tej', '🥛'], ['fagylalt', '🍦'], ['torta', '🎂'], ['pizza', '🍕'],
  ['labda', '⚽'], ['autó', '🚗'], ['busz', '🚌'], ['vonat', '🚆'], ['hajó', '🚢'], ['repülő', '✈️'], ['bicikli', '🚲'], ['traktor', '🚜'], ['mentő', '🚑'], ['tűzoltó', '🚒'], ['rakéta', '🚀'],
  ['nap', '☀️'], ['hold', '🌙'], ['csillag', '⭐'], ['felhő', '☁️'], ['tűz', '🔥'], ['virág', '🌸'], ['fa', '🌳'], ['esernyő', '☂️'], ['szivárvány', '🌈'], ['villám', '⚡'], ['hóember', '⛄'], ['karácsonyfa', '🎄'], ['ajándék', '🎁'], ['léggömb', '🎈'],
  ['ház', '🏠'], ['könyv', '📖'], ['toll', '🖊️'], ['óra', '⏰'], ['kulcs', '🔑'], ['szív', '❤️'], ['sapka', '🧢'], ['zokni', '🧦'], ['cipő', '👟'], ['fog', '🦷'], ['szem', '👁️'], ['kéz', '✋'], ['zongora', '🎹'], ['gitár', '🎸'], ['dob', '🥁'], ['telefon', '📱'], ['számítógép', '💻'], ['televízió', '📺'],
  ['olló', '✂️'], ['kalapács', '🔨'], ['szemüveg', '👓'], ['korona', '👑'], ['gyűrű', '💍'], ['sátor', '⛺'], ['templom', '⛪'], ['híd', '🌉']];
const CLUE = [['iskola', 'Ide járnak a gyerekek tanulni.'], ['tanító', 'Ő tanítja az iskolában a gyerekeket.'], ['füzet', 'Ebbe írunk az iskolában.'], ['ceruza', 'Ezzel írunk és rajzolunk.'], ['táska', 'Ebben visszük az iskolába a könyveket.'], ['szék', 'Erre ülünk az asztalnál.'], ['asztal', 'Erre terítünk, itt ebédelünk.'],
  ['ablak', 'Rajta át látunk ki a házból.'], ['ajtó', 'Ezen megyünk be a szobába.'], ['ágy', 'Ebben alszunk éjszaka.'], ['hűtő', 'Ebben tartjuk hidegen az ételt.'], ['eső', 'Felhőkből hull, esernyőt viszünk ilyenkor.'], ['tavasz', 'Az évszak, amikor kizöldülnek a fák.'], ['nyár', 'Az évszak, amikor a legmelegebb van.'],
  ['ősz', 'Az évszak, amikor hullanak a falevelek.'], ['tél', 'Az évszak, amikor havazik.'], ['szamár', 'Hosszú füle van, háziállat.'], ['malac', 'A disznó kicsinye.'], ['borjú', 'A tehén kicsinye.'], ['bárány', 'A birka kicsinye.'], ['csibe', 'A tyúk kicsinye.'], ['farkas', 'Erdei ragadozó, üvölt a holdra.'],
  ['szarvas', 'Agancsa van, az erdőben él.'], ['mókus', 'Bozontos farkú, diót gyűjt.'], ['pék', 'Ő süti a kenyeret.'], ['orvos', 'Ő gyógyítja a betegeket.'], ['tűzoltó', 'Ő oltja a tüzet.'], ['kertész', 'Virágokat és zöldségeket gondoz.'], ['szakács', 'Ő főz az étteremben.'], ['sofőr', 'Ő vezeti a buszt.'],
  ['uszoda', 'Itt úszni lehet.'], ['könyvtár', 'Itt lehet könyveket kölcsönözni.'], ['patika', 'Itt lehet gyógyszert venni.'], ['piac', 'Itt árulják a zöldséget és a gyümölcsöt.'], ['pékség', 'Itt vesszük a friss kenyeret.'], ['játszótér', 'Hinta és csúszda van itt.']];
const TRICKY = [['híd', 'Folyó fölött visz át.'], ['víz', 'Iszunk belőle, a folyóban folyik.'], ['tűz', 'Meleg, lángol.'], ['kő', 'Kemény, a földön találjuk.'], ['fű', 'Zöld, a réten nő.'], ['hős', 'Bátor ember a mesékben.'], ['szőnyeg', 'A padlón fekszik, lépkedünk rajta.'], ['bútor', 'Szék, asztal, szekrény együtt.'],
  ['hónap', 'Január, február, március… ezek mind.'], ['fűrész', 'Fát vágunk vele.'], ['szív', 'Ez dobog a mellkasunkban.'], ['kút', 'Vizet húzunk belőle.'], ['nyúl', 'Hosszú füle van, ugrál.'], ['kéz', 'Öt ujja van.'], ['erdő', 'Sok fa együtt.'], ['cipő', 'A lábunkra húzzuk.'], ['tükör', 'Benne látjuk magunkat.'],
  ['szülő', 'Anya vagy apa.'], ['öröm', 'Amit érzünk, ha boldogok vagyunk.'], ['fürdő', 'Itt mosakodunk.'], ['játék', 'Ezzel játszanak a gyerekek.'], ['majom', 'Fán mászik, banánt szeret.'], ['hajó', 'A vízen úszik.'], ['jég', 'Megfagyott víz.'], ['fej', 'Ezen van a szemünk és a szánk.'], ['sajt', 'Tejből készül, lyukas is lehet.'],
  ['tej', 'A tehén adja.'], ['bajusz', 'A felső ajka fölött nő a bácsiknak.'], ['rajz', 'Ceruzával vagy festékkel készül.'], ['ajándék', 'Születésnapra kapjuk.'], ['folyó', 'Hosszú víz, a tengerbe érkezik.'], ['golyó', 'Kerek, ezzel játszanak.'], ['király', 'Koronát visel a mesékben.'],
  ['bagoly', 'Éjjel repül, huhog.'], ['kehely', 'Bort ittak belőle a királyok.'], ['selyem', 'Puha, fényes anyag.'], ['gólya', 'Hosszú lábú madár, kéményen fészkel.'], ['hólyag', 'A bőrön támadhat, tele van folyadékkal.']];
const LONGW = [['csokoládé', 'Édesség kakaóból.'], ['palacsinta', 'Serpenyőben sütjük, lekvárral töltjük.'], ['repülőgép', 'Az égen szállít utasokat.'], ['csillagász', 'Az eget és a csillagokat kutatja.'], ['kirándulás', 'Erdőben gyalogolunk, hátizsákkal.'], ['bizonyítvány', 'Tanév végén kapjuk az iskolában.'],
  ['születésnap', 'Évente egyszer ünnepeljük, torta jár hozzá.'], ['hópehely', 'Télen hull az égből, hatágú csillag.'], ['szivárvány', 'Eső után látszik az égen, sok színű.'], ['villamos', 'Sínen közlekedik a városban.'], ['mosogatógép', 'Edényeket mos.'], ['hűtőszekrény', 'Hidegen tartja az ételt.'],
  ['számítógép', 'Ezen dolgozunk és játszunk.'], ['napszemüveg', 'A nap ellen viseljük.'], ['esernyő', 'Esőben nyitjuk ki.'], ['gyümölcsfa', 'Rajta alma, körte vagy szilva terem.'], ['tanítónő', 'Az iskolában tanít.'], ['könyvesbolt', 'Itt lehet könyveket vásárolni.'], ['tehervonat', 'Árut szállít sínen.'], ['strandlabda', 'Nyáron a vízparton játszunk vele.']];
const FEST = [['mikulás', 'December 6-án jön, piros ruhás.'], ['csizma', 'Kirakjuk az ablakba a Mikulásnak.'], ['virgács', 'Kis vessző a csizmában.'], ['rénszarvas', 'Húzza a Mikulás szánját.'], ['szaloncukor', 'Karácsonyfára lógatjuk.'], ['díszgömb', 'Kerek karácsonyfadísz.'], ['mézeskalács', 'Díszes karácsonyi sütemény.'],
  ['angyal', 'Szárnyai vannak, a betlehemes játék szereplője.'], ['gyertya', 'Meggyújtjuk az adventi koszorún.'], ['advent', 'Négy gyertyás várakozási időszak karácsony előtt.'], ['farsang', 'Jelmezes mulatság télen.'], ['jelmez', 'Ebbe öltözünk a farsangon.'], ['fánk', 'Édes, olajban sült, lekvárral töltött.'],
  ['álarc', 'Az arcunkra tesszük a farsangon.'], ['húsvét', 'Tavaszi ünnep, tojást festünk.'], ['locsolás', 'Húsvét hétfőn a fiúk ezt csinálják.'], ['nyuszi', 'A húsvéti ajándékot hozza.'], ['kalács', 'Fonott, édes sütemény.'], ['tulipán', 'Tavaszi virág, színes, kehely formájú.'],
  ['tanév', 'Szeptemberben kezdődik, júniusban ér véget.'], ['bizonyítvány', 'Tanév végén kapjuk.'], ['nyaralás', 'A nyári szünidő kedvenc programja.'], ['fagylalt', 'Nyáron hűsít, gombócban kapjuk.'], ['szüret', 'Ősszel szedik a szőlőt.'], ['falevél', 'Ősszel hullik a fáról.'], ['hóember', 'Télen építjük hóból, répaorra van.']];

/* ---- bővítés: több szó és új szintek ---- */
const ANI2 = [['kecske', '🐐'], ['birka', '🐑'], ['disznó', '🐖'], ['tyúk', '🐔'], ['csirke', '🐤'], ['galamb', '🕊️'], ['pillangó', '🦋'], ['nyúl', '🐇'], ['farkas', '🐺'], ['szarvas', '🦌'], ['zebra', '🦓'], ['víziló', '🦛'], ['orrszarvú', '🦏'], ['teve', '🐫'], ['kenguru', '🦘'], ['denevér', '🦇'], ['cápa', '🦈'], ['kagyló', '🐚'], ['papagáj', '🦜'], ['flamingó', '🦩'], ['páva', '🦚'], ['hattyú', '🦢'], ['sas', '🦅'], ['szúnyog', '🦟']];
const FOOD2 = [['burgonya', '🥔'], ['padlizsán', '🍆'], ['brokkoli', '🥦'], ['mogyoró', '🥜'], ['hamburger', '🍔'], ['palacsinta', '🥞'], ['méz', '🍯'], ['csokoládé', '🍫'], ['cukorka', '🍬'], ['nyalóka', '🍭'], ['sütemény', '🍰'], ['fánk', '🍩'], ['keksz', '🍪'], ['kávé', '☕'], ['szendvics', '🥪'], ['tészta', '🍝'], ['rizs', '🍚'], ['leves', '🍲'], ['kiwi', '🥝'], ['avokádó', '🥑'], ['kókusz', '🥥'], ['mangó', '🥭']];
const OBJ2 = [['lámpa', '💡'], ['zseblámpa', '🔦'], ['kanál', '🥄'], ['tányér', '🍽️'], ['seprű', '🧹'], ['szappan', '🧼'], ['ceruza', '✏️'], ['hátizsák', '🎒'], ['sál', '🧣'], ['kesztyű', '🧤'], ['kabát', '🧥'], ['póló', '👕'], ['nadrág', '👖'], ['ruha', '👗'], ['kalap', '🎩'], ['csizma', '👢'], ['táska', '👜'], ['zászló', '🚩'], ['harang', '🔔'], ['trombita', '🎺'], ['hegedű', '🎻'], ['mikrofon', '🎤'], ['kamera', '📷'], ['tévé', '📺'], ['rádió', '📻'], ['levél', '✉️'], ['naptár', '📅'], ['lakat', '🔒'], ['mágnes', '🧲'], ['távcső', '🔭'], ['mikroszkóp', '🔬'], ['gyógyszer', '💊']];
const NAT2 = [['sziget', '🏝️'], ['vulkán', '🌋'], ['hegy', '⛰️'], ['kastély', '🏰'], ['pálma', '🌴'], ['kaktusz', '🌵'], ['rózsa', '🌹'], ['napraforgó', '🌻'], ['bolygó', '🪐'], ['föld', '🌍'], ['üstökös', '☄️']];
EMO.push(...ANI2, ...FOOD2, ...OBJ2, ...NAT2);
const ANIM = EMO.filter(x => ['🐶', '🐱', '🐭', '🐸', '🐻', '🦊', '🐮', '🐴', '🦆', '🦉', '🐟', '🐝', '🦔', '🐌', '🐘', '🦒', '🦁', '🐊', '🐢', '🐍', '🐧', '🐒', '🐯', '🐬', '🐳', '🐙', '🦀', '🕷️', '🐞', '🐜'].includes(x[1])).concat(ANI2);
const FOODL = EMO.filter(x => ['🍎', '🍐', '🍌', '🍇', '🍓', '🍒', '🍋', '🍊', '🍑', '🍍', '🍉', '🥕', '🌽', '🍄', '🥒', '🍅', '🥚', '🍞', '🧀', '🥛', '🍦', '🎂', '🍕'].includes(x[1])).concat(FOOD2);
const OBJL = EMO.filter(x => ['🏠', '📖', '🖊️', '⏰', '🔑', '🧢', '🧦', '👟', '🎹', '🎸', '🥁', '📱', '✂️', '🔨', '👓', '👑', '💍'].includes(x[1])).concat(OBJ2);
CLUE.push(['tó', 'Álló víz, nyáron fürdünk benne.'], ['tenger', 'Sós víz, nagy hullámok vannak benne.'], ['kert', 'Itt nőnek a virágok és a zöldségek.'], ['mező', 'Füves, nyílt terület.'], ['bolt', 'Itt vásárolunk.'], ['mozi', 'Itt filmet nézünk.'], ['színház', 'Itt színészek játszanak a színpadon.'], ['állatkert', 'Itt vadállatok is vannak.'], ['kórház', 'Itt gyógyítják a betegeket.'], ['vár', 'Régi kőépület, magas falakkal.'], ['villa', 'Evőeszköz, szúrunk vele.'], ['kés', 'Vele vágjuk a kenyeret.'], ['pohár', 'Ebből iszunk.'], ['fazék', 'Ebben főzünk.']);
TRICKY.push(['lyuk', 'Ezt fúrjuk a falba.'], ['bölcső', 'Ebben ringatják a kisbabát.'], ['darázs', 'Csípős rovar, sárga-fekete csíkos.'], ['kölyök', 'A kutya vagy a macska kicsinye.'], ['könyv', 'Mesét olvasunk belőle.'], ['fejsze', 'Fát vágunk vele.'], ['ajak', 'A szánk széle.'], ['pajzs', 'A lovag védőfelszerelése.'], ['bölény', 'Nagy, bozontos vadállat.'], ['sólyom', 'Gyors ragadozó madár.'], ['gyöngy', 'Kagylóban terem, nyaklánc készül belőle.'], ['fűzfa', 'Hosszú, lelógó ágú fa a víz mellett.'], ['bajnok', 'A verseny nyertese.'], ['ölyv', 'Ragadozó madár, magasan körözik.']);
LONGW.push(['madárijesztő', 'Szántóföldön áll, elriasztja a madarakat.'], ['számológép', 'Vele gyorsan össze lehet adni a számokat.'], ['kerékpár', 'Pedállal hajtjuk, két kereke van.'], ['gyógyszertár', 'Itt lehet gyógyszert venni.'], ['pillangó', 'Színes szárnyú rovar.'], ['csúszda', 'Játszótéri játék, lecsúszunk rajta.'], ['hangszer', 'Zongora, gitár vagy hegedű.'], ['tanterem', 'Itt tartják az órákat az iskolában.'], ['postaláda', 'Ide dobjuk a leveleket.'], ['villanykörte', 'Világít, ha áram megy át rajta.'], ['kéményseprő', 'Fekete ruhás, a kéményeket tisztítja.'], ['mozdony', 'A vonatot húzza.'], ['mentőautó', 'Beteget szállít szirénázva.']);
FEST.push(['télapó', 'A Mikulás másik neve.'], ['szánkó', 'Télen ezen csúszunk le a dombról.'], ['korcsolya', 'Jégen siklunk vele.'], ['fenyő', 'Karácsonykor ezt díszítjük.'], ['betlehem', 'Itt született Jézus.'], ['csengő', 'Csilingel a szánon.'], ['szilveszter', 'Az év utolsó napja.'], ['újév', 'Január elseje.'], ['tűzijáték', 'Szilveszterkor szikrázik az égen.'], ['strand', 'Nyáron itt fürdünk.'], ['esőkabát', 'Esős őszi napokon viseljük.']);
/* mondatkiegészítés: [szó, névelő, mondat] */
const SENT = [['kutya', 'a', 'Hangosan ugat, a gazdája sétáltatja:'], ['macska', 'a', 'Nyávog, és szereti a tejet:'], ['méh', 'a', 'Virágport gyűjt, és mézet készít:'], ['tehén', 'a', 'Réten legel, és tejet ad:'], ['tyúk', 'a', 'Kotkodál, és tojást tojik:'], ['béka', 'a', 'A tóparton kuruttyol és ugrál:'], ['hal', 'a', 'Vízben él, és úszik:'], ['nap', 'a', 'Nappal süt az égen, meleget ad:'], ['hold', 'a', 'Éjjel világít az égen:'], ['eső', 'az', 'Felhőből hullik, esernyő kell hozzá:'], ['hó', 'a', 'Télen hull, hóembert építünk belőle:'], ['szél', 'a', 'Fúj, és repül tőle a sárkány:'], ['víz', 'a', 'Folyik a csapból, iszunk belőle:'], ['orvos', 'az', 'Beteg gyerekeket gyógyít:'], ['pék', 'a', 'Hajnalban süti a friss kenyeret:'], ['virág', 'a', 'A kertben nyílik, illatos:'], ['autó', 'az', 'Négy kereke van, úton megy:'], ['vonat', 'a', 'Sínen halad, állomásokon áll meg:'], ['ablak', 'az', 'Kinézünk rajta, üvegből van:'], ['ajtó', 'az', 'Ezen lépünk be a szobába:'], ['ágy', 'az', 'Éjszaka ebben alszunk:'], ['ceruza', 'a', 'Írunk vele a füzetbe:'], ['könyv', 'a', 'Mesék vannak benne, lapozzuk:']];
const picEmo = (list, n) => { const [w, e] = pick(list.filter(x => tok(x[0]).length >= 3 && tok(x[0]).length <= 8)), t = tok(w); return WQ(w, emo(e), n === 1 ? 'Pótold a hiányzó betűt!' : 'Pótold a hiányzó betűket!', pickIdx(t, t.length >= 6 ? n + 1 : n), `A kép: ${w}.`); };

mod({
  slug: 'beturako', title: 'Betűrakó szójáték', short: 'Betűrakó', group: 'nyelv', glyph: 'A_B', hue: 3, grades: [1, 6],
  desc: 'Pótold a hiányzó betűket a szavakban! Képes és szöveges feladványok, nehéz betűk (j, ly, ékezetek) és ünnepi szavak.',
  seo: 'A Betűrakó egy játékos szavas feladvány: egy képből vagy rövid magyarázatból kell kitalálni a szót, és a hiányzó betűkockákat a helyükre rakni. A magyar kétjegyű betűk egy kockának számítanak. A szinteken a képes szavaktól a nehéz helyesírású szavakig (j és ly, hosszú és rövid magánhangzók) és az ünnepi szavakig lehet gyakorolni, hang nélkül, büntetés nélkül.',
  levels: [
    { name: 'Képes szavak: egy betű hiányzik', gen: () => { const [w, e] = pick(EMO.filter(x => tok(x[0]).length >= 3 && tok(x[0]).length <= 6)), t = tok(w); return WQ(w, emo(e), 'Pótold a hiányzó betűt!', pickIdx(t, 1), `A kép: ${w}.`); } },
    { name: 'Képes szavak: két betű hiányzik', gen: () => { const [w, e] = pick(EMO.filter(x => tok(x[0]).length >= 5)), t = tok(w); return WQ(w, emo(e), 'Pótold a hiányzó betűket!', pickIdx(t, 2), `A kép: ${w}.`); } },
    { name: 'Szó a magyarázatból', gen: () => { const [w, c] = pick(CLUE), t = tok(w); return WQ(w, esc(c), 'Melyik szó rejtőzik? Pótold a hiányzó betűket!', pickIdx(t, t.length >= 6 ? 2 : 1), `A magyarázat: ${c} A szó: ${w}.`); } },
    { name: 'Nehéz betűk: j, ly és ékezetek', gen: () => { const [w, c] = pick(TRICKY), t = tok(w), crit = t.map((x, i) => (CRIT.has(x) ? i : -1)).filter(i => i >= 0), idx = crit.length ? shuffle(crit).slice(0, 2) : pickIdx(t, 1);
      return WQ(w, esc(c), 'Melyik betű hiányzik? Figyelj a j-re, az ly-ra és az ékezetekre!', idx, `A szó: ${w}. A magyarázat: ${c}`); } },
    { name: 'Hosszú szavak', gen: () => { const [w, c] = pick(LONGW), t = tok(w); return WQ(w, esc(c), 'Pótold a három hiányzó betűt!', pickIdx(t, 3), `A magyarázat: ${c} A szó: ${w}.`); } },
    { name: 'Ünnepek és évszakok', gen: () => { const [w, c] = pick(FEST), t = tok(w); return WQ(w, esc(c), 'Melyik szó rejtőzik? Pótold a hiányzó betűket!', pickIdx(t, t.length >= 6 ? 2 : 1), `A magyarázat: ${c} A szó: ${w}.`); } },
    { name: 'Állatok', gen: () => picEmo(ANIM, 1) },
    { name: 'Ételek és italok', gen: () => picEmo(FOODL, 1) },
    { name: 'Tárgyak és ruhák', gen: () => picEmo(OBJL.concat(NAT2), 2) },
    { name: 'Rakd ki az egész szót!', gen: () => { const [w, e] = pick(EMO.filter(x => tok(x[0]).length >= 3 && tok(x[0]).length <= 5)), t = tok(w); return WQ(w, emo(e), 'Rakd ki az összes betűt a helyes sorrendben!', t.map((_, i) => i), `A kép: ${w}.`); } },
    { name: 'Mondatkiegészítés', gen: () => { const [w, ar, m] = pick(SENT), t = tok(w); return WQ(w, esc(`${m} ${ar} ___.`), 'Melyik szó hiányzik? Pótold a hiányzó betűket!', pickIdx(t, t.length >= 4 ? 2 : 1, t.length >= 4 ? 1 : 0), `${m} ${ar} ${w}.`); } },
  ]
});
}

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
    { name: 'Rendszám: hányadik elem?', gen: () => { const e = pick(EL), up = Math.random() < .5; return up ? CH(Q(`${e[2]}.`, 'Melyik elem a periódusos rendszer ezen a helyén?'), { v: e[0], h: esc(e[0]) }, oth(EL, e, 3, x => ({ v: x[0], h: esc(x[0]) })), { hint: `${e[2]}. elem: ${e[0]} (${e[1]}).` }) : NUM(Q(`${esc(e[0])} (${sym(e[1])})`, 'Mennyi a rendszáma?'), e[2], { hint: `${Az(e[0])} ${e[0]} rendszáma ${e[2]}: ennyiedik a periódusos rendszerben.` }); } },
    { name: 'Fém, nemfém vagy nemesgáz?', gen: () => { const e = pick(ALL.filter(x => x[4])); return CH(Q(`${esc(e[0])} (${sym(e[1])})`, 'Fém, nemfém vagy nemesgáz?'), { v: TYPE[e[4]], h: TYPE[e[4]] }, Object.values(TYPE).filter(t => t !== TYPE[e[4]]), { hint: `${Az(e[0])} ${e[0]} ${TYPE[e[4]]}.` }); } }
  ]
});

mod({
  slug: 'atom-felepitese', title: 'Az atom felépítése gyakorló', short: 'Az atom felépítése', group: 'kemia', glyph: '<span>p<sup>+</sup> e<sup>−</sup></span>', hue: 1, grades: [7, 8],
  desc: 'Proton, neutron, elektron, rendszám, tömegszám és ionok: gyakorold az atom felépítését számolós és választós feladatokkal.',
  seo: 'Az Az atom felépítése gyakorló a hetedik és nyolcadik osztályos kémia egyik fő témáját gyakoroltatja: a részecskék töltését és helyét, a protonok és az elektronok számát, a neutronok kiszámítását a tömegszámból és a rendszámból, valamint az ionok elektronszámát. A feladatok az első húsz elem adataira épülnek, azonnali visszajelzéssel, ingyen, regisztráció nélkül.',
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
const FORM = [['víz', 'H2O', 'v'], ['szén-dioxid', 'CO2', 'v'], ['szén-monoxid', 'CO', 'v'], ['nátrium-klorid', 'NaCl', 'v'], ['metán', 'CH4', 'v'], ['ammónia', 'NH3', 'v'], ['sósav (hidrogén-klorid)', 'HCl', 'v'], ['kénsav', 'H2SO4', 'v'],
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
      return t ? NUM(Q(`<span class="fm">${fm(f[1])}</span>`, 'Összesen hány atomból áll egy molekula?'), total(f[1]), { hint: `${fm(f[1])}: ${el.map(k => `${a[k]} ${k}`).join(' + ')}, összesen ${total(f[1])} atom.` }) : (() => { const k = pick(el); return NUM(Q(`<span class="fm">${fm(f[1])}</span>`, `Hány ${k}-atom van a képletben?`), a[k], { hint: `Az alsó index mutatja: ${a[k]} darab ${k}-atom van.` }); })(); } },
    { name: 'Hány atom? Együtthatóval', gen: () => { const f = pick(FORM.filter(x => x[2] === 'v' && /\d/.test(x[1]))), c = rnd(2, 4), a = atoms(f[1]), k = pick(Object.keys(a)); return NUM(Q(`<span class="fm">${c} ${fm(f[1])}</span>`, `Összesen hány ${k}-atom van?`), c * a[k], { hint: `${c} molekulában ${c} · ${a[k]} = ${c * a[k]} darab ${k}-atom van.` }); } },
    { name: 'Egyenletrendezés: a hiányzó együttható', gen: () => { const eq = pick(EQ_C), terms = [...eq[0], ...eq[1]].filter(t => t[0] > 1), h = pick(terms);
      return NUM(Q(`<span class="fm">${eqHTML(eq, h)}</span>`, 'Melyik számot kell a kérdőjel helyére írni?'), h[0], { hint: `A kiegyenlített egyenlet: ${eqHTML(eq)}. Mindkét oldalon ugyanannyi atom van.` }); } },
    { name: 'Atomok számolása az egyenletben', gen: () => { const eq = pick(EQ.filter(e => [...e[0], ...e[1]].some(t => t[0] > 1))), side0 = Math.random() < .5, S = eq[side0 ? 0 : 1], els = [...new Set(S.flatMap(t => Object.keys(atoms(t[1]))))], k = pick(els), n = S.reduce((s, t) => s + t[0] * (atoms(t[1])[k] || 0), 0);
      return NUM(Q(`<span class="fm">${eqHTML(eq)}</span>`, `Hány ${k}-atom van a nyíl ${side0 ? 'bal' : 'jobb'} oldalán?`), n, { hint: `Ennyi ${k}-atom van a nyíl ${side0 ? 'bal' : 'jobb'} oldalán: ${n}. Az együtthatót szorozni kell az alsó indexszel.` }); } }
  ]
});
}

/* ================= MUNKALAPOK: közös, DOM-független függvények =================
   Ezeket a böngésző és a build is használja (a build ebből készíti az oldalakon látható mintamunkalapokat). */
const SITE_HOST = "iskolaigyakorlo.hu";
const ansText = q => (q.kind === 'num' ? `${numTxt(q.ans)}${q.unit ? (q.unit === '°' || q.unit === '%' ? '' : ' ') + q.unit : ''}` : q.ansLabel);
const keyText = q => { if (q.kind === 'num') return ansText(q); if (q.kind === 'word') return esc(q.word); const i = q.choices.findIndex(c => c.v === q.ans); return `${'ABCD'[i]}) ${q.ansLabel}`; };

/* Egy modul szintjei közül az adott évfolyamnak megfelelő sáv (a modul évfolyam-tartományát arányosan osztjuk szét a szintek között). */
const gradeLv = (m, g) => {
  const [a, z] = m.grades, nl = m.levels.length, span = z - a + 1;
  if (!g || g < a || g > z) return [0, nl - 1];
  const lo = Math.floor((g - a) * nl / span), hi = Math.max(lo, Math.ceil((g - a + 1) * nl / span) - 1);
  return [lo, Math.min(nl - 1, hi)];
};
const sheetQ = (m, lvl, seen) => {
  const L = m.levels[lvl], used = new Set(seen.map(x => x.q)); let q, k = 0;
  do { q = L.gen(); k++; } while (used.has(q.q) && k < 40);
  if (L.neg) q.neg = true;
  if (L.dec) q.dec = true;
  return q;
};
/* rows: [{ slug, sel: 'mix' | 'g' | szintszám, n }], grade: évfolyam az 'g' választáshoz */
const genRows = (rows, grade) => {
  const out = [];
  for (const r of rows) {
    const m = MODS.find(x => x.slug === r.slug); if (!m || !(r.n > 0)) continue;
    const nl = m.levels.length, [lo, hi] = r.sel === 'mix' ? [0, nl - 1] : r.sel === 'g' ? gradeLv(m, grade) : [+r.sel, +r.sel], seen = [];
    for (let i = 0; i < r.n; i++) { const q = sheetQ(m, lo + Math.floor(i * (hi - lo + 1) / r.n), seen); seen.push(q); out.push({ q, slug: m.slug, title: m.short }); }
  }
  return out;
};
const sItem = q => `<li><div class="sq">${q.q}</div>${q.kind === 'word' ? `<div class="sline wmask"><b>${esc(q.mask)}</b> <span class="blank long"></span></div>` : q.kind === 'num' ? `<div class="sline">Válasz: <span class="blank"></span> ${q.unit || ''}</div>` : `<div class="sopts">${q.choices.map((c, i) => `<span>${'ABCD'[i]}) ${c.h}</span>`).join('')}</div>`}</li>`;
/* Egymás utáni, azonos témájú feladatok csoportja (több téma esetén címsorral). */
const groupItems = items => { const gs = []; items.forEach((it, i) => { const g = gs[gs.length - 1]; if (g && g.slug === it.slug) g.items.push(it); else gs.push({ slug: it.slug, title: it.title, start: i + 1, items: [it] }); }); return gs; };
/* o: { title, sub, nameLine, cols } */
const sheetParts = (o, items) => {
  const gs = o.groups === false ? [{ slug: '', title: '', start: 1, items }] : groupItems(items), multi = gs.length > 1;
  const body = gs.map(g => `<section class="sgroup">${multi ? `<h3>${esc(g.title)}</h3>` : ''}<ol class="slist" start="${g.start}">${g.items.map(it => sItem(it.q)).join('')}</ol></section>`).join('');
  const head = `<div class="shead"><div class="stitle">${esc(o.title)}</div>${o.nameLine === false ? '' : '<div>Név: ____________________ Dátum: ____________</div>'}${o.sub ? `<div class="lvn">${esc(o.sub)}</div>` : ''}</div>`;
  const foot = `<div class="sfoot">Készült az ${SITE_HOST} oldalon: ingyenes gyakorlók és nyomtatható munkalapok 1–8. osztályosoknak.</div>`;
  const key = `<h2>Megoldókulcs</h2><div class="sgrid">${gs.map(g => `<div>${multi ? `<h3>${esc(g.title)}</h3>` : ''}<ol class="klist" start="${g.start}">${g.items.map(it => `<li>${keyText(it.q)}</li>`).join('')}</ol></div>`).join('')}</div>`;
  return { sheet: `${head}${body}${foot}`, key, cols: o.cols === false ? ' one' : '' };
};

/* Előre megépített munkalap-oldalak: cím, alcím és feladatsorok modulonként ('mod') vagy évfolyamonként ('grade', pl. m3 = 3. osztályos matek). */
const wsTitle = (type, key, sel) => {
  if (type === 'mod') { const m = MODS.find(x => x.slug === key); return { title: `${m.short} munkalap`, sub: sel === 'mix' ? 'Vegyes szintek: könnyebbtől a nehezebbig' : `${+sel + 1}. szint: ${m.levels[+sel].name}` }; }
  const g = +key.slice(1); return { title: `${g}. osztályos ${subjOf(key[0], g)} munkalap`, sub: 'Vegyes feladatok az évfolyam anyagából' };
};
const kindOf = m => (m.group === 'nyelv' ? 'n' : m.group === 'termeszet' || m.group === 'kemia' ? 't' : 'm');
const subjOf = (kind, g) => (kind === 'm' ? 'matek' : kind === 'n' ? 'helyesírás' : g <= 4 ? 'környezetismeret' : g <= 6 ? 'természetismeret' : 'kémia');
const gradeMods = (kind, g) => MODS.filter(m => kindOf(m) === kind && m.grades[0] <= g && g <= m.grades[1]);
const wsRows = (type, key, sel, n) => {
  if (type === 'mod') return [{ slug: key, sel, n }];
  const ms = gradeMods(key[0], +key.slice(1)), base = Math.floor(n / ms.length), extra = n % ms.length;
  return ms.map((m, i) => ({ slug: m.slug, sel: 'g', n: base + (i < extra ? 1 : 0) }));
};
const wsBuild = (type, key, sel, n) => { const mt = wsTitle(type, key, sel), items = genRows(wsRows(type, key, sel, n), type === 'grade' ? +key.slice(1) : 0); return Object.assign({ count: items.length }, sheetParts({ title: mt.title, sub: mt.sub, groups: type === 'mod' }, items)); };

/* ================= ÜNNEPI MUNKALAPOK =================
   Ünnepenként négyféle, évfolyam szerint nehezített, nyomtatható lap: szöveges feladatok, titkosírás-rejtvény, szókereső, hiányzó betűk.
   Tiszta (DOM nélküli) függvények: a böngésző és a build is használja. */
const BANDS = [['1', '1. osztály'], ['2', '2. osztály'], ['3', '3–4. osztály'], ['5', '5–6. osztály']];
const TTYPES = [['feladat', 'Szöveges feladatok'], ['titkos', 'Titkosírás-rejtvény'], ['szokereso', 'Szókereső'], ['betu', 'Hiányzó betűk']];
const THEMES = {
  mikulas: { name: 'Mikulás', title: 'Mikulás-munkalap', accent: 'Mikulás napja (december 6.)',
    scen: [['mandarin', 'a Mikulás zsákjában'], ['csokimikulás', 'a Mikulás zsákjában'], ['mogyoró', 'a Mikulás zsákjában'], ['narancs', 'a Mikulás kosarában'], ['alma', 'a Mikulás kosarában'], ['csomag', 'a rénszarvasok szánján']],
    words: ['mikulás', 'csizma', 'zsák', 'ajándék', 'virgács', 'rénszarvas', 'szán', 'mogyoró', 'mandarin', 'cukorka', 'csomag', 'manó', 'ablak', 'piros', 'szakáll', 'sapka', 'december'],
    phrases: ['JÖN A MIKULÁS', 'PIROS CSIZMA', 'TELE A ZSÁK', 'MIKULÁS NAP'] },
  karacsony: { name: 'Karácsony', title: 'Karácsonyi munkalap', accent: 'karácsony és advent',
    scen: [['díszgömb', 'a karácsonyfán'], ['szaloncukor', 'a tálban'], ['mézeskalács', 'a tepsin'], ['ajándék', 'a fa alatt'], ['csillag', 'az ablakban'], ['gyertya', 'a polcon']],
    words: ['karácsony', 'karácsonyfa', 'díszgömb', 'gyertya', 'ajándék', 'mézeskalács', 'szaloncukor', 'angyal', 'csillag', 'harang', 'fenyő', 'jászol', 'hópehely', 'pásztor', 'koszorú', 'advent', 'szenteste'],
    phrases: ['BOLDOG KARÁCSONYT', 'SZENTESTE VAN', 'FENYŐFA ILLAT', 'ANGYAL ÉS CSILLAG'] },
  farsang: { name: 'Farsang', title: 'Farsangi munkalap', accent: 'farsang',
    scen: [['lufi', 'a tornateremben'], ['fánk', 'a tálcán'], ['jelmez', 'a ruhatárban'], ['álarc', 'a dobozban'], ['szerpentin', 'a kosárban'], ['kalap', 'a polcon']],
    words: ['farsang', 'jelmez', 'álarc', 'maszk', 'fánk', 'lufi', 'szerpentin', 'bohóc', 'boszorkány', 'kalóz', 'tündér', 'zene', 'tánc', 'bál', 'tréfa', 'kosztüm', 'konfetti'],
    phrases: ['FARSANGI BÁL', 'JÓ MULATSÁGOT', 'JELMEZES NAP', 'FÁNK ÉS ZENE'] },
  husvet: { name: 'Húsvét', title: 'Húsvéti munkalap', accent: 'húsvét',
    scen: [['tojás', 'a kosárban'], ['csokinyuszi', 'a kosárban'], ['hímes tojás', 'a tálban'], ['tulipán', 'a vázában'], ['kalács', 'az asztalon'], ['barka', 'a vázában']],
    words: ['húsvét', 'tojás', 'nyuszi', 'locsolás', 'kalács', 'sonka', 'hímes', 'tulipán', 'bárány', 'kosár', 'barka', 'tavasz', 'virág', 'csibe', 'harmat'],
    phrases: ['BOLDOG HÚSVÉTOT', 'HÍMES TOJÁS', 'JÖN A NYUSZI', 'TAVASZI LOCSOLÁS'] },
  tanevkezdo: { name: 'Tanévkezdő', title: 'Tanévkezdő munkalap', accent: 'a tanév kezdete',
    scen: [['füzet', 'a táskában'], ['ceruza', 'a tolltartóban'], ['könyv', 'a polcon'], ['radír', 'a dobozban'], ['színes ceruza', 'a dobozban'], ['tankönyv', 'a padon']],
    words: ['tanév', 'iskola', 'tanító', 'füzet', 'ceruza', 'radír', 'táska', 'tolltartó', 'tankönyv', 'csengő', 'osztály', 'szünet', 'padtárs', 'tábla', 'toll'],
    phrases: ['JÓ TANÉVET', 'ÚJ ISKOLATÁSKA', 'KEZDŐDIK A TANÉV', 'SZEPTEMBER ELSŐ'] },
  evzaro: { name: 'Évzáró', title: 'Évzáró munkalap', accent: 'a tanév vége',
    scen: [['oklevél', 'az asztalon'], ['virág', 'a vázában'], ['fagylalt', 'a hűtőben'], ['lufi', 'az udvaron'], ['strandlabda', 'a kosárban'], ['könyv', 'a jutalomkosárban']],
    words: ['bizonyítvány', 'nyár', 'szünidő', 'évzáró', 'strand', 'fagylalt', 'tábor', 'kirándulás', 'jutalom', 'oklevél', 'virág', 'nyaralás', 'pihenés', 'tengerpart', 'vakáció'],
    phrases: ['JÓ NYARALÁST', 'KELLEMES SZÜNIDŐT', 'VÉGE A TANÉVNEK', 'SZÉP NYARAT'] }
};
const THEME_ORDER = ['mikulas', 'karacsony', 'farsang', 'husvet', 'tanevkezdo', 'evzaro'];
const thCap = s => s[0].toUpperCase() + s.slice(1);
const thFoot = () => `<div class="sfoot">Készült az ${SITE_HOST} oldalon: ingyenes gyakorlók és nyomtatható munkalapok 1–8. osztályosoknak.</div>`;
const thHead = (title, sub, intro) => `<div class="shead"><div class="stitle">${esc(title)}</div><div>Név: ____________________ Dátum: ____________</div><div class="lvn">${esc(sub)}</div></div>${intro ? `<p class="sintro">${esc(intro)}</p>` : ''}`;
const bandName = b => (BANDS.find(x => x[0] === b) || BANDS[1])[1];
const FRAC = [[2, 'a felét'], [3, 'a harmadát'], [4, 'a negyedét'], [5, 'az ötödét'], [10, 'a tizedét']];

/* ---------- Szöveges feladatok ---------- */
const THT = {
  add: (s, b) => { const a = b === '1' ? rnd(3, 12) : b === '2' ? rnd(20, 60) : rnd(120, 600), c = b === '1' ? rnd(1, 20 - a) : b === '2' ? rnd(5, Math.min(40, 100 - a)) : rnd(60, 300);
    return [`${thCap(s.loc)} ${a} ${s.t} volt. Még hozzátettek ${c} darabot. Hány ${s.t} van összesen?`, a + c, `${a} + ${c} = ${a + c}`]; },
  sub: (s, b) => { const a = b === '1' ? rnd(8, 20) : b === '2' ? rnd(30, 100) : rnd(300, 900), c = b === '1' ? rnd(2, a - 3) : b === '2' ? rnd(5, a - 10) : rnd(60, a - 100);
    return [`${thCap(s.loc)} ${a} ${s.t} volt. Közülük ${c} darabot kiosztottak. Hány ${s.t} maradt?`, a - c, `${a} − ${c} = ${a - c}`]; },
  mul: (s, b) => { const a = b === '2' ? rnd(2, 5) : rnd(3, 9), c = b === '2' ? rnd(2, 5) : b === '5' ? rnd(12, 40) : rnd(3, 10);
    return [`${a} gyerek mindegyikének jut ${c} ${s.t}. Hány ${s.t} kell összesen?`, a * c, `${a} × ${c} = ${a * c}`]; },
  div: (s, b) => { const k = b === '2' ? rnd(2, 5) : rnd(3, 9), q = b === '2' ? rnd(2, 5) : b === '5' ? rnd(12, 40) : rnd(3, 10);
    return [`${k * q} ${s.t} van, és egyenlően szétosztjuk ${k} gyerek között. Hány ${s.t} jut egy gyereknek?`, q, `${k * q} : ${k} = ${q}`]; },
  step: (s, b) => { const a = b === '2' ? rnd(30, 60) : b === '5' ? rnd(300, 700) : rnd(100, 300), c = b === '2' ? rnd(5, 20) : b === '5' ? rnd(50, 150) : rnd(20, 60), d = b === '2' ? rnd(5, 20) : b === '5' ? rnd(50, 150) : rnd(20, 60);
    return [`${thCap(s.loc)} ${a} ${s.t} volt. Még hozzátettek ${c} darabot, aztán ${d} darabot kiosztottak. Hány ${s.t} maradt?`, a + c - d, `${a} + ${c} − ${d} = ${a + c - d}`]; },
  box: (s) => { const a = rnd(3, 9), c = rnd(3, 9); return [`${a} dobozba ${c}-${c} ${s.t} került. Hány ${s.t} van összesen?`, a * c, `${a} × ${c} = ${a * c}`]; },
  money: (s, b) => { const p = b === '5' ? rnd(10, 60) * 10 : rnd(2, 20) * 10, n = b === '5' ? rnd(6, 20) : rnd(2, 9);
    return [`Egy ${s.t} ${p} forintba kerül. Hány forintba kerül ${n} darab?`, p * n, `${n} × ${p} = ${p * n}`]; },
  money2: (s) => { const p = rnd(2, 30) * 10, n = rnd(2, 9); return [`${n} ${s.t} ára összesen ${p * n} forint. Hány forintba kerül egy ${s.t}?`, p, `${p * n} : ${n} = ${p}`]; },
  frac: (s) => { const [d, w] = pick(FRAC), n = d * rnd(2, 12) * (d === 3 || d === 4 ? 2 : 1); return [`${thCap(s.loc)} ${n} ${s.t} volt. Ennek ${w} kiosztották. Hány ${s.t} maradt?`, n - n / d, `${n} : ${d} = ${n / d}, és ${n} − ${n / d} = ${n - n / d}`]; },
  percent: (s) => { const n = pick([20, 40, 60, 80, 100, 120, 200]), p = pick([10, 20, 25, 50]); if (n * p % 100) return THT.percent(s); return [`${thCap(s.loc)} ${n} ${s.t} volt. Közülük ${p}%-ot kiosztottak. Hány ${s.t} maradt?`, n - n * p / 100, `${p}% = ${n * p / 100}, és ${n} − ${n * p / 100} = ${n - n * p / 100}`]; }
};
const THB = { '1': ['add', 'sub'], '2': ['add', 'sub', 'mul', 'div', 'step'], '3': ['mul', 'div', 'box', 'step', 'money', 'money2', 'add', 'sub'], '5': ['mul', 'div', 'frac', 'percent', 'money', 'step'] };
const themeQ = (th, band) => { const [t, loc] = pick(THEMES[th].scen), k = pick(THB[band]), [text, ans, hint] = THT[k]({ t, loc }, band); return NUM(Q(esc(text)), ans, { hint }); };
const themeProblems = (th, band, n = 12) => { const items = [], seen = new Set(); for (let i = 0; i < 80 && items.length < n; i++) { const q = themeQ(th, band); if (!seen.has(q.q)) { seen.add(q.q); items.push({ q, slug: th, title: THEMES[th].name }); } } return items; };

/* ---------- Titkosírás-rejtvény ---------- */
const taskFor = (t, band) => {
  const add = () => { const a = rnd(1, t - 1); return [`${a} + ${t - a}`]; };
  const mulOpts = () => { const o = []; for (let d = 2; d <= 10; d++) if (t % d === 0 && t / d <= (band === '5' ? 40 : 12) && t / d >= 2) o.push(`${d} × ${t / d}`); return o; };
  const div = () => { const b = rnd(2, band === '5' ? 12 : 9); return [`${t * b} : ${b}`]; };
  if (band === '1') { if (t < 20 && Math.random() < .5) { const b = rnd(1, 20 - t); return `${t + b} − ${b}`; } return add()[0]; }
  if (band === '2') { const m = mulOpts(); if (m.length && Math.random() < .35) return pick(m); if (t < 98 && Math.random() < .5) { const b = rnd(1, 100 - t); return `${t + b} − ${b}`; } return add()[0]; }
  const opts = [...mulOpts(), ...div()]; if (Math.random() < .3) { const b = rnd(10, 90); return `${t + b} − ${b}`; } return pick(opts);
};
const titkosRange = { '1': [2, 20], '2': [11, 99], '3': [6, 90], '5': [20, 400] };
const themeSecret = (th, band) => {
  const T = THEMES[th], phrase = pick(T.phrases), letters = [...new Set([...phrase].filter(c => c !== ' '))], [lo, hi] = titkosRange[band];
  const nums = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, letters.length), map = {}; letters.forEach((l, i) => { map[l] = nums[i]; });
  const order = shuffle(letters), tasks = order.map(l => `<li><span class="cl">${esc(l)}</span><span class="ct">${taskFor(map[l], band)} = </span><span class="blank short"></span></li>`).join('');
  const msg = phrase.split(' ').map(w => `<span class="cw">${[...w].map(c => `<span class="cc"><b>${map[c]}</b><i></i></span>`).join('')}</span>`).join('');
  const sheet = `${thHead(`${T.title}: titkosírás`, bandName(band), 'Számold ki a feladatokat! A betű mellett lévő feladat eredményét keresd meg a kódban, és írd az eredmény alatti vonalra a betűt. Így kapod meg az üzenetet.')}<ol class="clist">${tasks}</ol><div class="cmsg">${msg}</div>${thFoot()}`;
  const key = `<h2>Megoldókulcs</h2><p>A megfejtés: <b>${esc(phrase)}</b></p><p class="ckey">${letters.map(l => `${esc(l)} = ${map[l]}`).join(' · ')}</p>`;
  return { sheet, key, count: letters.length };
};

/* ---------- Szókereső ---------- */
const WSL = 'AÁBCDEÉFGHIÍJKLMNOÓÖŐPRSTUÚÜŰVZ';
const wsDirs = { '1': [[0, 1], [1, 0]], '2': [[0, 1], [1, 0]], '3': [[0, 1], [1, 0], [1, 1]], '5': [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0]] };
const wsSize = { '1': [8, 6], '2': [10, 8], '3': [12, 10], '5': [14, 12] };
const themeSearch = (th, band) => {
  const T = THEMES[th], [size, cnt] = wsSize[band], dirs = wsDirs[band], maxLen = band === '1' ? 7 : size;
  const words = shuffle(T.words.map(w => w.replace(/[\s-]/g, '').toUpperCase()).filter(w => w.length <= maxLen)).slice(0, cnt).sort((a, b) => b.length - a.length);
  let g, hit, placed;
  for (let attempt = 0; attempt < 60; attempt++) {
    g = Array.from({ length: size }, () => Array(size).fill('')); hit = Array.from({ length: size }, () => Array(size).fill(false)); placed = [];
    for (const w of words) { for (let t = 0; t < 300; t++) { const [dr, dc] = pick(dirs), L = w.length, r0 = dr === 1 ? rnd(0, size - L) : dr === -1 ? rnd(L - 1, size - 1) : rnd(0, size - 1), c0 = dc === 1 ? rnd(0, size - L) : dc === -1 ? rnd(L - 1, size - 1) : rnd(0, size - 1);
        let ok = true; for (let i = 0; i < L; i++) { const c = g[r0 + dr * i][c0 + dc * i]; if (c && c !== w[i]) { ok = false; break; } }
        if (ok) { for (let i = 0; i < L; i++) { g[r0 + dr * i][c0 + dc * i] = w[i]; hit[r0 + dr * i][c0 + dc * i] = true; } placed.push(w); break; } } }
    if (placed.length === words.length) break;
  }
  const fill = [...new Set(placed.join(''))].join('') + WSL; for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!g[r][c]) g[r][c] = fill[rnd(0, fill.length - 1)];
  const grid = (mark) => `<table class="wsg"><tbody>${g.map((row, r) => `<tr>${row.map((c, k) => `<td${mark && hit[r][k] ? ' class="hit"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const list = [...placed].sort((a, b) => a.localeCompare(b, 'hu'));
  const sheet = `${thHead(`${T.title}: szókereső`, bandName(band), `Keresd meg a szavakat a rácsban! A szavak ${band === '1' || band === '2' ? 'vízszintesen és függőlegesen' : band === '3' ? 'vízszintesen, függőlegesen és átlósan' : 'vízszintesen, függőlegesen és átlósan, akár visszafelé is'} bújnak el. Húzd át őket!`)}${grid(false)}<div class="wlist"><b>Keresendő szavak:</b> ${list.map(esc).join(' · ')}</div>${thFoot()}`;
  return { sheet, key: `<h2>Megoldókulcs</h2>${grid(true)}`, count: list.length };
};

/* ---------- Hiányzó betűk ---------- */
const themeBlanks = (th, band) => {
  const T = THEMES[th], n = band === '1' ? 8 : 10, hideN = band === '1' ? 1 : band === '2' ? 1 : band === '3' ? 2 : 3;
  const words = shuffle(T.words.filter(w => !/\s/.test(w))).slice(0, n), rows = words.map(w => { const idx = shuffle(Array.from({ length: w.length - 1 }, (_, i) => i + 1)).slice(0, Math.min(hideN, w.length - 2)).sort((a, b) => a - b), shown = [...w].map((c, i) => (idx.includes(i) ? '_' : c)).join(''); return { w, shown: shown.split('').join(' ') }; });
  const sheet = `${thHead(`${T.title}: hiányzó betűk`, bandName(band), 'Pótold a hiányzó betűket, és írd le a teljes szót a vonalra!')}<ol class="blist">${rows.map(r => `<li><span class="bw">${esc(r.shown)}</span><span class="blank long"></span></li>`).join('')}</ol>${thFoot()}`;
  return { sheet, key: `<h2>Megoldókulcs</h2><ol class="klist">${rows.map(r => `<li>${esc(r.w)}</li>`).join('')}</ol>`, count: rows.length };
};

/* ---------- Egységes belépési pont ---------- */
const themeBuild = (th, band, type) => {
  if (type === 'titkos') return themeSecret(th, band);
  if (type === 'szokereso') return themeSearch(th, band);
  if (type === 'betu') return themeBlanks(th, band);
  const items = themeProblems(th, band), p = sheetParts({ title: `${THEMES[th].title}: szöveges feladatok`, sub: bandName(band), groups: false }, items);
  return { sheet: p.sheet, key: p.key, count: items.length };
};

/* ================= FELÜLET ================= */
const N = 10;                 // kérdések száma egy körben
const SHEET_N = 20;           // kérdések a munkalapon
const DAILY_GOAL = 20;        // napi cél: helyes válaszok
const XL = {"mod": {"osszeadas-kivonas": [["/munkalapok/osszeadas-kivonas/", "Összeadás, kivonás munkalap nyomtatható"], ["/1-osztalyos-matek-gyakorlo/", "1. osztályos matek gyakorló"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"]], "szorzotabla": [["/munkalapok/szorzotabla/", "Szorzótábla munkalap nyomtatható"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"], ["/4-osztalyos-matek-gyakorlo/", "4. osztályos matek gyakorló"]], "osztas": [["/munkalapok/osztas/", "Osztás munkalap nyomtatható"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"], ["/4-osztalyos-matek-gyakorlo/", "4. osztályos matek gyakorló"]], "irasbeli-muveletek": [["/munkalapok/irasbeli-muveletek/", "Írásbeli műveletek munkalap nyomtatható"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"], ["/4-osztalyos-matek-gyakorlo/", "4. osztályos matek gyakorló"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"]], "szoveges-feladatok": [["/munkalapok/szoveges-feladatok/", "Szöveges feladatok munkalap nyomtatható"], ["/1-osztalyos-matek-gyakorlo/", "1. osztályos matek gyakorló"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/4-osztalyos-matek-gyakorlo/", "4. osztályos matek gyakorló"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"]], "szamok-osszehasonlitasa": [["/munkalapok/szamok-osszehasonlitasa/", "Összehasonlítás munkalap nyomtatható"], ["/1-osztalyos-matek-gyakorlo/", "1. osztályos matek gyakorló"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"]], "szomszedok-sorozatok": [["/munkalapok/szomszedok-sorozatok/", "Szomszédok, sorozatok munkalap nyomtatható"], ["/1-osztalyos-matek-gyakorlo/", "1. osztályos matek gyakorló"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"]], "kerekites-paros-paratlan": [["/munkalapok/kerekites-paros-paratlan/", "Kerekítés, páros-páratlan munkalap nyomtatható"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"], ["/4-osztalyos-matek-gyakorlo/", "4. osztályos matek gyakorló"]], "romai-szamok": [["/munkalapok/romai-szamok/", "Római számok munkalap nyomtatható"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"], ["/4-osztalyos-matek-gyakorlo/", "4. osztályos matek gyakorló"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"]], "tortek": [["/munkalapok/tortek/", "Törtek munkalap nyomtatható"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"], ["/4-osztalyos-matek-gyakorlo/", "4. osztályos matek gyakorló"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"]], "ora-leolvasas": [["/munkalapok/ora-leolvasas/", "Óra leolvasása munkalap nyomtatható"], ["/1-osztalyos-matek-gyakorlo/", "1. osztályos matek gyakorló"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"]], "penz-szamolas": [["/munkalapok/penz-szamolas/", "Pénzszámolás munkalap nyomtatható"], ["/1-osztalyos-matek-gyakorlo/", "1. osztályos matek gyakorló"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"], ["/4-osztalyos-matek-gyakorlo/", "4. osztályos matek gyakorló"]], "mertekegysegek": [["/munkalapok/mertekegysegek/", "Mértékegységek munkalap nyomtatható"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"]], "geometria": [["/munkalapok/geometria/", "Geometria munkalap nyomtatható"], ["/1-osztalyos-matek-gyakorlo/", "1. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"]], "dobokocka": [["/munkalapok/dobokocka/", "Dobókocka munkalap nyomtatható"], ["/1-osztalyos-matek-gyakorlo/", "1. osztályos matek gyakorló"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"], ["/3-osztalyos-matek-gyakorlo/", "3. osztályos matek gyakorló"]], "negativ-szamok": [["/munkalapok/negativ-szamok/", "Negatív számok munkalap nyomtatható"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"], ["/7-osztalyos-matek-gyakorlo/", "7. osztályos matek gyakorló"]], "tizedes-tortek": [["/munkalapok/tizedes-tortek/", "Tizedes törtek munkalap nyomtatható"], ["/4-osztalyos-matek-gyakorlo/", "4. osztályos matek gyakorló"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"], ["/7-osztalyos-matek-gyakorlo/", "7. osztályos matek gyakorló"]], "tortek-halado": [["/munkalapok/tortek-halado/", "Törtek haladó munkalap nyomtatható"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"], ["/7-osztalyos-matek-gyakorlo/", "7. osztályos matek gyakorló"]], "szazalekszamitas": [["/munkalapok/szazalekszamitas/", "Százalékszámítás munkalap nyomtatható"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"], ["/7-osztalyos-matek-gyakorlo/", "7. osztályos matek gyakorló"], ["/8-osztalyos-matek-gyakorlo/", "8. osztályos matek gyakorló"]], "hatvanyok-gyokok": [["/munkalapok/hatvanyok-gyokok/", "Hatványok, gyökök munkalap nyomtatható"], ["/7-osztalyos-matek-gyakorlo/", "7. osztályos matek gyakorló"], ["/8-osztalyos-matek-gyakorlo/", "8. osztályos matek gyakorló"]], "oszthatosag-primszamok": [["/munkalapok/oszthatosag-primszamok/", "Oszthatóság, prímek munkalap nyomtatható"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"], ["/7-osztalyos-matek-gyakorlo/", "7. osztályos matek gyakorló"]], "egyenletek": [["/munkalapok/egyenletek/", "Egyenletek munkalap nyomtatható"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"], ["/7-osztalyos-matek-gyakorlo/", "7. osztályos matek gyakorló"], ["/8-osztalyos-matek-gyakorlo/", "8. osztályos matek gyakorló"]], "szogek-haromszogek": [["/munkalapok/szogek-haromszogek/", "Szögek, háromszögek munkalap nyomtatható"], ["/5-osztalyos-matek-gyakorlo/", "5. osztályos matek gyakorló"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"], ["/7-osztalyos-matek-gyakorlo/", "7. osztályos matek gyakorló"], ["/8-osztalyos-matek-gyakorlo/", "8. osztályos matek gyakorló"]], "kor-es-testek": [["/munkalapok/kor-es-testek/", "Kör és testek munkalap nyomtatható"], ["/6-osztalyos-matek-gyakorlo/", "6. osztályos matek gyakorló"], ["/7-osztalyos-matek-gyakorlo/", "7. osztályos matek gyakorló"], ["/8-osztalyos-matek-gyakorlo/", "8. osztályos matek gyakorló"]], "j-ly-helyesiras": [["/munkalapok/j-ly-helyesiras/", "J vagy LY munkalap nyomtatható"], ["/2-osztalyos-helyesiras-gyakorlo/", "2. osztályos helyesírás gyakorló"], ["/3-osztalyos-helyesiras-gyakorlo/", "3. osztályos helyesírás gyakorló"], ["/4-osztalyos-helyesiras-gyakorlo/", "4. osztályos helyesírás gyakorló"], ["/5-osztalyos-helyesiras-gyakorlo/", "5. osztályos helyesírás gyakorló"]], "hosszu-rovid-hangok": [["/munkalapok/hosszu-rovid-hangok/", "Hosszú-rövid hangok munkalap nyomtatható"], ["/1-osztalyos-helyesiras-gyakorlo/", "1. osztályos helyesírás gyakorló"], ["/2-osztalyos-helyesiras-gyakorlo/", "2. osztályos helyesírás gyakorló"], ["/3-osztalyos-helyesiras-gyakorlo/", "3. osztályos helyesírás gyakorló"], ["/4-osztalyos-helyesiras-gyakorlo/", "4. osztályos helyesírás gyakorló"]], "szotagolas-abc": [["/munkalapok/szotagolas-abc/", "Szótagolás, ABC munkalap nyomtatható"], ["/1-osztalyos-helyesiras-gyakorlo/", "1. osztályos helyesírás gyakorló"], ["/2-osztalyos-helyesiras-gyakorlo/", "2. osztályos helyesírás gyakorló"], ["/3-osztalyos-helyesiras-gyakorlo/", "3. osztályos helyesírás gyakorló"]], "szofajok": [["/munkalapok/szofajok/", "Szófajok munkalap nyomtatható"], ["/3-osztalyos-helyesiras-gyakorlo/", "3. osztályos helyesírás gyakorló"], ["/4-osztalyos-helyesiras-gyakorlo/", "4. osztályos helyesírás gyakorló"], ["/5-osztalyos-helyesiras-gyakorlo/", "5. osztályos helyesírás gyakorló"], ["/6-osztalyos-helyesiras-gyakorlo/", "6. osztályos helyesírás gyakorló"]], "mondatfajtak": [["/munkalapok/mondatfajtak/", "Mondatfajták munkalap nyomtatható"], ["/2-osztalyos-helyesiras-gyakorlo/", "2. osztályos helyesírás gyakorló"], ["/3-osztalyos-helyesiras-gyakorlo/", "3. osztályos helyesírás gyakorló"], ["/4-osztalyos-helyesiras-gyakorlo/", "4. osztályos helyesírás gyakorló"], ["/5-osztalyos-helyesiras-gyakorlo/", "5. osztályos helyesírás gyakorló"]], "toldalekok-val-vel": [["/munkalapok/toldalekok-val-vel/", "Toldalékok munkalap nyomtatható"], ["/3-osztalyos-helyesiras-gyakorlo/", "3. osztályos helyesírás gyakorló"], ["/4-osztalyos-helyesiras-gyakorlo/", "4. osztályos helyesírás gyakorló"], ["/5-osztalyos-helyesiras-gyakorlo/", "5. osztályos helyesírás gyakorló"], ["/6-osztalyos-helyesiras-gyakorlo/", "6. osztályos helyesírás gyakorló"]], "evszakok-honapok": [["/munkalapok/evszakok-honapok/", "Évszakok, hónapok munkalap nyomtatható"], ["/1-osztalyos-kornyezetismeret-gyakorlo/", "1. osztályos környezetismeret gyakorló"], ["/2-osztalyos-kornyezetismeret-gyakorlo/", "2. osztályos környezetismeret gyakorló"], ["/3-osztalyos-kornyezetismeret-gyakorlo/", "3. osztályos környezetismeret gyakorló"]], "allatok": [["/munkalapok/allatok/", "Állatok munkalap nyomtatható"], ["/1-osztalyos-kornyezetismeret-gyakorlo/", "1. osztályos környezetismeret gyakorló"], ["/2-osztalyos-kornyezetismeret-gyakorlo/", "2. osztályos környezetismeret gyakorló"], ["/4-osztalyos-kornyezetismeret-gyakorlo/", "4. osztályos környezetismeret gyakorló"], ["/5-osztalyos-termeszetismeret-gyakorlo/", "5. osztályos természetismeret gyakorló"]], "novenyek": [["/munkalapok/novenyek/", "Növények munkalap nyomtatható"], ["/1-osztalyos-kornyezetismeret-gyakorlo/", "1. osztályos környezetismeret gyakorló"], ["/3-osztalyos-kornyezetismeret-gyakorlo/", "3. osztályos környezetismeret gyakorló"], ["/5-osztalyos-termeszetismeret-gyakorlo/", "5. osztályos természetismeret gyakorló"], ["/6-osztalyos-termeszetismeret-gyakorlo/", "6. osztályos természetismeret gyakorló"]], "emberi-test": [["/munkalapok/emberi-test/", "Az emberi test munkalap nyomtatható"], ["/1-osztalyos-kornyezetismeret-gyakorlo/", "1. osztályos környezetismeret gyakorló"], ["/3-osztalyos-kornyezetismeret-gyakorlo/", "3. osztályos környezetismeret gyakorló"], ["/5-osztalyos-termeszetismeret-gyakorlo/", "5. osztályos természetismeret gyakorló"], ["/6-osztalyos-termeszetismeret-gyakorlo/", "6. osztályos természetismeret gyakorló"]], "anyagok": [["/munkalapok/anyagok/", "Anyagok munkalap nyomtatható"], ["/3-osztalyos-kornyezetismeret-gyakorlo/", "3. osztályos környezetismeret gyakorló"], ["/4-osztalyos-kornyezetismeret-gyakorlo/", "4. osztályos környezetismeret gyakorló"], ["/5-osztalyos-termeszetismeret-gyakorlo/", "5. osztályos természetismeret gyakorló"], ["/6-osztalyos-termeszetismeret-gyakorlo/", "6. osztályos természetismeret gyakorló"]], "idojaras-viz": [["/munkalapok/idojaras-viz/", "Időjárás, víz munkalap nyomtatható"], ["/2-osztalyos-kornyezetismeret-gyakorlo/", "2. osztályos környezetismeret gyakorló"], ["/3-osztalyos-kornyezetismeret-gyakorlo/", "3. osztályos környezetismeret gyakorló"], ["/4-osztalyos-kornyezetismeret-gyakorlo/", "4. osztályos környezetismeret gyakorló"], ["/5-osztalyos-termeszetismeret-gyakorlo/", "5. osztályos természetismeret gyakorló"]], "elohelyek": [["/munkalapok/elohelyek/", "Élőhelyek, láncok munkalap nyomtatható"], ["/4-osztalyos-kornyezetismeret-gyakorlo/", "4. osztályos környezetismeret gyakorló"], ["/5-osztalyos-termeszetismeret-gyakorlo/", "5. osztályos természetismeret gyakorló"], ["/6-osztalyos-termeszetismeret-gyakorlo/", "6. osztályos természetismeret gyakorló"]], "beturako": [["/munkalapok/beturako/", "Betűrakó munkalap nyomtatható"], ["/1-osztalyos-helyesiras-gyakorlo/", "1. osztályos helyesírás gyakorló"], ["/3-osztalyos-helyesiras-gyakorlo/", "3. osztályos helyesírás gyakorló"], ["/5-osztalyos-helyesiras-gyakorlo/", "5. osztályos helyesírás gyakorló"], ["/6-osztalyos-helyesiras-gyakorlo/", "6. osztályos helyesírás gyakorló"]], "kepes-feladatok": [["/munkalapok/kepes-feladatok/", "Képes feladatok munkalap nyomtatható"], ["/1-osztalyos-matek-gyakorlo/", "1. osztályos matek gyakorló"], ["/2-osztalyos-matek-gyakorlo/", "2. osztályos matek gyakorló"]], "elemek-vegyjelek": [["/munkalapok/elemek-vegyjelek/", "Elemek és vegyjelek munkalap nyomtatható"], ["/7-osztalyos-kemia-gyakorlo/", "7. osztályos kémia gyakorló"], ["/8-osztalyos-kemia-gyakorlo/", "8. osztályos kémia gyakorló"]], "atom-felepitese": [["/munkalapok/atom-felepitese/", "Az atom felépítése munkalap nyomtatható"], ["/7-osztalyos-kemia-gyakorlo/", "7. osztályos kémia gyakorló"], ["/8-osztalyos-kemia-gyakorlo/", "8. osztályos kémia gyakorló"]], "kepletek-egyenletek": [["/munkalapok/kepletek-egyenletek/", "Képletek és egyenletek munkalap nyomtatható"], ["/7-osztalyos-kemia-gyakorlo/", "7. osztályos kémia gyakorló"], ["/8-osztalyos-kemia-gyakorlo/", "8. osztályos kémia gyakorló"]]}, "g": {"m": ["/1-osztalyos-matek-gyakorlo/", "/2-osztalyos-matek-gyakorlo/", "/3-osztalyos-matek-gyakorlo/", "/4-osztalyos-matek-gyakorlo/", "/5-osztalyos-matek-gyakorlo/", "/6-osztalyos-matek-gyakorlo/", "/7-osztalyos-matek-gyakorlo/", "/8-osztalyos-matek-gyakorlo/"], "n": ["/1-osztalyos-helyesiras-gyakorlo/", "/2-osztalyos-helyesiras-gyakorlo/", "/3-osztalyos-helyesiras-gyakorlo/", "/4-osztalyos-helyesiras-gyakorlo/", "/5-osztalyos-helyesiras-gyakorlo/", "/6-osztalyos-helyesiras-gyakorlo/"], "t": ["/1-osztalyos-kornyezetismeret-gyakorlo/", "/2-osztalyos-kornyezetismeret-gyakorlo/", "/3-osztalyos-kornyezetismeret-gyakorlo/", "/4-osztalyos-kornyezetismeret-gyakorlo/", "/5-osztalyos-termeszetismeret-gyakorlo/", "/6-osztalyos-termeszetismeret-gyakorlo/", "/7-osztalyos-kemia-gyakorlo/", "/8-osztalyos-kemia-gyakorlo/"]}, "ws": {"mods": [["/munkalapok/osszeadas-kivonas/", "Összeadás, kivonás munkalap"], ["/munkalapok/szorzotabla/", "Szorzótábla munkalap"], ["/munkalapok/osztas/", "Osztás munkalap"], ["/munkalapok/irasbeli-muveletek/", "Írásbeli műveletek munkalap"], ["/munkalapok/szoveges-feladatok/", "Szöveges feladatok munkalap"], ["/munkalapok/szamok-osszehasonlitasa/", "Összehasonlítás munkalap"], ["/munkalapok/szomszedok-sorozatok/", "Szomszédok, sorozatok munkalap"], ["/munkalapok/kerekites-paros-paratlan/", "Kerekítés, páros-páratlan munkalap"], ["/munkalapok/romai-szamok/", "Római számok munkalap"], ["/munkalapok/tortek/", "Törtek munkalap"], ["/munkalapok/ora-leolvasas/", "Óra leolvasása munkalap"], ["/munkalapok/penz-szamolas/", "Pénzszámolás munkalap"], ["/munkalapok/mertekegysegek/", "Mértékegységek munkalap"], ["/munkalapok/geometria/", "Geometria munkalap"], ["/munkalapok/dobokocka/", "Dobókocka munkalap"], ["/munkalapok/negativ-szamok/", "Negatív számok munkalap"], ["/munkalapok/tizedes-tortek/", "Tizedes törtek munkalap"], ["/munkalapok/tortek-halado/", "Törtek haladó munkalap"], ["/munkalapok/szazalekszamitas/", "Százalékszámítás munkalap"], ["/munkalapok/hatvanyok-gyokok/", "Hatványok, gyökök munkalap"], ["/munkalapok/oszthatosag-primszamok/", "Oszthatóság, prímek munkalap"], ["/munkalapok/egyenletek/", "Egyenletek munkalap"], ["/munkalapok/szogek-haromszogek/", "Szögek, háromszögek munkalap"], ["/munkalapok/kor-es-testek/", "Kör és testek munkalap"], ["/munkalapok/j-ly-helyesiras/", "J vagy LY munkalap"], ["/munkalapok/hosszu-rovid-hangok/", "Hosszú-rövid hangok munkalap"], ["/munkalapok/szotagolas-abc/", "Szótagolás, ABC munkalap"], ["/munkalapok/szofajok/", "Szófajok munkalap"], ["/munkalapok/mondatfajtak/", "Mondatfajták munkalap"], ["/munkalapok/toldalekok-val-vel/", "Toldalékok munkalap"], ["/munkalapok/evszakok-honapok/", "Évszakok, hónapok munkalap"], ["/munkalapok/allatok/", "Állatok munkalap"], ["/munkalapok/novenyek/", "Növények munkalap"], ["/munkalapok/emberi-test/", "Az emberi test munkalap"], ["/munkalapok/anyagok/", "Anyagok munkalap"], ["/munkalapok/idojaras-viz/", "Időjárás, víz munkalap"], ["/munkalapok/elohelyek/", "Élőhelyek, láncok munkalap"], ["/munkalapok/beturako/", "Betűrakó munkalap"], ["/munkalapok/kepes-feladatok/", "Képes feladatok munkalap"], ["/munkalapok/elemek-vegyjelek/", "Elemek és vegyjelek munkalap"], ["/munkalapok/atom-felepitese/", "Az atom felépítése munkalap"], ["/munkalapok/kepletek-egyenletek/", "Képletek és egyenletek munkalap"]], "grades": [["/munkalapok/1-osztalyos-matek/", "1. osztályos matek munkalap"], ["/munkalapok/2-osztalyos-matek/", "2. osztályos matek munkalap"], ["/munkalapok/3-osztalyos-matek/", "3. osztályos matek munkalap"], ["/munkalapok/4-osztalyos-matek/", "4. osztályos matek munkalap"], ["/munkalapok/5-osztalyos-matek/", "5. osztályos matek munkalap"], ["/munkalapok/6-osztalyos-matek/", "6. osztályos matek munkalap"], ["/munkalapok/7-osztalyos-matek/", "7. osztályos matek munkalap"], ["/munkalapok/8-osztalyos-matek/", "8. osztályos matek munkalap"], ["/munkalapok/1-osztalyos-helyesiras/", "1. osztályos helyesírás munkalap"], ["/munkalapok/2-osztalyos-helyesiras/", "2. osztályos helyesírás munkalap"], ["/munkalapok/3-osztalyos-helyesiras/", "3. osztályos helyesírás munkalap"], ["/munkalapok/4-osztalyos-helyesiras/", "4. osztályos helyesírás munkalap"], ["/munkalapok/5-osztalyos-helyesiras/", "5. osztályos helyesírás munkalap"], ["/munkalapok/6-osztalyos-helyesiras/", "6. osztályos helyesírás munkalap"], ["/munkalapok/1-osztalyos-kornyezetismeret/", "1. osztályos környezetismeret munkalap"], ["/munkalapok/2-osztalyos-kornyezetismeret/", "2. osztályos környezetismeret munkalap"], ["/munkalapok/3-osztalyos-kornyezetismeret/", "3. osztályos környezetismeret munkalap"], ["/munkalapok/4-osztalyos-kornyezetismeret/", "4. osztályos környezetismeret munkalap"], ["/munkalapok/5-osztalyos-termeszetismeret/", "5. osztályos természetismeret munkalap"], ["/munkalapok/6-osztalyos-termeszetismeret/", "6. osztályos természetismeret munkalap"], ["/munkalapok/7-osztalyos-kemia/", "7. osztályos kémia munkalap"], ["/munkalapok/8-osztalyos-kemia/", "8. osztályos kémia munkalap"]], "themes": [["/munkalapok/mikulas/", "Mikulás munkalap"], ["/munkalapok/karacsony/", "Karácsony munkalap"], ["/munkalapok/farsang/", "Farsang munkalap"], ["/munkalapok/husvet/", "Húsvét munkalap"], ["/munkalapok/tanevkezdo/", "Tanévkezdő munkalap"], ["/munkalapok/evzaro/", "Évzáró munkalap"]]}};
const PATHMODE = document.documentElement.dataset.path === '1';
const href = slug => (PATHMODE ? (slug ? `/${slug}/` : '/') : (slug ? `#${slug}` : '#'));
const LS = 'iskolai-gyakorlo-v1';
/* ---------- Játékosok: ugyanazon az eszközön több gyerek, külön haladással (csak a böngészőben) ---------- */
const PROF_KEY = 'iskolai-gyakorlo-players', MAX_PLAYERS = 6;
const getProfs = () => { try { const o = JSON.parse(localStorage.getItem(PROF_KEY)); if (o && Array.isArray(o.list) && o.list.length && o.list.some(x => x.id === o.cur)) return o; } catch (e) { /* alapérték */ } return { list: [{ id: '1', name: 'Játékos' }], cur: '1' }; };
const setProfs = o => { try { localStorage.setItem(PROF_KEY, JSON.stringify(o)); } catch (e) { /* nincs tárhely */ } };
let PR = getProfs();
const sfx = () => (PR.cur === '1' ? '' : '-' + PR.cur);   // az első játékos a régi kulcsokat használja, így a meglévő haladás megmarad
const curName = () => (PR.list.find(x => x.id === PR.cur) || PR.list[0]).name;
const store = {
  get() { try { return JSON.parse(localStorage.getItem(LS + sfx())) || {}; } catch (e) { return {}; } },
  set(o) { try { localStorage.setItem(LS + sfx(), JSON.stringify(o)); } catch (e) { /* nincs tárhely */ } }
};
const OPT_KEY = 'iskolai-gyakorlo-opt';   // beállítások (pl. időre menő mód); nem része a mentési kódnak
const getOpt = () => { try { return JSON.parse(localStorage.getItem(OPT_KEY)) || {}; } catch (e) { return {}; } };
const setOpt = o => { try { localStorage.setItem(OPT_KEY, JSON.stringify(o)); } catch (e) { /* nincs tárhely */ } };
const BREAK_MIN = 20;         // szünet-emlékeztető: gyakorlással töltött percek
const BREAK_IDLE = 300;       // ennyi mp tétlenség után a számláló nullázódik
const TIME_SEC = 60;          // időre menő mód hossza
const MISS_KEY = 'iskolai-gyakorlo-miss';
const getMiss = () => { try { return JSON.parse(localStorage.getItem(MISS_KEY + sfx())) || []; } catch (e) { return []; } };
const setMiss = a => { try { localStorage.setItem(MISS_KEY + sfx(), JSON.stringify(a.slice(-40))); } catch (e) { /* nincs tárhely */ } };
const missKey = q => q.q + '|' + q.ans;
const T = () => (S.hiba ? S.pool.length : S.tm ? S.hist.length : N);
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
  { id: 'fast', g: '60 s', name: 'Villámkéz', desc: 'Oldj meg 20 feladatot 60 másodperc alatt.', t: p => (p.tbest || 0) >= 20 },
  { id: 'pts1000', g: '1000', name: 'Ezer pont', desc: 'Gyűjts 1000 pontot.', t: p => p.pts >= 1000 },
  { id: 'lv5', g: 'Sz. 5', name: 'Ötös szint', desc: 'Érd el az 5. szintet.', t: p => levelOf(p.pts) >= 5 },
  { id: 'big', g: '5–8', name: 'Nagy kihívás', desc: 'Szerezz 3 csillagot egy felsős (5–8. osztályos) gyakorlón.', t: (p, a) => MODS.some(m => m.grades[0] >= 5 && m.levels.some((_, i) => starsOf(((a[m.slug] || {})[i]) || 0) === 3)) },
  { id: 'mul', g: '×', name: 'Szorzótábla-mester', desc: 'Szerezz 3 csillagot a szorzótábla minden szintjén.', t: (p, a) => { const m = MODS.find(x => x.slug === 'szorzotabla'); return !!m && m.levels.every((_, i) => starsOf(((a[m.slug] || {})[i]) || 0) === 3); } }
];
const medal = (g, on) => `<svg class="medal ${on ? 'on' : ''}" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 3h11l5 15H23zM46 3H35l-5 15h11z" class="mrib"/><circle cx="32" cy="38" r="22" class="mcir"/><text x="32" y="${g.length > 4 ? 42 : 44}" text-anchor="middle" class="mtxt" style="font-size:${g.length > 4 ? 12 : g.length > 2 ? 15 : 19}px">${g}</text></svg>`;
const FLAME = '<svg class="flame" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" fill="currentColor"/></svg>';

const S = { view: 'home', mod: null, lvl: 0, cur: null, i: 0, score: 0, input: '', done: false, ok: null, pick: null, hist: [], timer: null, sheet: [], run: 0, maxRun: 0, award: null, askReset: false, tm: false, tick: null, tEnd: 0, trec: null };
S.timed = !!getOpt().timed;
S.sb = null;
S.breakOn = getOpt().brk !== false;   // szünet-emlékeztető (alapból be)
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
const showIn = s => esc(s.replace('-', '−'));
const parseIn = s => (/^-?\d+(,\d*)?$/.test(s) ? parseFloat(s.replace(',', '.')) : null);

/* ---------- Kérdések ---------- */
function newQ(seen = [], lv = S.lvl) {
  S.fill = [];
  if (S.hiba) return Object.assign({}, S.pool[S.i]);
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
  return `<a class="pstrip" href="${href('profil')}" aria-label="Haladásom és jelvények"><div class="pcell c1"><span class="lab">${l}. szint</span><b class="${titleOf(l).length > 11 ? 'lg' : ''}"><span class="ico" aria-hidden="true">⭐</span><span class="tt">${titleOf(l)}</span></b><div class="pbar"><i style="width:${pc}%"></i></div><small>${fmt(p.pts)} pont, még ${fmt(b - p.pts)} a következő szintig</small></div><div class="pcell c2"><span class="lab">Sorozat</span><b class="${cs ? 'hot' : ''}">${FLAME}${cs} nap</b><small>${cs ? 'Gyakorolj ma is!' : 'Kezdj új sorozatot!'}</small></div><div class="pcell c3"><span class="lab">Mai cél</span><b>${Math.min(day, DAILY_GOAL)}/${DAILY_GOAL}</b><div class="pbar"><i style="width:${Math.min(1, day / DAILY_GOAL) * 100}%"></i></div><small>helyes válasz ma</small></div><div class="pcell c4"><span class="lab">Jelvények</span><b><span class="ico" aria-hidden="true">🏅</span>${bc}/${BADGES.length}</b><small>Megnézem →</small></div></a>`;
}
function gradePicker() {
  const g = getP().grade, chip = (v, t) => `<button class="gchip" data-act="grade" data-g="${v}" aria-pressed="${g === v}">${t}</button>`;
  return `<div class="gpick" role="group" aria-label="Évfolyam"><span class="gl">Hányadikos vagy?</span><div class="gchips">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => chip(n, n + '.')).join('')}${chip(0, 'Mind')}</div></div>`;
}
const NEW_MODS = new Set(['beturako']);
const card = m => `<a class="card" data-h="${m.hue}" href="${href(m.slug)}">${NEW_MODS.has(m.slug) ? '<span class="newtag">Új!</span>' : ''}<div class="tile">${glyph(m)}</div><h3>${m.short}</h3><div class="meta"><span>${gradeTxt(m)}</span>${modStars(m) ? starHTML(modStars(m)) : `<span>${m.levels.length} szint</span>`}</div></a>`;
const SKINS = [['fuzet', 'Füzet', '#2a64d0', '#e2ecff'], ['erdo', 'Erdő', '#2d7a3e', '#dff2dc'], ['naplemente', 'Naplemente', '#b84d00', '#ffe6d2'], ['ur', 'Űr', '#6a3fd0', '#e8e0ff'], ['cukorka', 'Cukorka', '#c2286f', '#ffe0ee']];
const curSkin = () => { const k = (PR.list.find(x => x.id === PR.cur) || {}).skin; return SKINS.some(x => x[0] === k) ? k : 'fuzet'; };
const applySkin = () => { const k = curSkin(), r = document.documentElement; if (k === 'fuzet') r.removeAttribute('data-skin'); else r.setAttribute('data-skin', k); };
const skinBar = () => `<div class="skins" role="group" aria-label="Színtéma"><span class="lab">Színek:</span>${SKINS.map(([id, n, c1, c2]) => `<button class="sk" style="--c1:${c1};--c2:${c2}" data-act="skin" data-id="${id}" aria-pressed="${id === curSkin()}" aria-label="${n} téma" title="${n}"></button>`).join('')}<span class="skname">${SKINS.find(x => x[0] === curSkin())[1]}</span></div>`;
const cleanName = v => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 16);
const GICON = { kepes: '🖼️', szamolas: '🔢', szamok: '➗', meres: '⏰', forma: '📐', nyelv: '✏️', termeszet: '🌿', kemia: '⚗️' };
const settingsBox = () => { const open = S.setOpen || S.addP, nm = (PR.list.find(x => x.id === PR.cur) || {}).name || 'Játékos'; return `<div class="hcta"><a class="bigcta" href="#gyakorlok" data-act="go">▶ Gyakorlás indítása</a><button class="ghost" data-act="settings" aria-expanded="${open}" aria-controls="setpanel">⚙ Beállítások</button><button class="ghost" data-act="settings" aria-expanded="${open}" aria-controls="setpanel">👤 ${esc(nm)} ▾</button></div>${open ? `<div class="setpanel" id="setpanel">${playerBar(true)}${skinBar()}</div>` : ''}`; };
const playerBar = home => {
  if (!home && PR.list.length < 2) return '';
  const chips = PR.list.map(x => `<button class="chip ${x.id === PR.cur ? 'on' : ''}" data-act="who" data-id="${x.id}" aria-pressed="${x.id === PR.cur}">${esc(x.name)}</button>`).join('');
  const add = !home || PR.list.length >= MAX_PLAYERS ? '' : S.addP
    ? `<span class="padd"><input id="newp" class="tin" maxlength="16" placeholder="Név, pl. Anna" aria-label="Az új játékos neve" autocomplete="off"><button class="btn sm" data-act="addp">Hozzáadás</button><button class="btn sm sec" data-act="addcancel">Mégse</button></span>`
    : '<button class="chip add" data-act="addopen">+ Új játékos</button>';
  const tip = home && PR.list.length < 2 && !S.addP ? '<small class="ptip">Többen gyakoroltok ezen az eszközön? Mindenkinek külön pontja és jelvénye lehet.</small>' : '';
  return `<div class="pl" role="group" aria-label="Ki gyakorol?"><span class="lab">Ki gyakorol?</span>${chips}${add}${tip}</div>`;
};
function homeView() {
  const g = getP().grade, list = g ? MODS.filter(m => m.grades[0] <= g && g <= m.grades[1]) : MODS;
  const groups = GROUPS.map(gr => { const ms = list.filter(m => m.group === gr.id); return ms.length ? `<section class="grp"><h2><i class="gico" aria-hidden="true">${GICON[gr.id] || '📘'}</i>${gr.name}</h2><div class="cards">${ms.map(card).join('')}</div></section>` : ''; }).join('');
  const nm = getMiss().length, missBox = nm ? `<div class="missbox"><div><b>Hibáim gyakorlása</b><div class="st">${nm} feladat vár javításra. Ha jól válaszolsz, kikerül a listából.</div></div><button class="btn sm" data-act="miss">Gyakorlom</button></div>` : '';
  const note = g ? `<p class="gnote">Csak a(z) ${g}. osztályosoknak való gyakorlókat látod.${g === 1 ? ' Elsősöknek: a „Képes feladatok” és a számolós gyakorlók olvasás nélkül is mennek, a szavas feladatokat a szülő vagy egy idősebb testvér felolvashatja.' : ''} <button class="linkbtn" data-act="grade" data-g="0">Mutasd az összeset</button></p>` : '';
  return `<div class="hero"><div class="hero2"><div><h1>Gyakorolj <em>játékosan!</em> <span class="h1sub">Ingyenes gyakorló általános iskolásoknak: matek, helyesírás, környezetismeret és kémia 1–8. osztályig</span></h1><p>Szorzótábla, törtek, százalék, egyenletek, helyesírás, óra, pénz, geometria, állatok, növények és még sok más. Gyerekeknek, szülőknek és tanároknak, regisztráció nélkül, telefonon, tableten és számítógépen is.</p>${settingsBox()}</div><div class="heroart" aria-hidden="true"><span class="hfl f1">+</span><span class="hfl f2">÷</span><span class="hfl f3">ly</span><span class="hfl f4">%</span><div class="hq"><small>Mennyi?</small><b>6 × 7</b><div class="ha"><i>36</i><i class="ok">42 ✓</i><i>48</i></div></div></div></div></div>${pstrip()}${missBox}${gradePicker()}${note}<div id="gyakorlok">${groups}</div>${homeLinks()}`;
}

function fbBox(label) {
  const mt = (k, body) => `mailto:info@kochdigitalstudio.hu?subject=${encodeURIComponent('Iskolai Gyakorló visszajelzés – ' + k + ' – ' + label)}&body=${encodeURIComponent(body)}`;
  const tail = '\n\n\n(Kérjük, ne írj le a gyerek nevét vagy más személyes adatot.)';
  return `<section class="fb"><h2>Hasznos volt ez az oldal?</h2><p>Írd meg, mi segített, mi hiányzik, vagy hol találtál hibát. Így fejlődik az oldal.</p><p class="fbb"><a class="btn sm" href="${mt('hasznos', 'Mi volt hasznos?' + tail)}">Hasznos volt</a><a class="btn sm sec" href="${mt('javaslat', 'Mi nem volt jó, mi hiányzik, vagy hol találtál hibát?' + tail)}">Hibát találtam / hiányzik valami</a></p></section>`;
}

function homeLinks() {
  if (!PATHMODE || !XL.g) return '';
  const a = (u, t, full) => `<a href="${u}" title="${full}">${t}</a>`;
  const T = i => (i < 4 ? 'környezetismeret' : i < 6 ? 'természetismeret' : 'kémia'), GC = ['#e5546a', '#f08a24', '#d09a00', '#2fa36b', '#2a9fc9', '#2a64d0', '#6b4fd0', '#b04ab0'];
  const rows = XL.g.m.map((u, i) => `<div class="gm" style="--gc:${GC[i]}"><b class="gmn" aria-hidden="true">${i + 1}.</b><div class="gml">${a(u, 'Matek', `${i + 1}. osztályos matek`)}${XL.g.n[i] ? a(XL.g.n[i], 'Helyesírás', `${i + 1}. osztályos helyesírás`) : ''}${XL.g.t[i] ? a(XL.g.t[i], T(i)[0].toUpperCase() + T(i).slice(1), `${i + 1}. osztályos ${T(i)}`) : ''}</div></div>`).join('');
  return `<section class="grp"><h2><i class="gico" aria-hidden="true">🎒</i>Gyakorlók évfolyamonként</h2><nav class="gmatrix" aria-label="Évfolyamok">${rows}</nav></section>`;
}

const readNote = m => (m.grades[0] <= 1 && (m.group === 'nyelv' || m.group === 'termeszet' || m.slug === 'szoveges-feladatok') ? '<p class="rnote">Elsősöknek: ez a gyakorló olvasást igényel, ezért a szülő vagy egy idősebb testvér felolvashatja a kérdéseket.</p>' : '');
function setupView() {
  const m = S.mod;
  const tb = (store.get()._t || {})[m.slug] || {};
  const LC = ['var(--green)', 'var(--blue)', 'var(--red)', 'var(--amber)'];
  const pg = getP().grade, band = pg && pg >= m.grades[0] && pg <= m.grades[1] && m.levels.length > 1 ? gradeLv(m, pg) : null, only = !!band && !S.allLv;
  const rows = m.levels.map((L, i) => { if (only && (i < band[0] || i > band[1])) return ''; const b = bestOf(m.slug, i), r = tb[i] || 0, done = starsOf(b) === 3;
    const st = S.timed ? (r ? `Időrekordod: ${r} helyes válasz ${TIME_SEC} másodperc alatt` : 'Még nem próbáltad időre') : (b ? `${starHTML(starsOf(b))} · ${b}/${N} helyes` : 'Még nem próbáltad');
    const chip = S.timed ? '' : done ? '<span class="lchip done">✓ Kész</span>' : b ? '<span class="lchip">Folytasd!</span>' : '';
    return `<div class="lv" style="--c:${LC[i % 4]}"><span class="num" aria-hidden="true">${i + 1}</span><div><div class="nm">${L.name}${chip}</div><div class="st">${st}</div></div><div class="acts"><button class="btn pri" data-act="start" data-l="${i}">${S.timed ? '▶ Indítás ⏱' : done ? '▶ Újra' : '▶ Gyakorlás'}</button><button class="btn sec sm" data-act="sheet" data-l="${i}">🖨 Munkalap</button></div></div>`; }).join('');
  const rel = MODS.filter(x => x.group === m.group && x !== m).concat(MODS.filter(x => x.group !== m.group)).slice(0, 5).map(x => `<a href="${href(x.slug)}">${x.short}</a>`).join('');
  const roller = m.extra === 'dice' ? `<div class="roller"><button class="btn sm" data-act="roll" data-n="2">Dobj a kockákkal!</button><div class="dice" id="rollout" aria-live="polite">${dieSVG(4)}${dieSVG(2)}</div><div id="rollsum" class="sub"></div></div>` : '';
  return `<div class="setup"><a class="crumb" href="${href('')}">← Minden gyakorló</a><h1>${m.title}</h1><p class="lead">${m.desc}</p>${readNote(m)}<p class="grline">Ajánlott évfolyam: ${gradeTxt(m)}</p>${roller}<div class="tmode"><span class="tico" aria-hidden="true">⏱</span><div><b>Időre megy</b><small>${TIME_SEC} másodperc alatt annyi feladatot oldj meg, amennyit csak tudsz. Bármikor kikapcsolhatod.</small></div><button class="sw" role="switch" aria-checked="${S.timed}" aria-label="Időre menő mód" data-act="timed"><i></i></button></div><h2 class="sr">Szintek</h2>${band ? `<p class="gnote">${only ? `Csak a(z) ${pg}. osztályos tananyaghoz tartozó szinteket látod.` : `Az összes szintet látod.`} <button class="linkbtn" data-act="alllv">${only ? 'Mutasd az összes szintet' : `Csak a(z) ${pg}. osztályos szintek`}</button></p>` : ''}<div class="levels">${rows}</div>${m.levels.length > 1 ? `<div class="lv mixrow"><div><div class="nm">Vegyes munkalap</div><div class="st">Minden szintről, könnyebbtől a nehezebbig. A darabszámot a munkalapon állíthatod (10, 20 vagy 30).</div></div><div class="acts"><button class="btn sm sec" data-act="sheet" data-l="-1">Vegyes munkalap</button></div></div>` : ''}<section class="about"><h2>Mire jó ez a gyakorló?</h2><p>${m.seo}</p></section>${PATHMODE && XL.mod && XL.mod[m.slug] ? `<section class="about"><h2>Kapcsolódó oldalak</h2><ul class="xl">${XL.mod[m.slug].map(x => `<li><a href="${x[0]}">${x[1]}</a></li>`).join('')}</ul></section>` : ''}${PATHMODE ? fbBox(m.title) : ''}<nav class="rel" aria-label="További gyakorlók">${rel}</nav></div>`;
}

const BKSP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M13 9l4 6M17 9l-4 6"/></svg>';
function wordInner() {
  const q = S.cur, fill = S.fill || [], cls = S.done ? (S.ok ? 'ok' : 'bad') : '';
  const slots = q.tokens.map((t, i) => { const h = q.hidden.indexOf(i); if (h < 0) return `<span class="wl">${esc(t)}</span>`; const v = fill[h] !== undefined ? q.bank[fill[h]] : ''; return `<span class="wl slot${v ? ' f' : ''}${!S.done && h === fill.length ? ' cur' : ''}">${esc(v)}</span>`; }).join('');
  const bank = S.done ? '' : `<div class="lbank" role="group" aria-label="Betűk">${q.bank.map((l, i) => `<button class="key lt" data-act="lt" data-i="${i}" ${fill.includes(i) ? 'disabled' : ''} aria-label="${esc(l)}">${esc(l)}</button>`).join('')}</div><div class="lctrl"><button class="key" data-act="ltdel" aria-label="Törlés">${BKSP}</button><button class="key go" data-act="ltok" ${fill.length === q.hidden.length ? '' : 'disabled'}>Kész</button></div>`;
  return `<div class="wbox ${cls}" id="abox" aria-live="polite">${slots}</div>${bank}`;
}
const wordRefresh = () => { const w = $('#wordarea'); if (w) w.innerHTML = wordInner(); };
function answerArea() {
  const q = S.cur;
  if (q.kind === 'word') return `<div id="wordarea">${wordInner()}</div>`;
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
  const last = S.i + 1 >= T();
  return `<div class="fb ${S.ok ? 'ok' : 'bad'}" role="status">${S.ok ? '<span class="burst" aria-hidden="true"><i>🎉</i><i>✨</i><i>⭐</i><i>🎊</i></span>' : ''}<strong>${S.ok ? '🌟 ' : ''}${S.ok ? good : 'Nem egészen.'}</strong><p>${S.ok ? '' : `A helyes válasz: <b>${ansText(q)}</b>. `}${q.hint || ''}</p><button class="btn" data-act="next" id="nextbtn">${last ? 'Eredmény' : 'Tovább'}</button></div>`;
}
function quizView() {
  if (S.tm) { const left = Math.max(0, Math.ceil((S.tEnd - Date.now()) / 1000)); return `<div class="qbar${left <= 10 ? ' low' : ''}"><button data-act="quit" aria-label="Kilépés a gyakorlásból">✕ Kilépés</button><span class="tleft">⏱ <b id="tleft">${left} mp</b></span><span class="stars">★ ${S.score}</span></div><div class="prog tprog" aria-hidden="true"><i id="tbar" style="width:${left / TIME_SEC * 100}%"></i></div><div class="qwrap"><div class="qcard">${S.cur.q}</div><div>${answerArea()}${feedback()}</div></div>`; }
  return `<div class="qbar"><button data-act="quit" aria-label="Kilépés a gyakorlásból">✕ Kilépés</button><span>${S.i + 1} / ${T()}</span>${S.run >= 3 ? `<span class="runb">🔥 ${S.run} egymás után!</span>` : ''}<span class="stars">★ ${S.score}</span></div><div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="${T()}" aria-valuenow="${S.i + (S.done ? 1 : 0)}"><i style="width:${(S.i + (S.done ? 1 : 0)) / T() * 100}%"></i></div><div class="qwrap"><div class="qcard">${S.cur.q}</div><div>${answerArea()}${feedback()}</div></div>`;
}
function timedResultView() {
  const tot = S.hist.length, wrong = S.hist.filter(h => !h.ok), A = S.award, R = S.trec || {}, acc = tot ? Math.round(S.score / tot * 100) : 0;
  const msg = R.rec ? 'Új időrekord!' : S.score >= 15 ? 'Nagyon gyors vagy!' : S.score >= 8 ? 'Szép tempó!' : 'Jó kezdet, még gyorsabb is lehetsz!';
  const award = A ? `<div class="award"><div class="apts">+${A.pts} pont</div><ul>${A.parts.map(([t, v]) => `<li><span>${t}</span><b>+${v}</b></li>`).join('')}</ul>${A.up ? `<div class="lvup">Szintet léptél: ${A.lvl}. szint, ${titleOf(A.lvl)}!</div>` : ''}<div class="astat"><span class="hot">${FLAME}${A.streak} napos sorozat</span><span>Mai cél: ${Math.min(A.day, DAILY_GOAL)}/${DAILY_GOAL}</span></div></div>${A.nb.length ? `<h2 class="nbh">Új jelvény${A.nb.length > 1 ? 'ek' : ''}!</h2><div class="nbadges">${A.nb.map(b => `<div class="nb">${medal(b.g, true)}<b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div>` : ''}` : '';
  return `<div class="result${R.rec ? ' perfect' : ''}">${R.rec ? confetti() : ''}<h1>${msg}</h1><div class="tbig"><b>${S.score}</b><span>helyes válasz ${TIME_SEC} másodperc alatt</span></div><div class="score">${tot} feladatot oldottál meg, pontosság: ${acc}%${R.prev && !R.rec ? `. Az időrekordod: ${R.prev}` : ''}</div>${award}<div class="ractions"><button class="btn" data-act="again">Új kör időre</button><button class="btn sec" data-act="quit">Másik szint</button><a class="btn sec" href="${href('')}">Főoldal</a><button class="btn sec" data-act="share">Küldd el egy barátodnak</button></div><p id="shmsg" class="bmsg" role="status"></p>${wrong.length ? `<h2 style="margin-bottom:10px">Ezeket nézzük meg újra</h2><div class="wrongs">${wrong.slice(0, 12).map(h => `<div>${h.q.q}<div class="ans">Helyes válasz: ${ansText(h.q)}</div></div>`).join('')}</div>` : ''}</div>`;
}
const CONF = ['#2a64d0', '#cf3a47', '#16805a', '#f1b62e', '#7b5cd6', '#e8743b'];
const confetti = () => `<div class="confetti" aria-hidden="true">${Array.from({ length: 46 }, (_, i) => `<i style="--x:${rnd(0, 100)}%;--d:${(Math.random() * 1.6).toFixed(2)}s;--t:${(2.6 + Math.random() * 2).toFixed(2)}s;--r:${rnd(-360, 360)}deg;--c:${CONF[i % CONF.length]};--w:${rnd(7, 12)}px"></i>`).join('')}</div>`;
function resultView() {
  if (S.tm) return timedResultView();
  const tot = T(), st = starsOf(Math.round(S.score / tot * 10)), wrong = S.hist.filter(h => !h.ok), A = S.award, perfect = S.score === tot && tot >= 5;
  const msg = perfect ? 'Hibátlan! Tökéletes kör!' : st === 3 ? 'Kiváló munka!' : st === 2 ? 'Nagyon jó!' : st === 1 ? 'Jó kezdet!' : 'Ne add fel, gyakorolj még!';
  const award = A ? `<div class="award"><div class="apts">+${A.pts} pont</div><ul>${A.parts.map(([t, v]) => `<li><span>${t}</span><b>+${v}</b></li>`).join('')}</ul>${A.up ? `<div class="lvup">Szintet léptél: ${A.lvl}. szint, ${titleOf(A.lvl)}!</div>` : ''}<div class="astat"><span class="hot">${FLAME}${A.streak} napos sorozat</span><span>Mai cél: ${Math.min(A.day, DAILY_GOAL)}/${DAILY_GOAL}</span></div></div>${A.nb.length ? `<h2 class="nbh">Új jelvény${A.nb.length > 1 ? 'ek' : ''}!</h2><div class="nbadges">${A.nb.map(b => `<div class="nb">${medal(b.g, true)}<b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div>` : ''}` : '';
  return `<div class="result${perfect ? ' perfect' : ''}">${perfect ? confetti() : ''}<h1>${msg}</h1><div class="bigstars" aria-label="${st} csillag a 3-ból">${[0, 1, 2].map(i => `<span class="${i < st ? '' : 'off'}">★</span>`).join('')}</div><div class="score">${S.score} helyes válasz a ${tot}-ből</div>${award}<div class="ractions"><button class="btn" data-act="again">${S.hiba ? 'Még egy kör a hibákból' : 'Új kör'}</button><button class="btn sec" data-act="quit">${S.hiba ? 'Vissza' : 'Másik szint'}</button><a class="btn sec" href="${href('')}">Főoldal</a><button class="btn sec" data-act="share">Küldd el egy barátodnak</button></div><p id="shmsg" class="bmsg" role="status"></p>${wrong.length ? `<h2 style="margin-bottom:10px">Ezeket nézzük meg újra</h2><div class="wrongs">${wrong.map(h => `<div>${h.q.q}<div class="ans">Helyes válasz: ${ansText(h.q)}</div></div>`).join('')}</div>` : ''}</div>`;
}
function sheetView() {
  const m = S.mod, L = m.levels[Math.max(0, S.lvl)];
  const items = S.sheet.map(q => `<li><div class="sq">${q.q}</div>${q.kind === 'word' ? `<div class="sline wmask"><b>${esc(q.mask)}</b> <span class="blank long"></span></div>` : q.kind === 'num' ? `<div class="sline">Válasz: <span class="blank"></span> ${q.unit || ''}</div>` : `<div class="sopts">${q.choices.map((c, i) => `<span>${'ABCD'[i]}) ${c.h}</span>`).join('')}</div>`}</li>`).join('');
  return `<div class="stool noprint"><a class="btn sec sm" href="#" data-act="quit">← Vissza</a><button class="btn sm" data-act="print">Nyomtatás</button><button class="btn sec sm" data-act="newsheet">Új munkalap</button><span class="cnt">Feladatok: ${[10, 20, 30].map(n => `<button class="btn sm ${(S.sheetN || SHEET_N) === n ? '' : 'sec'}" data-act="sheetn" data-n="${n}" aria-pressed="${(S.sheetN || SHEET_N) === n}">${n}</button>`).join('')}</span></div><article class="sheet"><div class="shead"><h1>${m.title}</h1><div>Név: ____________________ Dátum: ____________</div><div class="lvn">${S.mix ? 'Vegyes szintek: könnyebbtől a nehezebbig' : `${S.lvl + 1}. szint: ${L.name}`}</div></div><ol class="slist">${items}</ol><div class="sfoot">Készült az ${SITE_HOST} oldalon: ingyenes gyakorlók és nyomtatható munkalapok 1–8. osztályosoknak.</div></article>`;
}
function playersBox() {
  const full = PR.list.length >= MAX_PLAYERS, many = PR.list.length > 1;
  const del = !many ? '' : S.askDel ? `<p class="warn">Biztosan törlöd ${esc(curName())} játékost és az összes eredményét?</p><div class="ractions left"><button class="btn sm" data-act="delyes">Igen, törlés</button><button class="btn sm sec" data-act="delno">Mégsem</button></div>` : '<button class="btn sec sm" data-act="delask">Ennek a játékosnak a törlése</button>';
  return `<h2 class="sech">Játékosok</h2><p>Ha többen használjátok ugyanezt az eszközt, mindenkinek külön pontja, jelvénye és hibalistája lehet. Nem kell hozzá fiók, minden csak a böngészőben marad.</p><div class="prow"><label for="pname" class="lab">Az aktuális játékos neve</label><input id="pname" class="tin" maxlength="16" value="${esc(curName())}" autocomplete="off"><button class="btn sm sec" data-act="rename">Átnevezés</button></div>${full ? `<p class="lead">Legfeljebb ${MAX_PLAYERS} játékos lehet.</p>` : '<div class="prow"><label for="newp" class="lab">Új játékos neve</label><input id="newp" class="tin" maxlength="16" placeholder="pl. Anna" autocomplete="off"><button class="btn sm" data-act="addp">Hozzáadás</button></div>'}${del}`;
}
function profileView() {
  const p = getP(), l = levelOf(p.pts), a = lvlStart(l), b = lvlStart(l + 1), pc = Math.round((p.pts - a) / (b - a) * 100), day = p.days[todayStr()] || 0;
  const stat = (v, t) => `<div class="stat"><b>${v}</b><span>${t}</span></div>`;
  const badges = BADGES.map(x => `<div class="bdg ${p.badges[x.id] ? 'got' : ''}">${medal(x.g, !!p.badges[x.id])}<b>${x.name}</b><small>${x.desc}</small>${p.badges[x.id] ? `<em>${p.badges[x.id]}</em>` : ''}</div>`).join('');
  const reset = S.askReset ? `<p class="warn">Biztosan törlöd ${PR.list.length > 1 ? esc(curName()) + ' ' : ''}az összes pontját, jelvényét és eredményét erről az eszközről?</p><div class="ractions"><button class="btn" data-act="resetyes">Igen, törlés</button><button class="btn sec" data-act="resetno">Mégsem</button></div>` : `<button class="btn sec sm" data-act="resetask">Minden adatom törlése</button>`;
  return `<div class="setup"><a class="crumb" href="${href('')}">← Minden gyakorló</a><h1>Haladásom és jelvények${PR.list.length > 1 ? ': ' + esc(curName()) : ''}</h1>${playerBar()}<p class="lead">Az eredményeid csak ezen az eszközön, a böngészőben tárolódnak. Nincs fiók és nincs regisztráció.</p><div class="pbig"><div><span class="lab">${l}. szint</span><b>${titleOf(l)}</b></div><div class="pbar"><i style="width:${pc}%"></i></div><small>${fmt(p.pts)} pont, még ${fmt(b - p.pts)} a következő szintig</small></div><div class="stats">${stat(fmt(p.pts), 'pont')}${stat(fmt(p.ok), 'helyes válasz')}${stat(p.rounds, 'befejezett kör')}${stat(p.perf, 'hibátlan kör')}${stat(curStreak(p), 'napos sorozat')}${stat(p.best, 'legjobb sorozat')}${stat(Math.min(day, DAILY_GOAL) + '/' + DAILY_GOAL, 'mai cél')}${stat(Object.keys(p.played).length + '/' + MODS.length, 'kipróbált gyakorló')}</div><h2 class="sech">Jelvények (${Object.keys(p.badges).length}/${BADGES.length})</h2><div class="bgrid">${badges}</div><div class="tmode"><div><b>Szünet-emlékeztető</b><small>Ha összesen ${BREAK_MIN} percet gyakoroltál megszakítás nélkül, egy kedves üzenet jelzi, hogy ideje pihenni.</small></div><button class="sw" role="switch" aria-checked="${S.breakOn}" aria-label="Szünet-emlékeztető" data-act="brk"><i></i></button></div>${playersBox()}<h2 class="sech">Haladás átvitele másik eszközre</h2><p>Készíts egy kódot, és másold be a másik eszközön ugyanide.${PR.list.length > 1 ? ` A kód csak ${esc(curName())} haladását tartalmazza.` : ''} A betöltés felülírja az ottani adatokat.</p><textarea id="code" class="code" rows="4" spellcheck="false" aria-label="Mentési kód" placeholder="Ide kerül a kód, vagy ide illeszd be a betöltéshez"></textarea><div class="ractions left"><button class="btn sm" data-act="mkcode">Kód készítése</button><button class="btn sm sec" data-act="copycode">Másolás</button><button class="btn sm sec" data-act="loadcode">Betöltés</button></div><p id="bmsg" class="bmsg" role="status"></p><div class="resetbox">${reset}</div>${installBox()}</div>`;
}

const modTitle = m => { const [a, z] = m.grades || [0, 0], t = a ? `${m.title} ${a === z ? a : a + '–' + z}. osztály – ${SITE_NAME}` : ''; return t && t.length <= 62 ? t : `${m.title} – ${SITE_NAME}`; };
function render() {
  applySkin();
  if (S.view === 'wspage') return;
  const app = $('#app');
  app.innerHTML = S.view === 'home' ? homeView() : S.view === 'setup' ? setupView() : S.view === 'quiz' ? quizView() : S.view === 'result' ? resultView() : S.view === 'profile' ? profileView() : S.view === 'sheets' ? builderView() : S.view === 'sheetx' ? sheetxView() : sheetView();
  if (S.addP && S.view === 'home') { const n = $('#newp'); if (n) n.focus({ preventScroll: true }); }
  if (S.view === 'quiz' && S.done && !S.ok) { const b = $('#nextbtn'); if (b) b.focus({ preventScroll: true }); }
  document.title = S.view === 'sheets' || S.view === 'sheetx' ? `Nyomtatható munkalap-készítő – ${SITE_NAME}` : S.view === 'profile' ? `Haladásom és jelvények – ${SITE_NAME}` : S.mod && S.view !== 'home' ? modTitle(S.mod) : `Ingyenes matek, helyesírás gyakorló általános iskolásoknak – ${SITE_NAME}`;
}

/* ---------- Működés ---------- */
function startMiss() {
  const pool = shuffle(getMiss()).slice(0, N); if (!pool.length) return;
  S.mod = { slug: 'hibaim', title: 'Hibáim gyakorlása', levels: [{ name: 'Hibás feladatok' }] }; S.pool = pool; S.hiba = true;
  clearTimeout(S.timer); clearInterval(S.tick); S.tm = false;
  Object.assign(S, { view: 'quiz', lvl: 0, i: 0, score: 0, input: '', done: false, ok: null, pick: null, hist: [], run: 0, maxRun: 0, award: null });
  S.cur = newQ([]); render(); window.scrollTo(0, 0);
}
function startQuiz(l) {
  clearTimeout(S.timer); clearInterval(S.tick); S.hiba = false; S.tm = S.timed;
  Object.assign(S, { view: 'quiz', lvl: l, i: 0, score: 0, input: '', done: false, ok: null, pick: null, hist: [], run: 0, maxRun: 0, award: null, trec: null });
  S.cur = newQ([]);
  if (S.tm) { S.tEnd = Date.now() + TIME_SEC * 1000; S.tick = setInterval(timeTick, 250); }
  render(); window.scrollTo(0, 0);
}
function timeTick() {
  const left = Math.max(0, S.tEnd - Date.now());
  const a = $('#tleft'), b = $('#tbar'), q = $('.qbar');
  if (a) a.textContent = Math.ceil(left / 1000) + ' mp';
  if (b) b.style.width = (left / (TIME_SEC * 1000) * 100) + '%';
  if (q) q.classList.toggle('low', left <= 10000);
  if (left <= 0) endTimed();
}
function endTimed() {
  clearInterval(S.tick); clearTimeout(S.timer);
  finishRound(); S.view = 'result'; render(); window.scrollTo(0, 0);
}
function answer(val) {
  if (S.done) return; const q = S.cur; let ok;
  if (q.kind === 'word') { if ((S.fill || []).length < q.hidden.length) return; ok = q.tokens.map((t, i) => { const h = q.hidden.indexOf(i); return h < 0 ? t : q.bank[S.fill[h]]; }).join('') === q.word; }
  else if (q.kind === 'num') { const v = parseIn(S.input); if (v === null) return; ok = Math.abs(v - q.ans) < 1e-6; } else { S.pick = val; ok = val === q.ans; }
  S.done = true; S.ok = ok; if (ok) { S.score++; S.run++; S.maxRun = Math.max(S.maxRun, S.run); } else S.run = 0;
  S.hist.push({ q, ok });
  const miss = getMiss().filter(x => missKey(x) !== missKey(q));
  if (!ok) miss.push(q); else if (!S.hiba) { /* jó válasz: nincs teendő */ }
  setMiss(miss); render();
  if (S.tm) S.timer = setTimeout(next, ok ? 350 : 1500);
  else if (ok) S.timer = setTimeout(next, 1100);
}
function finishRound() {
  const all = store.get(), p = Object.assign(blankP(), all._p || {}), slug = S.mod.slug, today = todayStr();
  const tm = S.tm; S.trec = null;
  if (tm) { all._t = all._t || {}; all._t[slug] = all._t[slug] || {}; const prev = all._t[slug][S.lvl] || 0, rec = S.score > prev; if (rec) all._t[slug][S.lvl] = S.score; S.trec = { prev, rec: rec && prev > 0 }; p.tbest = Math.max(p.tbest || 0, S.score); }
  else if (!S.hiba) { all[slug] = all[slug] || {}; if (S.score > (all[slug][S.lvl] || 0)) all[slug][S.lvl] = S.score; }
  const lvBefore = levelOf(p.pts), dayBefore = p.days[today] || 0, st = S.hiba || tm ? 0 : starsOf(S.score);
  const parts = [[`${S.score} helyes válasz`, S.score * (tm ? 5 : 10)]];
  if (tm && S.trec.rec) parts.push(['Új időrekord', 20]);
  if (!S.hiba && !tm && S.score === 10) parts.push(['Hibátlan kör', 50]);
  if (st) parts.push([`${st} csillag`, st * 20]);
  if (S.maxRun >= 5) parts.push([`${S.maxRun} jó válasz egymás után`, 20]);
  p.ok += S.score; p.rounds++; if (!S.hiba && !tm && S.score === 10) p.perf++; if (!S.hiba) p.played[slug] = 1;
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
  if (!S.tm && S.i + 1 >= T()) { finishRound(); S.view = 'result'; render(); window.scrollTo(0, 0); return; }
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

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (S.view === 'home' || S.view === 'profile') render(); });
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
const installBox = () => (standalone ? '' : deferredInstall ? '<div class="resetbox"><b>Telepítés</b><p>Tedd az appot a telefonod vagy géped kezdőképernyőjére, internet nélkül is működik.</p><button class="btn sm" data-act="install">Telepítés</button></div>' : isIOS ? '<div class="resetbox"><b>Telepítés iPhone-ra, iPadre</b><p>Safariban koppints a Megosztás gombra, majd a „Kezdőképernyőhöz adás" menüpontra. Utána internet nélkül is működik.</p></div>' : '');
if (PATHMODE && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'start') startQuiz(+t.dataset.l);
  else if (a === 'sheet') makeSheet(+t.dataset.l);
  else if (a === 'key') keyPress(t.dataset.k);
  else if (a === 'opt') answer(t.dataset.v);
  else if (a === 'lt') { const q = S.cur, i = +t.dataset.i; if (!S.done && q && q.kind === 'word' && !S.fill.includes(i) && S.fill.length < q.hidden.length) { S.fill.push(i); wordRefresh(); } }
  else if (a === 'ltdel') { if (!S.done) { S.fill.pop(); wordRefresh(); } }
  else if (a === 'ltok') answer();
  else if (a === 'next') next();
  else if (a === 'again') (S.hiba ? startMiss() : startQuiz(S.lvl));
  else if (a === 'miss') startMiss();
  else if (a === 'install') { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; render(); } }
  else if (a === 'quit') { e.preventDefault(); clearTimeout(S.timer); clearInterval(S.tick); S.tm = false; if (S.hiba) { S.hiba = false; S.mod = null; S.view = 'home'; render(); window.scrollTo(0, 0); return; } S.view = 'setup'; render(); window.scrollTo(0, 0); }
  else if (a === 'timed') { S.timed = !S.timed; const o = getOpt(); o.timed = S.timed; setOpt(o); render(); const sw = $('.sw'); if (sw) sw.focus({ preventScroll: true }); }
  else if (a === 'brk') { S.breakOn = !S.breakOn; const o = getOpt(); o.brk = S.breakOn; setOpt(o); breakSecs = 0; hideBreak(); render(); const sw = $('.sw[data-act="brk"]'); if (sw) sw.focus({ preventScroll: true }); }
  else if (a === 'brkok') { hideBreak(); }
  else if (a === 'who') { PR.cur = t.dataset.id; setProfs(PR); S.askReset = S.askDel = false; render(); }
  else if (a === 'rename') { const n = cleanName($('#pname').value); if (n) { PR.list.find(x => x.id === PR.cur).name = n; setProfs(PR); render(); } }
  else if (a === 'skin') { PR.list.find(x => x.id === PR.cur).skin = t.dataset.id; setProfs(PR); render(); const b = $(`.sk[data-id="${t.dataset.id}"]`); if (b) b.focus({ preventScroll: true }); }
  else if (a === 'settings') { S.setOpen = !S.setOpen; if (!S.setOpen) S.addP = false; render(); const b = $('.ghost'); if (b) b.focus({ preventScroll: true }); }
  else if (a === 'go') { e.preventDefault(); const g = $('#gyakorlok'); if (g) g.scrollIntoView({ behavior: 'smooth' }); }
  else if (a === 'addopen') { S.addP = true; render(); }
  else if (a === 'addcancel') { S.addP = false; render(); }
  else if (a === 'addp') { const n = cleanName($('#newp').value); if (n && PR.list.length < MAX_PLAYERS) { const id = String(Math.max(...PR.list.map(x => +x.id)) + 1); PR.list.push({ id, name: n }); PR.cur = id; setProfs(PR); S.askReset = S.askDel = S.addP = false; render(); window.scrollTo(0, 0); } }
  else if (a === 'delask') { S.askDel = true; render(); }
  else if (a === 'delno') { S.askDel = false; render(); }
  else if (a === 'delyes') { try { localStorage.removeItem(LS + sfx()); localStorage.removeItem(MISS_KEY + sfx()); } catch (er) { /* nincs tárhely */ } PR.list = PR.list.filter(x => x.id !== PR.cur); PR.cur = PR.list[0].id; setProfs(PR); S.askDel = false; render(); }
  else if (a === 'share') {
    const m = S.mod, slug = m && m.slug !== 'hibaim' ? m.slug : '', url = new URL(href(slug), location.href).href, tot = S.tm ? S.hist.length : T();
    const text = S.hiba || S.score < 5 ? `${S.hiba ? 'Ingyenes matek és helyesírás gyakorló gyerekeknek' : m.title + ': ingyenes gyakorló gyerekeknek'}. Próbáld ki!` : S.tm ? `${S.score} helyes válasz 60 másodperc alatt: ${m.title}. Te hányat tudsz?` : `${S.score} helyes válasz a ${tot}-ből: ${m.title}. Próbáld ki te is!`;
    const done = t => { const el = $('#shmsg'); if (el) el.textContent = t; };
    if (navigator.share) navigator.share({ title: SITE_NAME, text, url }).catch(() => {});
    else { try { navigator.clipboard.writeText(`${text} ${url}`).then(() => done('A link kimásolva, már küldheted is.'), () => done(`Másold ki a linket: ${url}`)); } catch (er) { done(`Másold ki a linket: ${url}`); } }
  }
  else if (a === 'sbd') sbSetN(t.dataset.slug, ((S.sb.rows[t.dataset.slug] || {}).n || 0) + +t.dataset.d);
  else if (a === 'sbgrade') { S.sb.grade = +t.dataset.g; saveSB(); render(); }
  else if (a === 'sbfill') { const g = +t.dataset.g, ms = gradeMods(t.dataset.k, g); S.sb.rows = {}; ms.forEach(m => { S.sb.rows[m.slug] = { sel: 'g', n: 2 }; }); S.sb.grade = g; saveSB(); render(); }
  else if (a === 'sbpreset') { S.sb.rows = {}; SB_PRESETS[+t.dataset.i][1].forEach(([slug, n]) => { S.sb.rows[slug] = { sel: 'mix', n }; }); S.sb.grade = 0; saveSB(); render(); }
  else if (a === 'sbclear') { S.sb.rows = {}; saveSB(); render(); }
  else if (a === 'sbgen') { if (sbTotal()) sbGenerate(); }
  else if (a === 'sbregen') sbGenerate();
  else if (a === 'sbback') { S.view = 'sheets'; render(); window.scrollTo(0, 0); }
  else if (a === 'wsprint') window.print();
  else if (a === 'wsnew') wsRegen();
  else if (a === 'wsn') { S.ws.n = +t.dataset.n; document.querySelectorAll('[data-act="wsn"]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.n === S.ws.n))); wsRegen(); }
  else if (a === 'print') window.print();
  else if (a === 'newsheet') makeSheet(S.lvl);
  else if (a === 'sheetn') { S.sheetN = +t.dataset.n; makeSheet(S.lvl); }
  else if (a === 'roll') rollDice(+t.dataset.n);
  else if (a === 'alllv') { S.allLv = !S.allLv; render(); }
  else if (a === 'grade') { S.allLv = false; const all = store.get(); all._p = Object.assign(blankP(), all._p || {}); all._p.grade = +t.dataset.g; store.set(all); render(); }
  else if (a === 'mkcode') { $('#code').value = enc(store.get()); msg('A kód elkészült. Másold ki, és illeszd be a másik eszközön.'); }
  else if (a === 'copycode') { const c = $('#code'); if (!c.value) c.value = enc(store.get()); c.select(); try { navigator.clipboard.writeText(c.value).then(() => msg('Kimásolva.'), () => msg('Jelöld ki és másold ki a kódot kézzel.')); } catch (er) { msg('Jelöld ki és másold ki a kódot kézzel.'); } }
  else if (a === 'loadcode') { try { const o = dec($('#code').value); if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('rossz'); store.set(o); render(); msg('Betöltve.'); } catch (er) { msg('Ez a kód nem érvényes. Ellenőrizd, hogy a teljes kódot bemásoltad-e.'); } }
  else if (a === 'resetask') { S.askReset = true; render(); }
  else if (a === 'resetno') { S.askReset = false; render(); }
  else if (a === 'resetyes') { store.set({}); setMiss([]); S.askReset = false; render(); msg('Az adatok törölve.'); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.sb) {
    const k = t.dataset.sb;
    if (k === 'n') sbSetN(t.dataset.slug, +t.value);
    else if (k === 'sel') { const r = S.sb.rows[t.dataset.slug] = Object.assign({ sel: 'mix', n: 0 }, S.sb.rows[t.dataset.slug]); r.sel = t.value === 'mix' || t.value === 'g' ? t.value : +t.value; saveSB(); }
    else if (k === 'title') { S.sb.title = t.value; saveSB(); }
    else if (k === 'keyp') { S.sb.key = t.checked; saveSB(); const el = $('#sbkey'); if (el) el.classList.toggle('noprint', !t.checked); }
    else { S.sb[k] = t.checked; saveSB(); }
  } else if (t.dataset.ws === 'band' || t.dataset.ws === 'ttype') { S.ws[t.dataset.ws] = t.value; wsRegen(); }
  else if (t.dataset.ws === 'sel') { S.ws.sel = t.value === 'mix' ? 'mix' : +t.value; wsRegen(); }
  else if (t.dataset.ws === 'key') { const el = $('#wskey'); if (el) el.classList.toggle('noprint', !t.checked); }
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset.sb === 'n') { const v = Math.max(0, Math.min(SB_ROW_MAX, +t.value || 0)); const r = S.sb.rows[t.dataset.slug] = Object.assign({ sel: 'mix', n: 0 }, S.sb.rows[t.dataset.slug]); const room = SB_MAX - (sbTotal() - (r.n || 0)); r.n = Math.min(v, room); saveSB(); sbSync(); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.target.id === 'newp' || e.target.id === 'pname')) { e.preventDefault(); const b = $(`[data-act="${e.target.id === 'newp' ? 'addp' : 'rename'}"]`); if (b) b.click(); return; }
  if (e.key === 'Escape' && e.target.id === 'newp' && S.addP) { S.addP = false; render(); return; }
  if (S.view !== 'quiz' || e.ctrlKey || e.metaKey || e.altKey) return;
  const q = S.cur;
  if (e.key === 'Enter') { e.preventDefault(); if (S.done) next(); else if (q.kind === 'num' || q.kind === 'word') answer(); return; }
  if (S.done) return;
  if (q.kind === 'word') {
    if (e.key === 'Backspace') { e.preventDefault(); S.fill.pop(); wordRefresh(); }
    else if (e.key.length === 1 && S.fill.length < q.hidden.length) { const i = q.bank.findIndex((l, k) => l === e.key.toLowerCase() && !S.fill.includes(k)); if (i >= 0) { S.fill.push(i); wordRefresh(); } }
    return;
  }
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

/* ---------- Szünet-emlékeztető: csak a ténylegesen gyakorlással töltött időt számolja, semmit nem tárol ---------- */
let breakSecs = 0, lastAct = Date.now();
const hideBreak = () => { const b = $('#brkbox'); if (b) b.remove(); };
function showBreak() {
  if ($('#brkbox')) return;
  const d = document.createElement('div'); d.id = 'brkbox'; d.className = 'brk noprint'; d.setAttribute('role', 'status');
  d.innerHTML = `<div><b>Már ${BREAK_MIN} perce gyakorolsz, pihenj egy kicsit.</b><small>Igyál egy pohár vizet, nyújtózz egyet, nézz ki az ablakon.</small></div><button class="btn sm" data-act="brkok">Rendben</button>`;
  document.body.appendChild(d);
}
['click', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
setInterval(() => {
  if (!S.breakOn || document.hidden) return;
  if (Date.now() - lastAct > BREAK_IDLE * 1000) { breakSecs = 0; return; }   // már tartott szünetet
  if (S.view === 'quiz') breakSecs++;
  if (breakSecs >= BREAK_MIN * 60 && !(S.view === 'quiz' && (S.tm || !S.done))) { breakSecs = 0; showBreak(); }
}, 1000);


/* ---------- Munkalap-készítő: a tanár kiválasztja, miből hány feladat legyen a lapon ---------- */
const SB_MAX = 60, SB_ROW_MAX = 30;
const loadSB = () => Object.assign({ grade: 0, rows: {}, title: '', name: true, key: false, two: true }, getOpt().sb || {});
const saveSB = () => { const o = getOpt(); o.sb = S.sb; setOpt(o); };
const sbRows = () => MODS.map(m => { const r = S.sb.rows[m.slug] || {}; return { slug: m.slug, sel: r.sel === undefined ? 'mix' : r.sel, n: r.n || 0 }; }).filter(r => r.n > 0);
const sbTotal = () => sbRows().reduce((a, r) => a + r.n, 0);
const SB_PRESETS = [
  ['Szorzás és osztás', [['szorzotabla', 6], ['osztas', 6], ['irasbeli-muveletek', 4]]],
  ['Összeadás, kivonás, szöveges feladat', [['osszeadas-kivonas', 8], ['szoveges-feladatok', 4], ['szamok-osszehasonlitasa', 4]]],
  ['Törtek és tizedes törtek', [['tortek', 5], ['tortek-halado', 5], ['tizedes-tortek', 5]]],
  ['Helyesírás vegyesen', [['j-ly-helyesiras', 5], ['hosszu-rovid-hangok', 5], ['toldalekok-val-vel', 5]]],
  ['Állatok, növények, emberi test', [['allatok', 5], ['novenyek', 5], ['emberi-test', 5]]],
  ['Mértékegység, idő, pénz', [['mertekegysegek', 5], ['ora-leolvasas', 5], ['penz-szamolas', 5]]]
];
const sbSummary = () => { const rs = sbRows(); return rs.length ? rs.map(r => `${esc(modBySlug(r.slug).short)} <b>×${r.n}</b>`).join(', ') : 'Még nincs kiválasztva feladat.'; };
const sbSync = () => { const t = sbTotal(), tot = $('#sbtot'), g = $('#sbgen'), s = $('#sbsum'); if (tot) tot.textContent = `Összesen: ${t} feladat`; if (g) g.disabled = !t; if (s) s.innerHTML = sbSummary();
  document.querySelectorAll('.sbr').forEach(el => el.classList.toggle('on', ((S.sb.rows[el.dataset.slug] || {}).n || 0) > 0)); };
const sbSetN = (slug, n) => { const r = S.sb.rows[slug] = Object.assign({ sel: 'mix', n: 0 }, S.sb.rows[slug]), cur = r.n || 0, room = SB_MAX - (sbTotal() - cur);
  r.n = Math.max(0, Math.min(SB_ROW_MAX, room, Math.round(n) || 0)); const inp = document.querySelector(`input[data-sb="n"][data-slug="${slug}"]`); if (inp) inp.value = r.n; saveSB(); sbSync(); };
const gradeBar = (kind, label) => `<div class="gchips" role="group" aria-label="${label}"><span class="lab">${label}:</span>${(kind === 'm' || kind === 't' ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6]).map(n => `<button class="chip" data-act="sbfill" data-k="${kind}" data-g="${n}">${n}.</button>`).join('')}</div>`;
function builderView() {
  const sb = S.sb, g = sb.grade, list = MODS.filter(m => !g || (m.grades[0] <= g && g <= m.grades[1]));
  const rows = GROUPS.map(gr => { const ms = list.filter(m => m.group === gr.id); if (!ms.length) return '';
    return `<h3 class="sbg">${gr.name}</h3>${ms.map(m => { const r = sb.rows[m.slug] || {}, n = r.n || 0, sel = r.sel === undefined ? 'mix' : String(r.sel);
      const opts = [['mix', 'Vegyes (könnyebbtől a nehezebbig)'], ...(g && m.grades[0] <= g && g <= m.grades[1] ? [['g', `${g}. osztálynak megfelelő szintek`]] : []), ...m.levels.map((l, i) => [String(i), `${i + 1}. ${l.name}`])];
      return `<div class="sbr${n ? ' on' : ''}" data-slug="${m.slug}"><div class="sbn"><b>${esc(m.short)}</b><small>${gradeTxt(m)}</small></div><select class="tin" data-sb="sel" data-slug="${m.slug}" aria-label="Szint: ${esc(m.short)}">${opts.map(([v, t]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select><div class="step"><button class="btn sm sec" data-act="sbd" data-slug="${m.slug}" data-d="-1" aria-label="Kevesebb feladat: ${esc(m.short)}">−</button><input class="tin num" type="number" min="0" max="${SB_ROW_MAX}" inputmode="numeric" data-sb="n" data-slug="${m.slug}" value="${n}" aria-label="Feladatok száma: ${esc(m.short)}"><button class="btn sm sec" data-act="sbd" data-slug="${m.slug}" data-d="1" aria-label="Több feladat: ${esc(m.short)}">+</button></div></div>`; }).join('')}`; }).join('');
  const gf = `<div class="gchips" role="group" aria-label="Szűrés évfolyamra"><span class="lab">Csak ezt mutasd:</span><button class="chip${g ? '' : ' on'}" data-act="sbgrade" data-g="0">Minden évfolyam</button>${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button class="chip${g === n ? ' on' : ''}" data-act="sbgrade" data-g="${n}">${n}.</button>`).join('')}</div>`;
  const ws = XL.ws ? `<section class="about noprint"><h2>Kész munkalapok témák szerint</h2>${XL.ws.mods.length ? `<ul class="xl">${XL.ws.mods.map(x => `<li><a href="${x[0]}">${x[1]}</a></li>`).join('')}</ul>` : ''}<h2>Kész munkalapok évfolyamonként</h2><ul class="xl">${XL.ws.grades.map(x => `<li><a href="${x[0]}">${x[1]}</a></li>`).join('')}</ul>${XL.ws.themes ? `<h2>Ünnepi munkalapok</h2><ul class="xl">${XL.ws.themes.map(x => `<li><a href="${x[0]}">${x[1]}</a></li>`).join('')}</ul>` : ''}</section>` : '';
  return `<div class="setup sbp"><a class="crumb" href="${PATHMODE ? '/tanaroknak/' : href('')}">← Tanároknak</a><h1>Nyomtatható munkalap-készítő</h1><p class="lead">Válaszd ki, miből hány feladat legyen a lapon, és nyomtasd ki. Minden lapon új, véletlenszerű feladatok vannak, és kérhetsz hozzá megoldókulcsot is. Ingyenes, regisztráció nélkül.</p>
<section class="sbbox"><h2>1. Gyors indítás</h2><p>Egy kattintással összeállít egy vegyes lapot az évfolyamnak. Utána bármit átállíthatsz.</p>${gradeBar('m', 'Matek')}${gradeBar('n', 'Helyesírás')}${gradeBar('t', 'Környezet, kémia')}<div class="gchips" role="group" aria-label="Témák szerint"><span class="lab">Témák:</span>${SB_PRESETS.map((p, i) => `<button class="chip" data-act="sbpreset" data-i="${i}">${esc(p[0])}</button>`).join('')}</div></section>
<section class="sbbox"><h2>2. Feladatok kiválasztása</h2>${gf}${rows}</section>
<section class="sbbox"><h2>3. Beállítások</h2><div class="prow"><label for="sbt" class="lab">A munkalap címe (nem kötelező)</label><input id="sbt" class="tin" maxlength="60" data-sb="title" value="${esc(sb.title)}" placeholder="pl. Házi feladat, 3.a"></div><label class="chk"><input type="checkbox" data-sb="name"${sb.name ? ' checked' : ''}> Név és dátum sor</label><label class="chk"><input type="checkbox" data-sb="two"${sb.two ? ' checked' : ''}> Két oszlop</label><label class="chk"><input type="checkbox" data-sb="key"${sb.key ? ' checked' : ''}> Megoldókulcs nyomtatása külön oldalon</label></section>
<div class="sbbar noprint"><div><span id="sbtot">Összesen: ${sbTotal()} feladat</span><small id="sbsum">${sbSummary()}</small></div><button class="btn sec sm" data-act="sbclear">Törlés</button><button class="btn" id="sbgen" data-act="sbgen"${sbTotal() ? '' : ' disabled'}>Munkalap készítése</button></div>${ws}</div>`;
}
const sbSub = () => `Témák: ${[...new Set(S.sbItems.map(i => i.title))].join(', ')}`;
function sheetxView() {
  const sb = S.sb, p = sheetParts({ title: sb.title.trim() || 'Munkalap', sub: sbSub(), nameLine: sb.name, cols: sb.two }, S.sbItems);
  return `<div class="stool noprint"><button class="btn sec sm" data-act="sbback">← Szerkesztés</button><button class="btn sm" data-act="print">Nyomtatás</button><button class="btn sec sm" data-act="sbregen">Új feladatok</button><label class="chk"><input type="checkbox" data-sb="keyp"${sb.key ? ' checked' : ''}> Megoldókulcs nyomtatása</label></div><article class="sheet${p.cols}">${p.sheet}</article><section class="skey${sb.key ? '' : ' noprint'}" id="sbkey">${p.key}</section>`;
}
const sbGenerate = () => { S.sbItems = genRows(sbRows(), S.sb.grade); S.view = 'sheetx'; render(); window.scrollTo(0, 0); };
function wsRegen() {
  const w = S.ws, b = w.type === 'theme' ? themeBuild(w.key, w.band, w.ttype) : wsBuild(w.type, w.key, w.sel, w.n), sh = $('#wssheet'), k = $('#wskey'); if (!sh || !k) return;
  sh.className = 'sheet' + (w.type === 'theme' ? ' th-' + w.ttype : ''); sh.innerHTML = b.sheet; k.innerHTML = b.key;
}

function route() {
  PR = getProfs();
  clearTimeout(S.timer); clearInterval(S.tick); S.tm = false;
  const slug = PATHMODE ? (document.documentElement.dataset.route || '') : decodeURIComponent(location.hash.replace(/^#/, ''));
  const m = modBySlug(slug);
  S.mod = m || null; S.askReset = false; S.askDel = false; S.addP = false; S.hiba = false;
  const ws = PATHMODE && document.documentElement.dataset.ws;
  if (ws) { const [t, k] = ws.split(':'); S.ws = { type: t, key: k, sel: 'mix', n: 20, band: '2', ttype: 'feladat' }; S.view = 'wspage'; render(); return; }
  S.sb = loadSB();
  S.view = slug === 'profil' ? 'profile' : slug === 'munkalapok' ? 'sheets' : m ? 'setup' : 'home'; render();
  if (!PATHMODE) window.scrollTo(0, 0);
}
if (!PATHMODE) window.addEventListener('hashchange', route);
route();

})();
