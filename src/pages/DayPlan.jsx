import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, Tent, Droplets, Zap, Ticket, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { DESTINATIONS, TIMELINE } from '../data/tripData';
import WikiImage from '../components/WikiImage';
import { REST_DAY_SUGGESTIONS, PARK_SHOWS, ENHANCED_RIDES } from '../data/disneyExtras';

import 'leaflet/dist/leaflet.css';
import FlightDayView from '../components/day/FlightDayView';
import ParkRidesSection from '../components/day/ParkRidesSection';
import ShowsSection from '../components/day/ShowsSection';
import RestDaySuggestions from '../components/day/RestDaySuggestions';
import RouteMap from '../components/day/RouteMap';
import AttractionsSection from '../components/day/AttractionsSection';
import DaySchedule from '../components/day/DaySchedule';
import { useApp } from '../context/AppContext';



const PARK_SECTIONS = ['yellowstone', 'grand-teton', 'salt-lake-city', 'bryce', 'zion', 'page', 'las-vegas'];

// The previous overnight stop, but only when both ends are driving (park) legs —
// so we never draw a line across the country for the flight days.
function findDriveLeg(currentDate, currentDestId, currentCoords) {
  if (!currentCoords || !PARK_SECTIONS.includes(currentDestId)) return null;
  const all = [];
  for (const dest of DESTINATIONS) for (const d of (dest.days || [])) {
    if (d.coords) all.push({ date: d.date, title: d.title, coords: d.coords, destId: dest.id });
  }
  all.sort((a, b) => a.date.localeCompare(b.date));
  const idx = all.findIndex(d => d.date === currentDate && d.destId === currentDestId);
  if (idx <= 0) return null;
  const prev = all[idx - 1];
  if (!PARK_SECTIONS.includes(prev.destId)) return null;
  if (prev.coords.lat === currentCoords.lat && prev.coords.lng === currentCoords.lng) return null;
  return prev;
}

