// director's control room (prototype). Talks to the app tabs of the same browser through BroadcastChannel.
// In production the same messages would come from a realtime server; the message shapes stay the same.
import { loadData, BANK } from './data.js';
import { $, $$, esc, fmt, shuffle, UNI_CODES } from './core.js';
import { initParallax } from './tilt.js';

const ch = new BroadcastChannel('uni-league-live');
const ROUNDS = ['دور المجموعات', 'ربع النهائي', 'نصف النهائي', 'النهائي'];
const S = { on: false, ep: 7, round: 'ربع النهائي', match: 'A2 ضد C3', dur: 12, queue: [], sel: null, gate: null, tally: { total: 0, ok: 0, ms: 0, by: {} } };
let closeT = 0, tick = 0;

const pushState = () => { ch.postMessage({ type: 'episode.state', on: S.on, ep: S.ep, round: S.round, match: S.match }); if (S.gate && !S.gate.closed) ch.postMessage({ type: 'gate.open', questionId: S.gate.q.id, durationSec: S.gate.dur, openedAt: S.gate.openedAt }); };
ch.onmessage = (e) => {
  const m = e.data; if (!m) return;
  if (m.type === 'hello') pushState();
  if (m.type === 'answer' && S.gate && m.qid === S.gate.q.id) {
    const t = S.tally; t.total++; if (m.ok) t.ok++; t.ms += m.ms || 0; const b = (t.by[m.code] ||= { n: 0, ok: 0 }); b.n++; if (m.ok) b.ok++; stats();
  }
};

function newQueue() { S.queue = shuffle(BANK.filter((q) => q.part !== 'H')).slice(0, 8); S.sel = S.queue[0].id; }

function openGate() {
  const q = BANK.find((x) => x.id === S.sel); if (!q) return;
  if (!S.on) { S.on = true; pushState(); }
  S.tally = { total: 0, ok: 0, ms: 0, by: {} };
  S.gate = { q, dur: S.dur, openedAt: Date.now(), closed: false };
  ch.postMessage({ type: 'gate.open', questionId: q.id, durationSec: S.dur, openedAt: S.gate.openedAt });
  clearTimeout(closeT); closeT = setTimeout(closeGate, S.dur * 1000);
  clearInterval(tick); tick = setInterval(timer, 200);
  draw();
}
function closeGate() {
  if (!S.gate || S.gate.closed) return;
  S.gate.closed = true; ch.postMessage({ type: 'gate.close' }); clearTimeout(closeT); clearInterval(tick); draw();
}
function timer() {
  const g = S.gate; const el = $('#cnt'); if (!g || !el) return;
  const r = Math.max(0, g.dur - (Date.now() - g.openedAt) / 1000); el.textContent = g.closed ? 'مغلقة' : r.toFixed(1);
}
function stats() {
  const t = S.tally, el = $('#stats'); if (!el) return;
  const pct = t.total ? Math.round(100 * t.ok / t.total) : 0, avg = t.total ? (t.ms / t.total / 1000).toFixed(1) : '0.0';
  const rows = Object.entries(t.by).sort((a, b) => b[1].n - a[1].n).slice(0, 8);
  el.innerHTML = `<div class="kpis"><div class="card3d kpi"><b>${fmt(t.total)}</b><span>إجابة مستلمة</span></div><div class="card3d kpi"><b>${pct}%</b><span>نسبة الصحيحة</span></div><div class="card3d kpi"><b>${avg}s</b><span>متوسط الزمن</span></div></div>
    <div style="display:grid;gap:9px;margin-top:12px">${rows.length ? rows.map(([c, b]) => `<div class="brow"><span class="c">${c}</span><div class="bar"><i style="width:${Math.round(100 * b.n / Math.max(1, rows[0][1].n))}%"></i></div><span class="v">${b.n}</span></div>`).join('') : '<p class="sm">لا إجابات بعد. افتح التطبيق في تبويب آخر وأجب.</p>'}</div>`;
}

function draw() {
  const g = S.gate, open = g && !g.closed;
  $('#root').innerHTML = `
    <header class="row"><div><h1 class="h3d h1">لوحة المخرج</h1><p class="sm">محاكاة تجريبية داخل هذا المتصفح. افتح التطبيق في تبويب آخر لترى النتيجة.</p></div><span class="tag az">تجريبي</span></header>
    <div class="ctlgrid">
      <div class="card3d" style="display:grid;gap:12px">
        <div class="row"><b class="t">حالة الحلقة</b><span class="tag ${S.on ? 'live' : ''}">${S.on ? 'مباشر' : 'متوقفة'}</span></div>
        <button class="btn3d ${S.on ? 'warn' : ''}" id="ep">${S.on ? 'أنهِ الحلقة' : 'ابدأ الحلقة'}</button>
        <div class="seg">${ROUNDS.map((r) => `<button data-r="${r}" class="${r === S.round ? 'on' : ''}">${r}</button>`).join('')}</div>
        <label class="field"><small>المواجهة</small><input id="match" value="${esc(S.match)}"></label>
        <div class="row"><b class="t">مدة العدّاد</b><div class="seg" style="width:60%">${[8, 12, 20].map((d) => `<button data-d="${d}" class="${d === S.dur ? 'on' : ''}">${d}</button>`).join('')}</div></div>
        <button class="btn3d" id="open" ${open ? 'disabled' : ''}>افتح بوابة التصويت</button>
        <button class="btn3d warn sm" id="close" ${open ? '' : 'disabled'}>إغلاق فوري</button>
        <div class="row"><span class="sm">حالة البوابة</span><span class="num t" id="cnt" style="color:var(--gold-hi)">${open ? '' : g ? 'مغلقة' : 'جاهزة'}</span></div>
        <p class="note">نقاط الجمهور لا تدخل في النتيجة الرسمية. الأسبقية تُحسم داخل الاستديو.</p>
      </div>
      <div class="card3d">
        <div class="row" style="margin-bottom:10px"><b class="t">طابور أسئلة الجمهور</b><button class="linkbtn" id="more">أسئلة أخرى</button></div>
        ${S.queue.map((q) => `<button class="qrow ${q.id === S.sel ? 'on' : ''}" data-q="${q.id}">${esc(q.q)}<small>${esc(q.topic)} · ${q.difficulty}</small></button>`).join('')}
      </div>
    </div>
    <div class="card3d"><b class="t">الإجابات الواردة حياً</b><div id="stats" style="margin-top:10px"></div></div>`;
  $('#ep').onclick = () => { S.on = !S.on; if (!S.on) { closeGate(); S.gate = null; } pushState(); draw(); };
  $$('[data-r]').forEach((b) => b.onclick = () => { S.round = b.dataset.r; pushState(); draw(); });
  $('#match').onchange = (e) => { S.match = e.target.value; pushState(); };
  $$('[data-d]').forEach((b) => b.onclick = () => { S.dur = +b.dataset.d; draw(); });
  $$('[data-q]').forEach((b) => b.onclick = () => { S.sel = b.dataset.q; draw(); });
  $('#more').onclick = () => { newQueue(); draw(); };
  $('#open').onclick = openGate; $('#close').onclick = closeGate;
  stats(); timer();
}

(async () => { initParallax(); await loadData(); newQueue(); draw(); ch.postMessage({ type: 'hello' }); })();
