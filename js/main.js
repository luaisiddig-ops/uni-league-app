import { state, touchDay } from './store.js';
import { loadData } from './data.js';
import { $, $$, go, runLeaves } from './core.js';
import { attachTilt, initParallax } from './tilt.js';
import { initLive } from './live.js';
import { rosette } from './ui.js';
import start from './screens/start.js';
import home from './screens/home.js';
import liveView from './screens/live-view.js';
import sim from './screens/sim.js';
import heritage from './screens/heritage.js';
import rank from './screens/rank.js';
import prizes from './screens/prizes.js';
import settings from './screens/settings.js';

const ROUTES = { start, home, live: liveView, sim, heritage, rank, prizes, settings };
const DOCK_MAP = { home: 'home', live: 'home', settings: 'home', sim: 'sim', prizes: 'sim', heritage: 'heritage', rank: 'rank' };

function render() {
  runLeaves();
  const parts = (location.hash || '#/home').replace(/^#\//, '').split('/');
  let name = parts[0] || 'home'; const args = parts.slice(1);
  if (!state.profile && name !== 'start') name = 'start';
  if (!ROUTES[name]) name = 'home';
  const view = $('#view'); view.innerHTML = '';
  const sc = document.createElement('section'); sc.className = 'screen'; view.append(sc); view.scrollTop = 0;
  ROUTES[name](sc, args);
  const noDock = name === 'start' || (name === 'sim' && args[0] === 'play') || (name === 'heritage' && args[0] === 'quiz');
  $('#dock').hidden = noDock; view.classList.toggle('nodock', noDock);
  $$('#dock a').forEach((a) => a.classList.toggle('on', a.dataset.r === DOCK_MAP[name]));
  $$('.tilt', sc).forEach(attachTilt);
}

async function boot() {
  document.body.classList.toggle('calm', !!state.settings.calm);
  initParallax();
  $('#view').innerHTML = `<div class="screen center" style="margin-top:20vh">${rosette()}<p class="sm">جارٍ التحميل…</p></div>`;
  try { await loadData(); }
  catch (e) { $('#view').innerHTML = '<div class="screen center" style="margin-top:20vh"><p class="h2">تعذّر تحميل الأسئلة</p><p class="sm">تأكد من الاتصال ثم أعد فتح التطبيق.</p></div>'; return; }
  if (state.profile) touchDay();
  initLive();
  window.addEventListener('hashchange', render);
  render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
