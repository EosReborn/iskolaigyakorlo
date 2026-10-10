/* ================= FELÜLET ================= */
const N = 10;                 // kérdések száma egy körben
const SHEET_N = 20;           // kérdések a munkalapon
const DAILY_GOAL = 20;        // napi cél: helyes válaszok
const XL = /*XL*/{}/*XL*/;
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
  { id: 'st3', g: '3 nap', name: 'Háromnapos sorozat', desc: 'Gyakorolj három egymást követő napon.', t: p => p.best >= 3 },
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
const aOrd = n => (n === 1 || n === 5 ? 'az' : 'a');
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
  const note = g ? `<p class="gnote">Csak ${aOrd(g)} ${g}. osztályosoknak való gyakorlókat látod.${g === 1 ? ' Elsősöknek: a „Képes feladatok” és a számolós gyakorlók olvasás nélkül is mennek, a szavas feladatokat a szülő vagy egy idősebb testvér felolvashatja.' : ''} <button class="linkbtn" data-act="grade" data-g="0">Mutasd az összeset</button></p>` : '';
  return `<div class="hero"><div class="hero2"><div><h1>Gyakorolj <em>játékosan!</em> <span class="h1sub">Ingyenes gyakorló általános iskolásoknak: matek, helyesírás, környezetismeret és kémia 1–8. osztályig</span></h1><p>Szorzótábla, törtek, százalék, egyenletek, helyesírás, óra, pénz, geometria, állatok, növények és még sok más. Gyerekeknek, szülőknek és tanároknak, regisztráció nélkül, telefonon, táblagépen és számítógépen is.</p>${settingsBox()}</div><div class="heroart" aria-hidden="true"><span class="hfl f1">+</span><span class="hfl f2">÷</span><span class="hfl f3">ly</span><span class="hfl f4">%</span><div class="hq"><small>Mennyi?</small><b>6 × 7</b><div class="ha"><i>36</i><i class="ok">42 ✓</i><i>48</i></div></div></div></div></div>${pstrip()}${missBox}${gradePicker()}${note}<div id="gyakorlok">${groups}</div>${homeLinks()}`;
}

function fbBox(label) {
  const mt = (k, body) => `mailto:info@kochdigitalstudio.hu?subject=${encodeURIComponent('Iskolai Gyakorló visszajelzés – ' + k + ' – ' + label)}&body=${encodeURIComponent(body)}`;
  const tail = '\n\n\n(Kérjük, ne írj le a gyerek nevét vagy más személyes adatot.)';
  return `<section class="fb"><h2>Hasznos volt ez az oldal?</h2><p>Írd meg, mi segített, mi hiányzik, vagy hol találtál hibát. Így fejlődik az oldal.</p><p class="fbb"><a class="btn sm" href="${mt('hasznos', 'Mi volt hasznos?' + tail)}">Hasznos volt</a><a class="btn sm sec" href="${mt('javaslat', 'Mi nem volt jó, mi hiányzik, vagy hol találtál hibát?' + tail)}">Hibát találtam / hiányzik valami</a></p></section>`;
}

function homeLinks() {
  if (!PATHMODE || !XL.g) return '';
  const a = (u, t, full) => `<a href="${u}" title="${full}">${t}</a>`;
  const T = i => (i < 4 ? 'környezetismeret' : i < 6 ? 'természetismeret' : 'kémia'), GC = ['#c93b52', '#b85c00', '#8f6b00', '#1f7a4f', '#1b7a9c', '#2a64d0', '#6b4fd0', '#a03aa0'];
  const rows = XL.g.m.map((u, i) => `<div class="gm" style="--gc:${GC[i]}"><b class="gmn" aria-hidden="true">${i + 1}.</b><div class="gml">${a(u, 'Matek', `${i + 1}. osztályos matek`)}${XL.g.n[i] ? a(XL.g.n[i], 'Helyesírás', `${i + 1}. osztályos helyesírás`) : ''}${XL.g.t[i] ? a(XL.g.t[i], T(i)[0].toUpperCase() + T(i).slice(1), `${i + 1}. osztályos ${T(i)}`) : ''}</div></div>`).join('');
  return `<section class="grp"><h2><i class="gico" aria-hidden="true">🎒</i>Gyakorlók évfolyamonként</h2><nav class="gmatrix" aria-label="Évfolyamok">${rows}</nav></section>`;
}

