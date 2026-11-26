// question bank + heritage cards (derived from the heritage questions)
import { state, save } from './store.js';
import { shuffle } from './core.js';

export let BANK = [];
export let HERITAGE = [];
export const H_SECTIONS = [
  { name: 'الأمثال والحكم', sub: 'أكمل المثل' },
  { name: 'اللهجة الإماراتية', sub: 'كلمات وسوالف' },
  { name: 'الأكلات والحلويات', sub: 'مائدة الأجداد' },
  { name: 'الغوص والبحر والحرف', sub: 'النوخذة واللؤلؤ' },
  { name: 'الصقارة والبيئة', sub: 'الصقر والصحراء' },
  { name: 'الفنون الشعبية والشعر', sub: 'العيّالة والنبط' },
  { name: 'الضيافة واللباس والزينة', sub: 'القهوة والكندورة' },
  { name: 'العمارة والمواقع والمناسبات', sub: 'البيت القديم' },
];

export async function loadData() {
  const r = await fetch('data/bank.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('bank ' + r.status);
  const j = await r.json();
  BANK = j.questions;
  HERITAGE = BANK.filter((q) => q.part === 'H').map((q) => ({
    id: q.id, section: q.topic, title: q.card || q.options[q.answer], text: q.fact, rare: q.difficulty !== 'سهل',
  }));
  return j;
}
export const byPart = (p) => BANK.filter((q) => q.part === p);
export const qById = (id) => BANK.find((q) => q.id === id);
export const hasCard = (id) => state.cards.includes(id);
export function unlockCard(id) { if (!state.cards.includes(id)) { state.cards.push(id); save(); return true; } return false; }
export function randomLockedCard(preferRare = false) {
  let pool = HERITAGE.filter((c) => !hasCard(c.id));
  if (preferRare) { const r = pool.filter((c) => c.rare); if (r.length) pool = r; }
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}
// pick n questions from a pool, preferring ones not played yet; remember what was played
export function pickQuestions(pool, n) {
  let fresh = shuffle(pool.filter((q) => !state.seen.includes(q.id)));
  if (fresh.length < n) { state.seen = state.seen.filter((id) => !pool.some((q) => q.id === id)); fresh = shuffle(pool); }
  const picked = fresh.slice(0, n);
  picked.forEach((q) => state.seen.push(q.id)); state.seen = state.seen.slice(-800); save();
  return picked;
}
