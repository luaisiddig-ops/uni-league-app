// pointer-driven 3D tilt for .tilt elements + background parallax
import { state } from './store.js';
const calm = () => state.settings.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;

export function attachTilt(el) {
  if (el._tilt) return; el._tilt = true;
  if (!el.querySelector(':scope > .glare') && el.classList.contains('card3d')) { const g = document.createElement('div'); g.className = 'glare'; el.prepend(g); }
  const max = 9;
  const move = (e) => {
    if (calm()) return;
    const r = el.getBoundingClientRect(); if (!r.width) return;
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', ((x - .5) * 2 * max).toFixed(2) + 'deg');
    el.style.setProperty('--rx', ((.5 - y) * 2 * max).toFixed(2) + 'deg');
    el.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (y * 100).toFixed(1) + '%'); el.style.setProperty('--go', '1');
  };
  const leave = () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--go', '0'); };
  el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave); el.addEventListener('pointerup', leave); el.addEventListener('pointercancel', leave);
}

export function initParallax() {
  const root = document.documentElement;
  const set = (px, py) => { root.style.setProperty('--px', px.toFixed(3)); root.style.setProperty('--py', py.toFixed(3)); };
  addEventListener('pointermove', (e) => { if (calm()) return; set(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5); }, { passive: true });
  addEventListener('deviceorientation', (e) => { if (calm() || e.gamma == null) return; set(Math.max(-1, Math.min(1, e.gamma / 40)) * .5, Math.max(-1, Math.min(1, ((e.beta || 0) - 40) / 40)) * .5); }, { passive: true });
}
