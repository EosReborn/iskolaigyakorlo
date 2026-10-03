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
