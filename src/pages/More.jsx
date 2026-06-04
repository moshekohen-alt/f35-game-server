import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, ClipboardList, Camera, Backpack } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TILES = [
  { icon: Backpack, label: 'ציוד', sublabel: 'רשימת ציוד ואריזה', path: '/packing', color: 'bg-amber-50 border-amber-100 text-amber-600' },
  { icon: ClipboardList, label: 'סקרים', sublabel: 'החלטות ותכנון', path: '/surveys', color: 'bg-blue-50 border-blue-100 text-blue-600' },
  { icon: DollarSign, label: 'תקציב', sublabel: 'הוצאות ותשלומים', path: '/budget', color: 'bg-green-50 border-green-100 text-green-600' },
  { icon: Camera, label: 'גלריית תמונות', sublabel: 'תמונות מהטיול', path: '/gallery-all', color: 'bg-violet-50 border-violet-100 text-violet-600' },
];

// Identify the trip organizer as the admin (Moshe Kohen for now)
const ADMIN_NAMES = ['משה כהן'];

export default function More() {
  const navigate = useNavigate();
  const { selectedMember } = useApp();

  const isAdmin = ADMIN_NAMES.includes(selectedMember?.name || '');
  const visibleTiles = TILES.filter(t => !t.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      <div className="pt-14 px-5 pb-6">
        <h1 className="text-2xl font-bold text-foreground text-right">עוד</h1>
        <p className="text-muted-foreground text-sm mt-1 text-right">
          {selectedMember?.name || 'אזורים נוספים'}
        </p>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3">
        {visibleTiles.map(({ icon: Icon, label, sublabel, path, color }, i) => (
          <motion.button
            key={path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 4) * 0.05, duration: 0.25 }}
            onClick={() => navigate(path)}
            className={`text-right p-4 rounded-2xl border ${color} active:scale-[0.97] transition-transform`}
          >
            <Icon size={24} className="mb-3" />
            <p className="font-bold text-foreground text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}