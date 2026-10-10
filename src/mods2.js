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
    { name: 'Ötperces pontossággal', gen: clockQ(4) },
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
const SHOP = [['füzet', 120], ['toll', 90], ['radír', 60], ['ceruza', 80], ['matrica', 50], ['tábla csokoládé', 350], ['szendvics', 450], ['alma', 70], ['limonádé', 300], ['jégkrém', 400], ['kifli', 60]];
mod({
  slug: 'penz-szamolas', title: 'Pénzszámolás gyakorló', short: 'Pénzszámolás', group: 'meres', glyph: '', hue: 4, icon: 'coin',
  desc: 'Forintérmék és bankjegyek összeadása, vásárlás és visszajáró számolása.',
  seo: 'A pénzzel való számolás hétköznapi készség. A gyakorló forintérméket és bankjegyeket mutat, ezek összegét kell kiszámolni. Később vásárlási és visszajáró feladatok is jönnek. A bankjegyek ábrái csak szemléltetésre szolgálnak.',
  levels: [
    { name: 'Érmék (5–200 Ft)', gen: sumQ(COINS) },
    { name: 'Bankjegyek (500–5000 Ft)', gen: sumQ(NOTES.slice(0, 4)) },
    { name: 'Érmék és bankjegyek vegyesen', gen: sumQ([...COINS, 500, 1000, 2000, 5000]) },
    { name: 'Visszajáró', gen: () => { const pay = pick([200, 500, 1000, 2000, 5000]); const cost = rnd(1, pay / 10 - 1) * 10;
      return NUM(Q(`Fizetsz ${fmt(pay)} Ft-tal. A vásárlás ára ${fmt(cost)} Ft. Mennyi a visszajáró?`), pay - cost, { unit: 'Ft', hint: `${fmt(pay)} − ${fmt(cost)} = ${fmt(pay - cost)} Ft.` }); } },
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
const SHAPE_HINT = { 'négyzet': 'A négyzetnek 4 egyenlő oldala és 4 derékszöge van.', 'téglalap': 'A téglalapnak 4 derékszöge van, a szemközti oldalai egyenlők.', 'háromszög': 'A háromszögnek 3 oldala és 3 csúcsa van.', 'kör': 'A kör kerek, nincs oldala és csúcsa.', 'ötszög': 'Az ötszögnek 5 oldala van.', 'hatszög': 'A hatszögnek 6 oldala van.', 'rombusz': 'A rombusznak mind a 4 oldala egyenlő, a szögei nem feltétlenül derékszögek.', 'trapéz': 'A trapéznek két párhuzamos oldala van.', 'paralelogramma': 'A paralelogramma szemközti oldalai párhuzamosak.' };
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
      return NUM(Q(gridSVG(cells), 'Egy kis négyzet területe 1 cm². Mennyi az alakzat területe?'), n, { unit: 'cm²', hint: `Számold meg a színes négyzeteket: ${n} darab, így a terület ${n} cm².` }); } },
    { name: 'Terület számolása képlettel', gen: () => { const a = rnd(2, 12), b = rnd(2, 12); const sq = Math.random() < .3; const B = sq ? a : b;
      return NUM(Q(sq ? `Egy négyzet oldala ${a} cm.` : `Egy téglalap oldalai ${a} cm és ${b} cm.`, 'Mennyi a területe?'), a * B, { unit: 'cm²', hint: `Terület = hosszúság × szélesség = ${a} × ${B} = ${a * B} cm².` }); } },
    { name: 'Hiányzó oldal kiszámítása', gen: () => { const a = rnd(3, 12), b = rnd(2, 10);
      return Math.random() < .5
        ? NUM(Q(`Egy téglalap területe ${a * b} cm², az egyik oldala ${a} cm.`, 'Mekkora a másik oldala?'), b, { unit: 'cm', hint: `${a * b} : ${a} = ${b} cm.` })
        : NUM(Q(`Egy téglalap kerülete ${2 * (a + b)} cm, az egyik oldala ${a} cm.`, 'Mekkora a másik oldala?'), b, { unit: 'cm', hint: `A kerület fele a két oldal összege: ${2 * (a + b)} : 2 = ${a + b} cm, ebből ${a + b} − ${a} = ${b} cm.` }); } }
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
