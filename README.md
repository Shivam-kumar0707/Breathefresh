# BreatheFresh 🌬️
> **Adaptive Winter Smog Defence & Personal Air Intelligence**  
> *Google GenAI Challenge — Winter Smog & Urban Air Pollution*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](tsconfig.json)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](package.json)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)](vite.config.ts)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](tailwind.config.js)
[![Groq AI](https://img.shields.io/badge/Groq-Exclusive_AI-f55036)](https://groq.com)
[![Vitest](https://img.shields.io/badge/Tests-15_Passed-brightgreen?logo=vitest)](src/engine/engine.test.ts)
[![Evaluator Friendly](https://img.shields.io/badge/Auth-Zero_Gate_/_Zero_Config-success)](#-quick-start--evaluator-guide)

---

## 📑 Table of Contents
1. [Chosen Vertical](#1-chosen-vertical)
2. [Approach and Logic](#2-approach-and-logic)
3. [How the Solution Works](#3-how-the-solution-works)
4. [Assumptions Made](#4-assumptions-made)
5. [System Architecture](#5-system-architecture)
6. [Quick Start & Evaluator Guide](#6-quick-start--evaluator-guide)
7. [Testing & Verification](#7-testing--verification)
8. [Environment & Configuration](#8-environment--configuration)
9. [Health Disclaimer](#9-health-disclaimer)

---

## 1. Chosen Vertical

### Winter Smog & Urban Air Pollution (Climate & Health Adaptation)

Every winter across the **Indo-Gangetic Plain** (Delhi NCR, Ghaziabad, Noida, Lucknow, Patna, Lahore) and global seasonal thermal inversion basins (e.g., Kraków, the Po Valley, California's Central Valley), hundreds of millions of people breathe air with particulate matter ($PM_{2.5}$) concentrations surging between **$250\ \mu\text{g/m}^3$ and $700+\ \mu\text{g/m}^3$**—up to **50 times above World Health Organization (WHO) safety guidelines**.

### The Winter Smog Trap:
* **Thermal Inversions**: As night falls, the ground rapidly cools, creating a cold boundary layer capped by warmer air above. Nocturnal boundary layer heights plummet below $200\text{ m}$, trapping vehicular exhaust, biomass burning smoke, and industrial particulate matter at street level with near-zero wind dispersion.
* **The Communication Failure of Raw AQI**: Government apps display abstract composite figures like *"AQI 465 — Severe"*. While alarming, this raw number fails to answer critical questions:
  * *Can my 72-year-old father with COPD take his morning walk?*
  * *Is opening the kitchen window at 2:00 PM safer than keeping it closed all day?*
  * *What is my 8-year-old daughter actually inhaling inside our sealed bedroom versus during her school bus commute?*
  * *What measurable difference does wearing an N95 mask or turning on a HEPA purifier make?*
* **The Microenvironment Reality**: Urban residents spend 85–90% of their day indoors, where aerosol concentrations vary dramatically based on building infiltration, room volume, air exchange rates, and filtration. Treating the outdoors and indoors as a single uniform AQI zone leads to severe under-protection or paralyzed daily routines.

**BreatheFresh** bridges this gap: transforming abstract outdoor pollution readings into **deterministic, personalized, microenvironment-specific daily action plans** that quantify health protection in tangible terms (cigarettes avoided, lung dose prevented) while helping families coordinate sustainable actions.

---

## 2. Approach and Logic

### The Core Design Principle: *"Physics Calculates, AI Communicates"*

A dangerous failure mode of LLM-based health and environmental applications is **numeric hallucination**—generative models inventing fictitious particulate dosages, guessing mask filter efficiencies, or making ungrounded medical predictions.

BreatheFresh eliminates this risk through strict architectural separation:

```
┌────────────────────────────────────────────────────────┐
│             Deterministic Impact Engine                │
│    (Pure TypeScript, Zero Network, Zero Hallucination)  │
│  • LBNL Indoor Aerosol Mass Balance Model              │
│  • Berkeley Earth Cigarette Equivalence (22 µg/m³)     │
│  • CPCB National Air Quality Index (NAQI) Breakpoints  │
│  • CAQM GRAP Stage I–IV Regulatory Classifier          │
│  • Activity-Weighted Lung Inhalation Multipliers       │
└───────────────────────────┬────────────────────────────┘
                            │ Allowed Numbers Whitelist
                            ▼
┌────────────────────────────────────────────────────────┐
│             BreatheFresh Number Guard                  │
│       Intercepts and scrubs unverified LLM digits      │
└───────────────────────────▲────────────────────────────┘
                            │ Raw Natural Language
┌───────────────────────────┴────────────────────────────┐
│                  Groq AI Cloud Engine                  │
│  • Personalized Routine Synthesis (Llama 3.3 70B)      │
│  • Physical Mechanism Explanations (Llama 3.1 8B)      │
│  • Multilingual Adaptive Streaming (English/Hinglish)  │
│  • Room Layout Aerosol Diagnosis (Llama 4 Vision)      │
└────────────────────────────────────────────────────────┘
```

### 1. Indoor Aerosol Mass-Balance Model (LBNL Formulation)
Indoor particulate concentration is derived from Lawrence Berkeley National Laboratory (LBNL) single-zone mass-balance physics:

$$C_{in}(t) = \frac{P \cdot a \cdot C_{out}(t)}{a + k + \frac{\text{CADR}}{V}} + S(t)$$

Where:
* $C_{in}(t)$: Indoor $PM_{2.5}$ concentration ($\mu\text{g/m}^3$).
* $C_{out}(t)$: Outdoor hourly $PM_{2.5}$ concentration ($\mu\text{g/m}^3$) from live sensors.
* $P$: Particle penetration factor through building envelope ($0.80$ default).
* $a$: Air exchange rate per hour ($0.8\text{ hr}^{-1}$ unsealed; $0.3\text{ hr}^{-1}$ taped/weatherstripped).
* $k$: Natural gravitational deposition rate onto indoor surfaces ($0.24\text{ hr}^{-1}$).
* $\text{CADR}$: Clean Air Delivery Rate of filtration equipment ($\text{m}^3/\text{hr}$).
* $V$: Enclosed room volume ($\text{m}^3$).
* $S(t)$: Indoor source generation (cooking, incense, indoor dust).

> **Physical Clamping**: Even in rooms with commercial HEPA purifiers, real-world edge leakage and door drafts prevent zero particulate concentration. BreatheFresh clamps indoor concentrations to $C_{in} \ge 0.05 \times C_{out}$.

### 2. Personal Inhalation Dose & Exposure Index (EI)
Air quality harm is determined by how much air enters the lungs, not just ambient concentration. Each hour's lung dose is calculated using microenvironment concentration, ventilation rates, and mask efficiency:

$$\text{dose}(h) = C_{\text{microenv}}(h) \times \text{ventilation}(activity) \times (1 - \eta_{\text{mask}})$$

* $\text{ventilation}(activity)$: Minute ventilation multiplier relative to resting tidal volume ($1.0\times$ resting, $1.2\times$ sedentary office, $2.0\times$ walking commute, $3.5\times$ vigorous exercise).
* $\eta_{\text{mask}}$: Inward leakage filtration factor ($\text{N95} = 0.95$, $\text{Surgical} = 0.50$, $\text{Cloth} = 0.20$, $\text{None} = 0.0$).
* **Exposure Index (EI)**: The 24-hour time-weighted inhalation dose:

$$\text{EI} = \frac{1}{24} \sum_{h=0}^{23} \text{dose}(h)\quad (\mu\text{g/m}^3)$$

### 3. Berkeley Earth Cigarette Equivalence
Abstract micrograms per cubic meter do not drive human behavioral change. BreatheFresh grounds its impact metrics in the peer-reviewed **Berkeley Earth heuristic** (Muller & Muller):

$$\text{Cigarette Equivalent} = \frac{\text{EI}}{22\ \mu\text{g/m}^3}$$

One cigarette smoked per day introduces approximately $22\ \mu\text{g/m}^3$ of $PM_{2.5}$ into the lungs over 24 hours. A family exposed to an EI of $176\ \mu\text{g/m}^3$ inhales particulate matter equivalent to smoking **8 cigarettes per person every day**.

### 4. The BreatheFresh Number Guard (`src/engine/numberGuard.ts`)
When Groq generates personalized guidance, the raw text is passed through the **Number Guard**:
1. The deterministic engine computes all valid metrics (baseline dose, plan dose, delta %, cigarette equivalents, cleanest hour window).
2. An **Allowed Numbers Whitelist** is constructed from these exact values, their integers, and their decimal bounds.
3. Every numeric token generated by the LLM is evaluated. Any hallucinated digit outside the whitelist is automatically stripped or rewritten to state the verified engine value before reaching the UI.

---

## 3. How the Solution Works

### End-to-End User Journey

```
 1. Onboard / Select Persona ➔ 2. Live Meteorology Ingestion ➔ 3. Deterministic Impact Calculation
              │                               │                                     │
              ▼                               ▼                                     ▼
      Sharma Family Demo             Open-Meteo Direct API               LBNL Mass-Balance + NAQI
    (5 Members, Ghaziabad)         (PM2.5, PM10, Inversion)             (Exposure Index & Cigarettes)
              │                               │                                     │
              └───────────────────────────────┼─────────────────────────────────────┘
                                              │
                                              ▼
                                4. Daily Action Plan (/plan)
                                 • Hero Cigarette Equivalent
                                 • Cleanest Air Window (e.g. 13:00–15:00)
                                 • Ordered Protective Actions with Impact Chips
                                 • One-Tap "Explain this" Physical Dynamics
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        5. Interactive Simulator (/impact)               6. Community Coalition (/community)
         • Client-Side Slider (<100ms)                    • Pooled Community Lung Dose Avoided
         • Real-Time What-If Action Toggles               • High-Res PNG Share Card Export
         • 7-Day "Do Nothing" vs. "Plan" Outlook          • Direct WhatsApp Family Sharing
```

### Key Modules:

1. **Zero-Config Profile & Onboarding (`/`)**:
   * Evaluator-first 1-click presets:
     * **Sharma Family (Ghaziabad)**: 5 members across generations, elderly grandfather with COPD, children with outdoor school transit, high-density winter smog corridor.
     * **Nowak Family (Kraków)**: European valley inversion, residential coal-boiler heating zone.
     * **Patel Commuter (Delhi)**: Solo professional with a 45-minute open scooter commute.
   * Full custom household profile builder: family members, respiratory vulnerabilities, room volumes, air purifier CADR specs, and commuting modes.

2. **Today's Action Plan (`/plan`)**:
   * **Hero Impact Counter**: Live animated display of family cigarette equivalents inhaled today vs. saved by following the plan.
   * **Live Air & Inversion Panel**: Real-time CPCB NAQI calculation, outdoor $PM_{2.5}$ and $PM_{10}$, and nocturnal boundary layer tracking that flags surface inversion risks.
   * **Optimal Air Window**: Automatically flags the cleanest daytime window (typically 13:00–15:00) when solar warming lifts the inversion layer, identifying the only safe time for brief cross-ventilation.
   * **Action Timeline with Impact Chips**: Every recommended action shows its physical impact (e.g., `-32% Exposure`, `-1.8 cigs/day`, `CADR Boost`).
   * **One-Tap Aerosol Explanation**: Powered by Groq Llama, breaking down the physical aerodynamics of why an action works.
   * **Indoor Hacks & Alternatives**: DIY HEPA fan assembly guide, door sweep weatherstripping calculator, and low-exposure transit routing.

3. **Interactive What-If & Smog Simulator (`/impact`)**:
   * Pure client-side reactive physics slider ($<100\text{ ms}$ latency).
   * Adjust outdoor smog from $50\ \mu\text{g/m}^3$ to $500+\ \mu\text{g/m}^3$ and immediately observe changes in family lung dose.
   * Toggle interventions (e.g., "Snug N95 on commute", "Seal window frame", "Bedroom HEPA overnight") to watch cigarette equivalents and carbon footprints adjust in real time.
   * 7-day projection comparing a "Do Nothing" baseline against the "BreatheFresh Plan".

4. **Community Coalition & Impact Share Cards (`/community`)**:
   * Demonstrates the collective impact of neighborhood action: total cigarettes avoided, kg of particulate matter diverted from lungs, and net carbon emissions avoided.
   * One-click high-resolution PNG share card generation via `html-to-image`.
   * Direct WhatsApp share links pre-populated with localized air quality alerts and family protective tips.

5. **AI Conversational Assistant & Vision Scanner**:
   * **Context-Aware Streaming Chat**: Answers user questions in English, Hindi, or Hinglish (e.g., *"Kya Dadaji subah walk par ja sakte hain?"*).
   * **Safety Guardrails**: Built-in red-flag symptom triage detects acute chest pain, severe breathlessness, or cyanosis and directs users to immediate medical care.
   * **Room Layout Vision Scanner**: Evaluates photos of living rooms to diagnose purifier placement, curtain obstructions, and air flow dead zones.

---

## 4. Assumptions Made

BreatheFresh explicitly documents all scientific, physiological, and computational assumptions:

| Domain | Parameter / Model | Assumption & Source Baseline | Rationale & Boundary |
| :--- | :--- | :--- | :--- |
| **Epidemiology** | Cigarette Equivalence | $22\ \mu\text{g/m}^3\text{ of 24h } PM_{2.5} \approx 1\text{ cigarette/day}$ (Berkeley Earth / Muller) | Used as an approximate risk communication heuristic; linear relationship assumed for non-smokers. |
| **Indoor Aerosols** | Building Envelope Penetration | $P = 0.80$ (typical residential construction) | Unsealed masonry in urban North India allows 80% of outdoor fine aerosols to penetrate without mechanical HVAC. |
| **Indoor Aerosols** | Air Exchange Rate ($a$) | $0.80\text{ hr}^{-1}$ unsealed; $0.30\text{ hr}^{-1}$ with weatherstripping | Standard natural infiltration in typical multi-story brick/concrete apartments. |
| **Indoor Aerosols** | Particle Deposition ($k$) | $k = 0.24\text{ hr}^{-1}$ for $PM_{2.5}$ | Gravitational settling and Brownian diffusion onto indoor walls and carpets (LBNL indoor models). |
| **Indoor Aerosols** | Filter Bypass Floor | Minimum indoor concentration clamped to $\ge 0.05 \times C_{out}$ | Real-world rooms are not cleanrooms; door openings and window frame gaps prevent 100% particulate elimination. |
| **Protective Equipment** | Mask Inward Leakage | $\text{N95/FFP2} = 95\%$; $\text{Surgical} = 50\%$; $\text{Cloth} = 20\%$ | Reflects empirical NIOSH and real-world fit testing (accounting for edge seal leakage). |
| **Physiology** | Minute Ventilation ($\dot{V}_E$) | Sleep: $6\text{ L/min}$ ($1.0\times$); Sedentary: $7.5\text{ L/min}$ ($1.2\times$); Walk: $12.5\text{ L/min}$ ($2.0\times$); Run: $22\text{ L/min}$ ($3.5\times$) | Heavy physical exertion significantly increases total inhaled particulate mass per hour. |
| **Meteorology** | Nocturnal Thermal Inversion | Boundary layer $< 250\text{ m}$ AND wind speed $< 5\text{ km/h}$ | Characteristic signature of stagnant ground inversions in winter smog basins. |
| **Index Standards** | NAQI Calculation | Linear interpolation across CPCB official sub-index breakpoints | Matches Indian Central Pollution Control Board standard for $PM_{2.5}$ and $PM_{10}$. |
| **Energy & Carbon** | Grid Emissions Factor | Northern India grid: $\approx 0.82\text{ kg CO}_2\text{e/kWh}$ | Applied to air purifier wattage (30–65W continuous) to calculate carbon footprints accurately. |
| **User Identity** | Client State Persistence | Randomized local UUID `deviceId` in `localStorage` | Zero authentication wall; no personal data or email stored on external servers. |

---

## 5. System Architecture

```
                                 Browser Client
          ┌─────────────────────────────────────────────────────────┐
          │  React 18 + Vite + TypeScript (Strict) + Tailwind CSS   │
          │                                                         │
          │  ┌───────────────────────────────────────────────────┐  │
          │  │               Pure Impact Engine                  │  │
          │  │  • LBNL Mass Balance Physics                      │  │
          │  │  • Berkeley Earth Exposure Index                  │  │
          │  │  • CPCB NAQI & CAQM GRAP Estimator                │  │
          │  │  • Number Guard Verification Pipeline             │  │
          │  │  • Instant Client-Side Smog Simulator (<100ms)    │  │
          │  └───────────────────────────────────────────────────┘  │
          └─────────────┬──────────────────────────┬────────────────┘
                        │                          │
      Open-Meteo Direct │                          │ Serverless Proxy
      (No Key Needed)   │                          │ (Protects Key & Rate Limits)
                        ▼                          ▼
          ┌───────────────────────────┐      ┌───────────────────────────┐
          │   Open-Meteo Free APIs    │      │    Vercel API Routes      │
          │  • PM2.5, PM10, AQI       │      │  • /api/plan              │
          │  • Boundary Layer Height  │      │  • /api/explain           │
          │  • Wind Speed & Temp      │      │  • /api/chat (SSE Stream) │
          │  • Geocoding Search       │      │  • /api/vision            │
          └───────────────────────────┘      └─────────────┬─────────────┘
                                                           │
                                                           ▼
                                             ┌───────────────────────────┐
                                             │     Groq Cloud API        │
                                             │  (Exclusive AI Engine)    │
                                             │  • Llama 3.3 70B          │
                                             │  • Llama 3.1 8B           │
                                             │  • Llama 4 Vision Scout   │
                                             └───────────────────────────┘
```

---

## 6. Quick Start & Evaluator Guide

BreatheFresh is built **evaluator-first**:
* 🚫 **No Login / No Signup**
* 🚫 **No Email or Phone Verification**
* 🚫 **No Credit Card or Paid APIs Required**
* ✅ **Immediate 1-Click Evaluation**

### Running Locally in 60 Seconds:

```bash
# 1. Clone repository
git clone https://github.com/Shivam-kumar0707/Breathefresh.git
cd Breathefresh

# 2. Install dependencies
npm install

# 3. Start local development server (includes built-in /api simulation)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### ⏱️ 2-Minute Evaluator Script:
1. **Landing / Onboard (`/`)**: Click **"Try demo family (Sharma, Ghaziabad)"**. The profile loads instantly with 5 family members, chronic conditions, and local air data.
2. **Today's Plan (`/plan`)**:
   * View the **Hero Cigarette Counter** indicating today's family particulate inhalation.
   * Inspect the **Live Air Panel** displaying CPCB NAQI, PM2.5/PM10, and thermal inversion status.
   * Check the **Action Timeline**: Note the **Impact Chips** (e.g. `-24% Exposure`, `-1.8 cigs/day`). Tap **"Explain this"** on any action to see the aerodynamic explanation.
3. **What-If Simulator (`/impact`)**:
   * Drag the **Smog Slider** from $100$ to $450\ \mu\text{g/m}^3$. Observe instant ($<100\text{ ms}$) updates in lung dose and cigarette equivalents.
   * Toggle interventions to see changes in both particulate exposure and estimated weekly carbon emissions.
4. **Community Coalition (`/community`)**:
   * View neighborhood cumulative metrics.
   * Click **"Generate Share Card"** to export an image card or generate a WhatsApp share link.
5. **Scientific Method (`/method`)**:
   * Review all formulas, physical constants, epidemiological papers, and the Number Guard architecture.

---

## 7. Testing & Verification

BreatheFresh enforces strict code quality and safety constraints:

```bash
# Run unit test suite (15 unit tests covering pure physics, NAQI, GRAP, Number Guard, and fallbacks)
npm test

# Verify strict project constraints (ensures zero auth, Groq exclusivity, and no leaked secrets)
npm run check:constraints

# Verify TypeScript types in strict mode
npm run typecheck

# Run ESLint
npm run lint

# Compile production bundle
npm run build
```

---

## 8. Environment & Configuration

BreatheFresh works out-of-the-box in local development with automatic fallbacks. To connect real Groq models in production, configure the following variables:

| Variable | Target | Description | Default |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | Serverless (`api/`) | Groq API Key (never exposed to client bundle) | *Optional for local dev* |
| `GROQ_MODEL_MAIN` | Serverless (`api/`) | Primary model for complex daily routine planning | `qwen/qwen3.8-27b` |
| `GROQ_MODEL_FAST` | Serverless (`api/`) | Fast model for micro-explanations and streaming chat | `qwen/qwen3.8-27b` |
| `GROQ_MODEL_VISION` | Serverless (`api/`) | Vision model for room aerosol analysis | `meta-llama/llama-4-scout-17b-16e-instruct` |
| `ALLOWED_ORIGIN` | Serverless (`api/`) | CORS origin lockdown | `*` (Lock to your domain in production) |
| `VITE_FIREBASE_*` | Browser Client | Optional Firebase web configuration for real-time community sync | *Optional* |

> **Graceful Degradation**: If `GROQ_API_KEY` is not set, BreatheFresh automatically switches to its deterministic local rule planner (`src/engine/plannerFallback.ts`). If the user is offline or Open-Meteo is unreachable, verified winter smog datasets for Ghaziabad, Delhi, and Kraków (`src/data/fallback/`) load seamlessly.

---

## 9. Health Disclaimer

BreatheFresh provides microenvironment exposure calculations, particulate inhalation estimates, and routine planning tools grounded in published aerosol physics and epidemiological heuristics. **It does not provide medical advice, diagnosis, or clinical treatment.**

Individuals with pre-existing cardiopulmonary conditions (including COPD, asthma, or ischemic heart disease) should consult qualified medical professionals and adhere to national health advisories during severe pollution events.

---

<div align="center">
  <b>Built for clean air, public health resilience, and climate adaptation.</b><br>
  <sub>BreatheFresh • Winter Smog Defence Engine</sub>
</div>
