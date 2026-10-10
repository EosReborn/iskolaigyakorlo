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
    { name: 'Ünnepek és évszakok', gen: () => { const [w, c] = pick(FEST), t = tok(w); return WQ(w, esc(c), 'Melyik szó rejtőzik? Pótold a hiányzó betűket!', pickIdx(t, t.length >= 6 ? 2 : 1), `A magyarázat: ${c} A szó: ${w}.`); } }
  ]
});
}
