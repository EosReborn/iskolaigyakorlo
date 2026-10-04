#!/usr/bin/env python3
"""Iskolai Gyakorló – build: oldalankénti HTML-ek, SEO, sitemap, vercel.json, valamint az előnézeti (artifact) fájl."""
import json, os, re, shutil, subprocess, hashlib, datetime, html, base64, io
from PIL import Image

SITE = os.environ.get('SITE_URL', 'https://iskolaigyakorlo.hu').rstrip('/')
NAME = 'Iskolai Gyakorló'
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, DIST = os.path.join(ROOT, 'src'), os.path.join(ROOT, 'dist')
rd = lambda p: open(os.path.join(SRC, p), encoding='utf-8').read()

meta = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'meta.js')], cwd=ROOT))
mods, groups = meta['mods'], meta['groups']

js = '(()=>{\n' + '\n'.join(rd(f) for f in ['core.js', 'mods1.js', 'mods2.js', 'mods3.js', 'mods4.js', 'ui.js']) + '\n})();\n'
css = rd('style.css')
FONT_FILES = sorted(f for f in os.listdir(os.path.join(SRC, 'fonts')) if f.endswith('.woff2'))
UR = {'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
      'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'}
def font_css():
    out = []
    for f in FONT_FILES:
        m = re.match(r'(fredoka|nunito)-(latin(?:-ext)?)-(\d+)-normal\.woff2', f)
        fam, sub, w = m.group(1).capitalize(), m.group(2), m.group(3)
        out.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;src:url(/assets/fonts/{f}) format('woff2');unicode-range:{UR[sub]}}}")
    return '\n'.join(out) + '\n'
css = font_css() + css
ver = hashlib.md5((js + css).encode()).hexdigest()[:8]
e = html.escape

