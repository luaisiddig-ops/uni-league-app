import { state, save, touchDay } from '../store.js';
import { $, $$, esc, go, UNI_CODES, ORG_CODES, toast } from '../core.js';
import { rosette } from '../ui.js';

export default function start(v) {
  let type = state.profile?.type || 'uni';
  let code = state.profile?.code || 'A2';
  const draw = () => {
    const codes = type === 'uni' ? UNI_CODES : ORG_CODES;
    if (!codes.includes(code)) code = codes[0];
    v.innerHTML = `
      <div class="hero">${rosette()}<h1 class="h3d h1 center">ألعب مع الحلقة</h1>
      <p class="sm center">اختر جامعتك أو مؤسستك لتنافس باسمها.</p></div>
      <div class="seg"><button data-t="uni" class="${type === 'uni' ? 'on' : ''}">جامعة</button><button data-t="org" class="${type === 'org' ? 'on' : ''}">مؤسسة</button></div>
      <div class="chips">${codes.map((c) => `<button data-c="${c}" class="${c === code ? 'on' : ''}">${c}</button>`).join('')}</div>
      <label class="field"><small>اسمك المستعار</small><input id="nick" maxlength="18" autocomplete="off" placeholder="مثال: صقر الشرق" value="${esc(state.profile?.nick || '')}"></label>
      <button class="btn3d" id="enter">ادخل</button>
      <p class="sm center">الدخول كضيف: بلا بريد ولا كلمة مرور. بياناتك تُحفظ على جهازك فقط.</p>
      <p class="note">رموز الجامعات والمؤسسات هنا رموز تجريبية كما في نموذج الوثيقة.</p>`;
    $$('[data-t]', v).forEach((b) => b.onclick = () => { type = b.dataset.t; draw(); });
    $$('[data-c]', v).forEach((b) => b.onclick = () => { code = b.dataset.c; $$('[data-c]', v).forEach((x) => x.classList.toggle('on', x === b)); });
    $('#enter', v).onclick = () => {
      const nick = ($('#nick', v).value || '').trim() || 'لاعب ' + code;
      if (nick.length < 2) { toast('اكتب اسماً من حرفين على الأقل'); return; }
      state.profile = { type, code, nick }; save(); touchDay(); go('#/home');
    };
  };
  draw();
}
