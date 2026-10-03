'use strict';
/* ---------- Segédfüggvények ---------- */
const $ = (s, r = document) => r.querySelector(s);
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = rnd(0, i); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => (n < 0 ? '−' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/* a / az névelő a kimondott szám első hangja szerint */
const art = n => {
  n = Math.abs(n);
  if (n >= 1000) return Math.floor(n / 1000) === 1 ? 'az' : art(Math.floor(n / 1000));
  if (n < 10) return (n === 1 || n === 5) ? 'az' : 'a';
  if (n < 100) return Math.floor(n / 10) === 5 ? 'az' : 'a';
  return Math.floor(n / 100) === 5 ? 'az' : 'a';
};
const fr = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const Q = (main, sub) => `<div class="big${main.replace(/<[^>]*>/g, '').length > 46 ? ' txt' : ''}">${main}</div>${sub ? `<div class="sub">${sub}</div>` : ''}`;
const slot = t => `<span class="slot">${t === undefined ? '?' : t}</span>`;

/* Kérdéstípusok: num = számbillentyűzet, choice = választógombok */
const NUM = (q, ans, o = {}) => ({ kind: 'num', q, ans: Math.round(Number(ans) * 1e6) / 1e6, ...o });
const CH = (q, correct, wrongs, o = {}) => {
  const norm = x => (typeof x === 'object' ? x : { v: String(x), h: esc(String(x)) });
  const c = norm(correct);
  const seen = new Set([c.v]);
  const w = [];
  for (const x of wrongs.map(norm)) if (!seen.has(x.v)) { seen.add(x.v); w.push(x); }
  return { kind: 'choice', q, ans: c.v, choices: shuffle([c, ...w.slice(0, 3)]), ansLabel: c.h, ...o };
};
const CMP = (q, a, b, o = {}) => {
  const s = a < b ? '<' : a > b ? '>' : '=';
  return { kind: 'choice', q, ans: s, cmp: true, ansLabel: s,
    choices: [{ v: '<', h: '&lt;', t: 'kisebb' }, { v: '=', h: '=', t: 'egyenlő' }, { v: '>', h: '&gt;', t: 'nagyobb' }], ...o };
};
const digitShuffle = n => {
  const d = String(n).split('');
  for (let k = 0; k < 20; k++) { const s = shuffle(d); if (s[0] !== '0') return Number(s.join('')); }
  return n;
};

/* Tizedes és negatív számok szövegesen (magyar tizedesvessző, ezres tagolás) */
const trim = n => Math.round(n * 1e6) / 1e6;
const numTxt = n => { n = trim(n); const [i, f] = String(Math.abs(n)).split('.'); return (n < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + (f ? ',' + f : ''); };
const fixd = (n, k) => (n < 0 ? '−' : '') + Math.abs(n).toFixed(k).replace('.', ',');
const par = n => (n < 0 ? `(${numTxt(n)})` : numTxt(n));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => a / gcd(a, b) * b;
const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const divisors = n => { const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };
const vx = '<span class="vx">x</span>';
const mix = (w, n, d) => `<span class="mix">${w}${fr(n, d)}</span>`;

/* Modulok gyűjtője */
const MODS = [];
const GROUPS = [
  { id: 'szamolas', name: 'Számolás' },
  { id: 'szamok', name: 'Számok és törtek' },
  { id: 'meres', name: 'Idő, pénz, mértékegységek' },
  { id: 'forma', name: 'Alakzatok és kocka' }
];
const mod = def => MODS.push(def);
