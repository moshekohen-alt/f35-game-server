import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Route, CheckSquare, Luggage, MoreHorizontal } from 'lucide-react';

// The itinerary (full day-by-day spine with flights, lodging and bookings) is
// the backbone of the trip, so it gets a first-class tab. The per-family
// "logistics road" sits beside it. Packing now lives under "More".
function getTabs() {
  return [
    { path: '/', icon: Home, label: 'בית' },
    { path: '/timeline', icon: Route, label: 'מסלול' },
    { path: '/logistics', icon: Luggage, label: 'לוגיסטיקה' },
    { path: '/tasks', icon: CheckSquare, label: 'משימות' },
    { path: '/more', icon: MoreHorizontal, label: 'עוד' },
  ];
}

export default function BottomNav({ taskBadge }) {
  const location = useLocation();
  const tabs = getTabs();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          const isTask = path === '/tasks';
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors duration-200 ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                {isTask && taskBadge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {taskBadge > 9 ? '9+' : taskBadge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>
                {label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}