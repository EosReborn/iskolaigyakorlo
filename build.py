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

js = '(()=>{\n' + '\n'.join(rd(f) for f in ['core.js', 'mods1.js', 'mods2.js', 'ui.js']) + '\n})();\n'
css = rd('style.css')
ver = hashlib.md5((js + css).encode()).hexdigest()[:8]
FONTS = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;600;700;800&display=swap'
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
LOGO_H = 46; LOGO_W = round(LOGO_H * RATIO)
def logo_img(src): return f'<img src="{src}" alt="{NAME}" width="{LOGO_W}" height="{LOGO_H}">'

def prerender(m):
    if not m:
        links = ''.join(f'<li><a href="/{x["slug"]}/">{e(x["title"])}</a>: {e(x["desc"])}</li>' for x in mods)
        return f'<div class="hero"><h1>Gyakorolj játékosan!</h1><p>Ingyenes matematikai gyakorlók alsó tagozatosoknak: szorzótábla, osztás, törtek, óra, pénz, geometria és még sok más. Regisztráció nélkül, telefonon, tableten és számítógépen is.</p></div><ul>{links}</ul>'
    lv = ''.join(f'<li>{i+1}. {e(n)}</li>' for i, n in enumerate(m['levels']))
    return f'<div class="setup"><a class="crumb" href="/">← Minden gyakorló</a><h1>{e(m["title"])}</h1><p class="lead">{e(m["desc"])}</p><ul>{lv}</ul><section class="about"><h2>Mire jó ez a gyakorló?</h2><p>{e(m["seo"])}</p></section></div>'

def page(m):
    slug = m['slug'] if m else ''
    title = f'{m["title"]} – {NAME}' if m else f'{NAME} – ingyenes matematika gyakorlók alsósoknak'
    desc = m['desc'] if m else 'Ingyenes, regisztráció nélküli matematika gyakorlók 1–4. osztályosoknak: szorzótábla, osztás, írásbeli műveletek, törtek, óra, pénz, geometria. Nyomtatható munkalapokkal.'
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
<link rel="icon" type="image/png" href="/assets/favicon.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="/assets/style.css?v={ver}">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<header class="site"><div class="wrap"><a class="brand" href="/">{logo_img("/assets/logo.webp")}</a><nav><a href="/">Minden gyakorló</a></nav></div></header>
<main class="wrap"><div id="app">{prerender(m)}</div></main>
<footer class="site"><div class="wrap"><p>{NAME}: ingyenes gyakorlók alsó tagozatosoknak. Nincs regisztráció, a legjobb eredményeidet csak a saját böngésződ tárolja.</p><p>A nyomtatható munkalap a gyakorló oldalán a „Munkalap” gombbal készíthető.</p></div></footer>
<script src="/assets/app.js?v={ver}" defer></script>
</body>
</html>
'''

if os.path.isdir(DIST): shutil.rmtree(DIST)
os.makedirs(os.path.join(DIST, 'assets'))
open(os.path.join(DIST, 'assets', 'app.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(DIST, 'assets', 'style.css'), 'w', encoding='utf-8').write(css)
open(os.path.join(DIST, 'assets', 'logo.webp'), 'wb').write(LOGO_WEBP)
FAV.save(os.path.join(DIST, 'assets', 'favicon.png'), optimize=True); APPLE.save(os.path.join(DIST, 'assets', 'apple-touch-icon.png'), optimize=True); OG.save(os.path.join(DIST, 'assets', 'og.png'), optimize=True)
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(page(None))
for m in mods:
    os.makedirs(os.path.join(DIST, m['slug']))
    open(os.path.join(DIST, m['slug'], 'index.html'), 'w', encoding='utf-8').write(page(m))

today = datetime.date.today().isoformat()
urls = [f'{SITE}/'] + [f'{SITE}/{m["slug"]}/' for m in mods]
open(os.path.join(DIST, 'sitemap.xml'), 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n' for u in urls) + '</urlset>\n')
open(os.path.join(DIST, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
json.dump({"cleanUrls": True, "trailingSlash": True, "headers": [{"source": "/assets/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=3600"}]}]}, open(os.path.join(DIST, 'vercel.json'), 'w'), indent=2)

# Előnézeti (artifact) változat: egyetlen fájl, hash-alapú navigációval, a keret saját doctype-ot ad hozzá
art = f'''<title>{NAME}</title>
<link rel="stylesheet" href="{FONTS}">
<style>
{css}
</style>
<header class="site"><div class="wrap"><a class="brand" href="#">{logo_img("data:image/webp;base64," + base64.b64encode(LOGO_WEBP).decode())}</a></div></header>
<main class="wrap"><div id="app"></div></main>
<footer class="site"><div class="wrap"><p>{NAME}: ingyenes gyakorlók alsó tagozatosoknak. Nincs regisztráció, a legjobb eredményeidet csak a saját böngésződ tárolja.</p></div></footer>
<script>
{js}</script>
'''
open(os.path.join(ROOT, 'artifact.html'), 'w', encoding='utf-8').write(art)
print('kész:', len(mods) + 1, 'oldal, verzió', ver)
