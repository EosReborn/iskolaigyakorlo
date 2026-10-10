#!/usr/bin/env python3
"""Iskolai Gyakorló – build: oldalankénti HTML-ek, SEO, sitemap, vercel.json, valamint az előnézeti (artifact) fájl."""
import json, os, re, shutil, subprocess, hashlib, datetime, html, base64, io
from PIL import Image
from urllib.parse import quote
import sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'content'))
from grades import MATH as G_MATH, NYELV as G_NYELV, TERM as G_TERM
from modseo import MODSEO
from articles import ARTICLES
from extra import EXTRA
from changelog import CHANGES
for _a in ARTICLES:
    _a['body'] = _a['body'].rstrip() + EXTRA.get(_a['slug'], '')

SITE = os.environ.get('SITE_URL', 'https://iskolaigyakorlo.hu').rstrip('/')
NAME = 'Iskolai Gyakorló'
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, DIST = os.path.join(ROOT, 'src'), os.path.join(ROOT, 'dist')
rd = lambda p: open(os.path.join(SRC, p), encoding='utf-8').read()

meta = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'meta.js')], cwd=ROOT))
mods, groups = meta['mods'], meta['groups']

js = '(()=>{\n' + '\n'.join(rd(f) for f in ['core.js', 'mods1.js', 'mods2.js', 'mods3.js', 'mods4.js', 'mods5.js', 'mods6.js', 'mods7.js', 'mods8.js', 'mods9.js', 'sheet.js', 'themes.js', 'ui.js']) + '\n})();\n'
css = rd('style.css')
FONT_FILES = sorted(f for f in os.listdir(os.path.join(SRC, 'fonts')) if f.endswith('.woff2'))
UR = {'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
      'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'}
FR_RANGE = 'U+0025,U+002B-003A,U+003D,U+003F,U+00B0,U+00B2-00B3,U+00D7,U+00F7,U+2212,U+2260,U+2264-2265,U+2248'
def font_css():
    out = []
    for f in FONT_FILES:
        m = re.match(r'(fredoka|nunito)-(latin(?:-ext)?)-(\d+)-normal\.woff2', f)
        fam, sub, w = m.group(1).capitalize(), m.group(2), m.group(3)
        if fam == 'Fredoka':   # a Fredoka nem tartalmazza az ő/ű betűket: csak a számokhoz és műveleti jelekhez használjuk
            if sub != 'latin': continue
            out.append(f"@font-face{{font-family:'Fredoka';font-style:normal;font-weight:{w};font-display:swap;src:url(/assets/fonts/{f}) format('woff2');unicode-range:{FR_RANGE}}}")
            continue
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
    W = 620; full_s = full.resize((W, round(W * full.height / full.width)), Image.LANCZOS)
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

READ_NOTE = '<p class="rnote">Elsősöknek: ez a gyakorló olvasást igényel, ezért a szülő vagy egy idősebb testvér felolvashatja a kérdéseket.</p>'
def read_note(m): return READ_NOTE if m['grades'][0] <= 1 and (m['group'] in ('nyelv', 'termeszet') or m['slug'] == 'szoveges-feladatok') else ''
def grade_lv(m, g):
    a, z = m['grades']; nl = len(m['levels']); span = z - a + 1
    lo = (g - a) * nl // span; hi = max(lo, -(-(g - a + 1) * nl // span) - 1)
    return lo, min(nl - 1, hi)
def grade_levels_html(m):
    a, z = m['grades']
    if a == z or len(m['levels']) < 2: return ''
    rows = ''
    for g in range(a, z + 1):
        lo, hi = grade_lv(m, g)
        names = ', '.join(e(m['levels'][i]) for i in range(lo, hi + 1))
        rows += f'<li><b>{g}. osztály:</b> {lo + 1}–{hi + 1}. szint ({names})</li>' if hi > lo else f'<li><b>{g}. osztály:</b> {lo + 1}. szint ({names})</li>'
    return f'<section class="about"><h2>Melyik szint melyik évfolyamnak való?</h2><p>A gyakorló szintjei az évfolyamokon belül nehezednek. Ha a kezdőlapon kiválasztod az évfolyamot, csak az adott osztály szintjeit látod.</p><ul class="xl">{rows}</ul></section>'
def mod_faq(m):
    gr = f'{m["grades"][0]}–{m["grades"][1]}. osztály' if m['grades'][0] != m['grades'][1] else f'{m["grades"][0]}. osztály'
    base = [(f'Melyik évfolyamnak ajánlott: {m["title"]}?', f'Ajánlott évfolyam: {gr}. A szintek az évfolyamokon belül nehezednek, így a gyerek a saját szintjén kezdhet, és fokozatosan haladhat tovább.'),
            ('Van hozzá nyomtatható munkalap?', f'Igen, a munkalap-készítőben a(z) {m["short"]} témából is készíthető nyomtatható feladatlap megoldókulccsal.'.replace('a(z) ', '')),
            ('Ingyenes, és kell hozzá regisztráció?', 'Az oldal teljesen ingyenes, regisztráció és bejelentkezés nélkül használható. A haladást csak a gyerek böngészője őrzi, nem kerül szerverre.')]
    return MODSEO.get(m['slug'], {}).get('faq', []) + base
def prerender(m):
    if not m:
        gl = lambda k, rng: ''.join(f'<li><a href="{g_url(k, n)}">{g_name(k, n)}</a></li>' for n in rng)
        links = ''.join(f'<li><a href="/{x["slug"]}/">{e(x["title"])}</a>: {e(x["desc"])}</li>' for x in mods)
        return f'<div class="hero"><h1>Gyakorolj játékosan! <span class="h1sub">Ingyenes gyakorló általános iskolásoknak: matek, helyesírás, környezetismeret és kémia 1–8. osztályig</span></h1><p>Szorzótábla, törtek, százalék, egyenletek, helyesírás, óra, pénz, geometria, állatok, növények és még sok más. Gyerekeknek, szülőknek és tanároknak, regisztráció nélkül, telefonon, tableten és számítógépen is.</p></div><ul>{links}</ul><h2>Gyakorlók évfolyamonként</h2><ul>{gl("m", range(1, 9))}{gl("n", range(1, 7))}{gl("t", range(1, 7))}</ul>'
    lv = ''.join(f'<li>{i+1}. {e(n)}</li>' for i, n in enumerate(m['levels']))
    extra = ''.join(f'<p>{e(t)}</p>' for t in MODSEO.get(m['slug'], {}).get('text', []))
    return f'<div class="setup"><a class="crumb" href="/">← Minden gyakorló</a><h1>{e(m["title"])}</h1><p class="lead">{e(m["desc"])}</p>{read_note(m)}<ul>{lv}</ul><section class="about"><h2>Mire jó ez a gyakorló?</h2><p>{e(m["seo"])}</p>{extra}</section>{grade_levels_html(m)}<section class="about"><h2>Kapcsolódó oldalak</h2>{links_html(XL["mod"][m["slug"]])}</section>{faq_html(mod_faq(m), "Gyakran ismételt kérdések")}{fb_html(m["title"])}</div>'

TODAY = datetime.date.today().isoformat()
MODBY = {x['slug']: x for x in mods}
def kind_of(x): return 'n' if x['group'] == 'nyelv' else 't' if x['group'] in ('termeszet', 'kemia') else 'm'
TOP = {'m': 8, 'n': 6, 't': 8}
SUBJ_SLUG = lambda kind, n: {'m': 'matek', 'n': 'helyesiras', 't': 'kornyezetismeret' if n <= 4 else 'termeszetismeret' if n <= 6 else 'kemia'}[kind]
SUBJ = lambda kind, n: {'m': 'matek', 'n': 'helyesírás', 't': 'környezetismeret' if n <= 4 else 'természetismeret' if n <= 6 else 'kémia'}[kind]
def g_url(kind, n): return f'/{n}-osztalyos-{SUBJ_SLUG(kind, n)}-gyakorlo/'
def g_name(kind, n): return f'{n}. osztályos {SUBJ(kind, n)} gyakorló'
def g_mods(kind, n): return [x for x in mods if kind_of(x) == kind and x['grades'][0] <= n <= x['grades'][1]]
GRADES = [('m', n) for n in range(1, 9)] + [('n', n) for n in range(1, 7)] + [('t', n) for n in range(1, 9)]
THEMES = meta['themes']
def th_url(t): return f'/munkalapok/{t["id"]}/'
def w_url(x): return f'/munkalapok/{x["slug"]}/'
def wg_url(kind, n): return f'/munkalapok/{n}-osztalyos-{SUBJ_SLUG(kind, n)}/'
def wg_name(kind, n): return f'{n}. osztályos {SUBJ(kind, n)} munkalap'
ART = {a['slug']: a for a in ARTICLES}
def a_url(a): return f'/tudastar/{a["slug"]}/'

