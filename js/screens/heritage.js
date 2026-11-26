import { state, save, addXp, touchDay } from '../store.js';
import { $, $$, esc, go, modal, onLeave, shuffle, toast } from '../core.js';
import { HERITAGE, H_SECTIONS, BANK, hasCard, unlockCard } from '../data.js';
import { keysHtml, markKeys, coin, logoDisc } from '../ui.js';
import { play, buzz } from '../sfx.js';
import { link } from '../share.js';

const coinLabel = (c) => (c.title.length <= 10 ? c.title : c.section.split(' ')[0]);

export function showCard(card, subtitle = '') {
  play.card(); buzz([40, 30, 80]);
  const sec = H_SECTIONS.find((s) => s.name === card.section);
  const m = modal(`<div style="display:grid;gap:10px;justify-items:center;text-align:center">
    <span class="tag gd">${card.rare ? 'بطاقة نادرة' : 'بطاقة تراث'}</span>
    <div class="z3">${coin(coinLabel(card), sec ? sec.sub : 'تراث', 150)}</div>
    <h2 class="h3d" style="font-size:22px">${esc(card.title)}</h2>
    <p class="sm">${esc(card.section)}</p>
    <p style="font-size:14.5px;line-height:1.85">${esc(card.text)}</p>
    ${subtitle ? `<p class="sm">${esc(subtitle)}</p>` : ''}
    <span class="tag">مسودة · تُراجَع مع مختص تراث قبل النشر</span>
    <div class="row" style="width:100%;gap:10px"><button class="btn3d" data-close>أضفها إلى خزانتي</button><button class="btn3d ghost" id="shc">شارك</button></div></div>`, { gold: true });
  const b = $('#shc'); if (b) b.onclick = async () => {
    const text = `بطاقة تراث من تطبيق يوني ليغ: ${card.title}. ${card.text}`;
    try { if (navigator.share) { await navigator.share({ text, url: link() }); return; } } catch (e) { return; }
    try { await navigator.clipboard.writeText(text + ' ' + link()); toast('نُسخ النص، الصقه حيث تشاء'); } catch (e) { toast('تعذّر النسخ'); }
  };
  return m;
}

export default function heritage(v, args) {
  if (args[0] === 'quiz') return quiz(v, +args[1]);
  if (args[0] === 'cards') return cards(v);
  return hub(v);
}

function hub(v) {
  const words = HERITAGE.filter((c) => c.section === 'اللهجة الإماراتية');
  const w = words.length ? words[Math.floor(Date.now() / 864e5) % words.length] : null;
  v.innerHTML = `
    <header class="hdr"><h1 class="h3d h1">مجلس التراث</h1><span class="tag gd"><span class="num">${state.cards.length} / ${HERITAGE.length}</span> بطاقة</span></header>
    <p class="sm">تعلّم من تراث الإمارات وأنت تلعب. كل إجابة صحيحة تفتح بطاقة تُحفظ في خزانتك.</p>
    ${w ? `<div class="card3d tilt gold pressable" id="wod"><span class="eyebrow z1">كلمة اليوم</span><div class="h2 z2">${esc(w.title)}</div><p class="sm z1">${esc(w.text)}</p></div>` : ''}
    <div class="grid2">${H_SECTIONS.map((s, i) => { const cs = HERITAGE.filter((c) => c.section === s.name), have = cs.filter((c) => hasCard(c.id)).length;
      return `<div class="card3d tilt pressable tile" data-q="${i}"><b class="z2">${s.name}</b><span class="z1">${s.sub}</span><span class="cnt z1">${have} / ${cs.length}</span></div>`; }).join('')}</div>
    <button class="btn3d ghost" data-go="#/heritage/cards">خزانتي</button>
    <p class="note">بطاقات التراث مسودات تُراجَع مع مختص تراث قبل أي نشر. بعض الأمثال والألفاظ تختلف بين المناطق.</p>`;
  $$('[data-q]', v).forEach((t) => t.onclick = () => go('#/heritage/quiz/' + t.dataset.q));
  $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go));
  const wod = $('#wod', v); if (wod) wod.onclick = () => showCard(w, 'كلمة اليوم');
}

