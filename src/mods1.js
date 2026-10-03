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