const readNote = m => (m.grades[0] <= 1 && (m.group === 'nyelv' || m.group === 'termeszet' || m.slug === 'szoveges-feladatok') ? '<p class="rnote">Elsősöknek: ez a gyakorló olvasást igényel, ezért a szülő vagy egy idősebb testvér felolvashatja a kérdéseket.</p>' : '');
const gradeLvBox = m => {
  const [a, z] = m.grades; if (a === z || m.levels.length < 2) return '';
  const rows = Array.from({ length: z - a + 1 }, (_, k) => { const g = a + k, [lo, hi] = gradeLv(m, g), names = m.levels.slice(lo, hi + 1).map(L => esc(L.name)).join(', ');
    return `<li><b>${g}. osztály:</b> ${hi > lo ? `${lo + 1}–${hi + 1}. szint` : `${lo + 1}. szint`} (${names})</li>`; }).join('');
  return `<section class="about fold"><details><summary><h2>Melyik szint melyik évfolyamnak való?</h2></summary><p>A gyakorló szintjei az évfolyamokon belül nehezednek. Ha a kezdőlapon kiválasztod az évfolyamot, csak az adott osztály szintjeit látod.</p><ul class="xl">${rows}</ul></details></section>`;
};
const modFaq = m => {
  const gr = m.grades[0] !== m.grades[1] ? `${m.grades[0]}–${m.grades[1]}. osztály` : `${m.grades[0]}. osztály`;
  const faq = (((XL.ms || {})[m.slug] || {}).faq || []).concat([[`Melyik évfolyamnak ajánlott: ${m.title}?`, `Ajánlott évfolyam: ${gr}. A szintek az évfolyamokon belül nehezednek, így a gyerek a saját szintjén kezdhet, és fokozatosan haladhat tovább.`], ['Van hozzá nyomtatható munkalap?', `Igen, a munkalap-készítőben „${m.short}” témában is készíthető nyomtatható feladatlap megoldókulccsal.`], ['Ingyenes, és kell hozzá regisztráció?', 'Az oldal teljesen ingyenes, regisztráció és bejelentkezés nélkül használható. A haladást csak a gyerek böngészője őrzi, nem kerül szerverre.']]);
  return `<section class="faq"><h2>Gyakran ismételt kérdések</h2>${faq.map(([q, an]) => `<details><summary>${esc(q)}</summary><p>${esc(an)}</p></details>`).join('')}</section>`;
};
function setupView() {
  const m = S.mod;
  const tb = (store.get()._t || {})[m.slug] || {};
  const LC = ['var(--green)', 'var(--blue)', 'var(--red)', '#9a5f00'];
  const pg = getP().grade, band = pg && pg >= m.grades[0] && pg <= m.grades[1] && m.levels.length > 1 ? gradeLv(m, pg) : null, only = !!band && !S.allLv;
  const rows = m.levels.map((L, i) => { if (only && (i < band[0] || i > band[1])) return ''; const b = bestOf(m.slug, i), r = tb[i] || 0, done = starsOf(b) === 3;
    const st = S.timed ? (r ? `Időrekordod: ${r} helyes válasz ${TIME_SEC} másodperc alatt` : 'Még nem próbáltad időre') : (b ? `${starHTML(starsOf(b))} · ${b}/${N} helyes` : 'Még nem próbáltad');
    const chip = S.timed ? '' : done ? '<span class="lchip done">✓ Kész</span>' : b ? '<span class="lchip">Folytasd!</span>' : '';
    return `<div class="lv" style="--c:${LC[i % 4]}"><span class="num" aria-hidden="true">${i + 1}</span><div><div class="nm">${L.name}${chip}</div><div class="st">${st}</div></div><div class="acts"><button class="btn pri" data-act="start" data-l="${i}">${S.timed ? '▶ Indítás ⏱' : done ? '▶ Újra' : '▶ Gyakorlás'}</button><button class="btn sec sm" data-act="sheet" data-l="${i}">🖨 Munkalap</button></div></div>`; }).join('');
  const rel = MODS.filter(x => x.group === m.group && x !== m).concat(MODS.filter(x => x.group !== m.group)).slice(0, 5).map(x => `<a href="${href(x.slug)}">${x.short}</a>`).join('');
  const roller = m.extra === 'dice' ? `<div class="roller"><button class="btn sm" data-act="roll" data-n="2">Dobj a kockákkal!</button><div class="dice" id="rollout" aria-live="polite">${dieSVG(4)}${dieSVG(2)}</div><div id="rollsum" class="sub"></div></div>` : '';
  return `<div class="setup"><a class="crumb" href="${href('')}">← Minden gyakorló</a><h1>${m.title}</h1><p class="lead">${m.desc}</p>${readNote(m)}<p class="grline">Ajánlott évfolyam: ${gradeTxt(m)}</p>${roller}<div class="tmode"><span class="tico" aria-hidden="true">⏱</span><div><b>Időre megy</b><small>${TIME_SEC} másodperc alatt annyi feladatot oldj meg, amennyit csak tudsz. Bármikor kikapcsolhatod.</small></div><button class="sw" role="switch" aria-checked="${S.timed}" aria-label="Időre menő mód" data-act="timed"><i></i></button></div><h2 class="sr">Szintek</h2>${band ? `<p class="gnote">${only ? `Csak ${aOrd(pg)} ${pg}. osztályos tananyaghoz tartozó szinteket látod.` : `Az összes szintet látod.`} <button class="linkbtn" data-act="alllv">${only ? 'Mutasd az összes szintet' : `Csak ${aOrd(pg)} ${pg}. osztályos szintek`}</button></p>` : ''}<div class="levels">${rows}</div>${m.levels.length > 1 ? `<div class="lv mixrow"><div><div class="nm">Vegyes munkalap</div><div class="st">Minden szintről, könnyebbtől a nehezebbig. A darabszámot a munkalapon állíthatod (10, 20 vagy 30).</div></div><div class="acts"><button class="btn sm sec" data-act="sheet" data-l="-1">Vegyes munkalap</button></div></div>` : ''}<section class="about fold"><details><summary><h2>Mire jó ez a gyakorló?</h2></summary>${((XL.ms || {})[m.slug] || { text: [] }).text.map(t => `<p>${esc(t)}</p>`).join('') || `<p>${m.seo}</p>`}</details></section>${gradeLvBox(m)}${PATHMODE && XL.mod && XL.mod[m.slug] ? `<section class="about fold"><details><summary><h2>Kapcsolódó oldalak</h2></summary><ul class="xl">${XL.mod[m.slug].map(x => `<li><a href="${x[0]}">${x[1]}</a></li>`).join('')}</ul></details></section>` : ''}${modFaq(m)}${PATHMODE ? fbBox(m.title) : ''}<nav class="rel" aria-label="További gyakorlók">${rel}</nav></div>`;
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
  return `<div class="result${perfect ? ' perfect' : ''}">${perfect ? confetti() : ''}<h1>${msg}</h1><div class="bigstars" aria-label="${st} csillag a 3-ból">${[0, 1, 2].map(i => `<span class="${i < st ? '' : 'off'}">★</span>`).join('')}</div><div class="score">${S.score} helyes válasz ${art(tot)} ${tot}-ből</div>${award}<div class="ractions"><button class="btn" data-act="again">${S.hiba ? 'Még egy kör a hibákból' : 'Új kör'}</button><button class="btn sec" data-act="quit">${S.hiba ? 'Vissza' : 'Másik szint'}</button><a class="btn sec" href="${href('')}">Főoldal</a><button class="btn sec" data-act="share">Küldd el egy barátodnak</button></div><p id="shmsg" class="bmsg" role="status"></p>${wrong.length ? `<h2 style="margin-bottom:10px">Ezeket nézzük meg újra</h2><div class="wrongs">${wrong.map(h => `<div>${h.q.q}<div class="ans">Helyes válasz: ${ansText(h.q)}</div></div>`).join('')}</div>` : ''}</div>`;
}
function sheetView() {
  const m = S.mod, L = m.levels[Math.max(0, S.lvl)];
  const items = S.sheet.map(q => `<li><div class="sq">${q.q}</div>${q.kind === 'word' ? `<div class="sline wmask"><b>${esc(q.mask)}</b> <span class="blank long"></span></div>` : q.kind === 'num' ? `<div class="sline">Válasz: <span class="blank"></span> ${q.unit || ''}</div>` : `<div class="sopts">${q.choices.map((c, i) => `<span>${'ABCD'[i]}) ${c.h}</span>`).join('')}</div>`}</li>`).join('');
  return `<div class="stool noprint"><a class="btn sec sm" href="#" data-act="quit">← Vissza</a><button class="btn sm" data-act="print">Nyomtatás</button><button class="btn sec sm" data-act="newsheet">Új munkalap</button><span class="cnt">Feladatok: ${[10, 20, 30].map(n => `<button class="btn sm ${(S.sheetN || SHEET_N) === n ? '' : 'sec'}" data-act="sheetn" data-n="${n}" aria-pressed="${(S.sheetN || SHEET_N) === n}">${n}</button>`).join('')}</span></div><article class="sheet"><div class="shead"><h1>${m.title}</h1><div>Név: ____________________ Dátum: ____________</div><div class="lvn">${S.mix ? 'Vegyes szintek: könnyebbtől a nehezebbig' : `${S.lvl + 1}. szint: ${L.name}`}</div></div><ol class="slist">${items}</ol><div class="sfoot">Készült az ${SITE_HOST} oldalon: ingyenes gyakorlók és nyomtatható munkalapok 1–8. osztályosoknak.</div></article>`;
}
function playersBox() {
  const full = PR.list.length >= MAX_PLAYERS, many = PR.list.length > 1;
  const del = !many ? '' : S.askDel ? `<p class="warn">Biztosan törlöd ezt a játékost („${esc(curName())}”) és az összes eredményét?</p><div class="ractions left"><button class="btn sm" data-act="delyes">Igen, törlés</button><button class="btn sm sec" data-act="delno">Mégsem</button></div>` : '<button class="btn sec sm" data-act="delask">Ennek a játékosnak a törlése</button>';
  return `<h2 class="sech">Játékosok</h2><p>Ha többen használjátok ugyanezt az eszközt, mindenkinek külön pontja, jelvénye és hibalistája lehet. Nem kell hozzá fiók, minden csak a böngészőben marad.</p><div class="prow"><label for="pname" class="lab">Az aktuális játékos neve</label><input id="pname" class="tin" maxlength="16" value="${esc(curName())}" autocomplete="off"><button class="btn sm sec" data-act="rename">Átnevezés</button></div>${full ? `<p class="lead">Legfeljebb ${MAX_PLAYERS} játékos lehet.</p>` : '<div class="prow"><label for="newp" class="lab">Új játékos neve</label><input id="newp" class="tin" maxlength="16" placeholder="pl. Anna" autocomplete="off"><button class="btn sm" data-act="addp">Hozzáadás</button></div>'}${del}`;
}
function profileView() {
  const p = getP(), l = levelOf(p.pts), a = lvlStart(l), b = lvlStart(l + 1), pc = Math.round((p.pts - a) / (b - a) * 100), day = p.days[todayStr()] || 0;
  const stat = (v, t) => `<div class="stat"><b>${v}</b><span>${t}</span></div>`;
  const badges = BADGES.map(x => `<div class="bdg ${p.badges[x.id] ? 'got' : ''}">${medal(x.g, !!p.badges[x.id])}<b>${x.name}</b><small>${x.desc}</small>${p.badges[x.id] ? `<em>${p.badges[x.id]}</em>` : ''}</div>`).join('');
  const reset = S.askReset ? `<p class="warn">${PR.list.length > 1 ? `Biztosan törlöd „${esc(curName())}” összes pontját, jelvényét és eredményét erről az eszközről?` : 'Biztosan törlöd az összes pontodat, jelvényedet és eredményedet erről az eszközről?'}</p><div class="ractions"><button class="btn" data-act="resetyes">Igen, törlés</button><button class="btn sec" data-act="resetno">Mégsem</button></div>` : `<button class="btn sec sm" data-act="resetask">Minden adatom törlése</button>`;
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
  document.title = S.view === 'sheets' || S.view === 'sheetx' ? `Nyomtatható munkalap-készítő – ${SITE_NAME}` : S.view === 'profile' ? `Haladásom és jelvények – ${SITE_NAME}` : S.mod && S.view !== 'home' ? modTitle(S.mod) : `Általános iskolai gyakorló, 1–8. osztály – ${SITE_NAME}`;
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
const installBox = () => (standalone ? '' : deferredInstall ? '<div class="resetbox"><b>Telepítés</b><p>Tedd az appot a telefonod vagy géped kezdőképernyőjére, internet nélkül is működik.</p><button class="btn sm" data-act="install">Telepítés</button></div>' : isIOS ? '<div class="resetbox"><b>Telepítés iPhone-ra, iPadre</b><p>Safariban koppints a Megosztás gombra, majd a „Kezdőképernyőhöz adás” menüpontra. Utána internet nélkül is működik.</p></div>' : '');
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
