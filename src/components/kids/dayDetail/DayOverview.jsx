import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Calendar } from 'lucide-react';
import SectionHeader from './SectionHeader';
import TransitionBanner from './TransitionBanner';
import LockedItem from './LockedItem';
import FinishDayCTA from './FinishDayCTA';
import { KIDS_DAYS } from '../../../data/kidsDays';
import {
  familyAwareIntroSuffix,
  transitionBannerType,
  familyDayBadge,
} from '../../../data/familyTravel';
import { themeForDate } from '../../../data/regionTheme';
import {
  isItemUnlocked,
  isItemCompleted,
  isDayClaimed,
  isDayUnlocked,
  dayProgress,
  isDevMode,
} from '../../../data/progress';

const ICON_TINTS = {
  blue: 'bg-blue-50 text-blue-900',
  amber: 'bg-amber-50 text-amber-800',
  purple: 'bg-violet-50 text-violet-800',
  green: 'bg-emerald-50 text-emerald-800',
  pink: 'bg-pink-50 text-pink-800',
  cyan: 'bg-cyan-50 text-cyan-800',
};

const BADGE_TINTS = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  gray:  'bg-gray-100 text-gray-700 border-gray-200',
};

// Clean a day's place label into something Wikipedia can match: drop Hebrew,
// emoji and qualifiers, keep the first English place name.
function sanitizeForWiki(raw) {
  if (!raw) return '';
  return raw
    .replace(/[\u0590-\u05FF]/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F\u200D]/gu, '')
    .split(/\s*[\/|—–→]\s*|\s-\s/)[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function HeroImage({ src, fallbackEmoji, query }) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);
  const triedWiki = useRef(false);

  useEffect(() => { setCurrent(src); setFailed(false); triedWiki.current = false; }, [src]);

  // If the day's own image fails, fetch a real photo from Wikipedia by place name
  // before giving up to the emoji pattern.
  const handleError = () => {
    if (!triedWiki.current) {
      triedWiki.current = true;
      const q = sanitizeForWiki(query);
      if (q && q.length > 2 && /[a-z]/i.test(q)) {
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`)
          .then(r => (r.ok ? r.json() : null))
          .then(d => {
            const wiki = d && d.thumbnail && d.thumbnail.source;
            if (wiki) setCurrent(wiki);
            else setFailed(true);
          })
          .catch(() => setFailed(true));
        return;
      }
    }
    setFailed(true);
  };

  if (failed || !current) {
    const emoji = fallbackEmoji || '✨';
    return (
      <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
        <span className="absolute text-[40px] opacity-15" style={{ top: '15%', left: '10%' }}>{emoji}</span>
        <span className="absolute text-[28px] opacity-10" style={{ top: '60%', left: '75%' }}>{emoji}</span>
        <span className="absolute text-[32px] opacity-12" style={{ top: '70%', left: '20%' }}>{emoji}</span>
        <span className="absolute text-[24px] opacity-10" style={{ top: '25%', left: '60%' }}>{emoji}</span>
      </div>
    );
  }
  return (
    <img
      src={current}
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
      onError={handleError}
    />
  );
}

function Row({ thumb, icon, iconTint = 'blue', title, sub, tag, tagVariant = 'default', onClick, animateDelay = 0, isCompleted }) {
  const tagStyles = {
    default: 'bg-gray-100 text-gray-600',
    warn: 'bg-amber-100 text-amber-800',
    good: 'bg-green-100 text-green-800',
  };
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animateDelay, duration: 0.2 }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 py-3 px-1 border-b border-border/60 last:border-b-0 active:bg-gray-50 text-right"
    >
      {thumb && (
        <div
          className="w-[50px] h-[50px] rounded-lg bg-gray-100 bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${thumb})` }}
        />
      )}
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[17px] shrink-0 ml-1 ${ICON_TINTS[iconTint]} ${isCompleted ? 'ring-2 ring-green-400' : ''}`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-medium text-foreground m-0 leading-[1.3]">{title}</p>
        {sub && <p className="text-[12.5px] text-muted-foreground m-0 leading-[1.35] truncate">{sub}</p>}
      </div>
      {isCompleted && (
        <span className="shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
          <Check size={13} className="text-green-700" strokeWidth={3} />
        </span>
      )}
      {tag && !isCompleted && (
        <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded shrink-0 ${tagStyles[tagVariant]}`}>
          {tag}
        </span>
      )}
      <ChevronRight size={16} className="text-gray-300 rotate-180 shrink-0" />
    </motion.button>
  );
}