def mod_links(x):
    """A modul oldalához tartozó belső linkek (évfolyam-oldalak és cikkek)."""
    kind = kind_of(x)
    top = TOP[kind]
    gs = [n for n in range(x['grades'][0], x['grades'][1] + 1) if n <= top]
    if len(gs) > 4: gs = [gs[0], gs[len(gs)//3], gs[2*len(gs)//3], gs[-1]]
    out = [[w_url(x), f'{x["short"]} munkalap nyomtatható']] + [[g_url(kind, n), g_name(kind, n)] for n in gs]
    return out
XL = {'ms': MODSEO, 'mod': {x['slug']: mod_links(x) for x in mods},
      'g': {'m': [g_url('m', n) for n in range(1, 9)], 'n': [g_url('n', n) for n in range(1, 7)], 't': [g_url('t', n) for n in range(1, 9)]},
      'ws': {'mods': [[w_url(x), f'{x["short"]} munkalap'] for x in mods], 'grades': [[wg_url(k, n), wg_name(k, n)] for k, n in GRADES], 'themes': [[th_url(t), f'{t["name"]} munkalap'] for t in THEMES]}}
js = js.replace('/*XL*/{}/*XL*/', json.dumps(XL, ensure_ascii=False))
js = js.replace("/*SH*/'iskolaigyakorlo.hu'/*SH*/", json.dumps(SITE.split('://', 1)[-1]))
ver = hashlib.md5((js + css).encode()).hexdigest()[:8]

FB_MAIL = 'info@kochdigitalstudio.hu'
def fb_html(label):
    def mt(kind, body): return f'mailto:{FB_MAIL}?subject=' + quote(f'Iskolai Gyakorló visszajelzés – {kind} – {label}') + '&body=' + quote(body)
    ok = mt('hasznos', 'Mi volt hasznos?\n\n\n(Kérjük, ne írj le a gyerek nevét vagy más személyes adatot.)')
    no = mt('javaslat', 'Mi nem volt jó, mi hiányzik, vagy hol találtál hibát?\n\n\n(Kérjük, ne írj le a gyerek nevét vagy más személyes adatot.)')
    return f'<section class="fb"><h2>Hasznos volt ez az oldal?</h2><p>Írd meg, mi segített, mi hiányzik, vagy hol találtál hibát. Így fejlődik az oldal.</p><p class="fbb"><a class="btn sm" href="{ok}">Hasznos volt</a><a class="btn sm sec" href="{no}">Hibát találtam / hiányzik valami</a></p></section>'

FB_URL = 'https://www.facebook.com/share/1MHYDxiciR/'
def links_html(items, cls='xl'):
    return f'<ul class="{cls}">' + ''.join(f'<li><a href="{u}">{e(t)}</a></li>' for u, t in items) + '</ul>'

def fnav():
    ch = lambda kind, rng: ''.join(f'<a href="{g_url(kind, n)}">{n}. osztályos {SUBJ(kind, n)}</a>' for n in rng)
    grp = lambda title, links: f'<details><summary>{title}</summary><div class="fl">{links}</div></details>'
    teach = ('<a href="/tanaroknak/">Tanároknak: eszközök az órára</a><a href="/munkalapok/">Munkalap-készítő</a><a href="/munkalapok/unnepi/">Ünnepi munkalapok</a><a href="/munkalapok/szorzotabla/">Szorzótábla munkalap</a><a href="/munkalapok/3-osztalyos-matek/">3. osztályos matek munkalap</a>')
    # A linkek a HTML-ben vannak (a keresők látják), a lenyíló csak a megjelenítést rendezi.
    return (f'<nav class="fnav" aria-label="Évfolyamok és munkalapok">{grp("Matek gyakorlók", ch("m", range(1, 9)))}{grp("Helyesírás gyakorlók", ch("n", range(1, 7)))}{grp("Környezet- és természetismeret, kémia", ch("t", range(1, 9)))}{grp("Tanároknak", teach)}</nav>')

def bc_ld(trail):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(trail)]}
def bc_html(trail):
    parts = [f'<a href="{u}">{e(n)}</a>' for n, u in trail[:-1]] + [f'<span aria-current="page">{e(trail[-1][0])}</span>']
    return '<nav class="crumbs" aria-label="Morzsamenü">' + ' <span aria-hidden="true">›</span> '.join(parts) + '</nav>'
ORG = {"@type": "Organization", "name": "Koch Digital Studio", "url": "https://kochdigitalstudio.hu"}
def faq_ld(faq):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}
def faq_html(faq, title='Gyakran ismételt kérdések'):
    return f'<section class="faq"><h2>{e(title)}</h2>' + ''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in faq) + '</section>'

def shell(title, desc, path, body, lds, route='', ogtype='website', app=True, ws=''):
    url = SITE + path
    if path.startswith(('/tanaroknak/', '/munkalapok/')): ogimg, ogalt = '/assets/og-tanar.png', 'Iskolai Gyakorló: nyomtatható munkalapok tanároknak, megoldókulccsal'
    elif path.startswith('/tudastar/'): ogimg, ogalt = '/assets/og-szulo.png', 'Iskolai Gyakorló: Tudástár szülőknek'
    else: ogimg, ogalt = '/assets/og-main.png', 'Iskolai Gyakorló: játékos tanulás, ingyenes fejlődés 1–8. osztályosoknak'
    ldh = ''.join(f'<script type="application/ld+json">{json.dumps(l, ensure_ascii=False)}</script>\n' for l in lds)
    return f"""<!doctype html>
<html lang="hu" data-path="1" data-route="{route}"{(' data-ws="' + ws + '"') if ws else ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="hu" href="{url}"><link rel="alternate" hreflang="x-default" href="{url}">
<meta property="og:type" content="{ogtype}"><meta property="og:locale" content="hu_HU"><meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}{ogimg}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{e(ogalt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{SITE}{ogimg}"><meta name="twitter:image:alt" content="{e(ogalt)}"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(desc)}">
<meta name="theme-color" content="#2a64d0">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Gyakorló">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png"><link rel="icon" type="image/png" sizes="96x96" href="/assets/favicon-96.png"><link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/nunito-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v={ver}">
<script>try{{var p=JSON.parse(localStorage.getItem("iskolai-gyakorlo-players")),c=p.list.filter(function(x){{return x.id===p.cur}})[0];if(c&&c.skin&&c.skin!=="fuzet")document.documentElement.setAttribute("data-skin",c.skin)}}catch(e){{}}</script>
{ldh}</head>
<body>
<header class="site"><div class="wrap"><a class="brand" href="/">{logo_img("/assets/logo.webp")}</a><nav><a href="/tanaroknak/">Tanároknak</a></nav></div></header>
<main class="wrap"><div id="app">{body}</div></main>
<footer class="site"><div class="wrap">{fnav()}<p>{NAME}: ingyenes gyakorlók 1–8. osztályosoknak. Nincs regisztráció, a pontjaidat és jelvényeidet csak a saját böngésződ tárolja.</p><p>A nyomtatható munkalap a gyakorló oldalán a „Munkalap” gombbal készíthető.</p><p><a href="/ujdonsagok/">Újdonságok</a> · <a href="{FB_URL}" target="_blank" rel="noopener">Facebook</a> · <a href="mailto:info@kochdigitalstudio.hu?subject=Iskolai%20Gyakorl%C3%B3%20visszajelz%C3%A9s">Visszajelzés küldése</a> · <a href="/adatvedelem/">Adatvédelmi tájékoztató</a></p>{credit("/assets/kds.png")}</div></footer>
{'<script src="/assets/app.js?v=' + ver + '" defer></script>' if app else ''}
</body>
</html>
"""

