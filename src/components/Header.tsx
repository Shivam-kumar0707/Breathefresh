import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { WindIcon, SparklesIcon } from './icons';
import { RoomScanModal } from './RoomScanModal';

export const Header: React.FC = () => {
  const location = useLocation();
  const { profile, setLanguage, setIsChatOpen } = useStore();
  const [isRoomScanOpen, setIsRoomScanOpen] = useState(false);

  const navLinks = [
    { to: '/', label: STRINGS.nav.home },
    { to: '/plan', label: STRINGS.nav.plan },
    { to: '/impact', label: STRINGS.nav.impact },
    { to: '/community', label: STRINGS.nav.community },
    { to: '/method', label: STRINGS.nav.method },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:bg-teal-700 transition-colors">
            <WindIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight block leading-none">
              {STRINGS.app.name}
            </span>
            <span className="text-[10px] text-teal-700 font-semibold tracking-wide">
              {STRINGS.app.tagline}
            </span>
          </div>
        </Link>

        {/* Navigation Landmarks */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 text-xs font-semibold">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={profile.language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'hinglish')}
            aria-label="Language selection"
            className="text-xs font-medium px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="hinglish">Hinglish</option>
          </select>

          {/* Room Scan Button */}
          <button
            type="button"
            onClick={() => setIsRoomScanOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors shadow-xs"
          >
            <span>📷 Scan</span>
          </button>

          {/* Ask AI Chat Button */}
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-xs"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <nav aria-label="Mobile Navigation" className="md:hidden flex border-t border-slate-200 bg-white overflow-x-auto no-scrollbar px-2 py-1.5 gap-1 text-xs font-semibold">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Room Scan Modal */}
      <RoomScanModal
        isOpen={isRoomScanOpen}
        onClose={() => setIsRoomScanOpen(false)}
      />
    </header>
  );
};
