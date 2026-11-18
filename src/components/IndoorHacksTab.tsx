import React, { useState } from 'react';
import { STRINGS } from '../i18n/en';
import { CheckIcon, ShieldIcon } from './icons';

export const IndoorHacksTab: React.FC = () => {
  const [roomAreaSqFt, setRoomAreaSqFt] = useState(150);
  const [ceilingHeightFt, setCeilingHeightFt] = useState(9);
  const [targetAch, setTargetAch] = useState(5); // 5 air changes per hour for smog

  // CADR formula:
  // Volume (cu ft) = Area * Height
  // Volume (m³) = Volume (cu ft) * 0.0283168
  // Needed CADR (m³/h) = Volume (m³) * targetAch
  const roomVolumeM3 = roomAreaSqFt * ceilingHeightFt * 0.0283168;
  const neededCadrM3h = Math.round(roomVolumeM3 * targetAch);
  const neededCfm = Math.round(neededCadrM3h * 0.5886);

  const hacksByBudget = [
    {
      tier: '₹0 (Free & Routine Habits)',
      items: [
        {
          title: 'Damp Mopping (Wet Microfiber) vs Dry Sweeping',
          desc: 'Dry brooming re-suspends settled PM2.5 and PM10 particles into the breathing plane. Damp mopping captures surface soot with zero cost.',
          impact: 'Prevents indoor dust resuspension spikes up to 40 µg/m³',
        },
        {
          title: 'Timing Ventilation to the Afternoon Lift Window',
          desc: 'Open windows only during the thermal boundary layer maximum (1:00 PM – 3:00 PM) for 15 minutes, flushing carbon dioxide while ambient PM2.5 is at its diurnal minimum.',
          impact: 'Lowers indoor CO2 without exposing home to morning inversion peaks',
        },
        {
          title: 'Active Range Hood / Exhaust Running During Cooking',
          desc: 'Always turn on the exhaust fan 2 minutes before igniting gas burners and keep running for 5 minutes after cooking completes.',
          impact: 'Captures up to 80% of oil aerosols and NOx at the point of origin',
        },
        {
          title: 'Create a Single "Clean Room" Sanctuary',
          desc: 'During severe smog, close internal doors and concentrate your family in the bedroom where your air cleaner or sealed windows are most effective.',
          impact: 'Doubles effective CADR per person by reducing active room volume',
        },
      ],
    },
    {
      tier: 'Low Cost (< ₹500)',
      items: [
        {
          title: 'Self-Adhesive Rubber Door Bottom Sweeps & Weatherstrips',
          desc: 'Install EPDM silicone weatherstripping around window sash edges and a draft-stopper under the main entryway door.',
          impact: 'Reduces air infiltration rate (ACH) from 0.50 down to 0.35 h⁻¹',
        },
        {
          title: 'AC Recirculation Filter Booster Mesh',
          desc: 'Add an inexpensive electrostatic particulate pre-filter layer across your existing split AC blower intake mesh.',
          impact: 'Filters coarse dust and fibers while cooling in summer/autumn',
        },
      ],
    },
    {
      tier: 'Moderate Cost (~₹2,200 DIY to ₹6,000)',
      items: [
        {
          title: 'DIY Corsi-Rosenthal Box Purifier (₹2,200)',
          desc: 'Build using 4 MERV-13 pleated HVAC filters taped into a cube with a standard 16-inch box fan and a circular cardboard shroud. Delivers 450+ m³/h CADR at 1/4 the cost of commercial purifiers.',
          impact: 'Equivalent CADR to a ₹18,000 commercial air purifier',
        },
        {
          title: 'True HEPA Purifier in Primary Sleeping Quarters',
          desc: 'Dedicated 3-stage filtration (pre-filter, True HEPA H13, and activated carbon) running continuously at low fan speed overnight.',
          impact: 'Reduces overnight sleeping PM2.5 exposure by 80–90%',
        },
      ],
    },
  ];

  const mythBusters = [
    {
      myth: '“Indoor plants (Snake plant, Areca palm) purify room air from winter smog.”',
      reality:
        'False. The 1989 NASA clean-air study was conducted in small, hermetically sealed 1 m³ chambers over days. In real homes with even minimal 0.5 air changes per hour, you would need roughly 100 to 1,000 plants per square meter to equal a single small HEPA fan.',
    },
    {
      myth: '“Himalayan salt lamps or negative ion generators clean air.”',
      reality:
        'False. Salt lamps emit zero active filtration. Electronic ion generators generate ozone (O3), a potent respiratory irritant that damages airway epithelium and worsens asthma.',
    },
    {
      myth: '“Burning camphor, dhoop, or incense purifies polluted air spiritually or physically.”',
      reality:
        'Dangerous myth. Combustion of incense and scented dhoop releases massive quantities of ultrafine carbon particles, benzene, and formaldehyde directly inside closed living rooms.',
    },
    {
      myth: '“Keeping all windows closed 24/7 is always best during winter.”',
      reality:
        'Partially false. In closed rooms without ventilation, CO2 builds up past 2,000 ppm, causing cognitive fatigue, headaches, and poor sleep. Targeted short ventilation during the afternoon clean window flushes CO2 with minimal PM2.5 penalty.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Purifier CADR Sizing Calculator */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
            <ShieldIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              {STRINGS.indoorHacks.cadrCalcTitle}
            </h2>
            <p className="text-xs text-slate-600">{STRINGS.indoorHacks.cadrCalcDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label
              htmlFor="cadr-room-area"
              className="text-xs font-semibold text-slate-800 block mb-1"
            >
              {STRINGS.indoorHacks.roomAreaLabel}
            </label>
            <input
              id="cadr-room-area"
              type="number"
              min={50}
              max={1500}
              value={roomAreaSqFt}
              onChange={(e) => setRoomAreaSqFt(Math.max(50, parseInt(e.target.value) || 100))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white font-medium min-h-[44px]"
            />
          </div>

          <div>
            <label
              htmlFor="cadr-ceiling-height"
              className="text-xs font-semibold text-slate-800 block mb-1"
            >
              {STRINGS.indoorHacks.ceilingHeightLabel}
            </label>
            <input
              id="cadr-ceiling-height"
              type="number"
              min={7}
              max={15}
              value={ceilingHeightFt}
              onChange={(e) => setCeilingHeightFt(Math.max(7, parseInt(e.target.value) || 9))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white font-medium min-h-[44px]"
            />
          </div>

          <div>
            <label
              htmlFor="cadr-target-ach"
              className="text-xs font-semibold text-slate-800 block mb-1"
            >
              Target Air Changes / Hour (ACH)
            </label>
            <select
              id="cadr-target-ach"
              value={targetAch}
              onChange={(e) => setTargetAch(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white font-medium min-h-[44px]"
            >
              <option value={4}>4 ACH (Moderate smog defense)</option>
              <option value={5}>5 ACH (Recommended for severe smog)</option>
              <option value={6}>6 ACH (Asthma / High vulnerability)</option>
            </select>
          </div>
        </div>

        {/* Calculator Output Card */}
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-teal-800 uppercase tracking-wide">
              {STRINGS.indoorHacks.recommendedCadr}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-teal-950 font-mono">{neededCadrM3h}</span>
              <span className="text-sm font-bold text-teal-800">m³/h</span>
              <span className="text-xs text-teal-700 font-mono">({neededCfm} CFM)</span>
            </div>
            <p className="text-xs text-teal-800 mt-0.5">
              Room volume: {Math.round(roomVolumeM3)} m³ · Delivers {targetAch} air flushes every
              hour.
            </p>
          </div>

          <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-teal-100 max-w-xs">
            <strong>Rule of thumb:</strong> Look for a CADR rating on the box at or above{' '}
            <strong>{neededCadrM3h} m³/h</strong> for this specific room.
          </div>
        </div>
      </section>

      {/* DIY Corsi-Rosenthal Box Blueprint */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              {STRINGS.indoorHacks.diyCorsiTitle}
            </h2>
            <p className="text-xs text-slate-600">{STRINGS.indoorHacks.diyCorsiDesc}</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
            Open-Source Design
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-teal-800 block">Step 1: Materials</span>
            <p className="text-slate-700">
              4× MERV-13 filters (20"×20"×2"), 1× 20-inch box fan, duct tape, cardboard.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-teal-800 block">Step 2: Form Cube</span>
            <p className="text-slate-700">
              Tape 4 filters into a 4-sided cube, airflow arrows pointing inwards. Cardboard bottom.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-teal-800 block">Step 3: Mount Fan</span>
            <p className="text-slate-700">
              Place fan on top blowing upwards, tape edges completely airtight.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-teal-800 block">Step 4: Cardboard Shroud</span>
            <p className="text-slate-700">
              Cut a circular donut shroud covering fan blade corners to prevent air backflow.
            </p>
          </div>
        </div>
      </section>

      {/* Grouped Hacks by Budget */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Actionable Hacks Grouped by Budget</h2>

        {hacksByBudget.map((group) => (
          <div key={group.tier} className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-900 bg-teal-50 px-3 py-1.5 rounded-lg inline-block border border-teal-200">
              {group.tier}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {group.items.map((item) => (
                <div
                  key={item.title}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2"
                >
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <CheckIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Myth-Busters Section */}
      <section className="bg-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Evidence-Based Science
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {STRINGS.indoorHacks.mythBustersTitle}
          </h2>
          <p className="text-xs text-slate-300">
            Separating marketing claims and folklore from physical mass balance reality.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {mythBusters.map((mb, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2"
            >
              <div className="flex items-start gap-2">
                <span className="text-rose-400 font-bold text-sm">✕</span>
                <h3 className="text-xs font-bold text-rose-200">{mb.myth}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-5">{mb.reality}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
