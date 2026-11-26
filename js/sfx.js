// tiny synthesized sounds (no audio files). Off by default; the player turns them on in settings.
import { state } from './store.js';
let ac = null;
function tone(f, d = .12, type = 'sine', v = .08, when = 0) {
  if (!state.settings.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
    const t0 = ac.currentTime + when;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + d + .02);
  } catch (e) { /* no audio */ }
}
export const play = {
  ok: () => { tone(660, .12); tone(880, .2, 'sine', .08, .1); },
  bad: () => tone(170, .3, 'sawtooth', .05),
  tick: () => tone(520, .05, 'square', .025),
  gate: () => { tone(140, .9, 'sine', .12); tone(210, .7, 'triangle', .05, .05); },
  card: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, .16, 'sine', .07, i * .09)),
};
export function buzz(p) { try { if (state.settings.haptics && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignore */ } }
