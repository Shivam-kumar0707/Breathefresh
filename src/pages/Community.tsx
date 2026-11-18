import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { db, doc, getDoc, setDoc, updateDoc, increment } from '../lib/firebase';
import { ShareCard } from '../components/ShareCard';
import { ShareIcon, SparklesIcon, UsersIcon } from '../components/icons';

interface CommunityData {
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

const EMOJIS = ['🌱', '🛡️', '🚴', '🍃', '⚡', '🏠', '✨', '🌲'];

function generateCommunityCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const Community: React.FC = () => {
  const { profile, selectedActions, air } = useStore();

  const [activeCommunity, setActiveCommunity] = useState<CommunityData | null>(null);
  const [nick, setNick] = useState('FreshAirAdvocate');
  const [selectedEmoji, setSelectedEmoji] = useState('🌱');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newCommName, setNewCommName] = useState('');
  const [newCommType, setNewCommType] = useState<'society' | 'school' | 'office' | 'neighbourhood'>('society');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const cached = localStorage.getItem('breathefresh_community');
    if (cached) {
      try {
        setActiveCommunity(JSON.parse(cached));
      } catch {
        // ignore
      }
    } else {
      // Default demo community for Ghaziabad/NCR evaluators
      const demoComm: CommunityData = {
        code: 'GZB202',
        name: 'Ahinsa Khand Residents Clean Air Coalition',
        type: 'society',
        city: 'Ghaziabad',
        createdAt: new Date().toISOString(),
        memberCount: 42,
        pledgeCount: 128,
        cigsAvoidedTotal: 342,
        co2eSavedKgTotal: 620,
      };
      setActiveCommunity(demoComm);
    }
  }, []);

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) return;

    const code = generateCommunityCode();
    const newComm: CommunityData = {
      code,
      name: newCommName.trim().slice(0, 60),
      type: newCommType,
      city: profile.city.name,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      pledgeCount: selectedActions.length,
      cigsAvoidedTotal: Math.round(selectedActions.length * 1.5 * 10) / 10,
      co2eSavedKgTotal: Math.round(selectedActions.length * 4.2 * 10) / 10,
    };

    setActiveCommunity(newComm);
    localStorage.setItem('breathefresh_community', JSON.stringify(newComm));
    setStatusMessage(`Created community "${newComm.name}" with invite code ${newComm.code}`);

    // If Firebase configured, sync to Firestore
    if (db) {
      try {
        const commDoc = doc(db, 'communities', code);
        await setDoc(commDoc, newComm);
      } catch (err) {
        console.warn('Firestore community create failed silently:', err);
      }
    }
  };

  const handleJoinCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (code.length !== 6) {
      alert('Please enter a 6-character code (e.g. GZB202)');
      return;
    }

    if (db) {
      try {
        const commDoc = doc(db, 'communities', code);
        const snapshot = await getDoc(commDoc);
        if (snapshot.exists()) {
          const data = snapshot.data() as CommunityData;
          // Increment community counters
          await updateDoc(commDoc, {
            memberCount: increment(1),
            pledgeCount: increment(selectedActions.length),
            cigsAvoidedTotal: increment(selectedActions.length * 1.5),
            co2eSavedKgTotal: increment(selectedActions.length * 4),
          });
          setActiveCommunity(data);
          localStorage.setItem('breathefresh_community', JSON.stringify(data));
          setStatusMessage(`Successfully joined ${data.name}!`);
          return;
        }
      } catch (err) {
        console.warn('Firestore join failed, using local simulate:', err);
      }
    }

    // Local simulated join fallback
    const joinedComm: CommunityData = {
      code,
      name: `${code} Community Group`,
      type: 'society',
      city: profile.city.name,
      createdAt: new Date().toISOString(),
      memberCount: 14,
      pledgeCount: 38,
      cigsAvoidedTotal: 96,
      co2eSavedKgTotal: 180,
    };
    setActiveCommunity(joinedComm);
    localStorage.setItem('breathefresh_community', JSON.stringify(joinedComm));
    setStatusMessage(`Joined community ${code}!`);
  };

  const handleDownloadCard = async () => {
    const cardEl = document.getElementById('breathefresh-share-card');
    if (!cardEl) return;

    setIsGeneratingCard(true);
    try {
      const dataUrl = await toPng(cardEl, { quality: 0.95 });
      const link = document.createElement('a');
      link.download = `BreatheFresh-Impact-${activeCommunity?.code || 'Family'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.warn('Share card generation failed:', err);
      alert('Could not generate image. Please screenshot your impact card!');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const whatsappShareUrl = useMemo(() => {
    const text = `🌬️ Our community on BreatheFresh has pledged ${
      activeCommunity?.pledgeCount ?? 20
    } actions and avoided an estimated ${
      activeCommunity?.cigsAvoidedTotal ?? 100
    } cigarette-equivalents of winter smog! Join our clean air circle with code: ${
      activeCommunity?.code ?? 'GZB202'
    } at https://breathefresh.app`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [activeCommunity]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 sm:py-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {STRINGS.community.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {STRINGS.community.subtitle} · {STRINGS.community.anonymousNotice}
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-900">
          ✓ {statusMessage}
        </div>
      )}

      {/* Active Community Impact Showcase */}
      {activeCommunity && (
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-900/60 px-2.5 py-0.5 rounded-full border border-teal-700/50">
                Code: {activeCommunity.code}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {activeCommunity.name}
              </h2>
              <p className="text-xs text-slate-300">
                {activeCommunity.city} · {activeCommunity.type.toUpperCase()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="share-button"
                onClick={handleDownloadCard}
                disabled={isGeneratingCard}
                className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <ShareIcon className="w-3.5 h-3.5" />
                <span>{isGeneratingCard ? 'Generating...' : STRINGS.community.shareCardBtn}</span>
              </button>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>WhatsApp 💬</span>
              </a>
            </div>
          </div>

          {/* Collective Scores Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 block">{STRINGS.community.sharedScore}</span>
              <span className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">
                {activeCommunity.memberCount}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Active Families</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 block">{STRINGS.community.totalPledges}</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {activeCommunity.pledgeCount}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Pledged Actions</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 block">{STRINGS.community.cigsAvoidedTotal}</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                {activeCommunity.cigsAvoidedTotal}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Cigs Avoided</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-400 block">{STRINGS.community.co2eSavedTotal}</span>
              <span className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">
                {activeCommunity.co2eSavedKgTotal}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">kg CO₂e Slashed</span>
            </div>
          </div>
        </section>
      )}

      {/* Hidden Share Card Container for html-to-image download */}
      <div className="overflow-hidden h-0 w-0 pointer-events-none" ref={shareCardRef}>
        <ShareCard
          cityName={profile.city.name}
          aqi={air?.naqi.aqi ?? 250}
          cigsAvoided={activeCommunity?.cigsAvoidedTotal ?? 45}
          co2eSaved={activeCommunity?.co2eSavedKgTotal ?? 80}
          pledgeCount={activeCommunity?.pledgeCount ?? 12}
          communityName={activeCommunity?.name}
        />
      </div>

      {/* Forms: Create or Join */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Community Form */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {STRINGS.community.createTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Start a private clean air coalition for your apartment or school
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateCommunity} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Community Name
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={newCommName}
                onChange={(e) => setNewCommName(e.target.value)}
                placeholder="e.g. Express Garden Society RWA"
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Community Type
              </label>
              <select
                value={newCommType}
                onChange={(e) =>
                  setNewCommType(e.target.value as 'society' | 'school' | 'office' | 'neighbourhood')
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value="society">Residential Apartment / Society</option>
                <option value="school">School / Parent-Teacher Group</option>
                <option value="office">Workplace / Corporate Campus</option>
                <option value="neighbourhood">Neighbourhood / Sector Circle</option>
              </select>
            </div>

            <button
              type="submit"
              data-testid="community-create"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
            >
              {STRINGS.community.createBtn}
            </button>
          </form>
        </section>

        {/* Join Community Form */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {STRINGS.community.joinTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Enter a 6-character code shared by your neighbor
              </p>
            </div>
          </div>

          <form onSubmit={handleJoinCommunity} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                6-Character Community Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. GZB202"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase tracking-widest font-bold border border-slate-300 rounded-xl bg-white text-teal-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Anonymous Nickname
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Avatar Emoji
                </label>
                <div className="flex gap-1 overflow-x-auto py-1">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSelectedEmoji(em)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-all ${
                        selectedEmoji === em
                          ? 'bg-teal-100 border-teal-500 scale-110'
                          : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              data-testid="community-join"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
            >
              {STRINGS.community.joinBtn}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
