#!/usr/bin/env python3
"""Iskolai Gyakorló – build: oldalankénti HTML-ek, SEO, sitemap, vercel.json, valamint az előnézeti (artifact) fájl."""
import json, os, re, shutil, subprocess, hashlib, datetime, html, base64, io
from PIL import Image
from urllib.parse import quote
import sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'content'))
from grades import MATH as G_MATH, NYELV as G_NYELV
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

js = '(()=>{\n' + '\n'.join(rd(f) for f in ['core.js', 'mods1.js', 'mods2.js', 'mods3.js', 'mods4.js', 'mods5.js', 'ui.js']) + '\n})();\n'
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

def prerender(m):
    if not m:
        gl = lambda k, rng: ''.join(f'<li><a href="{g_url(k, n)}">{g_name(k, n)}</a></li>' for n in rng)
        links = ''.join(f'<li><a href="/{x["slug"]}/">{e(x["title"])}</a>: {e(x["desc"])}</li>' for x in mods)
        return f'<div class="hero"><h1>Gyakorolj játékosan!</h1><p>Ingyenes matematikai gyakorlók 1–8. osztályosoknak: szorzótábla, törtek, százalék, egyenletek, helyesírás, óra, pénz, geometria és még sok más. Regisztráció nélkül, telefonon, tableten és számítógépen is.</p></div><ul>{links}</ul><h2>Gyakorlók évfolyamonként</h2><ul>{gl("m", range(1, 9))}{gl("n", range(1, 7))}</ul><h2>Szülőknek</h2><ul><li><a href="/tudastar/">Tudástár: cikkek szülőknek</a></li><li><a href="/ujdonsagok/">Újdonságok</a></li></ul>'
    lv = ''.join(f'<li>{i+1}. {e(n)}</li>' for i, n in enumerate(m['levels']))
    return f'<div class="setup"><a class="crumb" href="/">← Minden gyakorló</a><h1>{e(m["title"])}</h1><p class="lead">{e(m["desc"])}</p><ul>{lv}</ul><section class="about"><h2>Mire jó ez a gyakorló?</h2><p>{e(m["seo"])}</p></section><section class="about"><h2>Kapcsolódó oldalak</h2>{links_html(XL["mod"][m["slug"]])}</section>{fb_html(m["title"])}</div>'

TODAY = datetime.date.today().isoformat()
MODBY = {x['slug']: x for x in mods}
def g_url(kind, n): return f'/{n}-osztalyos-{"matek" if kind == "m" else "helyesiras"}-gyakorlo/'
def g_name(kind, n): return f'{n}. osztályos {"matek" if kind == "m" else "helyesírás"} gyakorló'
def g_mods(kind, n): return [x for x in mods if (x['group'] == 'nyelv') == (kind == 'n') and x['grades'][0] <= n <= x['grades'][1]]
GRADES = [('m', n) for n in range(1, 9)] + [('n', n) for n in range(1, 7)]
ART = {a['slug']: a for a in ARTICLES}
def a_url(a): return f'/tudastar/{a["slug"]}/'

