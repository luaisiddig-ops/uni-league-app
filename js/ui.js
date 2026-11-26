// 3D components as HTML strings
import { LET, esc } from './core.js';

const LOGO = 'icons/logo.png';

// the program logo (original colours, never recoloured) at the heart of a gold medal disc
export const logoDisc = (d = 56, off = false, cls = '') =>
  `<span class="ldisc${off ? ' off' : ''}${cls ? ' ' + cls : ''}" style="--d:${d}px"><img src="${LOGO}" alt="" draggable="false"></span>`;

export const rosette = () =>
  `<div class="armil" aria-hidden="true"><div class="spin">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<i style="--a:${(i * 180 / 7).toFixed(2)}deg"></i>`).join('')}</div>${logoDisc(66, false, 'core')}</div>`;

export const pearl = (s = 34, off = false) => `<b class="pearl${off ? ' off' : ''}" style="--s:${s}px"></b>`;

// 3D coin: thick gold edge, navy heart with the logo on both faces; the label sits under the logo on the front (large coins only)
export function coin(label, sub = '', size = 120, still = false) {
  const layers = Array.from({ length: 9 }, (_, i) => `<u style="--z:${((i - 4) * 1.8).toFixed(1)}px"></u>`).join('');
  const lbl = label && size >= 100 ? `<span class="lbl">${esc(label)}</span>` : '';
  return `<div class="coin${still ? ' still' : ''}" style="--cs:${size}px"><div class="cspin">${layers}<div class="face front"><div class="inner"><img src="${LOGO}" alt="" draggable="false">${lbl}</div></div><div class="face back"><div class="inner"><img class="big" src="${LOGO}" alt="" draggable="false"></div></div></div></div>`;
}

export function gate3d(open = false, text = '') {
  return `<div class="gate3d${open ? ' open' : ''}" id="gate3d"><div class="glow"></div>${logoDisc(84, false, 'gl')}<div class="door l"></div><div class="door r"></div>${text ? `<div class="gt">${esc(text)}</div>` : ''}</div>`;
}

// circular countdown (r=52, circumference ~326.7)
export function ring3d(frac, big, small = 'ثانية') {
  const C = 326.7;
  return `<div class="ring3d" id="ring3d"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="11"/><circle class="fg" cx="60" cy="60" r="52" fill="none" stroke="#E8C27E" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(C * frac).toFixed(1)} ${C}"/></svg><b><span id="ringn">${big}</span><small>${small}</small></b></div>`;
}
export function setRing(frac, big, hot) {
  const r = document.getElementById('ring3d'); if (!r) return;
  const C = 326.7; r.querySelector('circle.fg').setAttribute('stroke-dasharray', `${(C * Math.max(0, frac)).toFixed(1)} ${C}`);
  document.getElementById('ringn').textContent = big; r.classList.toggle('hot', !!hot);
}

export function keysHtml(q) {
  return `<div class="keys">${q.options.map((o, i) => `<button class="key" data-i="${i}" style="--i:${i}"><span class="k">${LET[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
}
// colour the keys after an answer; choice may be null (no answer)
export function markKeys(root, q, choice) {
  [...root.querySelectorAll('.key')].forEach((b) => {
    const i = +b.dataset.i; b.disabled = true; b.classList.remove('sel');
    if (i === q.answer) b.classList.add('ok');
    else if (i === choice) b.classList.add('bad');
    else b.classList.add('dim');
  });
}
