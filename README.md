# BreatheFresh

> **Know your air. Plan your day.**  
> *Google GenAI Challenge: Winter Smog & Urban Air Pollution*

---

## 🚀 Live Evaluator Guide (Zero Config, No Login)

BreatheFresh is built evaluator-first. **There is no login, no signup, no email wall, and no OAuth gate.** You can clone, run, and evaluate the application immediately.

### ⏱️ 2-Minute Quick Evaluation Script
1. **Open `/` (Onboarding)**: Click the prominent **"Try demo family (Sharma, Ghaziabad)"** button. Within 1 second, the profile is loaded with 5 family members (including elderly with COPD), high-traffic commute, and local air data.
2. **View `/plan` (Today's Plan)**:
   - Notice the hero impact metric: **"Your family inhaled the equivalent of X cigarettes today"** (animated count-up with `prefers-reduced-motion` compliance).
   - Check the **Live Air Panel**: Real-time India NAQI sub-index, PM2.5, PM10, cleanest window (e.g. 13:00–15:00), peak smog window, and estimated CAQM GRAP Stage for Delhi NCR.
   - Inspect the **Daily Action Timeline**: Groq/Engine-ordered protective actions, each displaying an **Impact Chip** (e.g. `-24% Exposure`, `-1.8 cigs/day`).
   - Tap **"Explain this"** on any action to see physical aerosol dynamics explained in plain language.
3. **Open `/impact` (What-If & Smog Simulator)**:
   - Drag the **Smog Simulator slider** from 100 to 450 µg/m³. Watch the family lung dose and baseline-vs-plan bars update **in under 100 ms** via pure client-side physics.
   - Toggle actions like *"Snug N95 on commute"* or *"Bedroom HEPA purifier"* to see real-time shifts in cigarette equivalents and weekly CO₂e emissions.
   - Review the **7-day outlook chart** comparing "Do Nothing" vs. "With Plan".
4. **Open `/community` (Community Coalition)**:
   - View pooled community impact (42 families, 342 cigarettes avoided, 620 kg CO₂e saved).
   - Tap **"Generate Share Card"** to export a high-resolution PNG card or generate a direct WhatsApp sharing link.
5. **Open `/method` (Scientific Rigor & Formulas)**:
   - Inspect every formula, constant, and epidemiological source (Berkeley Earth heuristic, LBNL indoor mass balance, CPCB NAQI breakpoints).
   - Learn how the **Number Guard** guarantees zero LLM numeric hallucinations.

---

## 🏗️ Architecture & System Design

```
                     ┌─────────────────────────────────────────────────────────┐
                     │                   Browser Client                        │
                     │                                                         │
                     │   React 18 + Vite + TypeScript (Strict) + Tailwind CSS   │
                     │                                                         │
                     │   ┌─────────────────────────────────────────────────┐   │
                     │   │             Pure Impact Engine                  │   │
                     │   │   • LBNL Mass Balance Indoor Model              │   │
                     │   │   • Berkeley Earth Cigarette Heuristic (22µg)   │   │
                     │   │   • CPCB NAQI & CAQM GRAP Estimator             │   │
                     │   │   • Number Guard Sanitization Pipeline          │   │
                     │   │   • Instant Client-Side Smog Simulator (<100ms) │   │
                     │   └─────────────────────────────────────────────────┘   │
                     └─────────────┬──────────────────────────┬────────────────┘
                                   │                          │
                 Open-Meteo Direct │                          │ Serverless Proxy
                 (No Key Needed)   │                          │ (Protects Key)
                                   ▼                          ▼
         ┌───────────────────────────────────┐      ┌──────────────────────────────────┐
         │       Open-Meteo Free APIs        │      │       Vercel API Routes          │
         │  • Air Quality (PM2.5, PM10, AQI) │      │  • /api/plan   (Groq Llama 3.3)  │
         │  • Weather (Inversion Layer, Wind)│      │  • /api/explain (Groq Llama 3.1) │
         │  • Geocoding Search               │      │  • /api/chat (SSE Stream)        │
         └───────────────────────────────────┘      │  • /api/vision (Llama 4 Vision)  │
                                                    └────────────────┬─────────────────┘
                                                                     │
                                                                     ▼
                                                    ┌──────────────────────────────────┐
                                                    │             Groq API             │
                                                    │   (Sole & Exclusive AI Engine)   │
                                                    └──────────────────────────────────┘
```

---

## 🛡️ Core Differentiator: Deterministic Impact Engine + Number Guard

A fundamental flaw of traditional generative AI applications is **numeric hallucination**—LLMs guessing health risks or inventing fictitious emission percentages. BreatheFresh solves this through an architectural boundary:

1. **Numbers Come From Physics, Never the LLM**:
   - Indoor aerosol concentration:
     $$\text{C}_{in} = \frac{\text{PENETRATION} \times a \times \text{C}_{out}}{a + \text{DEPOSITION} + \frac{\text{CADR}}{V}} + \text{sourceAdd}$$
     *(clamped to physical filter bypass threshold: $\ge 0.05 \times \text{C}_{out}$)*
   - Personal inhalation dose:
     $$\text{dose}(h) = \text{C}_{microenv}(h) \times \text{BREATHING}[\text{activity}] \times (1 - \text{MASK}[\text{mask}])$$
   - Exposure Index (EI): $\frac{1}{24} \sum_{h=0}^{23} \text{dose}(h)$ (breathing-weighted 24h $\mu\text{g/m}^3$).
   - Berkeley Earth Cigarette Equivalence: $\text{cigEq} = \frac{\text{EI}}{22}$ (22 $\mu\text{g/m}^3$ 24h PM2.5 $\approx$ 1 cigarette/day).

2. **The BreatheFresh Number Guard (`src/engine/numberGuard.ts`)**:
   - Before any LLM response from Groq reaches the user interface, it passes through `sanitizeTextWithNumberGuard`.
   - The engine constructs an `allowedNumbers` whitelist of exact values produced for the current scenario.
   - Any unverified numeric claim is immediately intercepted and replaced with engine-verified text.

---

## 📦 Zero-Config Local Setup

Clone and launch in under 60 seconds with **zero environment files required**:

```bash
# 1. Clone repository
git clone https://github.com/your-username/breathefresh.git
cd breathefresh

# 2. Install dependencies
npm install

# 3. Launch local development server (includes integrated /api mock middleware)
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

### Verification & Testing Suite
```bash
npm run check:constraints  # Verifies strict no-auth, Groq-only, and secret safety rules
npm run typecheck          # Verifies strict TypeScript type-safety
npm run lint               # Enforces ESLint rules (including restricted firebase/auth)
npm test                   # Runs Vitest unit tests for the pure Impact Engine
npm run build              # Builds production production bundle
```

---

## 🔑 Environment Variables (Optional for Local, Configured on Vercel)

| Variable | Environment | Description |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | Server only | Groq Cloud API key (never exposed to client bundle) |
| `GROQ_MODEL_MAIN` | Server only | Default: `llama-3.3-70b-versatile` |
| `GROQ_MODEL_FAST` | Server only | Default: `llama-3.1-8b-instant` |
| `GROQ_MODEL_VISION` | Server only | Default: `meta-llama/llama-4-scout-17b-16e-instruct` |
| `ALLOWED_ORIGIN` | Server only | CORS restriction (e.g. `https://breathefresh.vercel.app`) |
| `VITE_FIREBASE_*` | Client | Optional Firebase web config for community syncing |

> **Graceful Degradation Note**: If `GROQ_API_KEY` is missing, BreatheFresh automatically runs its verified local rule-based planner (`src/engine/plannerFallback.ts`). If the network is offline, it serves built-in CPCB winter smog fallback snapshots (`src/data/fallback/`).

---

## ⚖️ Health & Medical Disclaimer
BreatheFresh provides microenvironment exposure calculations and routine planning tools grounded in published aerosol physics and epidemiological heuristics. **It does not provide medical advice, diagnosis, or clinical treatment.** All health metrics are approximate communication heuristics.