def mod_links(x):
    """A modul oldalához tartozó belső linkek (évfolyam-oldalak és cikkek)."""
    kind = 'n' if x['group'] == 'nyelv' else 'm'
    top = 6 if kind == 'n' else 8
    gs = [n for n in range(x['grades'][0], x['grades'][1] + 1) if n <= top]
    if len(gs) > 4: gs = [gs[0], gs[len(gs)//3], gs[2*len(gs)//3], gs[-1]]
    out = [[g_url(kind, n), g_name(kind, n)] for n in gs]
    out += [[a_url(a), a['title']] for a in ARTICLES if x['slug'] in a['mods']][:2]
    return out
XL = {'mod': {x['slug']: mod_links(x) for x in mods},
      'g': {'m': [g_url('m', n) for n in range(1, 9)], 'n': [g_url('n', n) for n in range(1, 7)]},
      'art': [[a_url(a), a['title']] for a in ARTICLES[:4]]}
js = js.replace('/*XL*/{}/*XL*/', json.dumps(XL, ensure_ascii=False))
ver = hashlib.md5((js + css).encode()).hexdigest()[:8]

FB_MAIL = 'info@kochdigitalstudio.hu'
def fb_html(label):
    def mt(kind, body): return f'mailto:{FB_MAIL}?subject=' + quote(f'Iskolai Gyakorló visszajelzés – {kind} – {label}') + '&body=' + quote(body)
    ok = mt('hasznos', 'Mi volt hasznos?\n\n\n(Kérjük, ne írj le a gyerek nevét vagy más személyes adatot.)')
    no = mt('javaslat', 'Mi nem volt jó, mi hiányzik, vagy hol találtál hibát?\n\n\n(Kérjük, ne írj le a gyerek nevét vagy más személyes adatot.)')
    return f'<section class="fb"><h2>Hasznos volt ez az oldal?</h2><p>Írd meg, mi segített, mi hiányzik, vagy hol találtál hibát. Így fejlődik az oldal.</p><p class="fbb"><a class="btn sm" href="{ok}">Hasznos volt</a><a class="btn sm sec" href="{no}">Hibát találtam / hiányzik valami</a></p></section>'

def links_html(items, cls='xl'):
    return f'<ul class="{cls}">' + ''.join(f'<li><a href="{u}">{e(t)}</a></li>' for u, t in items) + '</ul>'

def fnav():
    ch = lambda kind, rng: ''.join(f'<a href="{g_url(kind, n)}">{n}. osztályos {"matek" if kind == "m" else "helyesírás"}</a>' for n in rng)
    return (f'<nav class="fnav" aria-label="Évfolyamok és tudástár"><div><b>Matek gyakorlók</b>{ch("m", range(1, 9))}</div>'
            f'<div><b>Helyesírás gyakorlók</b>{ch("n", range(1, 7))}</div>'
            f'<div><b>Szülőknek</b><a href="/tudastar/">Tudástár: cikkek szülőknek</a><a href="/szorzotabla/">Szorzótábla gyakorló</a><a href="/j-ly-helyesiras/">j vagy ly gyakorló</a><a href="/tortek/">Törtek gyakorló</a></div></nav>')

def bc_ld(trail):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(trail)]}
def bc_html(trail):
    parts = [f'<a href="{u}">{e(n)}</a>' for n, u in trail[:-1]] + [f'<span aria-current="page">{e(trail[-1][0])}</span>']
    return '<nav class="crumbs" aria-label="Morzsamenü">' + ' <span aria-hidden="true">›</span> '.join(parts) + '</nav>'
ORG = {"@type": "Organization", "name": "Koch Digital Studio", "url": "https://kochdigitalstudio.hu"}
def faq_ld(faq):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}
def faq_html(faq, title='Gyakran ismételt kérdések'):
    return f'<section class="faq"><h2>{e(title)}</h2>' + ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in faq) + '</section>'

