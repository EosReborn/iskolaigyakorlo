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
