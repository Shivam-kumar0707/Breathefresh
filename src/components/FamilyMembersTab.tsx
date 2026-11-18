import React from 'react';
import type { AgeGroup, HealthCondition, Member } from '../engine/exposure';

interface FamilyMembersTabProps {
  members: Member[];
  onAddMember: () => void;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
  onRemoveMember: (id: string) => void;
}

export const FamilyMembersTab: React.FC<FamilyMembersTabProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
}) => {
  const toggleCondition = (member: Member, condition: HealthCondition) => {
    const exists = member.conditions.includes(condition);
    const updated = exists
      ? member.conditions.filter((c) => c !== condition)
      : [...member.conditions, condition];
    onUpdateMember(member.id, { conditions: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-600">
          Each member has distinct inhalation rates and medical vulnerability risk multipliers.
        </p>
        {members.length < 6 && (
          <button
            type="button"
            onClick={onAddMember}
            className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-300 transition-colors min-h-[36px]"
          >
            + Add Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {members.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                aria-label={`Name for ${m.name}`}
                value={m.name}
                onChange={(e) => onUpdateMember(m.id, { name: e.target.value })}
                className="font-semibold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 focus:outline-none px-1"
                placeholder="Member Name"
              />
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveMember(m.id)}
                  aria-label={`Remove ${m.name}`}
                  className="text-xs text-slate-500 hover:text-rose-700 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center rounded"
                  title="Remove member"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Age Group Selector */}
            <div>
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide block mb-1">
                Age Group
              </span>
              <div
                className="grid grid-cols-4 gap-1 text-xs"
                role="radiogroup"
                aria-label={`Age group for ${m.name}`}
              >
                {(['child', 'teen', 'adult', 'senior'] as AgeGroup[]).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    role="radio"
                    aria-checked={m.ageGroup === grp}
                    onClick={() => onUpdateMember(m.id, { ageGroup: grp })}
                    className={`py-1.5 rounded font-medium capitalize text-center border transition-all min-h-[36px] ${
                      m.ageGroup === grp
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {grp === 'child' ? 'Child <12' : grp === 'senior' ? 'Senior 65+' : grp}
                  </button>
                ))}
              </div>
            </div>

            {/* Vulnerability Conditions */}
            <div>
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide block mb-1">
                Health Multipliers (Optional)
              </span>
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
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggleCondition(m, cond.id as HealthCondition)}
                      className={`text-xs px-2.5 py-1.5 rounded-full border transition-all min-h-[32px] ${
                        isSelected
                          ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
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
  );
};