export default function DayPlan() {
  const { destinationId, date } = useParams();
  const navigate = useNavigate();
  const { selectedFamily } = useApp();

  useEffect(() => { window.scrollTo(0, 0); }, [date]);

  const dest = DESTINATIONS.find(d => d.id === destinationId);
  const day = dest?.days?.find(d => d.date === date);

  useEffect(() => {
    if (!dest || !day) navigate(-1);
  }, [dest, day, navigate]);

  if (!dest || !day) return null;

  const restSuggestions = REST_DAY_SUGGESTIONS[day.date];
  const shows = PARK_SHOWS[day.date];
  const enhancedRides = ENHANCED_RIDES[day.date];

  const isParkSection = ['yellowstone', 'grand-teton', 'salt-lake-city', 'bryce', 'zion', 'page', 'las-vegas'].includes(destinationId);
  const transportMode = isParkSection ? '🚐 קרוואן' : null;
  const driveFrom = findDriveLeg(day.date, destinationId, day.coords);
  const hasRoute = !!driveFrom;

  // Hide the morning/afternoon/evening schedule block on Orlando/NY ONLY when
  // the day already has richer content (shows, rides, or rest-day suggestions).
  // For plain rest days the schedule is the most useful info we have.
  const hasRicherContent = !!(shows || enhancedRides || day.rides || restSuggestions);
  const hideSchedule = (destinationId === 'orlando' || destinationId === 'new-york') && hasRicherContent;

  // Pull this day's bookings/confirmations from the trip ledger so the day page
  // answers "what's booked / what's my confirmation" without leaving it.
  const dayBookings = TIMELINE.filter(e =>
    e.date === day.date && e.confirmation &&
    (!e.families || e.families.includes(selectedFamily))
  );

  if (day.type === 'flight') {
    return <FlightDayView day={day} family={selectedFamily} />;
  }

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">

      {/* Hero image */}
      <div className="relative h-56 overflow-hidden">
        {day.image_query ? (
          <WikiImage
            query={day.image_query}
            fallback={day.image}
            alt={day.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={day.image}
            alt={day.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80'; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 right-5 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ChevronRight size={20} className="text-white" />
        </button>
        <div className="absolute bottom-5 right-5 left-5 text-right">
          <p className="text-white/60 text-xs tracking-widest uppercase mb-1">{day.label}</p>
          <h1 className="text-white text-2xl font-bold leading-tight drop-shadow-md">{day.title}</h1>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-3">

        {/* Drive time */}
        {day.drive_time && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-white"
            dir="rtl"
          >
            <Clock size={17} className="text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 text-right">
              <p className="text-xs font-semibold text-muted-foreground mb-1">נסיעה</p>
              <p className="text-sm font-medium text-foreground leading-snug">{day.drive_time}</p>
              {transportMode && (
                <p className="text-xs text-primary font-semibold mt-1">{transportMode}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Camp + hookups */}
        {day.camp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-2xl px-4 py-3"
            dir="rtl"
          >
            <Tent size={17} className="text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-right">
              <p className="text-xs font-semibold text-muted-foreground">לינה</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(day.camp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary underline underline-offset-2"
              >{day.camp}</a>
              {destinationId !== 'orlando' && destinationId !== 'new-york' && destinationId !== 'niagara' && (
                <div className="flex items-center justify-end gap-3 mt-1.5">
                  <span className={`flex items-center gap-1 text-xs ${day.water_hookup ? 'text-blue-600' : 'text-muted-foreground/40'}`}>
                    <Droplets size={12} /> מים
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${day.electric_hookup ? 'text-yellow-600' : 'text-muted-foreground/40'}`}>
                    <Zap size={12} /> חשמל
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Bookings & confirmations for this day (from the trip ledger) */}
        {dayBookings.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3" dir="rtl">
            <div className="flex items-center gap-2 justify-end mb-2">
              <p className="text-xs font-semibold text-blue-900">הזמנות ואישורים</p>
              <Ticket size={15} className="text-blue-600" />
            </div>
            <div className="space-y-2">
              {dayBookings.map((b, i) => (
                <div key={i} className="text-right">
                  <p className="text-[13px] font-medium text-foreground leading-tight">{b.icon} {b.title}</p>
                  <p className="text-[11px] font-mono text-blue-700 mt-0.5 break-all">{b.confirmation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Schedule merged with attractions */}
        {(day.morning || day.afternoon || day.evening) && !hideSchedule && (
          <DaySchedule day={day} />
        )}

        {/* Route map to current location */}
        {day.drive_time && <RouteMap
          destinationId={destinationId}
          currentDay={day}
          DESTINATIONS={DESTINATIONS}
        />}

        {/* Rest day suggestions */}
        {restSuggestions && <RestDaySuggestions suggestions={restSuggestions} />}

        {/* Shows section (park days) */}
        {shows && <ShowsSection shows={shows} />}

        {/* Park rides — enhanced or original */}
        {(enhancedRides || day.rides) && (
          <ParkRidesSection rides={enhancedRides || day.rides} />
        )}

        {/* Attractions (national parks) — only shown if no schedule to merge with */}
        {day.attractions && !(day.morning || day.afternoon || day.evening) && (
          <AttractionsSection attractions={day.attractions} />
        )}

        {/* Interactive map — route for park drives, else just the location */}
        {day.coords && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.15 }}
          >
            <p className="text-xs font-semibold tracking-widest text-foreground/60 mb-3 text-right">
              {hasRoute ? '🗺️ מסלול הנסיעה' : '📍 מיקום על המפה'}
            </p>
            <div className="rounded-2xl overflow-hidden border border-border h-[52vh] min-h-[300px]">
              <MapContainer
                {...(hasRoute
                  ? { bounds: [[driveFrom.coords.lat, driveFrom.coords.lng], [day.coords.lat, day.coords.lng]], boundsOptions: { padding: [45, 45] } }
                  : { center: [day.coords.lat, day.coords.lng], zoom: 10 })}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution=""
                />
                {hasRoute && (
                  <>
                    <Polyline
                      positions={[[driveFrom.coords.lat, driveFrom.coords.lng], [day.coords.lat, day.coords.lng]]}
                      pathOptions={{ color: '#2563eb', weight: 4, dashArray: '10 8', opacity: 0.8 }}
                    />
                    <Marker position={[driveFrom.coords.lat, driveFrom.coords.lng]}>
                      <Popup>{driveFrom.title}</Popup>
                    </Marker>
                  </>
                )}
                <Marker position={[day.coords.lat, day.coords.lng]}>
                  <Popup>{day.title}</Popup>
                </Marker>
              </MapContainer>
            </div>
            {hasRoute && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${driveFrom.coords.lat},${driveFrom.coords.lng}&destination=${day.coords.lat},${day.coords.lng}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:opacity-90"
              >
                <Navigation size={16} /> פתח מסלול בגוגל מפות
              </a>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}