HOME_TITLE = f'Általános iskolai gyakorló, 1–8. osztály – {NAME}'
def mod_title(m):
    a, z = m['grades']; t = f'{m["title"]} {a}–{z}. osztály – {NAME}' if a != z else f'{m["title"]} {a}. osztály – {NAME}'
    return t if len(t) <= 62 else f'{m["title"]} – {NAME}'
def mod_desc(m):
    d = m['desc'].rstrip('.') + '.'
    if len(d) >= 130: return d
    for s in (f' {len(m["levels"])} szint, ingyenes, regisztráció nélkül, nyomtatható munkalappal.', ' Ingyenes, regisztráció nélkül, nyomtatható munkalappal.', ' Ingyenes, nyomtatható munkalappal.'):
        if len(d + s) <= 158: return d + s
    return d
def page(m):
    slug = m['slug'] if m else ''
    title = mod_title(m) if m else HOME_TITLE
    desc = mod_desc(m) if m else 'Ingyenes gyakorló általános iskolásoknak, szülőknek és tanároknak: matek, helyesírás, környezetismeret és kémia 1–8. osztályig. Regisztráció nélkül, nyomtatható munkalapokkal.'
    path = f'/{slug + "/" if slug else ""}'
    url = SITE + path
    ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": m['title'] if m else NAME, "url": url, "description": desc,
          "applicationCategory": "EducationalApplication", "operatingSystem": "Any", "inLanguage": "hu", "isAccessibleForFree": True,
          "audience": {"@type": "EducationalAudience", "educationalRole": "student"}, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "HUF"},
          "publisher": ORG}
    lds = [ld]
    if not m:
        lds += [{"@context": "https://schema.org", "@type": "WebSite", "name": NAME, "alternateName": ["Általános iskolai gyakorló", "iskolaigyakorlo.hu"], "url": SITE + "/", "inLanguage": "hu", "publisher": {"@type": "Organization", "name": NAME, "url": SITE + "/"}},
                {"@context": "https://schema.org", "@type": "Organization", "name": NAME, "url": SITE + "/", "logo": SITE + "/assets/icon-512.png", "sameAs": [FB_URL], "parentOrganization": ORG}]
    else:
        lds.append(bc_ld([("Kezdőlap", "/"), (m['title'], path)]))
        lds.append(faq_ld(mod_faq(m)))
    return shell(title, desc, path, prerender(m), lds, slug)

# ---- Évfolyam-oldalak ----
GRADE1_NOTE = {'m': '<p class="rnote">Elsősöknek: a számolós gyakorlók olvasás nélkül is mennek, a szöveges feladatokat a szülő vagy egy idősebb testvér felolvashatja.</p>',
               'n': '<p class="rnote">Elsősöknek: az első osztályosok még tanulnak olvasni, ezért a szülő vagy egy idősebb testvér felolvashatja a feladatokat.</p>',
               't': '<p class="rnote">Elsősöknek: az első osztályosok még tanulnak olvasni, ezért a szülő vagy egy idősebb testvér felolvashatja a kérdéseket.</p>'}
def grade_page(kind, n):
    G = {'m': G_MATH, 'n': G_NYELV, 't': G_TERM}[kind][n]
    ms = g_mods(kind, n); name = g_name(kind, n)
    nl = sum(len(x['levels']) for x in ms)
    subj = SUBJ(kind, n)
    path = g_url(kind, n)
    title = f'{name} – ingyenes | {NAME}'
    names = ', '.join(x['short'].lower() if i else x['short'] for i, x in enumerate(ms[:3]))
    desc = f'Ingyenes {n}. osztályos {subj} gyakorló regisztráció nélkül: {names} és más témák, {nl} szint, nyomtatható munkalap.'
    desc = re.sub(r'\s+', ' ', desc)
    cards = ''.join(f'<a class="gcard" href="/{x["slug"]}/"><h3>{e(x["short"])}</h3><p>{e(x["desc"])}</p><span>{len(x["levels"])} szint · {x["grades"][0]}–{x["grades"][1]}. osztály</span></a>' for x in ms)
    learn = ''.join(f'<li>{e(t)}</li>' for t in G['learn'])
    other = []
    if n > 1: other.append((g_url(kind, n - 1), g_name(kind, n - 1)))
    if n < TOP[kind]: other.append((g_url(kind, n + 1), g_name(kind, n + 1)))
    other += [(g_url(k2, n), g_name(k2, n)) for k2 in ('m', 'n', 't') if k2 != kind and n <= TOP[k2]]
    arts = [a for a in ARTICLES if n in a['grades'] and (kind == 'm') == any(MODBY[s]['group'] != 'nyelv' for s in a['mods'][:1])][:3]
    if len(arts) < 2: arts = (arts + [a for a in ARTICLES if n in a['grades'] and a not in arts])[:3]
    arth = ''
    trail = [("Kezdőlap", "/"), (name, path)]
    body = (f'<div class="setup gpage">{bc_html(trail)}<h1>{e(name)}</h1><p class="lead">{e(G["intro"])}</p>'
            f'{GRADE1_NOTE.get(kind, "") if n == 1 else ""}'
            f'<p class="gstat"><b>{len(ms)}</b> gyakorló · <b>{nl}</b> szint · nyomtatható munkalapok · regisztráció nélkül</p>'
            f'<h2>Gyakorlók {n}. osztályosoknak</h2><div class="gcards">{cards}</div>'
            f'<section class="about"><h2>Mit tanul a gyerek {n}. osztályban { {"m": "matekból", "n": "helyesírásból és nyelvtanból", "t": SUBJ("t", n) + "ből"}[kind] }?</h2><ul class="xl">{learn}</ul>'
            f'<p class="note">Az elvárások iskolánként és tankönyvenként eltérhetnek, mindig a tanító útmutatása az irányadó.</p></section>'
            f'<section class="about"><h2>Tippek a gyakorláshoz</h2><p>{e(G["tips"])}</p></section>'
            f'{faq_html(G["faq"])}{arth}'
            f'<section class="about"><h2>További évfolyamok</h2>{links_html(other)}</section>{fb_html(name)}</div>')
    lds = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": name, "url": SITE + path, "description": desc, "inLanguage": "hu", "isPartOf": {"@type": "WebSite", "name": NAME, "url": SITE + "/"},
            "audience": {"@type": "EducationalAudience", "educationalRole": "student"}, "educationalLevel": f"{n}. osztály",
            "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": x['title'], "url": f'{SITE}/{x["slug"]}/'} for i, x in enumerate(ms)]}},
           bc_ld(trail), faq_ld(G['faq'])]
    return path, shell(title, desc, path, body, lds, '', app=False)

# ---- Tudástár ----
def read_min(a):
    w = len(re.sub(r'<[^>]+>', ' ', a['body']).split()); return max(2, round(w / 200))
