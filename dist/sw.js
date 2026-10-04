const V = 'ig-61f55df8';
const PRE = ["/", "/profil/", "/osszeadas-kivonas/", "/szorzotabla/", "/osztas/", "/irasbeli-muveletek/", "/szoveges-feladatok/", "/szamok-osszehasonlitasa/", "/szomszedok-sorozatok/", "/kerekites-paros-paratlan/", "/romai-szamok/", "/tortek/", "/ora-leolvasas/", "/penz-szamolas/", "/mertekegysegek/", "/geometria/", "/dobokocka/", "/negativ-szamok/", "/tizedes-tortek/", "/tortek-halado/", "/szazalekszamitas/", "/hatvanyok-gyokok/", "/oszthatosag-primszamok/", "/egyenletek/", "/szogek-haromszogek/", "/kor-es-testek/", "/j-ly-helyesiras/", "/hosszu-rovid-hangok/", "/szotagolas-abc/", "/szofajok/", "/mondatfajtak/", "/toldalekok-val-vel/", "/assets/app.js?v=61f55df8", "/assets/style.css?v=61f55df8", "/assets/logo.webp", "/assets/kds.png", "/assets/favicon.png", "/assets/icon-192.png", "/manifest.webmanifest"];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(PRE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('/'))));
    return;
  }
  if (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r, { ignoreSearch: u.origin === location.origin && !u.pathname.startsWith('/assets/') }).then(m => {
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => m);
      return m || net;
    }));
  }
});