# ---- Logó feldolgozása: teljes logó (sötét fejlécre), ikon (favicon), megosztási kép ----
def make_brand():
    im = Image.open(os.path.join(SRC, 'brand', 'logo-original.png')).convert('RGBA')
    box = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
    pad = 12
    full = im.crop((box[0]-pad, box[1]-pad, box[2]+pad, box[3]+pad))
    W = 1100; full_s = full.resize((W, round(W * full.height / full.width)), Image.LANCZOS)
    buf = io.BytesIO(); full_s.save(buf, 'WEBP', quality=90, method=6); logo_webp = buf.getvalue()
    ratio = full.width / full.height
    # ikon: a külön megkapott favicon-grafika (átlátszó PNG), négyzetesre igazítva
    ic0 = Image.open(os.path.join(SRC, 'brand', 'favicon-original.png')).convert('RGBA')
    ib = ic0.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); ic0 = ic0.crop(ib)
    side = max(ic0.size); sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(ic0, ((side-ic0.width)//2, (side-ic0.height)//2))
    fav = sq.resize((64, 64), Image.LANCZOS)
    ap = Image.new('RGBA', (180, 180), (243, 246, 251, 255)); ic = sq.resize((144, 144), Image.LANCZOS); ap.paste(ic, (18, 18), ic)
    og = Image.new('RGBA', (1200, 630), (27, 42, 94, 255)); lg = full.resize((1000, round(1000 * full.height / full.width)), Image.LANCZOS)
    og.paste(lg, ((1200-lg.width)//2, (630-lg.height)//2), lg)
    return logo_webp, fav, ap.convert('RGB'), og.convert('RGB'), ratio

LOGO_WEBP, FAV, APPLE, OG, RATIO = make_brand()
def make_icons():
    ic0 = Image.open(os.path.join(SRC, 'brand', 'favicon-original.png')).convert('RGBA')
    ic0 = ic0.crop(ic0.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox())
    side = max(ic0.size); sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(ic0, ((side-ic0.width)//2, (side-ic0.height)//2))
    out = {}
    for size, name, frac in ((192, 'icon-192.png', .72), (512, 'icon-512.png', .72), (512, 'icon-maskable.png', .56)):
        bg = Image.new('RGBA', (size, size), (243, 246, 251, 255)); k = round(size * frac); ic = sq.resize((k, k), Image.LANCZOS)
        bg.paste(ic, ((size-k)//2, (size-k)//2), ic); out[name] = bg.convert('RGB')
    return out
ICONS_PWA = make_icons()
LOGO_H = 46; LOGO_W = round(LOGO_H * RATIO)
def logo_img(src): return f'<img src="{src}" alt="{NAME}" width="{LOGO_W}" height="{LOGO_H}">'


def credit(src):
    return f'<a class="kds" href="https://kochdigitalstudio.hu" target="_blank" rel="noopener"><img src="{src}" alt="" width="52" height="52"><span class="kt"><small>A weboldalt tervezte és fejlesztette</small><b>Koch Digital Studio</b><span>Prémium weboldalak, webalkalmazások és digitális megoldások cégeknek.</span></span><span class="kc">Ilyen weboldalt szeretne? →</span></a>'

def prerender(m):
    if not m:
        links = ''.join(f'<li><a href="/{x["slug"]}/">{e(x["title"])}</a>: {e(x["desc"])}</li>' for x in mods)
        return f'<div class="hero"><h1>Gyakorolj játékosan!</h1><p>Ingyenes matematikai gyakorlók 1–8. osztályosoknak: szorzótábla, törtek, százalék, egyenletek, helyesírás, óra, pénz, geometria és még sok más. Regisztráció nélkül, telefonon, tableten és számítógépen is.</p></div><ul>{links}</ul>'
    lv = ''.join(f'<li>{i+1}. {e(n)}</li>' for i, n in enumerate(m['levels']))
    return f'<div class="setup"><a class="crumb" href="/">← Minden gyakorló</a><h1>{e(m["title"])}</h1><p class="lead">{e(m["desc"])}</p><ul>{lv}</ul><section class="about"><h2>Mire jó ez a gyakorló?</h2><p>{e(m["seo"])}</p></section></div>'

def page(m):
    slug = m['slug'] if m else ''
    title = f'{m["title"]} – {NAME}' if m else f'{NAME} – ingyenes matematika gyakorlók 1–8. osztályosoknak'
    desc = m['desc'] if m else 'Ingyenes, regisztráció nélküli matematika gyakorlók 1–8. osztályosoknak: szorzótábla, törtek, százalék, egyenletek, helyesírás, óra, pénz, geometria. Nyomtatható munkalapokkal.'
    url = f'{SITE}/{slug + "/" if slug else ""}'
    ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": m['title'] if m else NAME, "url": url, "description": desc,
          "applicationCategory": "EducationalApplication", "inLanguage": "hu", "isAccessibleForFree": True,
          "audience": {"@type": "EducationalAudience", "educationalRole": "student"}, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "HUF"}}
    return f'''<!doctype html>
<html lang="hu" data-path="1" data-route="{slug}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:locale" content="hu_HU"><meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}/assets/og.png"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2a64d0">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Gyakorló">
<link rel="icon" type="image/png" href="/assets/favicon.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/nunito-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v={ver}">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<header class="site"><div class="wrap"><a class="brand" href="/">{logo_img("/assets/logo.webp")}</a><nav><a href="/">Minden gyakorló</a></nav></div></header>
<main class="wrap"><div id="app">{prerender(m)}</div></main>
<footer class="site"><div class="wrap"><p>{NAME}: ingyenes gyakorlók 1–8. osztályosoknak. Nincs regisztráció, a pontjaidat és jelvényeidet csak a saját böngésződ tárolja.</p><p>A nyomtatható munkalap a gyakorló oldalán a „Munkalap” gombbal készíthető.</p><p><a href="/adatvedelem/">Adatvédelmi tájékoztató</a></p>{credit("/assets/kds.png")}</div></footer>
<script src="/assets/app.js?v={ver}" defer></script>
</body>
</html>
'''

if os.path.isdir(DIST): shutil.rmtree(DIST)
os.makedirs(os.path.join(DIST, 'assets'))
open(os.path.join(DIST, 'assets', 'app.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(DIST, 'assets', 'style.css'), 'w', encoding='utf-8').write(css)
shutil.copy(os.path.join(SRC,'brand','kds-logo.png'), os.path.join(DIST,'assets','kds.png'))
os.makedirs(os.path.join(DIST, 'assets', 'fonts'))
for f in FONT_FILES: shutil.copy(os.path.join(SRC, 'fonts', f), os.path.join(DIST, 'assets', 'fonts', f))
open(os.path.join(DIST, 'assets', 'logo.webp'), 'wb').write(LOGO_WEBP)
FAV.save(os.path.join(DIST, 'assets', 'favicon.png'), optimize=True); APPLE.save(os.path.join(DIST, 'assets', 'apple-touch-icon.png'), optimize=True); OG.save(os.path.join(DIST, 'assets', 'og.png'), optimize=True)
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(page(None))
for m in mods:
    os.makedirs(os.path.join(DIST, m['slug']))
    open(os.path.join(DIST, m['slug'], 'index.html'), 'w', encoding='utf-8').write(page(m))

os.makedirs(os.path.join(DIST, 'profil'))
pp = page(None).replace('data-route=""', 'data-route="profil"').replace('<title>'+e(f'{NAME} – ingyenes matematika gyakorlók 1–8. osztályosoknak')+'</title>', f'<title>Haladásom – {NAME}</title>')
pp = re.sub(r'<link rel="canonical"[^>]*>', '<meta name="robots" content="noindex">', pp)
open(os.path.join(DIST, 'profil', 'index.html'), 'w', encoding='utf-8').write(pp)


# Adatvédelmi tájékoztató (statikus oldal, app.js nélkül)
PRIV_HTML = """<div class="setup legal"><a class="crumb" href="/">← Minden gyakorló</a><h1>Adatvédelmi tájékoztató</h1>
<p class="lead">Az Iskolai Gyakorló ingyenes, nincs benne regisztráció, hirdetés vagy követőkód. Az alábbiakban leírjuk, hogy az oldal pontosan mit tárol és kivel osztja meg.</p>
<section class="about"><h2>Röviden</h2><ul>
<li>Nem kérünk nevet, e-mail-címet vagy bármilyen személyes adatot, és nincs felhasználói fiók.</li>
<li>Az oldal nem használ sütiket (cookie), analitikát és hirdetéseket, ezért cookie-sávra sincs szükség.</li>
<li>A pontjaidat, jelvényeidet és a hibáidat csak a saját böngésződ tárolja az eszközödön. Ezek nem jutnak el hozzánk.</li>
<li>A betűtípusokat is az oldal saját szerveréről töltjük be, nem a Google-éről.</li></ul></section>
<section class="about"><h2>Ki üzemelteti az oldalt?</h2>
<p><b>Koch Digital Studio</b><br>E-mail: <a href="mailto:info@kochdigitalstudio.hu">info@kochdigitalstudio.hu</a><br>Weboldal: <a href="https://kochdigitalstudio.hu" rel="noopener">kochdigitalstudio.hu</a></p>
<p>Adatvédelmi kérdéseddel ezen az e-mail-címen fordulhatsz hozzánk.</p></section>
<section class="about"><h2>Mit tárol a böngésződ?</h2>
<p>A gyakorlás közben a böngésző helyi tárolójában (localStorage) két bejegyzés jön létre: az egyikben a pontjaid, a jelvényeid, a napi sorozatod és az eredményeid vannak, a másikban azok a feladatok, amelyeket elrontottál (ebből készül a „Hibáim gyakorlása”). Ha az oldalt telepíted a kezdőképernyőre, a böngésző az oldal fájljait is eltárolja, hogy internet nélkül is működjön.</p>
<p>Ezek az adatok az eszközödön maradnak, az oldal üzemeltetője nem fér hozzájuk. A tárolás kizárólag az oldal működéséhez kell, ezért hozzájárulás nem szükséges.</p>
<p>A Haladásom oldalon kérhetsz mentési kódot. Ezt te hozod létre, és te döntesz arról, hová másolod, például egy másik eszközre. Nem küldjük el sehova.</p>
<p><b>Törlés:</b> a Haladásom oldalon a „Minden adatom törlése” gombbal, vagy a böngésző beállításaiban a webhelyadatok törlésével az összes tárolt adat azonnal eltűnik.</p></section>
<section class="about"><h2>Technikai naplók (tárhely)</h2>
<p>Az oldalt a Vercel Inc. (USA) szolgáltatása szolgálja ki. A kiszolgáló az oldal megnyitásakor technikai adatokat naplózhat (például IP-cím, időpont, a kért oldal, böngészőtípus). Ez az oldal működtetéséhez és biztonságához szükséges, jogalapja a GDPR 6. cikk (1) bekezdés f) pontja szerinti jogos érdek. Az adatokat mi nem használjuk fel és nem kapcsoljuk össze másokkal. A Vercel adatkezeléséről a <a href="https://vercel.com/legal/privacy-policy" rel="noopener">saját adatvédelmi tájékoztatójában</a> olvashatsz.</p></section>
<section class="about"><h2>Külső szolgáltatások és hivatkozások</h2>
<p>Az oldal nem tölt be külső betűtípust, szkriptet vagy követőkódot. A láblécben lévő hivatkozásra kattintva a Koch Digital Studio weboldalára jutsz, ahol a saját szabályai érvényesek.</p></section>
<section class="about"><h2>Gyerekek</h2>
<p>Az oldal gyerekeknek készült, ezért szándékosan nem kér és nem gyűjt személyes adatot. A szülők és tanárok biztonságosan használhatják a gyerekekkel együtt.</p></section>
<section class="about"><h2>Jogaid</h2>
<p>A GDPR alapján kérheted a rólad kezelt adatok megismerését, törlését vagy korlátozását, és tiltakozhatsz a kezelésük ellen. Ha úgy érzed, hogy adataidat nem megfelelően kezelik, panaszt tehetsz a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH, 1055 Budapest, Falk Miksa utca 9-11., <a href="https://naih.hu" rel="noopener">naih.hu</a>).</p></section>
<p class="muted">Utolsó frissítés: 2026. október 4.</p></div>"""
os.makedirs(os.path.join(DIST, 'adatvedelem'))
ap = page(None).replace('data-route=""', 'data-route="adatvedelem"')
ap = ap.replace('<title>'+e(f'{NAME} – ingyenes matematika gyakorlók 1–8. osztályosoknak')+'</title>', f'<title>Adatvédelmi tájékoztató – {NAME}</title>')
ap = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Az Iskolai Gyakorló adatvédelmi tájékoztatója: nincs regisztráció, nincs cookie, a pontjaid csak a saját böngésződben tárolódnak.">', ap, count=1)
ap = ap.replace('<link rel="canonical" href="'+SITE+'/">', '<link rel="canonical" href="'+SITE+'/adatvedelem/">')
ap = re.sub(r'<script type="application/ld\+json">.*?</script>\n', '', ap, flags=re.S)
ap = re.sub(r'<div id="app">.*?</div></main>', lambda m_: '<div id="app">' + PRIV_HTML + '</div></main>', ap, count=1, flags=re.S)
ap = ap.replace('<script src="/assets/app.js?v='+ver+'" defer></script>\n', '')
open(os.path.join(DIST, 'adatvedelem', 'index.html'), 'w', encoding='utf-8').write(ap)

for n, im in ICONS_PWA.items(): im.save(os.path.join(DIST, 'assets', n), optimize=True)
json.dump({"name": NAME, "short_name": "Gyakorló", "description": "Ingyenes, regisztráció nélküli gyakorlók 1–8. osztályosoknak.", "lang": "hu", "start_url": "/?utm_source=pwa", "scope": "/", "display": "standalone",
           "background_color": "#f3f6fb", "theme_color": "#1b2a5e",
           "icons": [{"src": "/assets/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png"}, {"src": "/assets/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]},
          open(os.path.join(DIST, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
pre = ['/', '/profil/'] + [f'/{m["slug"]}/' for m in mods] + [f'/assets/app.js?v={ver}', f'/assets/style.css?v={ver}', '/assets/logo.webp', '/assets/kds.png', '/assets/favicon.png', '/assets/icon-192.png', '/manifest.webmanifest', '/adatvedelem/'] + [f'/assets/fonts/{f}' for f in FONT_FILES]
open(os.path.join(DIST, 'sw.js'), 'w', encoding='utf-8').write('''const V = 'ig-%s';
const PRE = %s;
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(PRE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('/'))));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(caches.match(r, { ignoreSearch: u.origin === location.origin && !u.pathname.startsWith('/assets/') }).then(m => {
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => m);
      return m || net;
    }));
  }
});
''' % (ver, json.dumps(pre)))

today = datetime.date.today().isoformat()
urls = [f'{SITE}/'] + [f'{SITE}/{m["slug"]}/' for m in mods] + [f'{SITE}/adatvedelem/']
open(os.path.join(DIST, 'sitemap.xml'), 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n' for u in urls) + '</urlset>\n')
open(os.path.join(DIST, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
json.dump({"cleanUrls": True, "trailingSlash": True, "headers": [{"source": "/assets/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=3600"}]}]}, open(os.path.join(DIST, 'vercel.json'), 'w'), indent=2)

# Előnézeti (artifact) változat: egyetlen fájl, hash-alapú navigációval, a keret saját doctype-ot ad hozzá
art = f'''<title>{NAME}</title>
<style>
{css}
</style>
<header class="site"><div class="wrap"><a class="brand" href="#">{logo_img("data:image/webp;base64," + base64.b64encode(LOGO_WEBP).decode())}</a></div></header>
<main class="wrap"><div id="app"></div></main>
<footer class="site"><div class="wrap"><p>{NAME}: ingyenes gyakorlók 1–8. osztályosoknak. Nincs regisztráció, a pontjaidat és jelvényeidet csak a saját böngésződ tárolja.</p>{credit("data:image/png;base64," + base64.b64encode(open(os.path.join(SRC,'brand','kds-logo.png'),'rb').read()).decode())}</div></footer>
<script>
{js}</script>
'''
open(os.path.join(ROOT, 'artifact.html'), 'w', encoding='utf-8').write(art)
print('kész:', len(mods) + 1, 'oldal, verzió', ver)