def article_page(a):
    path = a_url(a)
    title = f'{a["seo_title"]} | {NAME}' if len(a['seo_title']) <= 42 else a['seo_title']
    cta = ''.join(f'<a class="gcard" href="/{s}/"><h3>{e(MODBY[s]["short"])}</h3><p>{e(MODBY[s]["desc"])}</p><span>{len(MODBY[s]["levels"])} szint · ingyenes</span></a>' for s in a['mods'])
    rel = [ART[s] for s in a['related'] if s in ART]
    gl = [(g_url('n' if MODBY[a['mods'][0]]['group'] == 'nyelv' else 'm', n), g_name('n' if MODBY[a['mods'][0]]['group'] == 'nyelv' else 'm', n)) for n in a['grades'] if n <= (6 if MODBY[a['mods'][0]]['group'] == 'nyelv' else 8)][:4]
    trail = [("Kezdőlap", "/"), ("Tudástár", "/tudastar/"), (a['title'], path)]
    body = (f'<article class="setup article">{bc_html(trail)}<h1>{e(a["title"])}</h1><p class="lead">{e(a["lead"])}</p>'
            f'<p class="meta2">Frissítve: {TODAY.replace("-", ". ")}. · Olvasási idő: {read_min(a)} perc</p>'
            f'{a["body"]}'
            f'<aside class="cta"><h2>Gyakoroljatok most, ingyen</h2><p>Regisztráció nélkül, telefonon, tableten és számítógépen is. Minden gyakorlóhoz nyomtatható munkalap is tartozik.</p><div class="gcards">{cta}</div></aside>'
            f'{faq_html(a["faq"], "Gyakori kérdések")}'
            f'<section class="about"><h2>Olvass tovább</h2>{links_html([(a_url(r), r["title"]) for r in rel])}</section>'
            f'<section class="about"><h2>Gyakorlók évfolyamonként</h2>{links_html(gl)}</section>'
            f'<p class="note">A cikk általános útmutató, az iskolai elvárások eltérhetnek. Ha a gyerek tartósan nehezen halad, érdemes a tanítóval vagy szaktanárral is egyeztetni.</p>{fb_html(a["title"])}</article>')
    lds = [{"@context": "https://schema.org", "@type": "Article", "headline": a['seo_title'], "description": a['desc'], "inLanguage": "hu", "datePublished": TODAY, "dateModified": TODAY,
            "mainEntityOfPage": SITE + path, "image": SITE + "/assets/og.png", "author": ORG, "publisher": {"@type": "Organization", "name": NAME, "url": SITE + "/", "logo": {"@type": "ImageObject", "url": SITE + "/assets/icon-512.png"}}},
           bc_ld(trail), faq_ld(a['faq'])]
    return path, shell(title, a['desc'], path, body, lds, '', ogtype='article', app=False)

def ujdonsagok_page():
    path = '/ujdonsagok/'
    desc = 'Mi változott az Iskolai Gyakorlón? Új gyakorlók és szintek, színtémák, több játékos egy eszközön, javított feladatok: az újdonságok időrendben.'
    trail = [("Kezdőlap", "/"), ("Újdonságok", path)]
    hu = lambda d: d.replace('-', '. ', 2) + '.'
    blocks = ''.join(f'<section class="chg"><h2>{hu(d)}</h2><ul>' + ''.join(f'<li><span class="tag {"new" if t == "Új" else "fix"}">{t}</span> {e(x)}</li>' for t, x in items) + '</ul></section>' for d, items in CHANGES)
    body = (f'<div class="setup gpage legal">{bc_html(trail)}<h1>Újdonságok</h1><p class="lead">Itt látod, mit építettünk be és mit javítottunk. Ha hibát találsz, vagy van ötleted, írj nekünk az oldal alján lévő gombokkal.</p>{blocks}{fb_html("Újdonságok")}</div>')
    lds = [bc_ld(trail)]
    return path, shell(f'Újdonságok – mi változott | {NAME}', desc, path, body, lds, '', app=False)

def tudastar_page():
    path = '/tudastar/'
    desc = 'Rövid, gyakorlatias cikkek szülőknek: szorzótábla, törtek, j és ly, írásbeli osztás, és mennyi gyakorlás elég naponta. Mindegyikhez ingyenes gyakorló.'
    trail = [("Kezdőlap", "/"), ("Tudástár", path)]
    items = ''.join(f'<a class="gcard" href="{a_url(a)}"><h3>{e(a["title"])}</h3><p>{e(a["desc"])}</p><span>{read_min(a)} perc olvasás</span></a>' for a in ARTICLES)
    body = (f'<div class="setup gpage">{bc_html(trail)}<h1>Tudástár szülőknek</h1><p class="lead">Rövid, hasznos cikkek arról, hogyan segíthetsz a gyereknek otthon tanulni. Mindegyik végén ott a hozzá tartozó ingyenes gyakorló.</p>'
            f'<div class="gcards">{items}</div>'
            f'<section class="about"><h2>Gyakorlók évfolyamonként</h2>{links_html([(g_url(k, n), g_name(k, n)) for k, n in GRADES])}</section></div>')
    lds = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": "Tudástár szülőknek", "url": SITE + path, "description": desc, "inLanguage": "hu",
            "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": a['title'], "url": SITE + a_url(a)} for i, a in enumerate(ARTICLES)]}}, bc_ld(trail)]
    return path, shell(f'Tudástár szülőknek – tanulás otthon | {NAME}', desc, path, body, lds, '', app=False)


# ---- Nyomtatható munkalap-oldalak ----
WS = meta['ws']
def ws_tools(mod=None):
    sel = ''
    if mod:
        opts = '<option value="mix" selected>Vegyes (könnyebbtől a nehezebbig)</option>' + ''.join(f'<option value="{i}">{i+1}. {e(n)}</option>' for i, n in enumerate(mod['levels']))
        sel = f'<label class="chk sel"><span>Szint:</span><select class="tin" data-ws="sel" aria-label="Szint">{opts}</select></label>'
    ns = ''.join(f'<button class="btn sm {"" if n == 20 else "sec"}" data-act="wsn" data-n="{n}" aria-pressed="{"true" if n == 20 else "false"}">{n}</button>' for n in (10, 20, 30))
    return (f'<div class="stool noprint"><button class="btn sm" data-act="wsprint">Nyomtatás</button><button class="btn sec sm" data-act="wsnew">Új feladatok</button>{sel}'
            f'<span class="cnt">Feladatok: {ns}</span><label class="chk"><input type="checkbox" data-ws="key"> Megoldókulcs nyomtatása</label></div>')
def ws_sheet(d):
    return f'<article class="sheet" id="wssheet">{d["sheet"]}</article><section class="skey noprint" id="wskey">{d["key"]}</section>'
WS_FAQ = [("Ingyenes a munkalap, és szabadon kinyomtathatom?", "Igen, a munkalapok ingyenesek, regisztráció nélkül használhatók. Otthoni gyakorláshoz és az osztályteremben is nyugodtan kinyomtathatod őket."),
          ("Minden alkalommal ugyanaz a munkalap jön?", "Nem. Az „Új feladatok” gomb minden kattintásra újabb, véletlenszerűen összeállított feladatokat készít, így sosem fogynak ki a lapok."),
          ("Van megoldókulcs?", "Igen, a feladatok alatt megjelenik a megoldókulcs. Ha jelölőnégyzettel bekapcsolod, külön oldalon ki is nyomtathatod, hogy a gyerek ne lássa a megoldásokat."),
          ("Hogyan nyomtassak ki csak egy oldalt?", "A nyomtatási ablakban (Ctrl+P, telefonon a Megosztás menü) add meg az oldalszámot. A munkalap az első oldalon van, a megoldókulcs a másodikon.")]
