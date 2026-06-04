// src/data/progress.js
//
// Per-kid journey progress system.
//
// Each kid has their own progress, keyed by member name in localStorage.
// Progress tracks which articles and activities have been completed.
//
// A "day" is considered claimed when ALL of its articles AND activities
// are completed. The kid's animal advances to the next pin on the map.
//
// Days within KIDS_DAYS that have no DAY_CONTENT entry are treated as
// "auto-claim on visit" — the kid taps the pin, sees a "travel day"
// message, and the day claims automatically.
//
// Within a single day, items unlock STRICTLY in order:
//   articles[0], articles[1], ..., activities[0], activities[1], ...
// Each item must be completed before the next unlocks.

import { KIDS_DAYS } from './kidsDays';
import { DAY_CONTENT } from './dayLearningContent';

const STORAGE_KEY_PREFIX = 'kids:progress:';
const DEV_MODE_KEY_PREFIX = 'kids:devmode:';
const STORAGE_VERSION_KEY = 'kids:storage-version';
const CURRENT_STORAGE_VERSION = '10';   // bumped when progress shape changes; on mismatch, kid progress + dev-mode wiped

// One-time migration: when storage version mismatches, clear all per-kid
// progress (the old shape had buggy activity-counting that scrambled state)
// and turn dev-mode OFF for everyone.
function migrateIfNeeded() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const v = localStorage.getItem(STORAGE_VERSION_KEY);
    if (v === CURRENT_STORAGE_VERSION) return;
    // Wipe all per-kid progress AND dev-mode flags.
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(STORAGE_KEY_PREFIX) || key.startsWith(DEV_MODE_KEY_PREFIX))) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
  } catch { /* ignore */ }
}
migrateIfNeeded();

// Defensive helper — localStorage can throw in private mode etc.
function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

// ───────────────────────────────────────────────────────────
// Progress shape
// ───────────────────────────────────────────────────────────
//
// {
//   completed: {
//     '2026-08-03': {
//       articles: { 'physics-of-flight': true, 'flight-history': true },
//       activities: { 'flight-quiz': true },
//     },
//     '2026-08-04': {
//       articles: { 'rv-anatomy': true },        // partially started
//       activities: {},
//     },
//   },
//   memos: {                                      // persisted creative outputs
//     '2026-08-03:physics-of-flight': { kind: 'reflect', text: 'מתרגש מהטיסה!' },
//     '2026-08-04:rv-anatomy':       { kind: 'draw',    dataUrl: '...' },
//   }
// }

function defaultProgress() {
  return { completed: {}, memos: {} };
}

export function loadProgress(memberName) {
  if (!memberName) return defaultProgress();
  const raw = safeGet(STORAGE_KEY_PREFIX + memberName);
  if (!raw) return defaultProgress();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultProgress();
    return {
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
      memos: parsed.memos && typeof parsed.memos === 'object' ? parsed.memos : {},
    };
  } catch {
    return defaultProgress();
  }
}

function saveProgress(memberName, progress) {
  if (!memberName) return;
  safeSet(STORAGE_KEY_PREFIX + memberName, JSON.stringify(progress));
}

// ───────────────────────────────────────────────────────────
// Public API — used by components
// ───────────────────────────────────────────────────────────

// Mark an article as completed for this kid.
export function markArticleDone(memberName, dateStr, articleId, memo) {
  if (!memberName || !dateStr || !articleId) return;
  const p = loadProgress(memberName);
  if (!p.completed[dateStr]) p.completed[dateStr] = { articles: {}, activities: {} };
  if (!p.completed[dateStr].articles) p.completed[dateStr].articles = {};
  p.completed[dateStr].articles[articleId] = true;
  if (memo) {
    p.memos[`${dateStr}:${articleId}`] = memo;
  }
  saveProgress(memberName, p);
}

// Mark an activity as completed for this kid.
export function markActivityDone(memberName, dateStr, activityId) {
  if (!memberName || !dateStr || !activityId) return;
  const p = loadProgress(memberName);
  if (!p.completed[dateStr]) p.completed[dateStr] = { articles: {}, activities: {} };
  if (!p.completed[dateStr].activities) p.completed[dateStr].activities = {};
  p.completed[dateStr].activities[activityId] = true;
  saveProgress(memberName, p);
}

// Pass-31: clear a single day's ACTIVITY progress so the kid can replay the
// Finish Day flow from the start. Leaves article-read state intact (they don't
// need to re-read) and leaves other days untouched.
export function resetDayActivities(memberName, dateStr) {
  if (!memberName || !dateStr) return;
  const p = loadProgress(memberName);
  if (p.completed[dateStr]) {
    p.completed[dateStr].activities = {};
    delete p.completed[dateStr].autoClaimed;
    saveProgress(memberName, p);
  }
}

// Auto-claim a day with no content (a travel day with just a stub).
export function autoClaimDay(memberName, dateStr) {
  if (!memberName || !dateStr) return;
  const p = loadProgress(memberName);
  if (!p.completed[dateStr]) p.completed[dateStr] = { articles: {}, activities: {} };
  p.completed[dateStr].autoClaimed = true;
  saveProgress(memberName, p);
}

// Reset all progress for a kid (used by dev mode "reset progress").
export function resetProgress(memberName) {
  if (!memberName) return;
  safeSet(STORAGE_KEY_PREFIX + memberName, JSON.stringify(defaultProgress()));
}

// ───────────────────────────────────────────────────────────
// Dev mode (per-kid override that unlocks everything)
// ───────────────────────────────────────────────────────────

export function isDevMode(memberName) {
  if (!memberName) return false;
  if (memberName === 'דמו') return true;   // hidden demo profile is always unlocked
  return safeGet(DEV_MODE_KEY_PREFIX + memberName) === '1';
}
export function setDevMode(memberName, on) {
  if (!memberName) return;
  if (on) safeSet(DEV_MODE_KEY_PREFIX + memberName, '1');
  else safeSet(DEV_MODE_KEY_PREFIX + memberName, '0');
}
export function toggleDevMode(memberName) {
  const next = !isDevMode(memberName);
  setDevMode(memberName, next);
  return next;
}

// ───────────────────────────────────────────────────────────
// Unlock queries — used by JourneyMap and DayOverview
// ───────────────────────────────────────────────────────────

// Pass-6: Each article OWNS its activity (linked via `unlocks` field on the
// article). The day overview shows ARTICLES only. Each article opens to a
// page that includes the article body + the embedded activity at the bottom.
// "Article complete" means the embedded activity is complete.
export function getDayItems(dateStr) {
  const content = DAY_CONTENT[dateStr];
  if (!content) return { articles: [], activities: [], total: 0, hasContent: false };
  const articles = Array.isArray(content.learn) ? content.learn : [];
  const activities = Array.isArray(content.activities) ? content.activities : [];
  return {
    articles,
    activities,
    total: articles.length,  // counter shows article count only
    hasContent: true,
  };
}

// Find the activity bound to an article (via the article's `unlocks` field)
export function activityForArticle(dateStr, articleId) {
  const content = DAY_CONTENT[dateStr];
  if (!content) return null;
  const article = (content.learn || []).find(a => a.id === articleId);
  if (!article || !article.unlocks) return null;
  return (content.activities || []).find(a => a.id === article.unlocks) || null;
}

// Pass-6: Articles only — each article includes its activity inline. So
// the unlock chain is article-by-article. Article N is unlocked when
// article N-1 is COMPLETE (its embedded activity finished).
//
// We keep the function signature for backward compatibility, but `itemKind`
// is treated as 'article' in practice — the day overview only renders articles.
export function isItemUnlocked(memberName, dateStr, itemId, itemKind) {
  if (isDevMode(memberName)) return true;
  if (!isDayUnlocked(memberName, dateStr)) return false;

  // Activities are now embedded in articles — they unlock together with their parent.
  // For backward compat: if asked about an activity, check whether its parent article is unlocked.
  if (itemKind === 'activity') {
    const items = getDayItems(dateStr);
    // Find which article links to this activity (via `unlocks` field)
    const parentArticle = items.articles.find(a => a.unlocks === itemId);
    if (parentArticle) {
      return isItemUnlocked(memberName, dateStr, parentArticle.id, 'article');
    }
    // Orphan activity (no parent) → require all articles done
    const p = loadProgress(memberName);
    const dayProg = p.completed[dateStr] || { articles: {} };
    for (const a of items.articles) {
      if (!dayProg.articles?.[a.id]) return false;
    }
    return true;
  }

  // Article unlock: previous article (in order) must be complete
  const { articles } = getDayItems(dateStr);
  const idx = articles.findIndex(a => a.id === itemId);
  if (idx <= 0) return idx === 0;
  const p = loadProgress(memberName);
  const dayProg = p.completed[dateStr] || { articles: {} };
  for (let i = 0; i < idx; i++) {
    if (!dayProg.articles?.[articles[i].id]) return false;
  }
  return true;
}

// Has the kid completed an item?
export function isItemCompleted(memberName, dateStr, itemId, itemKind) {
  const p = loadProgress(memberName);
  const dayProg = p.completed[dateStr];
  if (!dayProg) return false;
  const bucket = itemKind === 'article' ? dayProg.articles : dayProg.activities;
  return !!(bucket && bucket[itemId]);
}

// Has the kid claimed this entire day?
// Pass-6 design: each article HAS its activity embedded. The "article is done"
// when the embedded activity is done (or when there's no activity for it).
// Day is claimed when all articles are done. Activities are NOT separate items
// for counting purposes — they're a sub-step of their article.
// Pass-31: A day is "done" when all its Finish-Day ACTIVITIES are complete.
// Reading articles no longer claims the day — articles are read-only and gate
// the Finish Day flow, but completing that flow (all activities) is what claims
// the day and unlocks the next one on the map.
export function isDayClaimed(memberName, dateStr) {
  if (isDevMode(memberName)) return false;
  const p = loadProgress(memberName);
  const dayProg = p.completed[dateStr];
  if (!dayProg) return false;
  if (dayProg.autoClaimed) return true;
  const items = getDayItems(dateStr);
  if (!items.hasContent) return false;
  // A day with articles but no activities is claimed once all articles are read.
  if (items.activities.length === 0) {
    if (items.articles.length === 0) return false;
    for (const a of items.articles) {
      if (!dayProg.articles?.[a.id]) return false;
    }
    return true;
  }
  // Otherwise: all activities must be complete.
  for (const act of items.activities) {
    if (!dayProg.activities?.[act.id]) return false;
  }
  return true;
}

// Number of completed articles / total articles (counter shown in the UI).
// Activities don't count separately — they're part of the article.
export function dayProgress(memberName, dateStr) {
  const items = getDayItems(dateStr);
  if (!items.hasContent) return { done: 0, total: 0, claimable: true };
  const p = loadProgress(memberName);
  const dayProg = p.completed[dateStr] || { articles: {}, activities: {} };
  let done = 0;
  for (const a of items.articles) if (dayProg.articles?.[a.id]) done++;
  return { done, total: items.articles.length, claimable: false };
}

// Is this day unlocked for navigation?
//   Day 0 (first day): always unlocked.
//   Day N: unlocked iff Day N-1 is claimed (or N==0).
//   Dev mode: all unlocked.
export function isDayUnlocked(memberName, dateStr) {
  if (isDevMode(memberName)) return true;
  const idx = KIDS_DAYS.findIndex(d => d.date === dateStr);
  if (idx <= 0) return idx === 0;
  const prev = KIDS_DAYS[idx - 1];
  return isDayClaimed(memberName, prev.date);
}