// Pass-11: card component for articles. Replaces row format with a richer
// thumbnail-first card so the day overview feels like an adventure menu, not a list.
function ArticleCard({ article, theme, isCompleted, onClick, animateDelay = 0 }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animateDelay, duration: 0.25 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full rounded-2xl overflow-hidden border-2 mb-2.5 text-right transition-all
        ${isCompleted
          ? 'bg-emerald-50 border-emerald-300'
          : `${theme.cardActiveBg} ${theme.cardActiveBorder} shadow-sm hover:shadow-md`}`}
    >
      <div className="flex items-stretch">
        {/* Thumbnail or icon */}
        <div className="w-[88px] h-[88px] shrink-0 relative bg-gray-100 overflow-hidden">
          {article.image && imgOk ? (
            <img
              src={article.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgOk(false)}
              loading="lazy"
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${theme.gradient}`}>
              <span className="text-4xl">{article.icon || '📖'}</span>
            </div>
          )}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-end p-1.5">
              <span className="text-[18px] drop-shadow-md">⭐</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
          <p className="text-[14.5px] font-bold text-foreground m-0 leading-[1.25]">
            {article.icon && !article.image ? '' : article.icon ? `${article.icon} ` : ''}
            {article.title}
          </p>
          {article.sub && (
            <p className="text-[12px] text-muted-foreground m-0 mt-0.5 leading-[1.35] line-clamp-2">
              {article.sub}
            </p>
          )}
          {isCompleted && (
            <p className="text-[11px] font-medium text-emerald-700 m-0 mt-1 inline-flex items-center gap-1">
              <Check size={12} strokeWidth={3} /> סיימת!
            </p>
          )}
        </div>

        {/* Chevron */}
        <div className="flex items-center pr-2.5 pl-1 shrink-0">
          <ChevronRight size={18} className="text-gray-400 rotate-180" />
        </div>
      </div>
    </motion.button>
  );
}

// Pass-12: AttractionCard — same card style as articles, themed by region.
// Used for Disney rides, NYC sights, etc. Includes height-requirement badge.
function AttractionCard({ attraction, theme, onClick, animateDelay = 0 }) {
  const [imgOk, setImgOk] = useState(true);
  const heightTag = attraction.min_height_cm ? `${attraction.min_height_cm} ס״מ` : 'לכולם';
  const heightTagBg = attraction.min_height_cm
    ? 'bg-amber-100 text-amber-800'
    : 'bg-emerald-100 text-emerald-800';
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animateDelay, duration: 0.25 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full rounded-2xl overflow-hidden border-2 mb-2.5 text-right transition-all ${theme.cardActiveBg} ${theme.cardActiveBorder} shadow-sm hover:shadow-md`}
    >
      <div className="flex items-stretch">
        <div className="w-[88px] h-[88px] shrink-0 relative bg-gray-100 overflow-hidden">
          {attraction.image && imgOk ? (
            <img
              src={attraction.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgOk(false)}
              loading="lazy"
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${theme.gradient}`}>
              <span className="text-4xl">🎢</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
          <p className="text-[14.5px] font-bold text-foreground m-0 leading-[1.25]">
            {attraction.name}
          </p>
          {attraction.sub && (
            <p className="text-[12px] text-muted-foreground m-0 mt-0.5 leading-[1.35] line-clamp-2">
              {attraction.sub}
            </p>
          )}
          <span className={`inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded mt-1.5 text-[10.5px] font-medium ${heightTagBg}`}>
            📏 {heightTag}
          </span>
        </div>
        <div className="flex items-center pr-2.5 pl-1 shrink-0">
          <ChevronRight size={18} className="text-gray-400 rotate-180" />
        </div>
      </div>
    </motion.button>
  );
}

