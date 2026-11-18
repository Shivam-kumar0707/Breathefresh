import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { AgeGroup, HealthCondition, Member } from '../engine/exposure';
import type { CookingFuel, HeatingFuel } from '../engine/emissions';
import { UsersIcon } from './icons';

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
        { startHour: 8, endHour: 9, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
        { startHour: 9, endHour: 17, place: 'work_school', activity: 'light', mask: 'none' },
        { startHour: 17, endHour: 18, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
        { startHour: 18, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
      ],
    };
    addMember(newMember);
  };

  const toggleCondition = (member: Member, condition: HealthCondition) => {
    const exists = member.conditions.includes(condition);
    const updated = exists
      ? member.conditions.filter((c) => c !== condition)
      : [...member.conditions, condition];
    updateMember(member.id, { conditions: updated });
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-5">
      {/* Tab Selector */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'members'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          Family Members ({profile.members.length}/6)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'home'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Home & Indoor Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('commute')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'commute'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Commute & Fuels
        </button>
      </div>

      {/* Tab 1: Members */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Each member has distinct inhalation rates and medical vulnerability risk multipliers.
            </p>
            {profile.members.length < 6 && (
              <button
                type="button"
                onClick={handleAddMember}
                className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors"
              >
                + Add Member
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {profile.members.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateMember(m.id, { name: e.target.value })}
                    className="font-semibold text-sm text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none px-1"
                    placeholder="Member Name"
                  />
                  {profile.members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 p-1"
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Age Group Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                    Age Group
                  </label>
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    {(['child', 'teen', 'adult', 'senior'] as AgeGroup[]).map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => updateMember(m.id, { ageGroup: grp })}
                        className={`py-1 rounded font-medium capitalize text-center border transition-all ${
                          m.ageGroup === grp
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {grp === 'child' ? 'Child <12' : grp === 'senior' ? 'Senior 65+' : grp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vulnerability Conditions */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                    Health Multipliers (Optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'asthma_copd', label: 'Asthma / COPD' },
                      { id: 'heart', label: 'Heart Condition' },
                      { id: 'pregnant', label: 'Pregnant' },
                    ].map((cond) => {
                      const isSelected = m.conditions.includes(cond.id as HealthCondition);
                      return (
                        <button
                          key={cond.id}
                          type="button"
                          onClick={() => toggleCondition(m, cond.id as HealthCondition)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-rose-100 text-rose-800 border-rose-300 font-semibold'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {cond.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Home */}
      {activeTab === 'home' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Floor Area (m²)
            </label>
            <input
              type="number"
              min={20}
              max={600}
              value={profile.lifestyle.homeAreaM2}
              onChange={(e) =>
                setProfile({
                  lifestyle: {
                    ...profile.lifestyle,
                    homeAreaM2: Math.max(20, parseInt(e.target.value) || 50),
                  },
                })
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Approx. {Math.round(profile.lifestyle.homeAreaM2 * 10.76)} sq. ft. Ceiling default: 2.7m.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Air Purifier at Home
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setProfile({
                    lifestyle: { ...profile.lifestyle, hasPurifier: false },
                  })
                }
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${
                  !profile.lifestyle.hasPurifier
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                No Purifier
              </button>
              <button
                type="button"
                onClick={() =>
                  setProfile({
                    lifestyle: {
                      ...profile.lifestyle,
                      hasPurifier: true,
                      cadrM3h: profile.lifestyle.cadrM3h ?? 300,
                    },
                  })
                }
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${
                  profile.lifestyle.hasPurifier
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                Have Purifier
              </button>
            </div>
            {profile.lifestyle.hasPurifier && (
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="CADR in m³/h (e.g. 300)"
                  value={profile.lifestyle.cadrM3h || ''}
                  onChange={(e) =>
                    setProfile({
                      lifestyle: {
                        ...profile.lifestyle,
                        cadrM3h: parseInt(e.target.value) || 250,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Commute & Fuels */}
      {activeTab === 'commute' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Primary Commute Mode
            </label>
            <select
              value={profile.lifestyle.commuteMode}
              onChange={(e) =>
                setProfile({
                  lifestyle: {
                    ...profile.lifestyle,
                    commuteMode: e.target.value as 'car_petrol' | 'two_wheeler' | 'metro' | 'bus',
                  },
                })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="car_petrol">Personal Car (AC / Cabin Filter)</option>
              <option value="two_wheeler">Two-Wheeler / Motorcycle (Direct Exhaust)</option>
              <option value="metro">Metro (Underground / Filtered AC)</option>
              <option value="bus">Public Bus (Semi-Open)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Daily Travel Distance (km round-trip)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={profile.lifestyle.commuteKm}
              onChange={(e) =>
                setProfile({
                  lifestyle: {
                    ...profile.lifestyle,
                    commuteKm: parseInt(e.target.value) || 15,
                  },
                })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Kitchen Cooking Fuel
            </label>
            <select
              value={profile.lifestyle.cookingFuel}
              onChange={(e) =>
                setProfile({
                  lifestyle: {
                    ...profile.lifestyle,
                    cookingFuel: e.target.value as CookingFuel,
                  },
                })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="lpg">LPG Cylinder / Piped Gas</option>
              <option value="induction">Electric Induction Cooktop</option>
              <option value="biomass">Biomass / Chulha (Solid Fuel)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Winter Heating Source
            </label>
            <select
              value={profile.lifestyle.heatingFuel}
              onChange={(e) =>
                setProfile({
                  lifestyle: {
                    ...profile.lifestyle,
                    heatingFuel: e.target.value as HeatingFuel,
                  },
                })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="none">No Space Heating Needed</option>
              <option value="electric">Electric Radiator / Heat Pump</option>
              <option value="coal_wood">Coal / Wood Angithi (Indoor Combustion)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
