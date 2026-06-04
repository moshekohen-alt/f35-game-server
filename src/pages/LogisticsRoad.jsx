import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Caravan, BedDouble, Heart, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DESTINATIONS, FAMILY_SECTIONS } from '../data/tripData';
import WikiImage from '../components/WikiImage';

// Each stop on the road is typed so it gets a color + icon. Types are derived
// from the day's own fields, so this works for every family automatically.
const TYPE = {
  flight:  { color: '#7F77DD', Icon: Plane,     label: 'טיסה' },
  rv:      { color: '#1D9E75', Icon: Caravan,   label: 'קרוואן' },
  lodging: { color: '#378ADD', Icon: BedDouble, label: 'לינה' },
  event:   { color: '#D4537E', Icon: Heart,     label: 'אירוע' },
};

function typeOf(day) {
  if (day.type === 'flight' || day.flight_info_by_family) return 'flight';
  const t = `${day.title || ''} ${day.label || ''}`;
  if (/קרוואן/.test(t)) return 'rv';
  if (day.sectionId === 'wedding') return 'event';
  return 'lodging';
}

const HE_MONTHS = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
function heDate(iso) {
  const p = (iso || '').split('-').map(Number);
  if (p.length < 3) return iso || '';
  return `${p[2]} ${HE_MONTHS[p[1] - 1]}`;
}

export default function LogisticsRoad() {
  const { selectedFamily } = useApp();
  const navigate = useNavigate();
  const [openDay, setOpenDay] = useState(null);

  // Gather every day from the sections this family actually travels, in date order.
  const days = useMemo(() => {
    const secs = FAMILY_SECTIONS[selectedFamily] || [];
    const out = [];
    DESTINATIONS.forEach((dest) => {
      if (!secs.includes(dest.section)) return;
      (dest.days || []).forEach((day) =>
        out.push({ ...day, destId: dest.id, sectionId: dest.section, destName: dest.name_en })
      );
    });
    out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const seen = new Set();
    const uniq = [];
    out.forEach((d) => {
      if (d.date && !seen.has(d.date)) { seen.add(d.date); uniq.push(d); }
    });
    return uniq;
  }, [selectedFamily]);

  // Winding road geometry
  const W = 340, cx = 170, amp = 80, top = 46, step = 84;
  const N = days.length;
  const H = top + Math.max(N - 1, 0) * step + 56;
  const X = (y) => cx + amp * Math.sin((y - top) / 100);
  const pts = [];
  for (let y = top - 26; y <= H - 26; y += 8) pts.push(`${X(y).toFixed(1)},${y}`);
  const dPath = 'M' + pts.join(' L');

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      <div className="px-5 pt-12 pb-3">
        <h1 className="text-2xl font-bold">המסלול</h1>
        <p className="text-sm text-muted-foreground">משפחת {selectedFamily}</p>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
          {Object.values(TYPE).map((t) => (
            <span key={t.label} className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {N === 0 ? (
        <p className="text-center text-sm text-muted-foreground mt-10">אין עדיין ימים לתצוגה.</p>
      ) : (
        <div className="relative mx-auto" style={{ width: W, height: H }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', top: 0, right: 0 }}>
            <path d={dPath} fill="none" stroke="#C9C7BE" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
            <path d={dPath} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="9 11" strokeLinecap="round" />
          </svg>
          {days.map((day, i) => {
            const ty = TYPE[typeOf(day)];
            const Icon = ty.Icon;
            const py = top + i * step;
            const px = X(py);
            const leftSide = px >= cx;
            const lw = 148;
            const labelPos = leftSide ? { right: W - (px - 20) } : { right: W - (px + 20) - lw };
            return (
              <React.Fragment key={day.date + '-' + i}>
                <button
                  onClick={() => setOpenDay(day)}
                  aria-label={day.title || day.label}
                  className="absolute flex items-center justify-center rounded-full"
                  style={{ top: py - 15, right: W - px - 15, width: 30, height: 30, background: ty.color, border: '3px solid #fff' }}
                >
                  <Icon size={14} color="#fff" strokeWidth={2.2} />
                </button>
                <div className="absolute text-right" style={{ top: py - 18, width: lw, pointerEvents: 'none', ...labelPos }}>
                  <div className="text-[11px] text-muted-foreground/70">{heDate(day.date)}</div>
                  <div className="text-[13px] font-semibold leading-tight">{day.title || day.label}</div>
                  {day.drive_time && <div className="text-[11px] text-muted-foreground leading-tight truncate">{day.drive_time}</div>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {openDay && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-6" onClick={() => setOpenDay(null)}>
          <div className="w-80 max-w-full bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-40 flex items-end" style={{ background: TYPE[typeOf(openDay)].color }}>
              <WikiImage
                query={openDay.image_query || openDay.destName || ''}
                fallback={openDay.image}
                alt={openDay.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <button onClick={() => setOpenDay(null)} className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/85 flex items-center justify-center">
                <X size={16} />
              </button>
              <div className="relative w-full px-4 py-2.5 text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)' }}>
                <div className="text-xs opacity-90">{heDate(openDay.date)}</div>
                <div className="text-lg font-bold leading-tight">{openDay.title || openDay.label}</div>
              </div>
            </div>
            <div className="p-4 text-sm space-y-1.5">
              {openDay.morning && <p>{openDay.morning}</p>}
              {openDay.camp && <p className="text-muted-foreground"><span className="font-medium text-foreground">לינה:</span> {openDay.camp}</p>}
              {openDay.drive_time && <p className="text-muted-foreground"><span className="font-medium text-foreground">נסיעה:</span> {openDay.drive_time}</p>}
              <button
                onClick={() => { const d = openDay; setOpenDay(null); navigate(`/destination/${d.destId}/day/${d.date}`); }}
                className="mt-2 w-full text-center text-primary text-sm font-medium py-2 rounded-xl border border-border"
              >
                פתח יום מלא
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
