/* Megosztási (Open Graph) képek készítése: node tools/make_og.js  (Playwright + Chromium kell hozzá)
   Az eredmény: src/brand/og-main.png, og-tanar.png, og-szulo.png (1200×630). A build ezeket másolja a dist/assets mappába. */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '..'), F = n => 'file://' + path.join(ROOT, 'src/fonts', n);
const LOGO = 'file://' + path.join(ROOT, 'src/brand/logo-original.png');
const UR = { latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212', ext: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+2113' };
const face = (fam, w, file, r) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('${F(file)}') format('woff2');unicode-range:${r}}`;
const fonts = [face('Fredoka', 600, 'fredoka-latin-600-normal.woff2', UR.latin), face('Fredoka', 600, 'fredoka-latin-ext-600-normal.woff2', UR.ext),
  face('Nunito', 800, 'nunito-latin-800-normal.woff2', UR.latin), face('Nunito', 800, 'nunito-latin-ext-800-normal.woff2', UR.ext),
  face('Nunito', 700, 'nunito-latin-700-normal.woff2', UR.latin), face('Nunito', 700, 'nunito-latin-ext-700-normal.woff2', UR.ext)].join('');
const VARIANTS = {
  main: { h: '<span>Játékos tanulás,</span><br>ingyenes fejlődés', s: '1–8. osztályosoknak · regisztráció nélkül', chips: ['játékos feladatok', 'sikerélmény', 'bővülő tartalom'], accent: '#7aa5ff' },
  tanar: { h: 'Nyomtatható munkalapok tanároknak', s: 'Válaszd ki, miből hány feladat legyen · megoldókulccsal', chips: ['matek', 'helyesírás', 'megoldókulcs', 'ingyenes'], accent: '#ffc857' },
  szulo: { h: 'Tudástár szülőknek', s: 'Hogyan segíts otthon a tanulásban, ingyenes gyakorlókkal', chips: ['szorzótábla', 'törtek', 'j vagy ly', 'napi gyakorlás'], accent: '#6fd48a' }
};
const html = v => `<!doctype html><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:#1b2a5e;color:#fff;font-family:Nunito,sans-serif;position:relative;overflow:hidden}
.grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff0d 2px,transparent 2px),linear-gradient(90deg,#ffffff0d 2px,transparent 2px);background-size:60px 60px}
.glow{position:absolute;right:-180px;bottom:-220px;width:700px;height:700px;border-radius:50%;background:${v.accent};opacity:.13;filter:blur(40px)}
.wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column}
.logo{height:150px;align-self:flex-start;margin:-18px 0 0 -22px}
h1{font:600 84px/1.08 Fredoka,sans-serif;margin-top:20px;max-width:1010px}
h1 span{color:${v.accent}}
.sub{font:800 36px/1.3 Nunito,sans-serif;margin-top:22px;color:#d3dcf7;max-width:1000px}
.chips{display:flex;gap:14px;margin-top:auto;flex-wrap:nowrap}
.chips b{font:700 28px Nunito,sans-serif;padding:8px 22px;border-radius:99px;border:3px solid ${v.accent};color:#fff}
.url{position:absolute;right:72px;top:92px;font:800 32px Nunito,sans-serif;color:${v.accent}}
</style><div class="grid"></div><div class="glow"></div><div class="wrap"><img class="logo" src="${LOGO}"><h1>${v.h.includes('<span>') ? v.h : v.h.replace(/^(\S+ \S+)/, '<span>$1</span>')}</h1><div class="sub">${v.s}</div><div class="chips">${v.chips.map(c => `<b>${c}</b>`).join('')}</div></div><div class="url">iskolaigyakorlo.hu</div>`;
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [k, v] of Object.entries(VARIANTS)) {
    const tmp = path.join(os.tmpdir(), `og-${k}.html`); fs.writeFileSync(tmp, html(v));
    await pg.goto('file://' + tmp, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(ROOT, 'src/brand', `og-${k}.png`) }); console.log('kész:', `og-${k}.png`);
  }
  await b.close();
})();
