// player state, saved on this device only (localStorage). No server, no account.
const KEY = 'uni-league.v1';
const defaults = () => ({
  profile: null,            // { type:'uni'|'org', code, nick }
  xp: 0,
  pts: { audience: 0, sim: 0 },   // audience points never touch the official result
  stagesCleared: 0,         // 0..4
  cards: [],                // unlocked heritage card ids
  seen: [],                 // question ids already played (avoid repeats)
  days: [],                 // ISO dates the player was active
  badges: [],
  nextAt: 0,
  settings: { sound: false, haptics: true, calm: false, auto: false },
});

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw) return defaults();
    const d = defaults();
    return { ...d, ...raw, pts: { ...d.pts, ...(raw.pts || {}) }, settings: { ...d.settings, ...(raw.settings || {}) } };
  } catch (e) { return defaults(); }
}
export const state = load();
export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }
export function resetAll() { Object.assign(state, defaults()); save(); }

export const LEVELS = [
  { n: 'غوّاص', xp: 0 }, { n: 'سيّب', xp: 150 }, { n: 'نهّام', xp: 400 }, { n: 'نوخذة', xp: 800 }, { n: 'صقّار', xp: 1500 },
];
export function level() {
  let i = 0; for (let k = 0; k < LEVELS.length; k++) if (state.xp >= LEVELS[k].xp) i = k;
  const cur = LEVELS[i], nxt = LEVELS[i + 1];
  const frac = nxt ? (state.xp - cur.xp) / (nxt.xp - cur.xp) : 1;
  return { i, n: cur.n, next: nxt ? nxt.xp : null, frac: Math.max(0, Math.min(1, frac)) };
}
export function addXp(n) { state.xp += n; save(); }
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);
export function touchDay() { const d = dayKey(Date.now()); if (!state.days.includes(d)) state.days.push(d); state.days = state.days.slice(-40); save(); }
export function weekPearls() { const out = []; for (let i = 6; i >= 0; i--) out.push(state.days.includes(dayKey(Date.now() - i * 864e5))); return out; }
