import { state, save, addXp, touchDay } from '../store.js';
import { $, $$, esc, go, hash, onLeave, UNI_CODES, ORG_CODES } from '../core.js';
import { live, onChange, startAuto, stopAuto, send } from '../live.js';
import { gate3d, ring3d, setRing, keysHtml, markKeys } from '../ui.js';
import { play, buzz } from '../sfx.js';

const answers = {};   // gate key -> { choice, ms }
const awarded = {};   // gate key -> { ok, pts, answered }
const pad = (n) => String(n).padStart(2, '0');

export default function liveView(v) {
  let tm = 0, lastMode = '';
  const off = onChange(draw);
  onLeave(() => { off(); clearInterval(tm); });
  draw();

  function wire() { $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go)); }

  function draw() {
    clearInterval(tm);
    if (!live.on) return waiting();
    const g = live.gate;
    if (!g) return lobby();
    const rem = g.dur - (Date.now() - g.openedAt) / 1000;
    if (!g.closed && rem > 0) return withDoors(g, rem);
    return reveal(g);
  }

  function waiting() {
    lastMode = 'waiting';
    v.innerHTML = `
      <header class="hdr"><h1 class="h3d h1">غرفة الانتظار</h1><button class="linkbtn" data-go="#/home">رجوع</button></header>
      ${gate3d(false, 'البوابة مغلقة')}
      <div class="card3d tilt gold" style="display:grid;gap:6px"><div class="eyebrow z1">الحلقة ${live.ep} · ${live.round}</div><div class="cd z2" id="cd">--:--</div><span class="sm center z1">الحلقة تبدأ بعد</span></div>
      <div class="card3d tilt"><b class="t z1">كيف تلعب؟</b><p class="sm z1" style="margin-top:4px">1) تُفتح بوابة التصويت فجأة أثناء البث.<br>2) أجب خلال <span class="num">12</span> ثانية.<br>3) نقاطك تُحتسب لجامعتك في الترتيب، وهي نقاط جمهور منفصلة عن النتيجة الرسمية.</p></div>
      <button class="btn3d" id="demo">ابدأ بثاً تجريبياً</button>
      <a class="btn3d ghost" href="control.html" target="_blank" rel="noopener">افتح لوحة المخرج في تبويب آخر</a>
      <p class="note">البث التجريبي يفتح بوابة تصويت كل نحو 24 ثانية. ومن لوحة المخرج تتحكم أنت في كل شيء.</p>`;
    wire(); $('#demo', v).onclick = () => startAuto();
    const upd = () => { const s = Math.max(0, Math.round((state.nextAt - Date.now()) / 1000)); const c = $('#cd', v); if (c) c.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
    upd(); tm = setInterval(upd, 1000);
  }

  function lobby() {
    lastMode = 'lobby';
    v.innerHTML = `
      <div class="row"><span class="tag live">مباشر الآن</span><span class="sm">الحلقة <span class="num">${live.ep}</span> · ${live.round}</span></div>
      ${gate3d(false, 'بانتظار فتح بوابة التصويت')}
      <div class="card3d tilt gold" style="display:grid;gap:6px"><div class="h2 z2 center">${live.match.replace(/([A-Z]\d)/g, '<span class="num">$1</span>')}</div><p class="sm center z1">ابقَ في هذه الشاشة. عند إشارة المخرج تنفتح البوابة ويظهر السؤال.</p></div>
      ${live.source === 'auto' ? '<button class="btn3d warn sm" id="stop">أوقف البث التجريبي</button>' : ''}
      <button class="btn3d ghost" data-go="#/home">العودة إلى الرئيسية</button>`;
    wire(); const s = $('#stop', v); if (s) s.onclick = () => stopAuto();
  }

  function withDoors(g, rem) {
    if (lastMode === 'lobby') {
      lastMode = 'opening'; play.gate(); buzz([60, 40, 90]);
      v.innerHTML = `<div class="row"><span class="tag live">بوابة التصويت مفتوحة</span></div>${gate3d(false, 'تنفتح الآن…')}<div class="h2 center">استعد</div>`;
      requestAnimationFrame(() => requestAnimationFrame(() => { const d = $('#gate3d', v); if (d) d.classList.add('open'); }));
      setTimeout(() => { lastMode = 'vote'; draw(); }, 900); return;
    }
    if (lastMode === 'opening') return;
    lastMode = 'vote'; vote(g, rem);
  }

  function vote(g, rem) {
    const key = g.key, ans = answers[key];
    v.innerHTML = `
      <div class="row"><span class="tag live">بوابة التصويت مفتوحة</span><span class="tag az">نقاط جمهور</span></div>
      ${ring3d(rem / g.dur, Math.ceil(rem))}
      <div class="eyebrow center">${esc(g.q.topic)}</div>
      <h2 class="qtxt">${esc(g.q.q)}</h2>
      ${keysHtml(g.q)}
      <p class="note" id="vnote">${ans ? 'تم تسجيل إجابتك. بانتظار الكشف…' : 'نقاط الجمهور منفصلة ولا تؤثر في النتيجة الرسمية للحلقة.'}</p>`;
    const keys = $$('.key', v);
    const lockUi = (choice) => keys.forEach((b) => { b.disabled = true; b.classList.toggle('sel', +b.dataset.i === choice); b.classList.toggle('dim', +b.dataset.i !== choice); });
    if (ans) lockUi(ans.choice);
    else keys.forEach((b) => b.onclick = () => {
      const choice = +b.dataset.i, ms = Date.now() - g.openedAt;
      answers[key] = { choice, ms }; play.tick(); buzz(20); lockUi(choice);
      $('#vnote', v).textContent = 'تم تسجيل إجابتك. بانتظار الكشف…';
      send({ type: 'answer', code: state.profile.code, ok: choice === g.q.answer, ms, qid: g.q.id });
    });
    let lastSec = -1;
    tm = setInterval(() => {
      const r = g.dur - (Date.now() - g.openedAt) / 1000;
      if (r <= 0 || g.closed) { clearInterval(tm); draw(); return; }
      setRing(r / g.dur, Math.ceil(r), r <= 4);
      if (r <= 4 && Math.ceil(r) !== lastSec) { lastSec = Math.ceil(r); play.tick(); }
    }, 100);
  }

  function reveal(g) {
    lastMode = 'reveal';
    const key = g.key, a = answers[key], ok = !!a && a.choice === g.q.answer;
    let aw = awarded[key];
    if (!aw) {
      let pts = 0; if (ok) pts = 10 + Math.round(Math.max(0, 1 - a.ms / (g.dur * 1000)) * 5);
      aw = awarded[key] = { ok, pts, answered: !!a };
      state.pts.audience += pts; addXp(ok ? 5 : a ? 1 : 0); touchDay(); save();
      if (ok) { play.ok(); buzz(40); } else if (a) { play.bad(); buzz([30, 30, 30]); }
    }
    const mine = state.profile.code, pool = state.profile.type === 'org' ? ORG_CODES : UNI_CODES;
    const others = pool.filter((c) => c !== mine).sort((x, y) => hash(key + x) - hash(key + y)).slice(0, 3);
    const rows = [mine, ...others].map((c) => ({ c, p: 48 + (hash(key + c) % 44) }));
    v.innerHTML = `
      <div class="row"><span class="tag gd">كشف الإجابة</span><span class="sm">${aw.answered ? '' : 'فاتتك هذه البوابة'}</span></div>
      ${aw.answered ? `<div class="big">${ok ? '+' + aw.pts : '0'}</div><p class="sm center">${ok ? 'إجابتك صحيحة. نقاط جمهور' : 'إجابتك غير صحيحة، والتعلّم مكسب'}</p>` : '<p class="sm center">لم تُسجَّل إجابة هذه المرة.</p>'}
      <h2 class="qtxt" style="font-size:16.5px">${esc(g.q.q)}</h2>
      ${keysHtml(g.q)}
      <div class="card3d tilt" style="display:grid;gap:10px"><div class="sm z1">الإجابات الصحيحة بحسب الجامعة (بيانات تجريبية)</div>
        ${rows.map((r) => `<div class="brow z1 ${r.c === mine ? 'me' : ''}"><span class="c">${r.c}</span><div class="bar"><i style="width:${r.p}%"></i></div><span class="v">${r.p}%</span></div>`).join('')}</div>
      <div class="card3d"><b class="t">هل تعلم؟</b><p class="sm" style="margin-top:3px">${esc(g.q.fact)}</p></div>
      <p class="note">بانتظار السؤال التالي. ستنفتح البوابة من جديد تلقائياً.</p>
      <button class="btn3d ghost" data-go="#/home">العودة إلى الرئيسية</button>`;
    markKeys(v, g.q, a ? a.choice : null); wire();
  }
}