// ShowCard — slightly more compact, no height badge
function ShowCard({ show, theme, onClick, animateDelay = 0 }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animateDelay, duration: 0.25 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full rounded-2xl overflow-hidden border-2 mb-2.5 text-right transition-all ${theme.cardActiveBg} ${theme.cardActiveBorder} shadow-sm hover:shadow-md`}
    >
      <div className="flex items-stretch">
        <div className="w-[88px] h-[88px] shrink-0 relative bg-gray-100 overflow-hidden">
          {show.image && imgOk ? (
            <img
              src={show.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgOk(false)}
              loading="lazy"
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${theme.gradient}`}>
              <span className="text-4xl">🎭</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
          <p className="text-[14.5px] font-bold text-foreground m-0 leading-[1.25]">
            {show.name}
          </p>
          {show.times && (
            <p className="text-[12px] text-muted-foreground m-0 mt-0.5 leading-[1.35] line-clamp-2">
              🕒 {show.times}
            </p>
          )}
        </div>
        <div className="flex items-center pr-2.5 pl-1 shrink-0">
          <ChevronRight size={18} className="text-gray-400 rotate-180" />
        </div>
      </div>
    </motion.button>
  );
}

function tintForActivityType(type) {
  switch (type) {
    case 'quiz':           return 'blue';
    case 'match':          return 'amber';
    case 'rank':           return 'purple';
    case 'truefalse':      return 'green';
    case 'hotcold':        return 'pink';
    case 'picturereveal':  return 'cyan';
    case 'photochallenge': return 'amber';
    default:               return 'green';
  }
}