def ws_mod_page(m):
    d = WS['mod:' + m['slug']]; a, z = m['grades']; path = w_url(m); gr = f'{a}–{z}. osztály' if a != z else f'{a}. osztály'
    title = f'{m["short"]} munkalap nyomtatható – {gr} | {NAME}'
    if len(title) > 68: title = f'{m["short"]} munkalap nyomtatható | {NAME}'
    desc = f'Ingyenes, nyomtatható {m["short"].lower()} munkalap {gr}osoknak: {d["count"]} feladat megoldókulccsal, új feladatok egy kattintással. Regisztráció nélkül.'.replace('osztályosoknak', 'osztályosoknak')
    desc = f'Ingyenes, nyomtatható {m["short"].lower()} munkalap ({gr}): {d["count"]} feladat megoldókulccsal, új feladatok egy kattintással. Regisztráció nélkül.'
    kind = kind_of(m); top = TOP[kind]
    gl = [(wg_url(kind, n), wg_name(kind, n)) for n in range(a, z + 1) if n <= top]
    lv = ''.join(f'<li>{i+1}. {e(n)}</li>' for i, n in enumerate(m['levels']))
    trail = [("Kezdőlap", "/"), ("Tanároknak", "/tanaroknak/"), ("Munkalapok", "/munkalapok/"), (f'{m["short"]} munkalap', path)]
    arts = [(a_url(x), x['title']) for x in ARTICLES if m['slug'] in x['mods']][:2]
    body = (f'<div class="setup wspage"><div class="noprint">{bc_html(trail)}<h1>{e(m["short"])} munkalap, nyomtatható feladatlap</h1>'
            f'<p class="lead">Nyomtasd ki ingyen: {d["count"]} véletlenszerű feladat a(z) „{e(m["title"].replace(" gyakorló", ""))}” témában, megoldókulccsal. Az „Új feladatok” gombbal annyi különböző munkalapot készíthetsz, amennyit csak szeretnél.</p></div>'
            f'{ws_tools(m)}{ws_sheet(d)}'
            f'<div class="noprint"><section class="about"><h2>Mire jó ez a munkalap?</h2><p>{e(m["seo"])}</p></section>'
            f'<section class="about"><h2>Hogyan használd?</h2><ol><li>Válaszd ki a szintet és a feladatok számát (10, 20 vagy 30).</li><li>Nyomtasd ki a lapot a „Nyomtatás” gombbal.</li><li>Ha szeretnéd, kapcsold be a megoldókulcs nyomtatását, ez külön oldalra kerül.</li><li>Új feladatokért kattints az „Új feladatok” gombra.</li></ol></section>'
            f'<section class="about"><h2>Szintek a munkalapon</h2><ul class="xl">{lv}</ul><p>A „Vegyes” beállítás a könnyebb szintektől a nehezebbek felé halad.</p></section>'
            f'<section class="about"><h2>Saját, vegyes munkalap</h2><p>Ha egy lapra többféle feladatot szeretnél, használd a <a href="/munkalapok/">munkalap-készítőt</a>: kiválaszthatod, melyik témából hány feladat legyen.</p></section>'
            f'<section class="about"><h2>Kapcsolódó oldalak</h2>{links_html([('/' + m['slug'] + '/', m['short'] + ' gyakorló (online)')] + gl)}</section>'
            f'{faq_html(WS_FAQ)}{fb_html(m["short"] + " munkalap")}</div></div>')
    lds = [{"@context": "https://schema.org", "@type": "LearningResource", "name": f'{m["short"]} munkalap', "description": desc, "url": SITE + path, "inLanguage": "hu", "isAccessibleForFree": True,
            "learningResourceType": "Worksheet", "educationalLevel": gr, "audience": {"@type": "EducationalAudience", "educationalRole": "student"}, "publisher": {"@type": "Organization", "name": NAME, "url": SITE + "/"}},
           bc_ld(trail), faq_ld(WS_FAQ)]
    return path, shell(title, desc, path, body, lds, '', ws='mod:' + m['slug'])
def ws_grade_page(kind, n):
    d = WS[f'grade:{kind}{n}']; ms = g_mods(kind, n); path = wg_url(kind, n); name = wg_name(kind, n); subj = SUBJ(kind, n)
    title = f'{n}. osztályos {subj} munkalap nyomtatható | {NAME}'
    desc = f'Ingyenes, nyomtatható {n}. osztályos {subj} munkalap: {d["count"]} vegyes feladat megoldókulccsal, új feladatok egy kattintással. Regisztráció nélkül.'
    top = ''.join(f'<li><a href="{w_url(x)}">{e(x["short"])} munkalap</a></li>' for x in ms)
    other = [(wg_url(kind, k), wg_name(kind, k)) for k in (n - 1, n + 1) if 1 <= k <= TOP[kind]]
    trail = [("Kezdőlap", "/"), ("Tanároknak", "/tanaroknak/"), ("Munkalapok", "/munkalapok/"), (name, path)]
    body = (f'<div class="setup wspage"><div class="noprint">{bc_html(trail)}<h1>{e(name)}, nyomtatható feladatlap</h1>'
            f'<p class="lead">Nyomtasd ki ingyen: {d["count"]} vegyes feladat az {n}. osztályos {subj} anyagából, megoldókulccsal. Minden kattintásra új feladatok készülnek.</p></div>'
            f'{ws_tools()}{ws_sheet(d)}'
            f'<div class="noprint"><section class="about"><h2>Miből állnak össze a feladatok?</h2><p>A munkalap a(z) {n}. osztályos anyaghoz illő szintekből válogat. Témánként külön is kérhetsz munkalapot:</p><ul class="xl">{top}</ul></section>'
            f'<section class="about"><h2>Saját, vegyes munkalap</h2><p>Ha te szeretnéd összeállítani, hogy miből hány feladat legyen, használd a <a href="/munkalapok/">munkalap-készítőt</a>.</p></section>'
            f'<section class="about"><h2>Kapcsolódó oldalak</h2>{links_html([(g_url(kind, n), g_name(kind, n) + " (online)")] + other)}</section>'
            f'{faq_html(WS_FAQ)}{fb_html(name)}</div></div>')
    lds = [{"@context": "https://schema.org", "@type": "LearningResource", "name": name, "description": desc, "url": SITE + path, "inLanguage": "hu", "isAccessibleForFree": True,
            "learningResourceType": "Worksheet", "educationalLevel": f"{n}. osztály", "audience": {"@type": "EducationalAudience", "educationalRole": "student"}, "publisher": {"@type": "Organization", "name": NAME, "url": SITE + "/"}},
           bc_ld(trail), faq_ld(WS_FAQ)]
    return path, shell(title, desc, path, body, lds, '', ws=f'grade:{kind}{n}')

def teacher_page():
    path = '/tanaroknak/'; trail = [("Kezdőlap", "/"), ("Tanároknak", path)]
    title = f'Tanároknak: nyomtatható munkalapok és gyakorlók az órára | {NAME}'
    desc = 'Ingyenes eszközök tanítóknak és tanároknak: munkalap-készítő megoldókulccsal, kész feladatlapok témánként és évfolyamonként, online gyakorlók az órára. Regisztráció nélkül.'
    ws_m = ''.join(f'<li><a href="{w_url(x)}">{e(x["short"])} munkalap</a></li>' for x in mods)
    ws_m_ = ws_m
    gl = lambda kind, rng: ''.join(f'<li><a href="{wg_url(kind, n)}">{wg_name(kind, n)}</a></li>' for n in rng)
    faq = [("Szükség van regisztrációra?", "Nem. Minden eszköz regisztráció és bejelentkezés nélkül használható, a diákok adatait sem kérjük."),
           ("Használhatom az órán, kivetítőn vagy a diákok telefonján?", "Igen. A gyakorlók böngészőben futnak, tableten, telefonon és számítógépen is. Az „Időre megy” mód jó tanórai versenyhez."),
           ("Honnan tudjam, melyik szint való az osztálynak?", "Az évfolyam-oldalak és a munkalap-készítő „az évfolyamnak megfelelő szintek” beállítása segít. A tanmenetet természetesen te ismered a legjobban, a szinteket szabadon átállíthatod.")]
    body = (f'<div class="setup gpage">{bc_html(trail)}<h1>Tanároknak: eszközök az órára</h1>'
            f'<p class="lead">Ingyenes, regisztráció nélküli eszközök tanítóknak és tanároknak: állítsd össze a saját munkalapodat, vagy nyomtass ki egy kész feladatlapot megoldókulccsal.</p>'
            f'<div class="gcards"><a class="gcard" href="/munkalapok/unnepi/"><h3>Ünnepi munkalapok</h3><p>Mikulás, karácsony, farsang, húsvét, tanévkezdő és évzáró: szöveges feladatok, titkosírás, szókereső, hiányzó betűk.</p><span>6 ünnep · 4 évfolyamszint</span></a><a class="gcard" href="/munkalapok/"><h3>Munkalap-készítő</h3><p>Válaszd ki, miből hány feladat legyen a lapon, add meg a címet, és kérj megoldókulcsot. Új lap egy kattintásra.</p><span>30 téma · max. 60 feladat</span></a></div>'
            f'<section class="about"><h2>Kész matek munkalapok évfolyamonként</h2><ul class="xl">{gl("m", range(1, 9))}</ul>'
            f'<h2>Kész helyesírás munkalapok évfolyamonként</h2><ul class="xl">{gl("n", range(1, 7))}</ul>'
            f'<h2>Kész környezetismeret, természetismeret és kémia munkalapok évfolyamonként</h2><ul class="xl">{gl("t", range(1, 9))}</ul></section>'
            f'<section class="about"><h2>Kész munkalapok témák szerint</h2><ul class="xl">{ws_m}</ul></section>'
            f'<section class="about"><h2>Hogyan használd az órán?</h2><ol><li><b>Bemelegítés:</b> nyomtass ki egy rövid, 10 feladatos lapot az óra elejére.</li><li><b>Differenciálás:</b> a munkalap-készítőben ugyanabból a témából különböző szintű lapokat is összeállíthatsz.</li><li><b>Házi feladat:</b> adj címet a lapnak, és kérj külön megoldókulcsot a javításhoz.</li><li><b>Verseny:</b> az online gyakorlók „Időre megy” módjával 60 másodperces csapatverseny szervezhető.</li></ol></section>'
            f'{faq_html(faq)}{fb_html("Tanároknak")}</div>')
    lds = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": "Tanároknak: eszközök az órára", "url": SITE + path, "description": desc, "inLanguage": "hu", "audience": {"@type": "EducationalAudience", "educationalRole": "teacher"},
            "isPartOf": {"@type": "WebSite", "name": NAME, "url": SITE + "/"}}, bc_ld(trail), faq_ld(faq)]
    return path, shell(title, desc, path, body, lds, '', app=False)