// Get the index of the kid's "current" day — the first unlocked-but-not-claimed day.
// Used to position the animal marker on the map.
export function currentDayIdx(memberName) {
  if (isDevMode(memberName)) {
    // Pass-31: dev mode previously always returned 0, which made the map's
    // "next adventure" CTA always point to day 1 — annoying when testing.
    // Now we return the highest-indexed day that has ANY progress recorded
    // (a read article or a completed activity). If none, fall back to today's
    // date's index, then to 0.
    const p = loadProgress(memberName);
    let highest = -1;
    for (let i = 0; i < KIDS_DAYS.length; i++) {
      const dp = p.completed[KIDS_DAYS[i].date];
      if (!dp) continue;
      const hasArticle = dp.articles && Object.keys(dp.articles).length > 0;
      const hasActivity = dp.activities && Object.keys(dp.activities).length > 0;
      if (hasArticle || hasActivity || dp.autoClaimed) highest = i;
    }
    if (highest >= 0) return highest;
    const t = todayDayIdx();
    if (t >= 0 && t < KIDS_DAYS.length) return t;
    return 0;
  }
  for (let i = 0; i < KIDS_DAYS.length; i++) {
    const d = KIDS_DAYS[i];
    if (!isDayClaimed(memberName, d.date)) return i;
  }
  // All days claimed — show animal on the last pin
  return KIDS_DAYS.length - 1;
}

// Index of "today" relative to the trip — used for a separate "you are here in real life" marker.
// Returns -1 if before trip, KIDS_DAYS.length if after, otherwise the index.
export function todayDayIdx() {
  const today = new Date().toISOString().slice(0, 10);
  if (KIDS_DAYS.length === 0) return -1;
  if (today < KIDS_DAYS[0].date) return -1;
  if (today > KIDS_DAYS[KIDS_DAYS.length - 1].date) return KIDS_DAYS.length;
  let exact = KIDS_DAYS.findIndex(d => d.date === today);
  if (exact >= 0) return exact;
  // Find the closest upcoming
  return KIDS_DAYS.findIndex(d => d.date > today);
}

// Read a saved memo (drawing/text).
export function loadMemo(memberName, dateStr, articleId) {
  const p = loadProgress(memberName);
  return p.memos[`${dateStr}:${articleId}`] || null;
}

// ───────────────────────────────────────────────────────────
// Trip phases — used for the big celebration when finishing a phase
// ───────────────────────────────────────────────────────────
//
// The trip has 4 named phases. Claiming the LAST day of a phase fires a
// big "you finished the [Niagara] trip!" overlay (separate from the small
// per-day claim animation).
export const TRIP_PHASES = [
  {
    id: 'niagara',
    name: 'ניאגרה',
    emoji: '💧',
    startDate: '2026-08-03',
    endDate: '2026-08-12',
    nextPreview: 'הדיסני מחכה!',
    nextEmoji: '🎢',
  },
  {
    id: 'disney',
    name: 'דיסני',
    emoji: '🎢',
    startDate: '2026-08-13',
    endDate: '2026-08-18',
    nextPreview: 'חוזרים לניו יורק לחתונה!',
    nextEmoji: '💒',
  },
  {
    id: 'newyork',
    name: 'ניו יורק',
    emoji: '🗽',
    startDate: '2026-08-19',
    endDate: '2026-08-24',
    nextPreview: 'ההרים והפארקים הלאומיים!',
    nextEmoji: '🏔️',
  },
  {
    id: 'parks',
    name: 'הפארקים הלאומיים',
    emoji: '🏔️',
    startDate: '2026-08-25',
    endDate: '2026-09-15',
    nextPreview: 'חזרה הביתה!',
    nextEmoji: '🏠',
  },
];

// Returns the phase whose endDate matches `dateStr`, or null.
export function phaseEndingOn(dateStr) {
  return TRIP_PHASES.find(p => p.endDate === dateStr) || null;
}

// Returns the phase that contains `dateStr`, or null.
export function phaseFor(dateStr) {
  return TRIP_PHASES.find(p => dateStr >= p.startDate && dateStr <= p.endDate) || null;
}