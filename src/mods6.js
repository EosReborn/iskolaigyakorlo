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
