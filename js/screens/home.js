import { state, save, level, weekPearls, LEVELS } from '../store.js';
import { $, $$, esc, fmt, go, onLeave } from '../core.js';
import { rosette, pearl } from '../ui.js';
import { live, onChange, startAuto } from '../live.js';
import { HERITAGE } from '../data.js';

const pad = (n) => String(n).padStart(2, '0');

export default function home(v) {
  const p = state.profile, lv = level();
  const week = weekPearls(), days = week.filter(Boolean).length;
  if (!state.nextAt || state.nextAt < Date.now()) { state.nextAt = Date.now() + 14 * 60e3 + 45e3; save(); }
  const nextXp = lv.next ? `${fmt(state.xp)} / ${fmt(lv.next)} للمستوى التالي (${LEVELS[lv.i + 1].n})` : 'أعلى مستوى';
  v.innerHTML = `
    <header class="hdr"><div><small>مرحباً</small><h2 class="h2">${esc(p.nick)} · <span class="num">${p.code}</span></h2></div>
      <div class="row" style="gap:8px"><span class="tag gd">${lv.n} · المستوى <span class="num">${lv.i + 1}</span></span><button class="linkbtn" data-go="#/settings">الإعدادات</button></div></header>
    <div class="hero">${rosette()}</div>
    <div id="banner"></div>
    <div class="grid2">
      <div class="card3d tilt pressable tile" data-go="#/sim"><b class="z2">العب كأنك في الحلقة</b><span class="z1">محاكاة بأربع مراحل</span><span class="cnt z1">${state.stagesCleared} / 4 مراحل</span></div>
      <div class="card3d tilt pressable tile" data-go="#/heritage"><b class="z2">مجلس التراث</b><span class="z1">تعلّم وأنت تلعب</span><span class="cnt z1">${state.cards.length} / ${HERITAGE.length} بطاقة</span></div>
    </div>
    <div class="card3d tilt" style="display:grid;gap:10px">
      <div class="row z1"><b class="t">لآلئ الأسبوع</b><span class="sm"><span class="num">${days}</span> من <span class="num">7</span> أيام</span></div>
      <div class="pearls z2">${week.map((on) => pearl(32, !on)).join('')}</div>
      <div class="xpbar z1"><i style="width:${Math.round(lv.frac * 100)}%"></i></div>
      <span class="sm z1">${nextXp}</span>
    </div>
    <div class="card3d tilt" style="display:grid;gap:4px">
      <div class="row z1"><b class="t">نقاطي</b><span class="num t" style="color:var(--gold-hi)">${fmt(state.pts.audience + state.pts.sim)}</span></div>
      <span class="sm z1">نقاط الجمهور: <span class="num">${fmt(state.pts.audience)}</span> · نقاط المحاكاة: <span class="num">${fmt(state.pts.sim)}</span></span>
      <button class="btn3d ghost sm z2" data-go="#/prizes" style="margin-top:6px">طريقك إلى الجوائز</button>
    </div>
    <p class="note">هذه النسخة لا ترسل أي إشعارات. والجوائز تجريبية حتى تعتمدها الجهات الراعية.</p>`;
  $$('[data-go]', v).forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));

  let tm = 0;
  const banner = () => {
    clearInterval(tm); const el = $('#banner', v); if (!el) return;
    if (live.on) {
      el.innerHTML = `<div class="card3d tilt gold" style="display:grid;gap:8px"><div class="row z1"><span class="tag live">مباشر الآن</span><span class="sm">الحلقة <span class="num">${live.ep}</span> · ${live.round}</span></div>
        <div class="h2 z2">${live.match.replace(/([A-Z]\d)/g, '<span class="num">$1</span>')}</div>
        <p class="sm z1">${live.gate && !live.gate.closed ? 'بوابة التصويت مفتوحة الآن!' : 'ادخل الغرفة وانتظر فتح بوابة التصويت.'}</p>
        <button class="btn3d z3" id="join">انضم إلى الحلقة</button></div>`;
      $('#join', v).onclick = () => go('#/live');
    } else {
      el.innerHTML = `<div class="card3d tilt gold" style="display:grid;gap:8px"><div class="row z1"><span class="tag az">الحلقة القادمة</span><span class="sm">الحلقة <span class="num">${live.ep}</span> · ${live.round}</span></div>
        <div class="cd z2" id="cd">--:--</div>
        <div class="row" style="gap:10px"><button class="btn3d ghost sm" id="room">غرفة الانتظار</button><button class="btn3d sm" id="demo">ابدأ بثاً تجريبياً</button></div></div>`;
      const upd = () => { const s = Math.max(0, Math.round((state.nextAt - Date.now()) / 1000)); const c = $('#cd', v); if (c) c.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
      upd(); tm = setInterval(upd, 1000);
      $('#room', v).onclick = () => go('#/live');
      $('#demo', v).onclick = () => { startAuto(); go('#/live'); };
    }
  };
  banner();
  const off = onChange(banner);
  onLeave(() => { off(); clearInterval(tm); });
}