function quiz(v, idx) {
  const sec = H_SECTIONS[idx]; if (!sec) { go('#/heritage'); return; }
  const pool = BANK.filter((q) => q.part === 'H' && q.topic === sec.name);
  const qs = [...shuffle(pool.filter((q) => !hasCard(q.id))), ...shuffle(pool.filter((q) => hasCard(q.id)))].slice(0, 5);
  if (!qs.length) { v.innerHTML = `<p class="sm">لا توجد أسئلة في هذا القسم بعد.</p><button class="btn3d ghost" data-go="#/heritage">رجوع</button>`; $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go)); return; }
  let i = 0, right = 0; const gained = [];
  const timers = []; onLeave(() => timers.forEach(clearTimeout));

  function ask() {
    const q = qs[i];
    v.innerHTML = `
      <div class="row"><span class="eyebrow">${sec.name} · <span class="num">${i + 1}</span> / <span class="num">${qs.length}</span></span><button class="linkbtn" data-go="#/heritage">خروج</button></div>
      <div class="xpbar"><i style="width:${Math.round(i / qs.length * 100)}%"></i></div>
      <h2 class="qtxt">${esc(q.q)}</h2>${keysHtml(q)}<div id="after"></div>`;
    $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go));
    $$('.key', v).forEach((b) => b.onclick = () => answer(+b.dataset.i));
  }
  function answer(choice) {
    const q = qs[i], ok = choice === q.answer; markKeys(v, q, choice); touchDay();
    let card = null;
    if (ok) { right++; addXp(6); play.ok(); buzz(40); if (unlockCard(q.id)) { card = HERITAGE.find((c) => c.id === q.id); gained.push(card); } } else { play.bad(); buzz([30, 30, 30]); }
    save();
    const last = i >= qs.length - 1;
    $('#after', v).innerHTML = `<div class="card3d" style="display:grid;gap:6px;margin:6px 0 12px"><b class="t">${ok ? 'أحسنت' : 'الإجابة الصحيحة موضّحة أعلاه'}</b><p class="sm">${esc(q.fact)}</p>${card ? '<p class="note">فتحتَ بطاقة تراث جديدة!</p>' : ''}</div><button class="btn3d" id="nx">${last ? 'النتيجة' : 'التالي'}</button>`;
    $('#after', v).scrollIntoView({ block: 'end', behavior: 'smooth' });
    $('#nx', v).onclick = () => { i++; if (i >= qs.length) done(); else ask(); };
    if (card) timers.push(setTimeout(() => showCard(card), 650));
  }
  function done() {
    v.innerHTML = `
      <div class="center" style="display:grid;gap:8px"><span class="tag gd" style="justify-self:center">${sec.name}</span><h1 class="h3d h1">أجبتَ <span class="num">${right}</span> من <span class="num">${qs.length}</span></h1></div>
      ${gained.length ? `<div class="card3d tilt gold" style="display:grid;gap:8px"><b class="t z1">بطاقات جديدة</b>${gained.map((c) => `<div class="row z1"><span>${esc(c.title)}</span>${logoDisc(34)}</div>`).join('')}</div>` : '<p class="sm center">لا بطاقات جديدة هذه المرة. جرّب القسم مرة أخرى.</p>'}
      <button class="btn3d" data-go="#/heritage/quiz/${idx}">جولة جديدة في القسم</button>
      <button class="btn3d ghost" data-go="#/heritage/cards">خزانتي</button><button class="btn3d ghost" data-go="#/heritage">الأقسام</button>`;
    $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go));
  }
  ask();
}

function cards(v) {
  const sorted = [...HERITAGE].sort((a, b) => H_SECTIONS.findIndex((s) => s.name === a.section) - H_SECTIONS.findIndex((s) => s.name === b.section));
  v.innerHTML = `
    <header class="hdr"><h1 class="h3d h1">خزانتي</h1><button class="linkbtn" data-go="#/heritage">رجوع</button></header>
    <p class="sm"><span class="num">${state.cards.length}</span> من <span class="num">${HERITAGE.length}</span> بطاقة. المغلقة تُفتح بالإجابة الصحيحة في أقسام المجلس أو في المحاكاة.</p>
    <div class="hgrid">${sorted.map((c) => hasCard(c.id)
      ? `<div class="card3d tilt pressable hcard" data-id="${c.id}">${logoDisc(46)}<span class="z2">${esc(c.title.length > 22 ? c.title.slice(0, 21) + '…' : c.title)}</span><small class="z1">${esc(c.section.split(' ')[0])}</small></div>`
      : `<div class="card3d hcard lock">${logoDisc(46, true)}<span>؟</span></div>`).join('')}</div>`;
  $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go));
  $$('[data-id]', v).forEach((t) => t.onclick = () => showCard(HERITAGE.find((c) => c.id === t.dataset.id)));
}
