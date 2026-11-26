import { state } from '../store.js';
import { $, $$, esc, fmt, go, hash, toast, UNI_CODES, ORG_CODES } from '../core.js';
import { scoreCard, shareCanvas, copyLink, link, shareText } from '../share.js';

let tab = 'uni';

export default function rank(v) {
  if (state.profile.type === 'org' && tab === 'uni' && !v.dataset.once) tab = 'org';
  v.dataset.once = '1';
  draw();

  function draw() {
    const mine = state.profile.code, myType = state.profile.type;
    const contrib = state.pts.audience + state.pts.sim;
    const M = 2800 + (hash('M' + mine) % 1700);
    const within = Math.max(1, Math.round(M / (1 + contrib / 60)));
    let body = '';
    if (tab === 'council') {
      body = `<div class="card3d tilt gold" style="display:grid;gap:10px"><b class="t z1">مجلسي</b>
        <p class="sm z1">ادعُ أصدقاءك إلى مجلسك. عندما يُفعَّل الخادم ستظهر هنا نتائجهم ومنافساتكم.</p>
        <div class="field z1"><small>رابط التطبيق</small><input readonly value="${esc(link())}" id="lk" dir="ltr"></div>
        <div class="row z2" style="gap:10px"><button class="btn3d sm" id="cp">انسخ الرابط</button><button class="btn3d ghost sm" id="wa">واتساب</button></div></div>
        <p class="note">ميزة «مجلسي» تحتاج خادماً لربط الأصدقاء ببعضهم. في هذه النسخة تدعو فقط.</p>`;
    } else {
      const codes = tab === 'org' ? ORG_CODES : UNI_CODES;
      const rows = codes.map((c) => ({ c, p: 420 + (hash('base' + c) % 900) + (c === mine && myType === (tab === 'org' ? 'org' : 'uni') ? contrib : 0) })).sort((a, b) => b.p - a.p);
      const max = rows[0].p;
      body = `<div style="display:grid;gap:10px">${rows.map((r, i) => `<div class="card3d tilt ${r.c === mine ? 'gold' : ''}" style="padding:11px 14px"><div class="brow z1 ${r.c === mine ? 'me' : ''}" style="grid-template-columns:30px 40px 1fr 56px"><span class="num t">${i + 1}</span><span class="c">${r.c}</span><div class="bar"><i style="width:${Math.round(r.p / max * 100)}%"></i></div><span class="v">${fmt(r.p)}</span></div></div>`).join('')}</div>
        <p class="note">${tab === 'org' ? 'دوري المؤسسات يُفتح بدعوة رسمية من الجهات المشاركة، ويضم تحدّي مؤسسة لجامعة.' : 'نقاط الجامعات تجريبية، وتُضاف إليها نقاطك فوراً.'}</p>`;
    }
    v.innerHTML = `
      <header class="hdr"><h1 class="h3d h1">الترتيب</h1><span class="tag az">بيانات تجريبية</span></header>
      <div class="seg"><button data-t="uni" class="${tab === 'uni' ? 'on' : ''}">الجامعات</button><button data-t="org" class="${tab === 'org' ? 'on' : ''}">المؤسسات</button><button data-t="council" class="${tab === 'council' ? 'on' : ''}">مجلسي</button></div>
      <div class="card3d tilt gold" style="display:grid;gap:4px"><span class="eyebrow z1">ترتيبك داخل ${myType === 'org' ? 'مؤسستك' : 'جامعتك'} (تقديري)</span><div class="h2 z2"><span class="num">#${fmt(within)}</span> من <span class="num">${fmt(M)}</span></div><span class="sm z1">نقاطك: <span class="num">${fmt(contrib)}</span></span></div>
      ${body}
      <button class="btn3d" id="share">شارك نتيجتك</button>`;
    $$('[data-t]', v).forEach((b) => b.onclick = () => { tab = b.dataset.t; draw(); });
    $('#share', v).onclick = async (e) => {
      const btn = e.currentTarget; btn.disabled = true;
      try { const c = await scoreCard({ rank: within, total: M }); const r = await shareCanvas(c, `أنا ${state.profile.nick} ألعب في يوني ليغ`, 'uni-league-result.png'); if (r === 'downloaded') toast('حُفظت صورة النتيجة، انشرها في قصتك'); }
      catch (err) { toast('تعذّر إنشاء البطاقة'); } finally { btn.disabled = false; }
    };
    const cp = $('#cp', v), wa = $('#wa', v);
    if (cp) cp.onclick = async () => toast((await copyLink()) ? 'نُسخ الرابط' : 'انسخ الرابط يدوياً');
    if (wa) wa.onclick = () => shareText('whatsapp', 'تعال العب معي في يوني ليغ');
  }
}
