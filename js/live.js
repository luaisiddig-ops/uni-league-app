// live engine: the director (control.html tab, or the built-in demo director) opens a voting gate;
// the app reacts on any screen. Same-browser tabs talk through BroadcastChannel (no server needed for the prototype).
import { state } from './store.js';
import { qById, BANK } from './data.js';
import { modal, go, $ } from './core.js';
import { gate3d } from './ui.js';
import { play, buzz } from './sfx.js';

export const live = { on: false, ep: 7, round: 'ربع النهائي', match: 'A2 ضد C3', gate: null, source: 'none' };
const subs = new Set();
export const onChange = (f) => { subs.add(f); return () => subs.delete(f); };
const emit = () => subs.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });

let ch = null;
try { ch = new BroadcastChannel('uni-league-live'); } catch (e) { /* unsupported */ }
export const send = (m) => { try { ch && ch.postMessage(m); } catch (e) { /* ignore */ } };

let closeT = 0, autoT = 0, announced = null;

function handle(m) {
  if (!m || !m.type) return;
  if (m.type === 'episode.state') {
    if (live.source === 'auto') stopAuto(true);
    Object.assign(live, { on: !!m.on, ep: m.ep ?? live.ep, round: m.round ?? live.round, match: m.match ?? live.match, source: m.on ? 'director' : 'none' });
    if (!m.on) { live.gate = null; clearTimeout(closeT); hideAnnounce(); }
    emit();
  } else if (m.type === 'gate.open') openGate(m);
  else if (m.type === 'gate.close') closeGate();
}
if (ch) ch.onmessage = (e) => handle(e.data);

export function openGate(m) {
  const q = qById(m.questionId); if (!q) return;
  const gate = { q, dur: m.durationSec || 12, openedAt: m.openedAt || Date.now(), closed: false, key: q.id + ':' + (m.openedAt || Date.now()) };
  live.gate = gate; live.on = true; if (live.source === 'none') live.source = 'director';
  clearTimeout(closeT);
  const rem = gate.dur * 1000 - (Date.now() - gate.openedAt);
  closeT = setTimeout(() => closeGate(), Math.max(0, rem));
  emit(); announce();
}
export function closeGate() { if (live.gate && !live.gate.closed) { live.gate.closed = true; hideAnnounce(); emit(); } }

// full-screen alert when the gate opens while the player is on another screen
function announce() {
  const g = live.gate; if (!g || announced === g.key) return; announced = g.key;
  if ((location.hash || '').startsWith('#/live')) return;
  play.gate(); buzz([60, 40, 90]);
  modal(`<div class="center" style="display:grid;gap:12px"><span class="tag live" style="justify-self:center">بوابة التصويت مفتوحة</span>${gate3d(true)}<div class="h2">أجب الآن، الوقت يمضي</div><p class="sm">سؤال من الحلقة <span class="num">${live.ep}</span> · ${live.round}</p><button class="btn3d" id="joinGate">انضم الآن</button></div>`, { gold: true });
  const j = $('#joinGate'); if (j) j.onclick = () => { $('#modal').hidden = true; go('#/live'); };
}
function hideAnnounce() { if ($('#joinGate')) { $('#modal').hidden = true; $('#modal').innerHTML = ''; } }

// built-in demo director: runs a small show by itself so the app can be tested without a second tab
const demoUsed = [];
export function startAuto() {
  stopAuto(true); live.on = true; live.source = 'auto'; live.gate = null; emit();
  const loop = () => {
    const pool = BANK.filter((q) => q.part !== 'H' && !demoUsed.includes(q.id));
    const q = (pool.length ? pool : BANK.filter((x) => x.part !== 'H'))[Math.floor(Math.random() * (pool.length || 1))];
    if (!q) return; demoUsed.push(q.id); if (demoUsed.length > 40) demoUsed.shift();
    openGate({ questionId: q.id, durationSec: 12, openedAt: Date.now() });
    autoT = setTimeout(loop, 24000);
  };
  autoT = setTimeout(loop, 2500);
}
export function stopAuto(silent) {
  clearTimeout(autoT); autoT = 0;
  if (live.source === 'auto') { live.on = false; live.gate = null; live.source = 'none'; clearTimeout(closeT); if (!silent) emit(); }
}

export function initLive() {
  send({ type: 'hello' });
  if (state.settings.auto) startAuto();
}
