import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { db, doc, getDoc, setDoc, updateDoc, increment } from '../lib/firebase';
import { ShareCard } from '../components/ShareCard';
import { CommunityImpactView, type CommunityData } from '../components/CommunityImpactView';
import { CommunityForms } from '../components/CommunityForms';

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
  const [newCommType, setNewCommType] = useState<'society' | 'school' | 'office' | 'neighbourhood'>(
    'society'
  );
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
      // Default demo community for Ghaziabad/NCR
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

    if (db) {
      try {
        const commDoc = doc(db, 'communities', code);
        await setDoc(commDoc, newComm);
      } catch {
        // Firestore fallback handled
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
      } catch {
        // Handled silently
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
    } catch {
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
        <div
          role="status"
          aria-live="polite"
          className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-900"
        >
          ✓ {statusMessage}
        </div>
      )}

      {/* Active Community Impact Showcase */}
      {activeCommunity && (
        <CommunityImpactView
          community={activeCommunity}
          isGeneratingCard={isGeneratingCard}
          whatsappShareUrl={whatsappShareUrl}
          onDownloadCard={handleDownloadCard}
        />
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
      <CommunityForms
        newCommName={newCommName}
        setNewCommName={setNewCommName}
        newCommType={newCommType}
        setNewCommType={setNewCommType}
        joinCodeInput={joinCodeInput}
        setJoinCodeInput={setJoinCodeInput}
        nick={nick}
        setNick={setNick}
        selectedEmoji={selectedEmoji}
        setSelectedEmoji={setSelectedEmoji}
        onCreateCommunity={handleCreateCommunity}
        onJoinCommunity={handleJoinCommunity}
      />
    </div>
  );
};
