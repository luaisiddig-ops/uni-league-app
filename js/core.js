// shared helpers: DOM, routing, toast, modal, number formatting
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = (n) => Number(n).toLocaleString('en-US');
export const LET = ['أ', 'ب', 'ج', 'د'];
export const UNI_CODES = ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4'];
export const ORG_CODES = ['M1','M2','M3','M4','M5','M6','M7','M8'];

export function go(h) {
  if (location.hash === h) window.dispatchEvent(new Event('hashchange'));
  else location.hash = h;
}

const leaves = [];
export const onLeave = (f) => leaves.push(f);
export function runLeaves() { while (leaves.length) { try { leaves.pop()(); } catch (e) { /* ignore */ } } }

let toastT = 0;
export function toast(msg, ms = 2800) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}

export function modal(html, opts = {}) {
  const m = $('#modal');
  m.innerHTML = `<div class="mbox card3d tilt ${opts.gold ? 'gold' : ''}"><div class="glare"></div>${html}</div>`;
  m.hidden = false;
  const api = { el: m, close() { m.hidden = true; m.innerHTML = ''; } };
  $$('[data-close]', m).forEach((b) => b.addEventListener('click', () => api.close()));
  if (opts.dismiss !== false) m.onclick = (e) => { if (e.target === m) api.close(); };
  import('./tilt.js').then((t) => $$('.tilt', m).forEach(t.attachTilt));
  return api;
}
export const modalOpen = () => !$('#modal').hidden;

// deterministic pseudo-random from a string
export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
