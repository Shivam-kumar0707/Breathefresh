import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Member } from '../engine/exposure';
import { UsersIcon } from './icons';
import { FamilyMembersTab } from './FamilyMembersTab';
import { FamilyHomeTab } from './FamilyHomeTab';
import { FamilyCommuteTab } from './FamilyCommuteTab';

export const FamilyBuilder: React.FC = () => {
  const { profile, updateMember, addMember, removeMember, setProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'members' | 'home' | 'commute'>('members');

  const handleAddMember = () => {
    if (profile.members.length >= 6) return;
    const newId = `m-${Date.now()}`;
    const newMember: Member = {
      id: newId,
      name: `Member ${profile.members.length + 1}`,
      ageGroup: 'adult',
      conditions: [],
      blocks: [
        { startHour: 0, endHour: 8, place: 'home', activity: 'sleep', mask: 'none' },
        {
          startHour: 8,
          endHour: 9,
          place: 'commute',
          activity: 'rest',
          commuteMode: 'car_ac',
          mask: 'none',
        },
        { startHour: 9, endHour: 17, place: 'work_school', activity: 'light', mask: 'none' },
        {
          startHour: 17,
          endHour: 18,
          place: 'commute',
          activity: 'rest',
          commuteMode: 'car_ac',
          mask: 'none',
        },
        { startHour: 18, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
      ],
    };
    addMember(newMember);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-5">
      {/* Tab Selector */}
      <div
        className="flex border-b border-slate-200"
        role="tablist"
        aria-label="Family Profile Configuration Sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'members'}
          onClick={() => setActiveTab('members')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 min-h-[44px] ${
            activeTab === 'members'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          Family Members ({profile.members.length}/6)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 min-h-[44px] ${
            activeTab === 'home'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Home & Indoor Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'commute'}
          onClick={() => setActiveTab('commute')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 min-h-[44px] ${
            activeTab === 'commute'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Commute & Fuels
        </button>
      </div>

      {/* Tab 1: Members */}
      {activeTab === 'members' && (
        <FamilyMembersTab
          members={profile.members}
          onAddMember={handleAddMember}
          onUpdateMember={updateMember}
          onRemoveMember={removeMember}
        />
      )}

      {/* Tab 2: Home */}
      {activeTab === 'home' && (
        <FamilyHomeTab
          lifestyle={profile.lifestyle}
          onUpdateLifestyle={(updates) =>
            setProfile({
              lifestyle: { ...profile.lifestyle, ...updates },
            })
          }
        />
      )}

      {/* Tab 3: Commute & Fuels */}
      {activeTab === 'commute' && (
        <FamilyCommuteTab
          lifestyle={profile.lifestyle}
          onUpdateLifestyle={(updates) =>
            setProfile({
              lifestyle: { ...profile.lifestyle, ...updates },
            })
          }
        />
      )}
    </div>
  );
};
