import { state, save, resetAll } from '../store.js';
import { $, $$, go, toast, modal } from '../core.js';
import { startAuto, stopAuto } from '../live.js';

let deferred = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });

export default function settings(v) {
  const sw = (key, title, desc) => `<div class="switch"><div><b class="t">${title}</b><div class="sm">${desc}</div></div><button data-k="${key}" class="${state.settings[key] ? 'on' : ''}" aria-pressed="${!!state.settings[key]}" aria-label="${title}"></button></div>`;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  v.innerHTML = `
    <header class="hdr"><h1 class="h3d h1">الإعدادات</h1><button class="linkbtn" data-go="#/home">رجوع</button></header>
    <div class="card3d tilt">${sw('sound', 'الأصوات', 'مؤثرات قصيرة عند الإجابة وفتح البوابة. متوقفة افتراضياً.')}${sw('haptics', 'الاهتزاز', 'اهتزاز خفيف في الأجهزة التي تدعمه.')}${sw('calm', 'وضع الهدوء', 'يوقف الحركة والإمالة ثلاثية الأبعاد لمن يفضّل ذلك.')}${sw('auto', 'بثّ تجريبي تلقائي', 'يشغّل مخرجاً داخلياً يفتح بوابة تصويت كل نحو 24 ثانية.')}</div>
    <div class="card3d tilt" style="display:grid;gap:10px"><b class="t">تثبيت التطبيق</b>
      <p class="sm">${ios ? 'في آيفون: اضغط زر المشاركة في المتصفح ثم «إضافة إلى الشاشة الرئيسية».' : 'ثبّته على شاشتك الرئيسية ليعمل كتطبيق، حتى دون اتصال بعد أول فتح.'}</p>
      <button class="btn3d sm" id="install">ثبّت التطبيق</button></div>
    <div class="card3d tilt" style="display:grid;gap:10px"><b class="t">لوحة المخرج (تجريبية)</b>
      <p class="sm">افتحها في تبويب آخر من المتصفح نفسه. من هناك تفتح بوابة التصويت فتظهر هنا فوراً.</p>
      <a class="btn3d ghost sm" href="control.html" target="_blank" rel="noopener">افتح لوحة المخرج</a></div>
    <div class="card3d tilt" style="display:grid;gap:8px"><b class="t">حسابي</b>
      <p class="sm">${state.profile.nick} · ${state.profile.code}</p>
      <div class="row" style="gap:10px"><button class="btn3d ghost sm" id="chg">غيّر الجامعة أو الاسم</button><button class="btn3d warn sm" id="rst">مسح تقدّمي</button></div></div>
    <div class="card3d" style="display:grid;gap:6px"><b class="t">عن هذه النسخة</b>
      <p class="sm">نموذج تجريبي لتطبيق برنامج يوني ليغ. الأرقام والنتائج الجماعية تجريبية. تصويت الجمهور «نقاط جمهور» منفصلة ولا تؤثر في النتيجة الرسمية للحلقة. لا حسابات ولا رسوم ولا رهان، وبياناتك على جهازك فقط. لا إشعارات في هذه النسخة، وعند إضافتها لن تُرسل وقت الأذان ولا صلاة الجمعة.</p></div>`;
  $$('.switch button', v).forEach((b) => b.onclick = () => {
    const k = b.dataset.k; state.settings[k] = !state.settings[k]; save(); b.classList.toggle('on', state.settings[k]); b.setAttribute('aria-pressed', state.settings[k]);
    if (k === 'calm') document.body.classList.toggle('calm', state.settings.calm);
    if (k === 'auto') { state.settings.auto ? startAuto() : stopAuto(); }
  });
  $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go));
  $('#install', v).onclick = async () => {
    if (deferred) { deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; }
    else toast(ios ? 'استخدم زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»' : 'خيار التثبيت يظهر في قائمة المتصفح عند فتح التطبيق من رابط آمن');
  };
  $('#chg', v).onclick = () => go('#/start');
  $('#rst', v).onclick = () => {
    const m = modal(`<div style="display:grid;gap:12px;text-align:center"><div class="h2">مسح التقدّم؟</div><p class="sm">تُمسح نقاطك وبطاقاتك ومراحلك من هذا الجهاز.</p><button class="btn3d warn" id="yes">نعم، امسح</button><button class="btn3d ghost" data-close>إلغاء</button></div>`);
    $('#yes').onclick = () => { resetAll(); m.close(); go('#/start'); };
  };
}
