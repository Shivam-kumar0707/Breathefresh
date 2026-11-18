import React from 'react';
import { STRINGS } from '../i18n/en';
import { SparklesIcon, UsersIcon } from './icons';

const EMOJIS = ['🌱', '🛡️', '🚴', '🍃', '⚡', '🏠', '✨', '🌲'];

interface CommunityFormsProps {
  newCommName: string;
  setNewCommName: (v: string) => void;
  newCommType: 'society' | 'school' | 'office' | 'neighbourhood';
  setNewCommType: (v: 'society' | 'school' | 'office' | 'neighbourhood') => void;
  joinCodeInput: string;
  setJoinCodeInput: (v: string) => void;
  nick: string;
  setNick: (v: string) => void;
  selectedEmoji: string;
  setSelectedEmoji: (v: string) => void;
  onCreateCommunity: (e: React.FormEvent) => void;
  onJoinCommunity: (e: React.FormEvent) => void;
}

export const CommunityForms: React.FC<CommunityFormsProps> = ({
  newCommName,
  setNewCommName,
  newCommType,
  setNewCommType,
  joinCodeInput,
  setJoinCodeInput,
  nick,
  setNick,
  selectedEmoji,
  setSelectedEmoji,
  onCreateCommunity,
  onJoinCommunity,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Create Community Form */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
            <UsersIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">{STRINGS.community.createTitle}</h2>
            <p className="text-xs text-slate-600">
              Start a private clean air coalition for your apartment or school
            </p>
          </div>
        </div>

        <form onSubmit={onCreateCommunity} className="space-y-3 pt-1">
          <div>
            <label
              htmlFor="comm-name-input"
              className="text-xs font-semibold text-slate-800 block mb-1"
            >
              Community Name
            </label>
            <input
              id="comm-name-input"
              type="text"
              required
              maxLength={60}
              value={newCommName}
              onChange={(e) => setNewCommName(e.target.value)}
              placeholder="e.g. Express Garden Society RWA"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white min-h-[44px]"
            />
          </div>

          <div>
            <label
              htmlFor="comm-type-select"
              className="text-xs font-semibold text-slate-800 block mb-1"
            >
              Community Type
            </label>
            <select
              id="comm-type-select"
              value={newCommType}
              onChange={(e) =>
                setNewCommType(e.target.value as 'society' | 'school' | 'office' | 'neighbourhood')
              }
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-medium min-h-[44px]"
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
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs min-h-[44px]"
          >
            {STRINGS.community.createBtn}
          </button>
        </form>
      </section>

      {/* Join Community Form */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">{STRINGS.community.joinTitle}</h2>
            <p className="text-xs text-slate-600">
              Enter a 6-character code shared by your neighbor
            </p>
          </div>
        </div>

        <form onSubmit={onJoinCommunity} className="space-y-3 pt-1">
          <div>
            <label
              htmlFor="comm-code-input"
              className="text-xs font-semibold text-slate-800 block mb-1"
            >
              6-Character Community Code
            </label>
            <input
              id="comm-code-input"
              type="text"
              required
              maxLength={6}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. GZB202"
              className="w-full px-3.5 py-2 text-sm font-mono uppercase tracking-widest font-bold border border-slate-300 rounded-xl bg-white text-teal-900 min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="comm-nick-input"
                className="text-xs font-semibold text-slate-800 block mb-1"
              >
                Anonymous Nickname
              </label>
              <input
                id="comm-nick-input"
                type="text"
                maxLength={20}
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Avatar Emoji
              </label>
              <div
                className="flex gap-1 overflow-x-auto py-1"
                role="radiogroup"
                aria-label="Select avatar emoji"
              >
                {EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    role="radio"
                    aria-checked={selectedEmoji === em}
                    aria-label={`Select emoji ${em}`}
                    onClick={() => setSelectedEmoji(em)}
                    className={`min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg text-sm flex items-center justify-center border transition-all ${
                      selectedEmoji === em
                        ? 'bg-teal-100 border-teal-600 scale-105'
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
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs min-h-[44px]"
          >
            {STRINGS.community.joinBtn}
          </button>
        </form>
      </section>
    </div>
  );
};