# ---- Ünnepi munkalapok ----
TH_INFO = {
 'mikulas': {'kw': 'Mikulás munkalap nyomtatható – matek és rejtvény', 'when': 'november vége – december 6.', 'adj': 'Mikulás',
   'intro': 'A Mikulás napja (december 6.) a gyerekek egyik kedvenc ünnepe. Ezekkel a nyomtatható Mikulás-munkalapokkal játékosan lehet számolni, helyesírni és szavakat keresni a Mikulás-várás hetében.'},
 'karacsony': {'kw': 'Karácsonyi munkalap nyomtatható – matek és rejtvény', 'when': 'advent – december 24.', 'adj': 'karácsonyi',
   'intro': 'Az adventi időszakban jól jön egy-egy játékos lap a tanórára vagy otthonra. A karácsonyi munkalapokon díszgömbök, szaloncukrok és mézeskalácsok szerepelnek a feladatokban, a rejtvényekből pedig ünnepi üzenet olvasható ki.'},
 'farsang': {'kw': 'Farsangi munkalap nyomtatható – matek és rejtvény', 'when': 'január vége – február', 'adj': 'farsangi',
   'intro': 'A farsangi időszakban a gyerekek jelmezekkel, fánkkal és szerpentinnel foglalkoznak, a munkalapokban pedig ugyanezek a témák jelennek meg számolási, helyesírási és rejtvényfeladatként.'},
 'husvet': {'kw': 'Húsvéti munkalap nyomtatható – matek és rejtvény', 'when': 'március – április', 'adj': 'húsvéti',
   'intro': 'A húsvéti munkalapok a tavaszi ünnep hangulatát hozzák az órára: tojásokkal, nyuszikkal és tulipánokkal számolnak, szavakat keresnek, és húsvéti üzenetet fejtenek meg.'},
 'tanevkezdo': {'kw': 'Tanévkezdő munkalap nyomtatható – matek és rejtvény', 'when': 'augusztus vége – szeptember', 'adj': 'tanévkezdő',
   'intro': 'A tanév elején érdemes lazán, játékosan felfrissíteni a tudást. A tanévkezdő munkalapok füzetekkel, ceruzákkal és tankönyvekkel dolgoznak, és könnyű bemelegítő feladatokat adnak.'},
 'evzaro': {'kw': 'Évzáró munkalap nyomtatható – matek és rejtvény', 'when': 'június', 'adj': 'évzáró',
   'intro': 'A tanév végén a gyerekek már a nyárra gondolnak. Az évzáró munkalapok játékos lezárásként szolgálnak: fagylaltos, strandos, nyaralós feladatokat és rejtvényeket tartalmaznak.'}
}
TT_DESC = [('Szöveges feladatok', 'ünnepi történetekbe csomagolt összeadás, kivonás, szorzás, osztás, törtek és százalék, évfolyam szerint'), ('Titkosírás-rejtvény', 'a feladatok eredményeiből ünnepi üzenet olvasható ki, minden eredményhez egy betű tartozik'),
           ('Szókereső', 'ünnepi szavak a betűrácsban, a magasabb évfolyamokon átlósan és visszafelé is'), ('Hiányzó betűk', 'ünnepi szavak helyesírása hiányzó betűkkel')]
TH_FAQ = [("Milyen évfolyamnak készültek a lapok?", "Négy nehézségi szint közül választhatsz: 1. osztály, 2. osztály, 3–4. osztály és 5–6. osztály. A szöveges feladatok és a titkosírás számai is ehhez igazodnak."),
          ("Van megoldókulcs?", "Igen, minden laphoz jár megoldókulcs. A „Megoldókulcs nyomtatása” jelölőnégyzettel külön oldalra is kinyomtathatod."),
          ("Minden kattintásra új lap készül?", "Igen, az „Új lap” gomb véletlenszerűen új feladatokat, szavakat és rácsot készít, így mindig friss lapot nyomtathatsz."),
          ("Szabadon kinyomtathatom az osztálynak?", "Igen, a lapok ingyenesek, regisztráció nélkül használhatók, otthoni és osztálytermi használatra is.")]
def ws_theme_tools():
    band = '<label class="chk sel"><span>Évfolyam:</span><select class="tin" data-ws="band" aria-label="Évfolyam">' + ''.join(f'<option value="{k}"{" selected" if k == "2" else ""}>{v}</option>' for k, v in [('1', '1. osztály'), ('2', '2. osztály'), ('3', '3–4. osztály'), ('5', '5–6. osztály')]) + '</select></label>'
    typ = '<label class="chk sel"><span>Lap:</span><select class="tin" data-ws="ttype" aria-label="A lap típusa">' + ''.join(f'<option value="{k}">{v}</option>' for k, v in [('feladat', 'Szöveges feladatok'), ('titkos', 'Titkosírás-rejtvény'), ('szokereso', 'Szókereső'), ('betu', 'Hiányzó betűk')]) + '</select></label>'
    return (f'<div class="stool noprint"><button class="btn sm" data-act="wsprint">Nyomtatás</button><button class="btn sec sm" data-act="wsnew">Új lap</button>{band}{typ}'
            f'<label class="chk"><input type="checkbox" data-ws="key"> Megoldókulcs nyomtatása</label></div>')