export default function DayOverview({
  day,
  content,
  userFamily,
  memberName,
  onOpenLearn,
  onOpenAttraction,
  onOpenShow,
  onOpenActivity,
  onStartFinishDay,
  onPrevDay,
  onNextDay,
  onJumpToDay,
  onBackToMap,
  hasPrevDay,
  hasNextDay,
  // celebration trigger from parent (pass-3)
  showJustClaimed,
  onDismissClaimed,
}) {
  // All hooks MUST be called before any early return (Rules of Hooks)
  const [showDayPicker, setShowDayPicker] = useState(false);
  const currentDayRowRef = useRef(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (showDayPicker && currentDayRowRef.current) {
      const t = setTimeout(() => {
        if (currentDayRowRef.current && currentDayRowRef.current.scrollIntoView) {
          currentDayRowRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [showDayPicker]);

  // Pass-19: defensive guard — must come AFTER hooks
  if (!day || !day.date) {
    return (
      <div dir="rtl" className="p-6 text-center">
        <p className="text-[14px] text-muted-foreground mb-3">לא נמצא יום להצגה.</p>
        {onBackToMap && (
          <button
            onClick={onBackToMap}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground bg-white border border-border rounded-lg px-3 py-2 active:bg-gray-50"
          >
            <ChevronRight size={14} /> חזרה למפה
          </button>
        )}
      </div>
    );
  }

  const introSuffix = userFamily ? familyAwareIntroSuffix(userFamily, day.date) : '';
  const banner = transitionBannerType(day.date);
  const badge = userFamily ? familyDayBadge(userFamily, day.date) : null;

  const theme = themeForDate(day.date);
  const intro = (content?.intro || day.what || '') + introSuffix;

  const formatDayLabel = () => {
    if (day.dayNum) return `יום ${day.dayNum} • ${day.label}`;
    return day.label;
  };

  const showLockedToast = () => {
    setToast('🔒 השלימו את הפריטים הקודמים כדי לפתוח');
    setTimeout(() => setToast(null), 1800);
  };

  const claimed = memberName ? isDayClaimed(memberName, day.date) : false;
  const dev = memberName ? isDevMode(memberName) : false;
  const progress = memberName ? dayProgress(memberName, day.date) : null;

  return (
    <div>
      {/* Top bar — restructured so the day picker expands to fill horizontal space */}
      <div className="flex items-stretch gap-2 mb-3">
        {onBackToMap && (
          <button
            onClick={onBackToMap}
            className="flex items-center gap-1.5 text-[12px] font-medium text-foreground bg-white border border-border rounded-lg px-2.5 py-2 active:bg-gray-50 shrink-0"
          >
            <ChevronRight size={14} /> חזרה למפה
          </button>
        )}

        <button
          onClick={onPrevDay}
          disabled={!hasPrevDay}
          className="px-3 py-2 rounded-lg border border-border bg-white text-[14px] font-medium text-muted-foreground disabled:opacity-30 active:bg-gray-50 shrink-0"
          aria-label="יום קודם"
        >
          ‹
        </button>

        {/* Picker button: flex-1 to consume remaining horizontal space */}
        <button
          onClick={() => setShowDayPicker(true)}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-white text-[12.5px] font-medium text-foreground active:bg-gray-50 inline-flex items-center justify-center gap-1.5"
          aria-label="בחר יום"
        >
          <Calendar size={14} />
          <span className="truncate">בחר יום</span>
        </button>

        <button
          onClick={onNextDay}
          disabled={!hasNextDay}
          className="px-3 py-2 rounded-lg border border-border bg-white text-[14px] font-medium text-muted-foreground disabled:opacity-30 active:bg-gray-50 shrink-0"
          aria-label="יום הבא"
        >
          ›
        </button>
      </div>

      {/* Hero — themed by region. Lighter overlay so the photo + colors come through. */}
      <div className={`relative rounded-2xl overflow-hidden h-[200px] mb-4 bg-gradient-to-br ${theme.gradient}`}>
        {day.image && <HeroImage src={day.image} fallbackEmoji={day.emoji} query={day.where} />}
        {/* Lighter overlay than before — was 78%, now 50% — image stays vivid */}
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.heroOverlay}`} />
        {/* Region emoji badge in top corner */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-sm shadow-sm">
          <span className="text-[14px]">{theme.emoji}</span>
          <span className="text-[11px] font-bold text-foreground">{theme.name}</span>
        </div>
        <div className="absolute bottom-3.5 right-4 left-4 text-white">
          <p className="text-[10.5px] font-medium tracking-[0.8px] uppercase opacity-90 mb-1 m-0 drop-shadow-md">
            {formatDayLabel()}
          </p>
          <h1 className="text-[26px] font-semibold leading-[1.1] m-0 tracking-tight drop-shadow-md">{day.title}</h1>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {day.where && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] bg-white/25 backdrop-blur-sm">
                📍 {day.where}
              </span>
            )}
            {badge && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] border ${BADGE_TINTS[badge.tone] || BADGE_TINTS.gray}`}>
                {badge.text}
              </span>
            )}
            {claimed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] bg-emerald-500 text-white shadow-sm">
                ⭐ הושלם
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Day-progress bar (when not claimed and there's content). Themed. */}
      {memberName && !claimed && progress && progress.total > 0 && (
        <div className={`${theme.cardBg} ${theme.cardBorder} border rounded-xl p-2.5 mb-3`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] font-medium text-foreground/80">התקדמות ביום</span>
            <span className="text-[12px] font-bold text-foreground">{progress.done} / {progress.total}</span>
          </div>
          <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full ${theme.headerBar} transition-all duration-500`}
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {banner && <TransitionBanner type={banner} />}

      {intro && (
        <p className="text-[15px] leading-[1.7] text-gray-700 px-1 mb-1">{intro}</p>
      )}

      {/* Pass-11: ARTICLE CARDS — bigger, themed, image-forward. */}
      {content?.learn?.length > 0 && (
        <>
          <SectionHeader accent="blue">המסע של היום</SectionHeader>
          <div>
            {content.learn.map((article, i) => {
              const unlocked = memberName ? isItemUnlocked(memberName, day.date, article.id, 'article') : true;
              const completed = memberName ? isItemCompleted(memberName, day.date, article.id, 'article') : false;
              if (!unlocked) {
                return (
                  <LockedItem
                    key={`art-${article.id}`}
                    title={article.title}
                    sub={article.sub}
                    kind="article"
                    onTap={showLockedToast}
                  />
                );
              }
              return (
                <ArticleCard
                  key={`art-${article.id}`}
                  article={article}
                  theme={theme}
                  isCompleted={completed}
                  onClick={() => onOpenLearn(article.id)}
                  animateDelay={i * 0.05}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Finish Day CTA — appears after articles list when there are activities */}
      {content?.learn?.length > 0 && content?.activities?.length > 0 && memberName && onStartFinishDay && (
        <FinishDayCTA
          articlesRead={(content.learn || []).filter(a =>
            isItemCompleted(memberName, day.date, a.id, 'article')
          ).length}
          articlesTotal={(content.learn || []).length}
          activitiesCount={(content.activities || []).length}
          estimatedMinutes={Math.max(2, Math.round((content.activities || []).length * 1.5))}
          onStart={onStartFinishDay}
        />
      )}

      {/* Attractions — themed cards */}
      {content?.attractions?.length > 0 && (
        <>
          <SectionHeader accent="amber">{content.attractions.length} אטרקציות</SectionHeader>
          <div>
            {content.attractions.map((a, i) => (
              <AttractionCard
                key={a.id}
                attraction={a}
                theme={theme}
                onClick={() => onOpenAttraction(a.id)}
                animateDelay={i * 0.04}
              />
            ))}
          </div>
        </>
      )}

      {/* Shows — themed cards */}
      {content?.shows?.length > 0 && (
        <>
          <SectionHeader accent="purple">{content.shows.length} מופעים</SectionHeader>
          <div>
            {content.shows.map((s, i) => (
              <ShowCard
                key={s.id}
                show={s}
                theme={theme}
                onClick={() => onOpenShow(s.id)}
                animateDelay={i * 0.04}
              />
            ))}
          </div>
        </>
      )}

      {/* (day-nav arrows are at the top of the page; see Top bar above) */}

      {/* Toast for locked tap */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2.5 rounded-full text-[13px] font-medium shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Just-claimed celebration overlay */}
      <AnimatePresence>
        {showJustClaimed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6"
            onClick={onDismissClaimed}
          >
            <motion.div
              initial={{ scale: 0.7, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="bg-white rounded-3xl p-6 text-center max-w-[320px] w-full border-4 border-amber-300 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-6xl mb-2">⭐</div>
              <p className="text-[20px] font-bold text-foreground mb-1">סיימת את היום!</p>
              <p className="text-[14px] text-muted-foreground mb-4 leading-[1.5]">
                {day.title} — מצוין! פתחת את היום הבא במסע.
              </p>
              <button
                onClick={onDismissClaimed}
                className="w-full py-3 rounded-xl bg-amber-500 text-white text-[14px] font-bold shadow-md active:scale-95"
              >
                המשך למפה
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pass-10: Day-picker bottom sheet */}
      <AnimatePresence>
        {showDayPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => setShowDayPicker(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full max-w-[480px] max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-3 shrink-0" />
              <p className="text-[15px] font-bold text-foreground text-center mb-3 px-4 shrink-0">בחר יום במסע</p>
              <div className="overflow-y-auto px-3 pb-4 space-y-1.5">
                {KIDS_DAYS.map((d, i) => {
                  const isCurrent = i === KIDS_DAYS.findIndex(x => x.date === day.date);
                  const isClaimed = memberName ? isDayClaimed(memberName, d.date) : false;
                  const isUnlocked = memberName ? isDayUnlocked(memberName, d.date) : true;

                  let statusEmoji = '🔒';
                  let statusBg = 'bg-gray-50 border-gray-200 opacity-60';
                  if (isClaimed) { statusEmoji = '⭐'; statusBg = 'bg-emerald-50 border-emerald-200'; }
                  else if (isUnlocked) { statusEmoji = '▶'; statusBg = 'bg-amber-50 border-amber-300'; }
                  if (isCurrent) statusBg += ' ring-2 ring-blue-400 ring-offset-1';

                  return (
                    <button
                      key={d.date}
                      ref={isCurrent ? currentDayRowRef : null}
                      type="button"
                      onClick={() => {
                        setShowDayPicker(false);
                        if (typeof onJumpToDay === 'function') {
                          onJumpToDay(i);
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border ${statusBg} active:scale-[0.98] transition-transform text-right`}
                    >
                      <span className="text-[18px] shrink-0">{d.emoji || '📍'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-bold text-foreground leading-tight m-0 truncate">
                          {d.title}
                        </p>
                        <p className="text-[11.5px] text-muted-foreground m-0 mt-0.5 truncate">
                          {d.label}{d.where ? ' · ' + d.where : ''}
                        </p>
                      </div>
                      <span className="text-[14px] shrink-0">{statusEmoji}</span>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-border p-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDayPicker(false)}
                  className="w-full py-2.5 rounded-xl bg-gray-100 text-[13px] font-medium text-foreground active:bg-gray-200"
                >
                  סגור
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}