def shell(title, desc, path, body, lds, route='', ogtype='website', app=True):
    url = SITE + path
    ldh = ''.join(f'<script type="application/ld+json">{json.dumps(l, ensure_ascii=False)}</script>\n' for l in lds)
    return f"""<!doctype html>
<html lang="hu" data-path="1" data-route="{route}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="hu" href="{url}"><link rel="alternate" hreflang="x-default" href="{url}">
<meta property="og:type" content="{ogtype}"><meta property="og:locale" content="hu_HU"><meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}/assets/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(desc)}">
<meta name="theme-color" content="#2a64d0">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Gyakorló">
<link rel="icon" type="image/png" href="/assets/favicon.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/nunito-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v={ver}">
{ldh}</head>
<body>
<header class="site"><div class="wrap"><a class="brand" href="/">{logo_img("/assets/logo.webp")}</a><nav><a href="/tudastar/">Szülőknek</a><a href="/">Minden gyakorló</a></nav></div></header>
<main class="wrap"><div id="app">{body}</div></main>
<footer class="site"><div class="wrap">{fnav()}<p>{NAME}: ingyenes gyakorlók 1–8. osztályosoknak. Nincs regisztráció, a pontjaidat és jelvényeidet csak a saját böngésződ tárolja.</p><p>A nyomtatható munkalap a gyakorló oldalán a „Munkalap” gombbal készíthető.</p><p><a href="/ujdonsagok/">Újdonságok</a> · <a href="mailto:info@kochdigitalstudio.hu?subject=Iskolai%20Gyakorl%C3%B3%20visszajelz%C3%A9s">Visszajelzés küldése</a> · <a href="/adatvedelem/">Adatvédelmi tájékoztató</a></p>{credit("/assets/kds.png")}</div></footer>
{'<script src="/assets/app.js?v=' + ver + '" defer></script>' if app else ''}
</body>
</html>
"""

def page(m):
    slug = m['slug'] if m else ''
    title = f'{m["title"]} – {NAME}' if m else f'{NAME} – ingyenes matematika és helyesírás gyakorlók 1–8. osztályosoknak'
    desc = (m['desc'] if len(m['desc']) >= 100 else m['desc'].rstrip('.') + '. Ingyenes, regisztráció nélkül, szintekkel és nyomtatható munkalappal.') if m else 'Ingyenes, regisztráció nélküli matematika és helyesírás gyakorlók 1–8. osztályosoknak: szorzótábla, törtek, százalék, egyenletek, j–ly, óra, pénz, geometria. Nyomtatható munkalapokkal.'
    path = f'/{slug + "/" if slug else ""}'
    url = SITE + path
    ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": m['title'] if m else NAME, "url": url, "description": desc,
          "applicationCategory": "EducationalApplication", "operatingSystem": "Any", "inLanguage": "hu", "isAccessibleForFree": True,
          "audience": {"@type": "EducationalAudience", "educationalRole": "student"}, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "HUF"},
          "publisher": ORG}
    lds = [ld]
    if not m:
        lds += [{"@context": "https://schema.org", "@type": "WebSite", "name": NAME, "url": SITE + "/", "inLanguage": "hu"},
                {"@context": "https://schema.org", "@type": "Organization", "name": NAME, "url": SITE + "/", "logo": SITE + "/assets/icon-512.png", "parentOrganization": ORG}]
    else:
        lds.append(bc_ld([("Kezdőlap", "/"), (m['title'], path)]))
    return shell(title, desc, path, prerender(m), lds, slug)

