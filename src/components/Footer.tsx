import React from 'react';
import { Link } from 'react-router-dom';
import { STRINGS } from '../i18n/en';
import { ShieldIcon, WindIcon } from './icons';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 bg-white border-t border-slate-200 text-slate-600 text-xs py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center">
              <WindIcon className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 text-sm">{STRINGS.app.name}</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="text-slate-600">{STRINGS.app.tagline}</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <Link to="/plan" className="hover:text-teal-700">
              Today’s Plan
            </Link>
            <Link to="/impact" className="hover:text-teal-700">
              What-If & Simulator
            </Link>
            <Link to="/community" className="hover:text-teal-700">
              Community
            </Link>
            <Link to="/method" className="hover:text-teal-700 font-bold text-teal-800">
              How We Calculate
            </Link>
          </div>
        </div>

        {/* Medical & Scientific Disclaimer */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-[11px] leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <ShieldIcon className="w-3.5 h-3.5 text-amber-700" />
            <span>Health & Medical Disclaimer:</span>
          </div>
          <p>{STRINGS.app.notMedicalAdvice}</p>
        </div>

        {/* Privacy Note */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-600">
          <p>
            Privacy by Design: No accounts, login, or tracking cookies. Identity is an anonymous
            local ID. All exposure figures calculated deterministically.
          </p>
          <span className="font-mono text-slate-600">v1.0</span>
        </div>
      </div>
    </footer>
  );
};
