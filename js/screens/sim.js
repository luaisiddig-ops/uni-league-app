import { state, save, addXp, touchDay } from '../store.js';
import { $, $$, esc, fmt, go, onLeave, shuffle, UNI_CODES, ORG_CODES } from '../core.js';
import { BANK, pickQuestions, randomLockedCard, unlockCard } from '../data.js';
import { keysHtml, markKeys, coin } from '../ui.js';
import { play as sfx, buzz } from '../sfx.js';
import { showCard } from './heritage.js';

// transfer shares per stage are the ones in the document («الخزينة الحية»): 80 / 90 / 95 / 100
export const STAGES = [
  { n: 'دور المجموعات', take: .8, qn: 5, oppP: .5, hard: .2, reward: 'وسام الغوّاص', rk: 'badge' },
  { n: 'ربع النهائي', take: .9, qn: 5, oppP: .6, hard: .35, reward: 'بطاقة تراث نادرة', rk: 'card' },
  { n: 'نصف النهائي', take: .95, qn: 6, oppP: .68, hard: .5, reward: 'شهادة رقمية', rk: 'cert' },
  { n: 'النهائي', take: 1, qn: 7, oppP: .75, hard: .6, reward: 'الجائزة الكبرى (تجريبية)', rk: 'grand' },
];
const UNIT = 10000, START = 100000, QTIME = 12;
const pct = (x) => Math.round(x * 100) + '%';
let run = null;

export default function sim(v, args) {
  if (args[0] === 'play') { if (!run) { go('#/sim'); return; } return playStage(v); }
  return map(v);
}

function map(v) {
  const cur = Math.min(state.stagesCleared, 3);
  v.innerHTML = `
    <header class="hdr"><h1 class="h3d h1">طريقك إلى النهائي</h1><button class="linkbtn" data-go="#/home">رجوع</button></header>
    <p class="sm">كلما تقدّمت مرحلة، ارتفعت حصة الفائز من رصيد الخصم وفُتحت مكافأة جديدة.</p>
    ${STAGES.map((s, i) => { const st = i < state.stagesCleared ? 'done' : i === cur ? 'now' : 'lock';
      return `<div class="card3d tilt stg ${st}"><b class="z2">${s.n}</b><span class="p z1">${pct(s.take)} / ${pct(1 - s.take)}</span><em class="z1">${st === 'done' ? 'تم · ' : 'المكافأة: '}${s.reward}</em></div>`; }).join('')}
    <button class="btn3d" id="go">${state.stagesCleared >= 4 ? 'العب النهائي مجدداً' : 'ابدأ المواجهة'}</button>
    <p class="note">النسب من قسم «الخزينة الحية» في الوثيقة. المنافس افتراضي، ونقاط المحاكاة منفصلة عن نقاط الجمهور.</p>`;
  $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go));
  $('#go', v).onclick = () => startStage(cur);
}

function startStage(i) {
  const st = STAGES[i], pool = BANK.filter((q) => q.part !== 'H');
  const med = pool.filter((q) => q.difficulty !== 'سهل'), easy = pool.filter((q) => q.difficulty === 'سهل');
  const nm = Math.round(st.qn * st.hard);
  const qs = shuffle([...pickQuestions(med, nm), ...pickQuestions(easy, st.qn - nm)]);
  const codes = state.profile.type === 'org' ? ORG_CODES : UNI_CODES;
  const opp = shuffle(codes.filter((c) => c !== state.profile.code))[0];
  run = { stage: i, st, qs, i: 0, me: { score: 0, vault: START, streak: 0 }, opp: { code: opp, score: 0, vault: START, streak: 0 } };
  go('#/sim/play');
}

