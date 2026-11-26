// share cards drawn on a canvas, then sent through the native share sheet (or downloaded)
import { state } from './store.js';
import { fmt } from './core.js';

const appUrl = () => location.origin + location.pathname.replace(/[^/]*$/, '');
const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

function wrap(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

async function base(w, h) {
  try { await document.fonts.load('900 64px "Noto Kufi Arabic"'); await document.fonts.load('700 40px Cairo'); } catch (e) { /* ignore */ }
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const g = x.createRadialGradient(w / 2, 0, 80, w / 2, h * .4, h); g.addColorStop(0, '#1d4285'); g.addColorStop(.5, '#0b1836'); g.addColorStop(1, '#050B17');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(232,194,126,.16)'; x.lineWidth = 2;   // perspective floor
  for (let i = 0; i < 14; i++) { const y = h * .62 + Math.pow(i / 13, 2) * h * .4; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
  for (let i = -10; i <= 10; i++) { x.beginPath(); x.moveTo(w / 2 + i * 40, h * .62); x.lineTo(w / 2 + i * 190, h); x.stroke(); }
  x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, 0, 0);
  const logo = await load('icons/icon-512.png');
  return { c, x, logo };
}
// polished-gold metallic text (gradient fill, thin light edge, soft shadow)
function glowText(x, t, px, py, size) {
  x.font = `700 ${size}px "Noto Kufi Arabic", Cairo, sans-serif`; x.textAlign = 'center'; x.direction = 'rtl';
  const g = x.createLinearGradient(0, py - size * .85, 0, py + size * .25);
  [[0, '#FFF9E6'], [.22, '#F7E2AA'], [.48, '#DDB46C'], [.56, '#B98A45'], [.78, '#F4DA9C'], [1, '#CFA257']].forEach(([o, c]) => g.addColorStop(o, c));
  x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 16; x.shadowOffsetY = 8; x.fillStyle = g; x.fillText(t, px, py);
  x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
  x.lineWidth = Math.max(1, size / 110); x.strokeStyle = 'rgba(255,255,255,.28)'; x.strokeText(t, px, py - 1);
}

export async function scoreCard({ rank, total }) {
  const W = 1080, H = 1920, { c, x, logo } = await base(W, H);
  if (logo) { x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 40; x.shadowOffsetY = 20; x.drawImage(logo, W / 2 - 150, 190, 300, 300); x.restore(); }
  x.textAlign = 'center'; x.direction = 'rtl';
  glowText(x, state.profile.nick, W / 2, 640, 84);
  x.font = '700 48px Cairo, sans-serif'; x.fillStyle = '#C8CEDC'; x.fillText('يلعب باسم ' + state.profile.code, W / 2, 720);
  const pts = state.pts.audience + state.pts.sim;
  x.direction = 'ltr'; glowText(x, fmt(pts), W / 2, 1000, 230, '#E8C27E');
  x.direction = 'rtl'; x.font = '700 52px Cairo, sans-serif'; x.fillStyle = '#EDE5D6'; x.fillText('نقطة', W / 2, 1090);
  x.font = '700 44px Cairo, sans-serif'; x.fillStyle = '#C8CEDC'; x.fillText(`الترتيب ${fmt(rank)} من ${fmt(total)} في جامعتي`.replace(/جامعتي/, state.profile.type === 'org' ? 'مؤسستي' : 'جامعتي'), W / 2, 1190);
  const bw = 760, bh = 120, bx = W / 2 - bw / 2, by = 1420;
  const bg = x.createLinearGradient(0, by, 0, by + bh); bg.addColorStop(0, '#FBE7B4'); bg.addColorStop(1, '#C99A50'); x.fillStyle = bg;
  x.beginPath(); x.roundRect ? x.roundRect(bx, by, bw, bh, 30) : x.rect(bx, by, bw, bh); x.fill();
  x.fillStyle = '#2a1b06'; x.font = '900 52px "Noto Kufi Arabic", Cairo, sans-serif'; x.fillText('العب معنا في يوني ليغ', W / 2, by + 78);
  x.font = '600 34px Cairo, sans-serif'; x.fillStyle = '#C8CEDC'; x.direction = 'ltr'; x.fillText(appUrl().replace(/^https?:\/\//, ''), W / 2, 1620);
  return c;
}

export async function certCard() {
  const W = 1080, H = 1350, { c, x, logo } = await base(W, H);
  x.strokeStyle = '#C89A52'; x.lineWidth = 6; x.strokeRect(50, 50, W - 100, H - 100); x.strokeStyle = 'rgba(232,194,126,.4)'; x.lineWidth = 2; x.strokeRect(74, 74, W - 148, H - 148);
  if (logo) x.drawImage(logo, W / 2 - 110, 130, 220, 220);
  x.textAlign = 'center'; x.direction = 'rtl';
  glowText(x, 'شهادة تقدير', W / 2, 520, 100);
  x.font = '600 46px Cairo, sans-serif'; x.fillStyle = '#C8CEDC'; x.fillText('تُمنح هذه الشهادة الرقمية إلى', W / 2, 640);
  glowText(x, state.profile.nick, W / 2, 790, 110, '#E8C27E');
  x.font = '600 46px Cairo, sans-serif'; x.fillStyle = '#EDE5D6';
  const sentence = `لتجاوزه مراحل متقدمة في وضع المحاكاة بتطبيق يوني ليغ، ممثلاً ${state.profile.type === 'org' ? 'مؤسسته' : 'جامعته'} ${state.profile.code}`;
  wrap(x, sentence, 840).forEach((l, i) => x.fillText(l, W / 2, 900 + i * 66));
  x.font = '700 38px Cairo, sans-serif'; x.fillStyle = '#C8CEDC'; x.direction = 'ltr';
  x.fillText(new Date().toISOString().slice(0, 10), W / 2, 1180);
  x.direction = 'rtl'; x.font = '600 30px Cairo, sans-serif'; x.fillStyle = '#8A93AD'; x.fillText('شهادة تجريبية رقمية، لا تمثّل جائزة فعلية', W / 2, 1250);
  return c;
}

const toBlob = (c) => new Promise((r) => c.toBlob(r, 'image/png'));
export async function shareCanvas(c, text, name = 'uni-league.png') {
  const blob = await toBlob(c); const file = new File([blob], name, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, url: appUrl() }); return 'shared'; } } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  return 'downloaded';
}
export const shareText = (kind, text) => {
  const url = appUrl(), t = encodeURIComponent(text), u = encodeURIComponent(url);
  const map = { whatsapp: `https://wa.me/?text=${t}%20${u}`, telegram: `https://t.me/share/url?url=${u}&text=${t}`, x: `https://twitter.com/intent/tweet?text=${t}&url=${u}` };
  window.open(map[kind], '_blank', 'noopener');
};
export async function copyLink() { try { await navigator.clipboard.writeText(appUrl()); return true; } catch (e) { return false; } }
export const link = appUrl;
