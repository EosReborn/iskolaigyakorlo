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