function countUp(el, from, to, ms = 700) {
  if (!el) return; const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

function playStage(v) {
  let tm = 0, locked = false;
  const st = run.st;
  onLeave(() => clearInterval(tm));
  const vaults = () => `<div class="vaults"><div class="card3d tilt vault me"><div class="n z2" id="vm">${fmt(run.me.vault)}</div><div class="l z1"><span class="num">${state.profile.code}</span> · رصيدك (درهم)</div></div><div class="card3d tilt vault"><div class="n z2" id="vo">${fmt(run.opp.vault)}</div><div class="l z1"><span class="num">${run.opp.code}</span> · الخصم (درهم)</div></div></div>`;

  function question() {
    const q = run.qs[run.i]; locked = false;
    v.innerHTML = `
      ${vaults()}
      <div class="row"><span class="eyebrow">${st.n} · السؤال <span class="num">${run.i + 1}</span> / <span class="num">${run.qs.length}</span></span>
        <span class="row" style="gap:7px"><span class="sm">هجوم خاطف</span><span class="pips">${[0, 1, 2].map((k) => `<i class="${run.me.streak > k ? 'on' : ''}"></i>`).join('')}</span></span></div>
      <div class="tbar" id="tbar"><i></i></div>
      <h2 class="qtxt">${esc(q.q)}</h2>
      ${keysHtml(q)}
      <p class="sm center" id="oppline"><span class="num">${run.opp.code}</span> يفكّر…</p>
      <div id="after"></div>`;
    $$('.key', v).forEach((b) => b.onclick = () => resolve(+b.dataset.i));
    const t0 = Date.now(); let lastSec = -1;
    tm = setInterval(() => {
      const r = QTIME - (Date.now() - t0) / 1000, bar = $('#tbar', v); if (!bar) return;
      bar.firstElementChild.style.transform = `scaleX(${Math.max(0, r / QTIME)})`; bar.classList.toggle('hot', r <= 4);
      if (r <= 4 && Math.ceil(r) !== lastSec && r > 0) { lastSec = Math.ceil(r); sfx.tick(); }
      if (r <= 0) { clearInterval(tm); resolve(null); }
    }, 100);
  }

  function resolve(choice) {
    if (locked) return; locked = true; clearInterval(tm);
    const q = run.qs[run.i], ok = choice === q.answer, oppOk = Math.random() < st.oppP;
    const before = { me: run.me.vault, opp: run.opp.vault }, notes = []; let streakCard = null;
    markKeys(v, q, choice);
    if (ok) { run.me.score++; run.me.vault += UNIT; run.me.streak++; state.pts.sim += 10; addXp(8); sfx.ok(); buzz(40); } else { run.me.streak = 0; sfx.bad(); buzz([30, 30, 30]); }
    if (oppOk) { run.opp.score++; run.opp.vault += UNIT; run.opp.streak++; } else run.opp.streak = 0;
    if (run.me.streak >= 3) {
      const steal = Math.round(run.opp.vault * .1); run.opp.vault -= steal; run.me.vault += steal; run.me.streak = 0;
      notes.push(`هجوم خاطف! سحبتَ <span class="num">${fmt(steal)}</span> درهم من رصيد <span class="num">${run.opp.code}</span>`);
      streakCard = randomLockedCard(true); if (streakCard) unlockCard(streakCard.id);
    }
    if (run.opp.streak >= 3) {
      const steal = Math.round(run.me.vault * .1); run.me.vault -= steal; run.opp.vault += steal; run.opp.streak = 0;
      notes.push(`هجوم خاطف من <span class="num">${run.opp.code}</span>: سُحب <span class="num">${fmt(steal)}</span> من رصيدك`);
    }
    save(); touchDay();
    countUp($('#vm', v), before.me, run.me.vault); countUp($('#vo', v), before.opp, run.opp.vault);
    $('#oppline', v).innerHTML = `<span class="num">${run.opp.code}</span>: ${oppOk ? 'أجاب صحيحاً' : 'أخطأ'}`;
    $$('.pips i', v).forEach((p, k) => p.classList.toggle('on', run.me.streak > k));
    const last = run.i >= run.qs.length - 1;
    $('#after', v).innerHTML = `<div class="card3d" style="display:grid;gap:6px;margin-bottom:12px">
      <b class="t">${choice === null ? 'انتهى الوقت' : ok ? 'إجابة صحيحة' : 'إجابة غير صحيحة'}</b><p class="sm">${esc(q.fact)}</p>
      ${notes.map((n) => `<p class="note">${n}</p>`).join('')}</div>
      <button class="btn3d" id="next">${last ? 'إنهاء المرحلة' : 'السؤال التالي'}</button>`;
    $('#after', v).scrollIntoView({ block: 'end', behavior: 'smooth' });
    $('#next', v).onclick = () => { run.i++; if (run.i >= run.qs.length) endStage(); else question(); };
    if (streakCard) setTimeout(() => showCard(streakCard, 'فتحتَها بعد 3 إجابات صحيحة متتالية'), 700);
  }

  function endStage() {
    const me = run.me, opp = run.opp;
    const win = me.score > opp.score || (me.score === opp.score && me.vault >= opp.vault);
    const winner = win ? me : opp, loser = win ? opp : me;
    const amount = Math.round(loser.vault * st.take);
    const from = { me: me.vault, opp: opp.vault };
    winner.vault += amount; loser.vault -= amount;
    let reward = '', rewardCard = null;
    if (win) {
      state.stagesCleared = Math.max(state.stagesCleared, run.stage + 1); addXp(40); state.pts.sim += 50;
      if (st.rk === 'badge' && !state.badges.includes('diver')) state.badges.push('diver');
      if (st.rk === 'card') { rewardCard = randomLockedCard(true); if (rewardCard) unlockCard(rewardCard.id); }
      reward = { badge: coin('الغوّاص', 'وسام', 130), card: coin('نادرة', 'بطاقة تراث', 130), cert: coin('شهادة', 'رقمية', 130), grand: coin('الكبرى', 'تجريبية', 130) }[st.rk];
    } else addXp(10);
    save();
    const last = run.stage >= 3;
    v.innerHTML = `
      <div class="center" style="display:grid;gap:8px"><span class="tag ${win ? 'ok' : 'live'}" style="justify-self:center">${win ? 'فزتَ بالمرحلة' : 'خسرتَ هذه المرحلة'}</span><h1 class="h3d h1">${st.n}</h1></div>
      ${win ? `<div class="card3d tilt gold" style="display:grid;gap:8px;justify-items:center"><div class="z3">${reward}</div><b class="t z2">${st.reward}</b>${rewardCard ? `<span class="sm z1">${esc(rewardCard.title)}</span>` : ''}</div>` : ''}
      <div class="card3d tilt" style="display:grid;gap:10px">
        <div class="row z1"><b class="t">النتيجة</b><span class="num t" style="color:var(--gold-hi)">${me.score} - ${opp.score}</span></div>
        <div class="row z1"><span class="sm">رصيدك</span><span class="num t" id="fm">${fmt(from.me)}</span></div>
        <div class="row z1"><span class="sm">رصيد <span class="num">${opp.code}</span></span><span class="num t" id="fo">${fmt(from.opp)}</span></div>
        <p class="note z1">${win ? 'أخذتَ' : `<span class="num">${opp.code}</span> أخذ`} <span class="num">${pct(st.take)}</span> من رصيد ${win ? `<span class="num">${opp.code}</span>` : 'فريقك'}: <span class="num">${fmt(amount)}</span> درهم.</p>
      </div>
      ${win && !last ? '<button class="btn3d" id="n1">المرحلة التالية</button>' : ''}
      ${win && last ? '<button class="btn3d" id="n2">اذهب إلى الجوائز</button>' : ''}
      ${!win ? '<button class="btn3d" id="n3">حاول مرة أخرى</button>' : ''}
      <button class="btn3d ghost" data-go="#/sim">خريطة المراحل</button>`;
    countUp($('#fm', v), from.me, me.vault, 1100); countUp($('#fo', v), from.opp, opp.vault, 1100);
    $$('[data-go]', v).forEach((b) => b.onclick = () => go(b.dataset.go));
    const n1 = $('#n1', v), n2 = $('#n2', v), n3 = $('#n3', v);
    if (n1) n1.onclick = () => startStage(run.stage + 1);
    if (n2) n2.onclick = () => go('#/prizes');
    if (n3) n3.onclick = () => startStage(run.stage);
    if (win) { sfx.card(); buzz([40, 30, 80]); }
  }

  question();
}