def ws_theme_page(t):
    d = WS['theme:' + t['id']]; inf = TH_INFO[t['id']]; path = th_url(t)
    title = f'{inf["kw"]} | {NAME}'
    desc = f'Ingyenes, nyomtatható {inf["adj"]} munkalap 1–6. osztályosoknak: szöveges feladatok, titkosírás-rejtvény, szókereső és hiányzó betűk megoldókulccsal. Új lap egy kattintással.'
    trail = [("Kezdőlap", "/"), ("Tanároknak", "/tanaroknak/"), ("Ünnepi munkalapok", "/munkalapok/unnepi/"), (t['title'], path)]
    tt = ''.join(f'<li><b>{a}:</b> {e(b_)}.</li>' for a, b_ in TT_DESC)
    others = [(th_url(x), f'{x["name"]} munkalap') for x in THEMES if x['id'] != t['id']]
    body = (f'<div class="setup wspage"><div class="noprint">{bc_html(trail)}<h1>{e(t["title"])}, nyomtatható feladatlap</h1><p class="lead">{e(inf["intro"])}</p></div>'
            f'{ws_theme_tools()}<article class="sheet" id="wssheet">{d["sheet"]}</article><section class="skey noprint" id="wskey">{d["key"]}</section>'
            f'<div class="noprint"><section class="about"><h2>Négyféle lap, évfolyam szerint</h2><ul class="xl">{tt}</ul><p>Az évfolyamot és a lap típusát a gombok fölött választhatod ki, az „Új lap” gomb pedig minden alkalommal újat készít.</p></section>'
            f'<section class="about"><h2>Mikor használd?</h2><p>A(z) {e(inf["adj"])} munkalapok legjobban a(z) <b>{e(inf["when"])}</b> időszakban jönnek jól, de bármikor használhatók, ha egy játékos, ünnepi hangulatú lapra van szükség.</p></section>'
            f'<section class="about"><h2>Saját munkalap</h2><p>Ha egyszerre többféle témából szeretnél feladatokat, használd a <a href="/munkalapok/">munkalap-készítőt</a>.</p></section>'
            f'<section class="about"><h2>További ünnepi munkalapok</h2>{links_html(others + [("/munkalapok/unnepi/", "Minden ünnepi munkalap")])}</section>'
            f'{faq_html(TH_FAQ)}{fb_html(t["title"])}</div></div>')
    lds = [{"@context": "https://schema.org", "@type": "LearningResource", "name": t['title'], "description": desc, "url": SITE + path, "inLanguage": "hu", "isAccessibleForFree": True, "learningResourceType": "Worksheet",
            "educationalLevel": "1–6. osztály", "audience": {"@type": "EducationalAudience", "educationalRole": "student"}, "publisher": {"@type": "Organization", "name": NAME, "url": SITE + "/"}}, bc_ld(trail), faq_ld(TH_FAQ)]
    return path, shell(title, desc, path, body, lds, '', ws='theme:' + t['id'])
def ws_unnepi_page():
    path = '/munkalapok/unnepi/'; trail = [("Kezdőlap", "/"), ("Tanároknak", "/tanaroknak/"), ("Ünnepi munkalapok", path)]
    title = f'Ünnepi munkalapok: Mikulás, karácsony, farsang, húsvét | {NAME}'
    desc = 'Ingyenes, nyomtatható ünnepi munkalapok 1–6. osztályosoknak: Mikulás, karácsony, farsang, húsvét, tanévkezdő és évzáró. Szöveges feladatok, titkosírás, szókereső, hiányzó betűk.'
    cards = ''.join(f'<a class="gcard" href="{th_url(t)}"><h3>{e(t["title"])}</h3><p>{e(TH_INFO[t["id"]]["intro"])}</p><span>Aktuális: {e(TH_INFO[t["id"]]["when"])}</span></a>' for t in THEMES)
    body = (f'<div class="setup gpage">{bc_html(trail)}<h1>Ünnepi munkalapok</h1><p class="lead">Ingyenes, nyomtatható lapok a Mikulás, a karácsony, a farsang, a húsvét, a tanév eleje és a tanév vége időszakára. Mindegyikből négyféle lap készíthető évfolyam szerint, megoldókulccsal.</p>'
            f'<div class="gcards">{cards}</div>'
            f'<section class="about"><h2>Négyféle lap minden ünnephez</h2><ul class="xl">{"".join(f"<li><b>{a}:</b> {e(b_)}.</li>" for a, b_ in TT_DESC)}</ul></section>'
            f'<section class="about"><h2>Saját munkalap</h2><p>Ha egyszerre többféle témából szeretnél feladatokat, használd a <a href="/munkalapok/">munkalap-készítőt</a>.</p></section>{faq_html(TH_FAQ)}{fb_html("Ünnepi munkalapok")}</div>')
    lds = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": "Ünnepi munkalapok", "url": SITE + path, "description": desc, "inLanguage": "hu", "isPartOf": {"@type": "WebSite", "name": NAME, "url": SITE + "/"},
            "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": t['title'], "url": SITE + th_url(t)} for i, t in enumerate(THEMES)]}}, bc_ld(trail), faq_ld(TH_FAQ)]
    return path, shell(title, desc, path, body, lds, '', app=False)

def ws_hub_page():
    path = '/munkalapok/'; trail = [("Kezdőlap", "/"), ("Tanároknak", "/tanaroknak/"), ("Munkalapok", path)]
    title = f'Nyomtatható munkalap-készítő – matek és helyesírás | {NAME}'
    desc = 'Ingyenes munkalap-készítő tanároknak és szülőknek: válaszd ki, miből hány feladat legyen a lapon, és nyomtasd ki megoldókulccsal. 1–8. osztály, regisztráció nélkül.'
    ws_m = ''.join(f'<li><a href="{w_url(x)}">{e(x["short"])} munkalap</a></li>' for x in mods)
    ws_g = ''.join(f'<li><a href="{wg_url(k, n)}">{wg_name(k, n)}</a></li>' for k, n in GRADES)
    body = (f'<div class="setup sbp">{bc_html(trail)}<h1>Nyomtatható munkalap-készítő</h1><p class="lead">Válaszd ki, miből hány feladat legyen a lapon, és nyomtasd ki. Minden lapon új, véletlenszerű feladatok vannak, és kérhetsz hozzá megoldókulcsot is. Ingyenes, regisztráció nélkül.</p>'
            f'<noscript><p class="note">A munkalap-készítő használatához engedélyezni kell a JavaScriptet. A kész munkalapok lent böngészhetők.</p></noscript>'
            f'<section class="about"><h2>Kész munkalapok témák szerint</h2><ul class="xl">{ws_m}</ul><h2>Kész munkalapok évfolyamonként</h2><ul class="xl">{ws_g}</ul></section></div>')
    lds = [{"@context": "https://schema.org", "@type": "WebApplication", "name": "Nyomtatható munkalap-készítő", "url": SITE + path, "description": desc, "applicationCategory": "EducationalApplication", "operatingSystem": "Any", "inLanguage": "hu", "isAccessibleForFree": True,
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "HUF"}, "publisher": {"@type": "Organization", "name": NAME, "url": SITE + "/"}}, bc_ld(trail)]
    return path, shell(title, desc, path, body, lds, 'munkalapok')

