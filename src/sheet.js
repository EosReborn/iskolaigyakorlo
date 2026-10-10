/* ================= MUNKALAPOK: közös, DOM-független függvények =================
   Ezeket a böngésző és a build is használja (a build ebből készíti az oldalakon látható mintamunkalapokat). */
const SITE_HOST = /*SH*/'iskolaigyakorlo.hu'/*SH*/;
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
