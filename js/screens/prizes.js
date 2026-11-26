import { state } from '../store.js';
import { $, $$, go, toast } from '../core.js';
import { coin } from '../ui.js';
import { HERITAGE } from '../data.js';
import { certCard, shareCanvas } from '../share.js';

export default function prizes(v) {
  const s = state.stagesCleared;
  const items = [
    { n: 1, t: 'وسام الغوّاص', d: 'رقمي · تجاوز دور المجموعات', ok: s >= 1, coin: coin('الغوّاص', 'وسام', 84, true) },
    { n: 2, t: 'بطاقة تراث نادرة', d: 'تجاوز ربع النهائي', ok: s >= 2, coin: coin('نادرة', 'تراث', 84, true) },
    { n: 3, t: 'شهادة رقمية باسمك', d: 'تجاوز نصف النهائي · قابلة للمشاركة', ok: s >= 3, coin: coin('شهادة', 'رقمية', 84, true), cert: true },
    { n: 4, t: 'الجائزة الكبرى', d: 'تجاوز النهائي · من الجهات الراعية', ok: s >= 4, coin: coin('الكبرى', 'تجريبية', 84, true) },
  ];
  v.innerHTML = `
    <header class="hdr"><h1 class="h3d h1">طريقك إلى الجوائز</h1><button class="linkbtn" data-go="#/home">رجوع</button></header>
    <p class="sm">كل مرحلة تتجاوزها في المحاكاة تفتح مكافأة جديدة. أنجزتَ <span class="num">${s}</span> من <span class="num">4</span> مراحل، وجمعتَ <span class="num">${state.cards.length}</span> من <span class="num">${HERITAGE.length}</span> بطاقة تراث.</p>
    ${items.map((it) => `<div class="card3d tilt rwd ${it.ok ? '' : 'lock'}"><div class="z2" style="width:84px">${it.ok ? it.coin : `<span class="n">${it.n}</span>`}</div><div class="z1"><b>${it.t}</b><span class="d">${it.d}</span>${it.ok && it.cert ? '<br><button class="btn3d sm" id="cert" style="margin-top:8px;width:auto;display:inline-block">حمّل الشهادة</button>' : ''}</div><span class="tag ${it.ok ? 'ok' : ''} z1">${it.ok ? 'مفتوحة' : 'مغلقة'}</span></div>`).join('')}
    <button class="btn3d" data-go="#/sim">${s >= 4 ? 'العب مجدداً' : 'تابع المحاكاة'}</button>
    <p class="note">الجوائز تجريبية في هذه النسخة. الجوائز الفعلية تحدّدها الجهات الراعية وتخضع لتصريح الجهة المختصة. لا رهان ولا رسوم دخول.</p>`;
  $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go));
  const c = $('#cert', v);
  if (c) c.onclick = async () => {
    c.disabled = true;
    try { const cv = await certCard(); const r = await shareCanvas(cv, 'شهادتي الرقمية من يوني ليغ', 'uni-league-certificate.png'); if (r === 'downloaded') toast('حُفظت الشهادة على جهازك'); }
    catch (e) { toast('تعذّر إنشاء الشهادة'); } finally { c.disabled = false; }
  };
}
