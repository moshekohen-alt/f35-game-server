import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { TRIP_SECTIONS, DESTINATIONS } from '../data/tripData';
import WikiImage from '../components/WikiImage';

const DEST_MAP = Object.fromEntries(DESTINATIONS.map(d => [d.id, d]));

// Hero image per section — same images as the Home page section cards
const SECTION_HERO_IMAGE = {
  niagara_rv: 'https://commons.wikimedia.org/wiki/Special:FilePath/Niagara_Falls_aerial_view.jpg?width=1600',
  disney:     'https://media.base44.com/images/public/69d14c60fb768fe1fc501899/421fcc6ff_IMG_1807.jpg',
  wedding:    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?fm=jpg&q=60&w=3000',
  parks:      'https://images.unsplash.com/photo-1527489377706-5bf97e608852?fm=jpg&q=60&w=3000&auto=format&fit=crop',
};

const SECTION_GRADIENT = {
  niagara_rv: 'from-black/70 via-black/40 to-transparent',
  disney: 'from-black/70 via-black/40 to-transparent',
  wedding: 'from-black/70 via-black/40 to-transparent',
  parks: 'from-black/70 via-black/40 to-transparent',
};

const SECTION_ACCENT_TEXT = {
  niagara_rv: 'text-white/70',
  disney: 'text-white/70',
  wedding: 'text-white/70',
  parks: 'text-white/70',
};

export default function SectionHome() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const section = TRIP_SECTIONS.find(s => s.id === sectionId);

  useEffect(() => { window.scrollTo(0, 0); }, [sectionId]);

  useEffect(() => {
    if (!section) navigate('/');
  }, [section, navigate]);

  if (!section) return null;

  const sectionDests = section.destinations.map(id => DEST_MAP[id]).filter(Boolean);

  // ניאגרה, דיסני וחתונה — מציגים תכנון יומי ישירות בלי עמוד ביניים
  const isSimpleSection = sectionId === 'niagara_rv' || sectionId === 'disney' || sectionId === 'wedding';
  const simpleDest = DEST_MAP[section.destinations?.[0]];

  if (isSimpleSection && simpleDest?.days) {
    return (
      <div className="min-h-screen bg-background pb-28" dir="rtl">
        <div className="relative h-52 overflow-hidden">
          <img
            src={SECTION_HERO_IMAGE[sectionId]}
            alt={section.title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-b ${SECTION_GRADIENT[sectionId]}`} />
          <button
            onClick={() => navigate('/')}
            className="absolute top-12 right-5 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
          <div className="absolute bottom-5 right-5 left-5 text-right">
            <p className="text-white/60 text-xs tracking-widest uppercase mb-1">{section.subtitle}</p>
            <h1 className="text-white text-2xl font-bold leading-tight drop-shadow-md">{section.emoji} {section.title}</h1>
            <p className="text-white/60 text-xs mt-1">{section.dates}</p>
          </div>
        </div>

        <div className="px-5 mt-6">
          {simpleDest.days.length > 0 && (
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4 text-right">תכנון יומי</p>
          )}
          <div className="space-y-3">
            {simpleDest.days.map((day, i) => (
            <motion.button
              key={day.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 4) * 0.05, duration: 0.25 }}
              onClick={() => navigate(`/destination/${simpleDest.id}/day/${day.date}`)}
              className="w-full group text-right"
            >
              <div className="relative rounded-2xl overflow-hidden h-36">
                {day.image_query ? (
                  <WikiImage
                    query={day.image_query}
                    fallback={day.image}
                    alt={day.title}
                    className="absolute inset-0 w-full h-full object-cover group-active:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <img
                    src={day.image}
                    alt={day.title}
                    className="absolute inset-0 w-full h-full object-cover group-active:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 px-4 pb-3 text-right">
                  <p className="text-white/70 text-[11px] font-medium mb-0.5">{day.label}</p>
                  <p className="text-white font-bold text-base leading-tight drop-shadow">{day.title}</p>
                </div>
                <div className="absolute top-3 left-3">
                  <ChevronLeft size={16} className="text-white/60" />
                </div>
              </div>
            </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">

      {/* ── HERO IMAGE ── */}
      <div className="relative h-[75vw] max-h-96 overflow-hidden">
        <img
          src={SECTION_HERO_IMAGE[sectionId]}
          alt={section.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${SECTION_GRADIENT[sectionId]}`} />

        <button
          onClick={() => navigate('/')}
          className="absolute top-12 right-5 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ChevronRight size={20} className="text-white" />
        </button>

        <div className="absolute bottom-5 right-5 left-5 text-right">
          <p className="text-white/60 text-xs tracking-widest uppercase mb-1">{section.subtitle}</p>
          <h1 className="text-white text-3xl font-bold leading-tight drop-shadow-md">
            {section.emoji} {section.title}
          </h1>
          <div className="flex items-center justify-end gap-1.5 mt-1.5">
            <span className={`text-xs font-medium ${SECTION_ACCENT_TEXT[sectionId]}`}>{section.dates}</span>
            <Calendar size={12} className="text-white/50" />
          </div>
        </div>
      </div>

      {/* ── OTHER DESTINATIONS (פארקים) ── */}
      {sectionDests.length > 0 && (
        <div className="px-5 mt-6">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4 text-right">
            יעדים במסלול
          </p>
          <div className="space-y-2.5">
            {sectionDests.map((dest, i) => (
              <motion.button
                key={dest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 4) * 0.05, duration: 0.25 }}
                onClick={() => navigate(`/destination/${dest.id}`)}
                className="w-full relative rounded-2xl overflow-hidden h-24 group text-right"
              >
                <img
                  src={dest.image}
                  alt={dest.name}


                  className="absolute inset-0 w-full h-full object-cover group-active:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                <div className="absolute top-0 right-0 bottom-0 flex items-center px-4">
                  <div className="text-right">
                    <p className="text-white font-bold text-sm leading-tight drop-shadow">
                      {dest.emoji} {dest.name}
                    </p>
                    <p className="text-white/60 text-[11px] mt-0.5">{dest.dates}</p>
                  </div>
                </div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <ChevronLeft size={13} className="text-white/40" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}