# ---- Évfolyam-oldalak ----
def grade_page(kind, n):
    G = (G_MATH if kind == 'm' else G_NYELV)[n]
    ms = g_mods(kind, n); name = g_name(kind, n)
    nl = sum(len(x['levels']) for x in ms)
    subj = 'matek' if kind == 'm' else 'helyesírás'
    path = g_url(kind, n)
    title = f'{name} – ingyenes | {NAME}'
    names = ', '.join(x['short'].lower() if i else x['short'] for i, x in enumerate(ms[:3]))
    desc = f'Ingyenes {n}. osztályos {subj} gyakorló regisztráció nélkül: {names} és más témák, {nl} szint, nyomtatható munkalap.'
    desc = re.sub(r'\s+', ' ', desc)
    cards = ''.join(f'<a class="gcard" href="/{x["slug"]}/"><h3>{e(x["short"])}</h3><p>{e(x["desc"])}</p><span>{len(x["levels"])} szint · {x["grades"][0]}–{x["grades"][1]}. osztály</span></a>' for x in ms)
    learn = ''.join(f'<li>{e(t)}</li>' for t in G['learn'])
    other = []
    if n > 1: other.append((g_url(kind, n - 1), g_name(kind, n - 1)))
    if n < (8 if kind == 'm' else 6): other.append((g_url(kind, n + 1), g_name(kind, n + 1)))
    if kind == 'm' and n <= 6: other.append((g_url('n', n), g_name('n', n)))
    if kind == 'n': other.append((g_url('m', n), g_name('m', n)))
    arts = [a for a in ARTICLES if n in a['grades'] and (kind == 'm') == any(MODBY[s]['group'] != 'nyelv' for s in a['mods'][:1])][:3]
    if len(arts) < 2: arts = (arts + [a for a in ARTICLES if n in a['grades'] and a not in arts])[:3]
    arth = (f'<section class="about"><h2>Cikkek szülőknek</h2>{links_html([(a_url(a), a["title"]) for a in arts])}</section>') if arts else ''
    trail = [("Kezdőlap", "/"), (name, path)]
    body = (f'<div class="setup gpage">{bc_html(trail)}<h1>{e(name)}</h1><p class="lead">{e(G["intro"])}</p>'
            f'<p class="gstat"><b>{len(ms)}</b> gyakorló · <b>{nl}</b> szint · nyomtatható munkalapok · regisztráció nélkül</p>'
            f'<h2>Gyakorlók {n}. osztályosoknak</h2><div class="gcards">{cards}</div>'
            f'<section class="about"><h2>Mit tanul a gyerek {n}. osztályban {"matekból" if kind == "m" else "helyesírásból és nyelvtanból"}?</h2><ul class="xl">{learn}</ul>'
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
    desc = 'Mi változott az Iskolai Gyakorlón? Új gyakorlók, javított feladatok és helyesírás, újdonságok időrendben.'
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

if os.path.isdir(DIST): shutil.rmtree(DIST)
os.makedirs(os.path.join(DIST, 'assets'))
open(os.path.join(DIST, 'assets', 'app.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(DIST, 'assets', 'style.css'), 'w', encoding='utf-8').write(css)
shutil.copy(os.path.join(SRC,'brand','kds-logo.png'), os.path.join(DIST,'assets','kds.png'))
os.makedirs(os.path.join(DIST, 'assets', 'fonts'))
for f in [x for x in FONT_FILES if not x.startswith('fredoka-latin-ext')]: shutil.copy(os.path.join(SRC, 'fonts', f), os.path.join(DIST, 'assets', 'fonts', f))
open(os.path.join(DIST, 'assets', 'logo.webp'), 'wb').write(LOGO_WEBP)
FAV.save(os.path.join(DIST, 'assets', 'favicon.png'), optimize=True); APPLE.save(os.path.join(DIST, 'assets', 'apple-touch-icon.png'), optimize=True); OG.save(os.path.join(DIST, 'assets', 'og.png'), optimize=True)
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(page(None))
for m in mods:
    os.makedirs(os.path.join(DIST, m['slug']))
    open(os.path.join(DIST, m['slug'], 'index.html'), 'w', encoding='utf-8').write(page(m))

SEO_PAGES = [grade_page(k, n) for k, n in GRADES] + [tudastar_page(), ujdonsagok_page()] + [article_page(a) for a in ARTICLES]
for pth, htm in SEO_PAGES:
    d = os.path.join(DIST, pth.strip('/')); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(htm)

os.makedirs(os.path.join(DIST, 'profil'))
pp = page(None).replace('data-route=""', 'data-route="profil"').replace('<title>'+e(f'{NAME} – ingyenes matematika és helyesírás gyakorlók 1–8. osztályosoknak')+'</title>', f'<title>Haladásom – {NAME}</title>')
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
ap = ap.replace('<title>'+e(f'{NAME} – ingyenes matematika és helyesírás gyakorlók 1–8. osztályosoknak')+'</title>', f'<title>Adatvédelmi tájékoztató – {NAME}</title>')
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