if os.path.isdir(DIST): shutil.rmtree(DIST)
os.makedirs(os.path.join(DIST, 'assets'))
open(os.path.join(DIST, 'assets', 'app.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(DIST, 'assets', 'style.css'), 'w', encoding='utf-8').write(css)
shutil.copy(os.path.join(SRC,'brand','kds-logo.png'), os.path.join(DIST,'assets','kds.png'))
os.makedirs(os.path.join(DIST, 'assets', 'fonts'))
for f in [x for x in FONT_FILES if not x.startswith('fredoka-latin-ext')]: shutil.copy(os.path.join(SRC, 'fonts', f), os.path.join(DIST, 'assets', 'fonts', f))
open(os.path.join(DIST, 'assets', 'logo.webp'), 'wb').write(LOGO_WEBP)
FAV.save(os.path.join(DIST, 'assets', 'favicon.png'), optimize=True); APPLE.save(os.path.join(DIST, 'assets', 'apple-touch-icon.png'), optimize=True); OG.save(os.path.join(DIST, 'assets', 'og.png'), optimize=True)
def _sq_icon():
    ic0 = Image.open(os.path.join(SRC, 'brand', 'favicon-original.png')).convert('RGBA'); ib = ic0.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); ic0 = ic0.crop(ib)
    side = max(ic0.size); sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(ic0, ((side - ic0.width) // 2, (side - ic0.height) // 2)); return sq
_sq = _sq_icon()
for _n in (48, 96): _sq.resize((_n, _n), Image.LANCZOS).save(os.path.join(DIST, 'assets', f'favicon-{_n}.png'), optimize=True)
_sq.resize((256, 256), Image.LANCZOS).save(os.path.join(DIST, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
for _k, _n in (('main', 'og.png'), ('main', 'og-main.png'), ('tanar', 'og-tanar.png'), ('szulo', 'og-szulo.png')):
    _p = os.path.join(SRC, 'brand', f'og-{_k}.png')
    if os.path.exists(_p): shutil.copy(_p, os.path.join(DIST, 'assets', _n))
    elif _k != 'main': shutil.copy(os.path.join(DIST, 'assets', 'og.png'), os.path.join(DIST, 'assets', _n))
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(page(None))
for m in mods:
    os.makedirs(os.path.join(DIST, m['slug']))
    open(os.path.join(DIST, m['slug'], 'index.html'), 'w', encoding='utf-8').write(page(m))

SEO_PAGES = [grade_page(k, n) for k, n in GRADES] + [tudastar_page(), ujdonsagok_page()] + [article_page(a) for a in ARTICLES] + [teacher_page(), ws_hub_page(), ws_unnepi_page()] + [ws_theme_page(t) for t in THEMES] + [ws_mod_page(x) for x in mods] + [ws_grade_page(k, n) for k, n in GRADES]
for pth, htm in SEO_PAGES:
    d = os.path.join(DIST, pth.strip('/')); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(htm)

os.makedirs(os.path.join(DIST, 'profil'))
pp = page(None).replace('data-route=""', 'data-route="profil"').replace('<title>'+e(HOME_TITLE)+'</title>', f'<title>Haladásom – {NAME}</title>')
pp = re.sub(r'<meta name="robots"[^>]*>\n', '', pp)
pp = re.sub(r'<link rel="alternate"[^>]*><link rel="alternate"[^>]*>\n', '', pp)
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
<p><b>Koch Digital Studio</b> (Koch Norbert egyéni vállalkozó)<br>Székhely: 9151 Abda<br>Adószám: 91806891-1-28<br>Nyilvántartási szám: 61942471<br>E-mail: <a href="mailto:info@kochdigitalstudio.hu">info@kochdigitalstudio.hu</a><br>Weboldal: <a href="https://kochdigitalstudio.hu" rel="noopener">kochdigitalstudio.hu</a></p>
<p>Adatvédelmi kérdéseddel ezen az e-mail-címen fordulhatsz hozzánk.</p></section>
<section class="about"><h2>Mit tárol a böngésződ?</h2>
<p>A gyakorlás közben a böngésző helyi tárolójában (localStorage) két bejegyzés jön létre: az egyikben a pontjaid, a jelvényeid, a napi sorozatod és az eredményeid vannak, a másikban azok a feladatok, amelyeket elrontottál (ebből készül a „Hibáim gyakorlása”). Ha többen használjátok ugyanazt az eszközt, és felveszel több játékost, mindegyiknek külön bejegyzés jön létre, valamint egy kis lista a játékosok nevéről (a neveket te adod meg, ezek sem hagyják el az eszközt). Ha az oldalt telepíted a kezdőképernyőre, a böngésző az oldal fájljait is eltárolja, hogy internet nélkül is működjön.</p>
<p>Ezek az adatok az eszközödön maradnak, az oldal üzemeltetője nem fér hozzájuk. A tárolás kizárólag az oldal működéséhez kell, ezért hozzájárulás nem szükséges.</p>
<p>A Haladásom oldalon kérhetsz mentési kódot. Ezt te hozod létre, és te döntesz arról, hová másolod, például egy másik eszközre. Nem küldjük el sehova.</p>
<p><b>Törlés:</b> a Haladásom oldalon a „Minden adatom törlése” gombbal, vagy a böngésző beállításaiban a webhelyadatok törlésével az összes tárolt adat azonnal eltűnik.</p></section>
<section class="about"><h2>Technikai naplók (tárhely)</h2>
<p>Az oldalt a Vercel Inc. (USA) szolgáltatása szolgálja ki. A kiszolgáló az oldal megnyitásakor technikai adatokat naplózhat (például IP-cím, időpont, a kért oldal, böngészőtípus). Ez az oldal működtetéséhez és biztonságához szükséges, jogalapja a GDPR 6. cikk (1) bekezdés f) pontja szerinti jogos érdek. Az adatokat mi nem használjuk fel és nem kapcsoljuk össze másokkal. A Vercel adatkezeléséről a <a href="https://vercel.com/legal/privacy-policy" rel="noopener">saját adatvédelmi tájékoztatójában</a> olvashatsz.</p></section>
<section class="about"><h2>Külső szolgáltatások és hivatkozások</h2>
<p>Ha visszajelzést küldesz, azt a saját e-mail-programodból küldöd az info@kochdigitalstudio.hu címre. Az oldal maga nem gyűjti és nem továbbítja a visszajelzéseket, a levélben megadott adatokat csak a válaszadáshoz használjuk. Kérjük, ne írd bele a gyerek nevét.</p>\n<p>Az oldal nem tölt be külső betűtípust, szkriptet vagy követőkódot. A láblécben lévő hivatkozásra kattintva a Koch Digital Studio weboldalára jutsz, ahol a saját szabályai érvényesek.</p></section>
<section class="about"><h2>Gyerekek</h2>
<p>Az oldal gyerekeknek készült, ezért szándékosan nem kér és nem gyűjt személyes adatot. A szülők és tanárok biztonságosan használhatják a gyerekekkel együtt.</p></section>
<section class="about"><h2>Jogaid</h2>
<p>A GDPR alapján kérheted a rólad kezelt adatok megismerését, törlését vagy korlátozását, és tiltakozhatsz a kezelésük ellen. Ha úgy érzed, hogy adataidat nem megfelelően kezelik, panaszt tehetsz a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH, 1055 Budapest, Falk Miksa utca 9-11., <a href="https://naih.hu" rel="noopener">naih.hu</a>).</p></section>
<p class="muted">Utolsó frissítés: 2026. október 4.</p></div>"""
os.makedirs(os.path.join(DIST, 'adatvedelem'))
ap = page(None).replace('data-route=""', 'data-route="adatvedelem"')
ap = ap.replace('<title>'+e(HOME_TITLE)+'</title>', f'<title>Adatvédelmi tájékoztató – {NAME}</title>')
ap = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Az Iskolai Gyakorló adatvédelmi tájékoztatója: nincs regisztráció, nincs cookie, a pontjaid csak a saját böngésződben tárolódnak.">', ap, count=1)
ap = ap.replace(SITE+'/">', SITE+'/adatvedelem/">')
ap = re.sub(r'<script type="application/ld\+json">.*?</script>\n', '', ap, flags=re.S)
ap = re.sub(r'<div id="app">.*?</div></main>', lambda m_: '<div id="app">' + PRIV_HTML + '</div></main>', ap, count=1, flags=re.S)
ap = ap.replace('<script src="/assets/app.js?v='+ver+'" defer></script>\n', '')
open(os.path.join(DIST, 'adatvedelem', 'index.html'), 'w', encoding='utf-8').write(ap)

for n, im in ICONS_PWA.items(): im.save(os.path.join(DIST, 'assets', n), optimize=True)
json.dump({"name": NAME, "short_name": "Gyakorló", "description": "Ingyenes, regisztráció nélküli gyakorlók 1–8. osztályosoknak.", "lang": "hu", "start_url": "/?utm_source=pwa", "scope": "/", "display": "standalone",
           "background_color": "#f3f6fb", "theme_color": "#1b2a5e",
           "icons": [{"src": "/assets/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png"}, {"src": "/assets/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]},
          open(os.path.join(DIST, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
pre = ['/', '/profil/'] + [f'/{m["slug"]}/' for m in mods] + [p for p, _ in SEO_PAGES] + [f'/assets/app.js?v={ver}', f'/assets/style.css?v={ver}', '/assets/logo.webp', '/assets/kds.png', '/assets/favicon.png', '/assets/icon-192.png', '/manifest.webmanifest', '/adatvedelem/'] + [f'/assets/fonts/{f}' for f in FONT_FILES if not f.startswith('fredoka-latin-ext')]
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
urls = [f'{SITE}/'] + [f'{SITE}/{m["slug"]}/' for m in mods] + [SITE + p for p, _ in SEO_PAGES] + [f'{SITE}/adatvedelem/']
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
