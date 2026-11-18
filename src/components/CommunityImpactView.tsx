import React from 'react';
import { STRINGS } from '../i18n/en';
import { ShareIcon } from './icons';

export interface CommunityData {
  code: string;
  name: string;
  type: 'society' | 'school' | 'office' | 'neighbourhood';
  city: string;
  createdAt: string;
  memberCount: number;
  pledgeCount: number;
  cigsAvoidedTotal: number;
  co2eSavedKgTotal: number;
}

interface CommunityImpactViewProps {
  community: CommunityData;
  isGeneratingCard: boolean;
  whatsappShareUrl: string;
  onDownloadCard: () => void;
}

export const CommunityImpactView: React.FC<CommunityImpactViewProps> = ({
  community,
  isGeneratingCard,
  whatsappShareUrl,
  onDownloadCard,
}) => {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-600">
            Code: {community.code}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{community.name}</h2>
          <p className="text-xs text-slate-300">
            {community.city} · {community.type.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="share-button"
            onClick={onDownloadCard}
            disabled={isGeneratingCard}
            className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5 min-h-[44px]"
          >
            <ShareIcon className="w-3.5 h-3.5" />
            <span>{isGeneratingCard ? 'Generating...' : STRINGS.community.shareCardBtn}</span>
          </button>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition-all shadow-xs flex items-center gap-1.5 min-h-[44px]"
          >
            <span>WhatsApp 💬</span>
          </a>
        </div>
      </div>

      {/* Collective Scores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-slate-300 block">{STRINGS.community.sharedScore}</span>
          <span className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">
            {community.memberCount}
          </span>
          <span className="text-[11px] text-slate-300 block mt-0.5">Active Families</span>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-slate-300 block">{STRINGS.community.totalPledges}</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {community.pledgeCount}
          </span>
          <span className="text-[11px] text-slate-300 block mt-0.5">Pledged Actions</span>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-slate-300 block">{STRINGS.community.cigsAvoidedTotal}</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
            {community.cigsAvoidedTotal}
          </span>
          <span className="text-[11px] text-slate-300 block mt-0.5">Cigs Avoided</span>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-slate-300 block">{STRINGS.community.co2eSavedTotal}</span>
          <span className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">
            {community.co2eSavedKgTotal}
          </span>
          <span className="text-[11px] text-slate-300 block mt-0.5">kg CO₂e Slashed</span>
        </div>
      </div>
    </section>
  );
};
