/* ================= ÜNNEPI MUNKALAPOK =================
   Ünnepenként négyféle, évfolyam szerint nehezített, nyomtatható lap: szöveges feladatok, titkosírás-rejtvény, szókereső, hiányzó betűk.
   Tiszta (DOM nélküli) függvények: a böngésző és a build is használja. */
const BANDS = [['1', '1. osztály'], ['2', '2. osztály'], ['3', '3–4. osztály'], ['5', '5–6. osztály']];
const TTYPES = [['feladat', 'Szöveges feladatok'], ['titkos', 'Titkosírás-rejtvény'], ['szokereso', 'Szókereső'], ['betu', 'Hiányzó betűk']];
const THEMES = {
  mikulas: { name: 'Mikulás', title: 'Mikulás-munkalap', accent: 'Mikulás napja (december 6.)',
    scen: [['mandarin', 'a Mikulás zsákjában'], ['csokimikulás', 'a Mikulás zsákjában'], ['mogyoró', 'a Mikulás zsákjában'], ['narancs', 'a Mikulás kosarában'], ['alma', 'a Mikulás kosarában'], ['csomag', 'a rénszarvasok szánján']],
    words: ['Mikulás', 'csizma', 'zsák', 'ajándék', 'virgács', 'rénszarvas', 'szán', 'mogyoró', 'mandarin', 'cukorka', 'csomag', 'manó', 'ablak', 'piros', 'szakáll', 'sapka', 'december'],
    phrases: ['JÖN A MIKULÁS', 'PIROS CSIZMA', 'TELE A ZSÁK', 'MIKULÁS NAPJA'] },
  karacsony: { name: 'Karácsony', title: 'Karácsonyi munkalap', accent: 'karácsony és advent',
    scen: [['díszgömb', 'a karácsonyfán'], ['szaloncukor', 'a tálban'], ['mézeskalács', 'a tepsin'], ['ajándék', 'a fa alatt'], ['csillag', 'az ablakban'], ['gyertya', 'a polcon']],
    words: ['karácsony', 'karácsonyfa', 'díszgömb', 'gyertya', 'ajándék', 'mézeskalács', 'szaloncukor', 'angyal', 'csillag', 'harang', 'fenyő', 'jászol', 'hópehely', 'pásztor', 'koszorú', 'advent', 'szenteste'],
    phrases: ['BOLDOG KARÁCSONYT', 'SZENTESTE VAN', 'FENYŐILLAT', 'ANGYAL ÉS CSILLAG'] },
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
    phrases: ['JÓ TANÉVET', 'ÚJ ISKOLATÁSKA', 'KEZDŐDIK A TANÉV', 'SZEPTEMBER ELSEJE'] },
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
